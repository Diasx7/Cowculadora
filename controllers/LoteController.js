const db = require("../config/db");

// CRIAR LOTE
exports.criarLote = async (req, res) => {
  const { nome, descricao } = req.body;
  const userId = req.usuario.id;

  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

  try {
    const [existing] = await db.query(
      "SELECT id FROM lotes WHERE nome = ? AND user_id = ?",
      [nome, userId]
    );
    if (existing.length > 0) return res.status(400).json({ error: "Já existe um lote com esse nome" });

    await db.query(
      "INSERT INTO lotes (user_id, nome, descricao) VALUES (?, ?, ?)",
      [userId, nome, descricao || null]
    );
    res.status(201).json({ message: "Lote criado com sucesso" });
  } catch (err) {
    console.error("ERRO ao criar lote:", err);
    res.status(500).json({ error: "Erro ao criar lote" });
  }
};

// LISTAR LOTES COM CONTAGEM DE ANIMAIS
exports.listarLotes = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [lotes] = await db.query(
      `SELECT l.*, COUNT(a.id) as total_animais
       FROM lotes l
       LEFT JOIN animais a ON a.lote_id = l.id
       WHERE l.user_id = ?
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId]
    );
    res.json(lotes);
  } catch (err) {
    console.error("ERRO ao listar lotes:", err);
    res.status(500).json({ error: "Erro ao buscar lotes" });
  }
};

// DELETAR LOTE
exports.deletarLote = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM lotes WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ message: "Lote removido com sucesso" });
  } catch (err) {
    console.error("ERRO ao deletar lote:", err);
    res.status(500).json({ error: "Erro ao remover lote" });
  }
};

// ATRIBUIR ANIMAL A LOTE
exports.atribuirAnimal = async (req, res) => {
  const userId = req.usuario.id;
  const { animalId, loteId } = req.body;
  try {
    await db.query(
      "UPDATE animais SET lote_id = ? WHERE id = ? AND user_id = ?",
      [loteId || null, animalId, userId]
    );
    res.json({ message: "Animal atualizado com sucesso" });
  } catch (err) {
    console.error("ERRO ao atribuir animal:", err);
    res.status(500).json({ error: "Erro ao atribuir animal ao lote" });
  }
};

// LISTAR ANIMAIS DE UM LOTE
exports.animaisDoLote = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    const [animais] = await db.query(
      "SELECT * FROM animais WHERE lote_id = ? AND user_id = ? ORDER BY created_at DESC",
      [id, userId]
    );
    res.json(animais);
  } catch (err) {
    console.error("ERRO ao buscar animais do lote:", err);
    res.status(500).json({ error: "Erro ao buscar animais do lote" });
  }
};