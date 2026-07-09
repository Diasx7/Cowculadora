const db = require("../config/db");

// cria a sessao e salva todos os pesos de uma vez
exports.criarSessao = async (req, res) => {
  const { loteId, dataSessao, pesos, observacao } = req.body;
  const userId = req.usuario.id;

  if (!loteId || !dataSessao || !pesos || pesos.length === 0) {
    return res.status(400).json({ error: "Informe o lote, a data e pelo menos um peso" });
  }

  for (const p of pesos) {
    const valor = typeof p === "object" ? p.peso : p;
    if (!valor || valor <= 0 || valor >= 1500) {
      return res.status(400).json({ error: "Peso inválido: " + valor });
    }
  }

  // transacao pra nao salvar sessao pela metade se der erro no meio
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [lote] = await conn.query("SELECT id FROM lotes WHERE id = ? AND user_id = ?", [loteId, userId]);
    if (lote.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Lote não encontrado" });
    }

    const [sessao] = await conn.query(
      "INSERT INTO sessoes_pesagem (lote_id, user_id, data_sessao, observacao) VALUES (?, ?, ?, ?)",
      [loteId, userId, dataSessao, observacao || null]
    );

    // peso pode vir so o numero ou { peso, brinco } quando for boi medicado
    const valores = pesos.map((p) => {
      if (typeof p === "object") {
        return [sessao.insertId, p.peso, p.brinco || null];
      }
      return [sessao.insertId, p, null];
    });

    await conn.query("INSERT INTO pesos (sessao_id, peso, brinco) VALUES ?", [valores]);

    await conn.commit();
    res.status(201).json({ message: "Pesagem salva", sessaoId: sessao.insertId, totalPesos: pesos.length });
  } catch (err) {
    await conn.rollback();
    console.error("ERRO criar sessão:", err);
    res.status(500).json({ error: "Erro ao salvar a pesagem" });
  } finally {
    conn.release();
  }
};

// lista as sessoes do lote com media e total de cada uma
exports.listarSessoes = async (req, res) => {
  const { loteId } = req.params;
  const userId = req.usuario.id;

  try {
    const sql = `
      SELECT s.id, s.data_sessao, s.observacao,
             COUNT(p.id) AS qtd_pesados,
             ROUND(AVG(p.peso), 2) AS peso_medio,
             ROUND(SUM(p.peso), 2) AS peso_total
      FROM sessoes_pesagem s
      LEFT JOIN pesos p ON p.sessao_id = s.id
      WHERE s.lote_id = ? AND s.user_id = ?
      GROUP BY s.id
      ORDER BY s.data_sessao ASC
    `;
    const [sessoes] = await db.query(sql, [loteId, userId]);
    res.json(sessoes);
  } catch (err) {
    console.error("ERRO listar sessões:", err);
    res.status(500).json({ error: "Erro ao buscar sessões" });
  }
};