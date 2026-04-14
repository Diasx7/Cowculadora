const db = require("../config/db");

// CADASTRAR INSUMO
exports.criarInsumo = async (req, res) => {
  const { nome, unidade, precoUnitario } = req.body;
  const userId = req.usuario.id;
  if (!nome || !unidade || !precoUnitario) return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  try {
    await db.query(
      "INSERT INTO insumos (user_id, nome, unidade, preco_unitario) VALUES (?, ?, ?, ?)",
      [userId, nome, unidade, precoUnitario]
    );
    res.status(201).json({ message: "Insumo cadastrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar insumo" });
  }
};

exports.listarInsumos = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [rows] = await db.query(
      "SELECT * FROM insumos WHERE user_id = ? ORDER BY nome",
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar insumos" });
  }
};

exports.deletarInsumo = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM insumos WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ message: "Insumo removido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover insumo" });
  }
};

// REGISTRAR CONSUMO
exports.registrarConsumo = async (req, res) => {
  const { insumoId, animalId, loteId, quantidadeDia, dataInicio, dataFim, observacao } = req.body;
  const userId = req.usuario.id;
  if (!insumoId || !quantidadeDia || !dataInicio) return res.status(400).json({ error: "Insumo, quantidade e data início são obrigatórios" });
  try {
    await db.query(
      "INSERT INTO consumo_insumos (user_id, insumo_id, animal_id, lote_id, quantidade_dia, data_inicio, data_fim, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, insumoId, animalId || null, loteId || null, quantidadeDia, dataInicio, dataFim || null, observacao || null]
    );
    res.status(201).json({ message: "Consumo registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar consumo" });
  }
};

exports.listarConsumos = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [rows] = await db.query(
      `SELECT c.*, i.nome as insumo_nome, i.unidade, i.preco_unitario,
        a.brinco, a.raca, l.nome as lote_nome,
        DATEDIFF(IFNULL(c.data_fim, CURDATE()), c.data_inicio) + 1 as dias_total,
        (DATEDIFF(IFNULL(c.data_fim, CURDATE()), c.data_inicio) + 1) * c.quantidade_dia as quantidade_total,
        (DATEDIFF(IFNULL(c.data_fim, CURDATE()), c.data_inicio) + 1) * c.quantidade_dia * i.preco_unitario as custo_total
       FROM consumo_insumos c
       JOIN insumos i ON c.insumo_id = i.id
       LEFT JOIN animais a ON c.animal_id = a.id
       LEFT JOIN lotes l ON c.lote_id = l.id
       WHERE c.user_id = ?
       ORDER BY c.data_inicio DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar consumos" });
  }
};

exports.deletarConsumo = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM consumo_insumos WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ message: "Consumo removido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover consumo" });
  }
};