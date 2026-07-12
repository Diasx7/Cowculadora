const db = require("../config/db");

const TIPOS_VALIDOS = ["morte", "descarte", "venda", "transferencia"];

// headcount nunca é armazenado: inicial - tudo que saiu do lote + transferências recebidas de outros lotes
async function calcularHeadcount(loteId) {
  const [[lote]] = await db.query("SELECT quantidade_inicial FROM lotes WHERE id = ?", [loteId]);
  if (!lote) return null;

  const [[saidas]] = await db.query(
    "SELECT COALESCE(SUM(quantidade), 0) AS total FROM movimentacoes_lote WHERE lote_id = ?",
    [loteId]
  );
  const [[entradas]] = await db.query(
    "SELECT COALESCE(SUM(quantidade), 0) AS total FROM movimentacoes_lote WHERE tipo = 'transferencia' AND lote_destino_id = ?",
    [loteId]
  );

  // SUM() volta como string no mysql2 (evita perder precisão) - precisa forçar número
  return Number(lote.quantidade_inicial) - Number(saidas.total) + Number(entradas.total);
}

const CAUSAS_MORTE_VALIDAS = ["definhamento", "subita"];

exports.criarMovimentacao = async (req, res) => {
  const { loteId, tipo, quantidade, dataEvento, loteDestinoId, pesoMedioEstimado, brinco, observacao, causaMorte } = req.body;
  const userId = req.usuario.id;

  if (!loteId || !tipo || !quantidade || !dataEvento) {
    return res.status(400).json({ error: "Informe o lote, o tipo, a quantidade e a data do evento" });
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: "Tipo inválido. Use: " + TIPOS_VALIDOS.join(", ") });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ error: "Quantidade deve ser maior que zero" });
  }

  if (causaMorte && !CAUSAS_MORTE_VALIDAS.includes(causaMorte)) {
    return res.status(400).json({ error: "Causa da morte inválida. Use: " + CAUSAS_MORTE_VALIDAS.join(", ") });
  }

  try {
    const [lote] = await db.query("SELECT id FROM lotes WHERE id = ? AND user_id = ?", [loteId, userId]);
    if (lote.length === 0) {
      return res.status(404).json({ error: "Lote não encontrado" });
    }

    // transferência precisa de um destino válido, diferente da origem e do mesmo usuário
    if (tipo === "transferencia") {
      if (!loteDestinoId || Number(loteDestinoId) === Number(loteId)) {
        return res.status(400).json({ error: "Informe um lote de destino diferente do lote de origem" });
      }
      const [destino] = await db.query("SELECT id FROM lotes WHERE id = ? AND user_id = ?", [loteDestinoId, userId]);
      if (destino.length === 0) {
        return res.status(404).json({ error: "Lote de destino não encontrado" });
      }
    }

    const headcountAtual = await calcularHeadcount(loteId);
    if (quantidade > headcountAtual) {
      return res.status(400).json({
        error: `O lote só tem ${headcountAtual} cabeças, não dá pra movimentar ${quantidade}`
      });
    }

    await db.query(
      `INSERT INTO movimentacoes_lote
        (lote_id, user_id, tipo, quantidade, data_evento, lote_destino_id, peso_medio_estimado, brinco, observacao, causa_morte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loteId,
        userId,
        tipo,
        quantidade,
        dataEvento,
        tipo === "transferencia" ? loteDestinoId : null,
        pesoMedioEstimado || null,
        brinco || null,
        observacao || null,
        // causa_morte só faz sentido pra tipo='morte' - nos outros tipos ignora silenciosamente
        tipo === "morte" ? (causaMorte || null) : null
      ]
    );

    const headcountAtualizado = await calcularHeadcount(loteId);
    res.status(201).json({ message: "Movimentação registrada", headcountAtual: headcountAtualizado });
  } catch (err) {
    console.error("ERRO ao criar movimentação:", err);
    res.status(500).json({ error: "Erro ao registrar movimentação" });
  }
};

exports.listarMovimentacoes = async (req, res) => {
  const { loteId } = req.params;
  const userId = req.usuario.id;

  try {
    const [lote] = await db.query("SELECT id FROM lotes WHERE id = ? AND user_id = ?", [loteId, userId]);
    if (lote.length === 0) {
      return res.status(404).json({ error: "Lote não encontrado" });
    }

    const [movimentacoes] = await db.query(
      "SELECT * FROM movimentacoes_lote WHERE lote_id = ? AND user_id = ? ORDER BY data_evento DESC",
      [loteId, userId]
    );

    const headcountAtual = await calcularHeadcount(loteId);
    res.json({ headcountAtual, movimentacoes });
  } catch (err) {
    console.error("ERRO ao listar movimentações:", err);
    res.status(500).json({ error: "Erro ao buscar movimentações" });
  }
};
