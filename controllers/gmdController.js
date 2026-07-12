const db = require("../config/db");

// media da ultima sessao de pesagem de um lote ate uma certa data (usada como estimativa de peso)
async function mediaSessaoAnterior(loteId, dataLimite) {
  const [rows] = await db.query(
    `SELECT SUM(p.peso) AS massa, COUNT(p.id) AS qtd
     FROM sessoes_pesagem s
     JOIN pesos p ON p.sessao_id = s.id
     WHERE s.lote_id = ? AND s.data_sessao <= ?
     GROUP BY s.id
     ORDER BY s.data_sessao DESC
     LIMIT 1`,
    [loteId, dataLimite]
  );
  if (rows.length === 0 || !rows[0].qtd) return null;
  return Number(rows[0].massa) / Number(rows[0].qtd);
}

// headcount de um lote travado numa data (mesma regra do movimentacaoController, so que ate uma data-limite)
async function headcountNaData(loteId, userId, data) {
  const [[lote]] = await db.query("SELECT quantidade_inicial FROM lotes WHERE id = ? AND user_id = ?", [loteId, userId]);
  if (!lote) return null;

  const [[saidas]] = await db.query(
    "SELECT COALESCE(SUM(quantidade), 0) AS total FROM movimentacoes_lote WHERE lote_id = ? AND user_id = ? AND data_evento <= ?",
    [loteId, userId, data]
  );
  const [[entradas]] = await db.query(
    "SELECT COALESCE(SUM(quantidade), 0) AS total FROM movimentacoes_lote WHERE tipo = 'transferencia' AND lote_destino_id = ? AND user_id = ? AND data_evento <= ?",
    [loteId, userId, data]
  );

  return Number(lote.quantidade_inicial) - Number(saidas.total) + Number(entradas.total);
}

function formatarData(data) {
  return new Date(data).toISOString().slice(0, 10);
}

function diffDias(dataInicio, dataFim) {
  return Math.round((new Date(dataFim) - new Date(dataInicio)) / 86400000);
}

