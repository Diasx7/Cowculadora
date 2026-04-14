const db = require("../config/db");

// CADASTRAR ANIMAL
exports.criarAnimal = async (req, res) => {
  const { brinco, raca, nascimento, sexo } = req.body;
  const userId = req.usuario.id;

  if (!brinco) {
    return res.status(400).json({ error: "Brinco é obrigatório" });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM animais WHERE brinco = ? AND user_id = ?",
      [brinco, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Já existe um animal com esse brinco" });
    }

    await db.query(
      "INSERT INTO animais (user_id, brinco, raca, nascimento, sexo) VALUES (?, ?, ?, ?, ?)",
      [userId, brinco, raca || null, nascimento || null, sexo || null]
    );

    res.status(201).json({ message: "Animal cadastrado com sucesso" });
  } catch (err) {
    console.error("ERRO ao criar animal:", err);
    res.status(500).json({ error: "Erro ao cadastrar animal" });
  }
};

// LISTAR ANIMAIS
exports.listarAnimais = async (req, res) => {
  const userId = req.usuario.id;

  try {
    const [animais] = await db.query(
      "SELECT * FROM animais WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.json(animais);
  } catch (err) {
    console.error("ERRO ao listar animais:", err);
    res.status(500).json({ error: "Erro ao buscar animais" });
  }
};

// BUSCAR ANIMAL POR ID
exports.buscarAnimal = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;

  try {
    const [animais] = await db.query(
      "SELECT * FROM animais WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (animais.length === 0) {
      return res.status(404).json({ error: "Animal não encontrado" });
    }

    res.json(animais[0]);
  } catch (err) {
    console.error("ERRO ao buscar animal:", err);
    res.status(500).json({ error: "Erro ao buscar animal" });
  }
};

// DELETAR ANIMAL
exports.deletarAnimal = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;

  try {
    await db.query(
      "DELETE FROM animais WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    res.json({ message: "Animal removido com sucesso" });
  } catch (err) {
    console.error("ERRO ao deletar animal:", err);
    res.status(500).json({ error: "Erro ao remover animal" });
  }
};