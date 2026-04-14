const db = require("../config/db");

exports.criar = async (req, res) => {
  const { animalId, loteId, tipo, descricao, dataPrevista } = req.body;
  const userId = req.usuario.id;
  if (!tipo || !dataPrevista) return res.status(400).json({ error: "Tipo e data são obrigatórios" });
  try {
    await db.query(
      "INSERT INTO agenda (user_id, animal_id, lote_id, tipo, descricao, data_prevista) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, animalId || null, loteId || null, tipo, descricao || null, dataPrevista]
    );
    res.status(201).json({ message: "Agendado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao agendar" });
  }
};

exports.listar = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [rows] = await db.query(
      `SELECT ag.*, a.brinco, a.raca, l.nome as lote_nome,
        DATEDIFF(ag.data_prevista, CURDATE()) as dias_restantes
       FROM agenda ag
       LEFT JOIN animais a ON ag.animal_id = a.id
       LEFT JOIN lotes l ON ag.lote_id = l.id
       WHERE ag.user_id = ?
       ORDER BY ag.data_prevista ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agenda" });
  }
};

exports.concluir = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE agenda SET concluido = 1 WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    res.json({ message: "Concluído" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao concluir" });
  }
};

exports.deletar = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM agenda WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ message: "Removido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover" });
  }
};