// Balanço de massa, em bom português: pesa-se o lote inteiro numa sessão, pesa-se de novo na
// próxima, e a diferença SÓ seria o ganho de peso se ninguém tivesse saído ou entrado no meio
// do caminho. Como sempre sai gente (morte/venda/descarte/transferência) e às vezes entra
// (transferência recebida), a gente estima a massa que cada movimentação levou ou trouxe e
// "recoloca" ela na conta antes de calcular o ganho real. Esse ganho, dividido pelo tamanho
// médio do lote ao longo do período (animais-dia, não dias corridos), dá o GMD por cabeça.
exports.calcularGMD = async (req, res) => {
  const { loteId } = req.params;
  const userId = req.usuario.id;

  try {
    const [lote] = await db.query("SELECT id FROM lotes WHERE id = ? AND user_id = ?", [loteId, userId]);
    if (lote.length === 0) {
      return res.status(404).json({ error: "Lote não encontrado" });
    }

    const [sessoes] = await db.query(
      `SELECT s.id, s.data_sessao, COUNT(p.id) AS qtd, SUM(p.peso) AS massa_total
       FROM sessoes_pesagem s
       JOIN pesos p ON p.sessao_id = s.id
       WHERE s.lote_id = ? AND s.user_id = ?
       GROUP BY s.id
       ORDER BY s.data_sessao ASC`,
      [loteId, userId]
    );

    if (sessoes.length < 2) {
      return res.json({ periodos: [], resumo: null, message: "É preciso pelo menos duas pesagens para calcular o GMD" });
    }

    const periodos = [];
    let ganhoAcumulado = 0;
    let animaisDiaAcumulado = 0;

    for (let i = 0; i < sessoes.length - 1; i++) {
      const anterior = sessoes[i];
      const seguinte = sessoes[i + 1];

      const massaInicial = Number(anterior.massa_total);
      const massaFinal = Number(seguinte.massa_total);
      const mediaAnterior = massaInicial / anterior.qtd;

      // saidas do proprio lote (morte/descarte/venda/transferencia) no periodo
      const [saidas] = await db.query(
        `SELECT tipo, quantidade, peso_medio_estimado, causa_morte, data_evento
         FROM movimentacoes_lote
         WHERE lote_id = ? AND user_id = ? AND data_evento > ? AND data_evento <= ?`,
        [loteId, userId, anterior.data_sessao, seguinte.data_sessao]
      );

      // transferencias recebidas de outros lotes no periodo
      const [entradas] = await db.query(
        `SELECT quantidade, peso_medio_estimado, data_evento, lote_id AS lote_origem_id
         FROM movimentacoes_lote
         WHERE tipo = 'transferencia' AND lote_destino_id = ? AND user_id = ? AND data_evento > ? AND data_evento <= ?`,
        [loteId, userId, anterior.data_sessao, seguinte.data_sessao]
      );

      // hierarquia de estimativa: peso informado > causa da morte > media da sessao anterior
      let massaSaida = 0;
      for (const mv of saidas) {
        let pesoPorCabeca;
        if (mv.peso_medio_estimado != null) {
          pesoPorCabeca = Number(mv.peso_medio_estimado);
        } else if (mv.tipo === "morte" && mv.causa_morte === "definhamento") {
          pesoPorCabeca = mediaAnterior * 0.825;
        } else {
          pesoPorCabeca = mediaAnterior;
        }
        massaSaida += mv.quantidade * pesoPorCabeca;
      }

      // entrada usa a media da ultima sessao do lote de ORIGEM (é o peso que esses animais tinham ao sair de lá);
      // se a origem nunca foi pesada, cai pra media da sessao anterior do proprio destino
      let massaEntrada = 0;
      let estimativaIncompleta = false;
      for (const mv of entradas) {
        let pesoPorCabeca;
        if (mv.peso_medio_estimado != null) {
          pesoPorCabeca = Number(mv.peso_medio_estimado);
        } else {
          const mediaOrigem = await mediaSessaoAnterior(mv.lote_origem_id, mv.data_evento);
          if (mediaOrigem != null) {
            pesoPorCabeca = mediaOrigem;
          } else if (!Number.isNaN(mediaAnterior)) {
            pesoPorCabeca = mediaAnterior;
          } else {
            // nem origem nem destino tem sessao pra estimar - nao da pra confiar nesse periodo
            pesoPorCabeca = 0;
            estimativaIncompleta = true;
          }
        }
        massaEntrada += mv.quantidade * pesoPorCabeca;
      }

      const ganhoReal = massaFinal - (massaInicial - massaSaida + massaEntrada);

      // animais-dia: soma cada trecho (dias x headcount vigente), mudando o headcount a cada movimentação
      const eventos = [
        ...saidas.map((m) => ({ data: m.data_evento, delta: -m.quantidade })),
        ...entradas.map((m) => ({ data: m.data_evento, delta: m.quantidade }))
      ].sort((a, b) => new Date(a.data) - new Date(b.data));

      let headcountCorrente = await headcountNaData(loteId, userId, anterior.data_sessao);
      let dataCorrente = anterior.data_sessao;
      let animaisDia = 0;

      for (const ev of eventos) {
        animaisDia += diffDias(dataCorrente, ev.data) * headcountCorrente;
        headcountCorrente += ev.delta;
        dataCorrente = ev.data;
      }
      animaisDia += diffDias(dataCorrente, seguinte.data_sessao) * headcountCorrente;

      const dias = diffDias(anterior.data_sessao, seguinte.data_sessao);
      const gmd = animaisDia > 0 ? ganhoReal / animaisDia : null;

      periodos.push({
        data_inicio: formatarData(anterior.data_sessao),
        data_fim: formatarData(seguinte.data_sessao),
        dias,
        headcount_medio: dias > 0 ? Math.round((animaisDia / dias) * 100) / 100 : null,
        ganho_kg: Math.round(ganhoReal * 100) / 100,
        animais_dia: animaisDia,
        gmd: gmd != null ? Math.round(gmd * 1000) / 1000 : null,
        estimativa_incompleta: estimativaIncompleta
      });

      ganhoAcumulado += ganhoReal;
      animaisDiaAcumulado += animaisDia;
    }

    const resumo = {
      ganho_total_kg: Math.round(ganhoAcumulado * 100) / 100,
      animais_dia_total: animaisDiaAcumulado,
      gmd_acumulado: animaisDiaAcumulado > 0 ? Math.round((ganhoAcumulado / animaisDiaAcumulado) * 1000) / 1000 : null,
      estimativa_incompleta: periodos.some((p) => p.estimativa_incompleta)
    };

    res.json({ periodos, resumo });
  } catch (err) {
    console.error("ERRO ao calcular GMD:", err);
    res.status(500).json({ error: "Erro ao calcular GMD" });
  }
};
