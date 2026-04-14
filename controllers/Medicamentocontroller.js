const db = require("../config/db");

// REGISTRAR MEDICAMENTO
exports.registrar = async (req, res) => {
  const { animalId, loteId, nome, dose, dataAplicacao, carenciaDias, observacao } = req.body;
  const userId = req.usuario.id;

  if (!nome || !dataAplicacao) {
    return res.status(400).json({ error: "Nome e data de aplicação são obrigatórios" });
  }

  try {
    await db.query(
      `INSERT INTO medicamentos (user_id, animal_id, lote_id, nome, dose, data_aplicacao, carencia_dias, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, animalId || null, loteId || null, nome, dose || null, dataAplicacao, carenciaDias || 0, observacao || null]
    );
    res.status(201).json({ message: "Medicamento registrado com sucesso" });
  } catch (err) {
    console.error("ERRO ao registrar medicamento:", err);
    res.status(500).json({ error: "Erro ao registrar medicamento" });
  }
};

// LISTAR TODOS
exports.listar = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [rows] = await db.query(
      `SELECT m.*, 
        a.brinco, a.raca,
        l.nome as lote_nome,
        DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) as data_fim_carencia,
        DATEDIFF(DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY), CURDATE()) as dias_restantes_carencia
       FROM medicamentos m
       LEFT JOIN animais a ON m.animal_id = a.id
       LEFT JOIN lotes l ON m.lote_id = l.id
       WHERE m.user_id = ?
       ORDER BY m.data_aplicacao DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("ERRO ao listar medicamentos:", err);
    res.status(500).json({ error: "Erro ao buscar medicamentos" });
  }
};

// LISTAR POR ANIMAL
exports.listarPorAnimal = async (req, res) => {
  const userId = req.usuario.id;
  const { animalId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT m.*,
        DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) as data_fim_carencia,
        DATEDIFF(DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY), CURDATE()) as dias_restantes_carencia
       FROM medicamentos m
       WHERE m.user_id = ? AND m.animal_id = ?
       ORDER BY m.data_aplicacao DESC`,
      [userId, animalId]
    );
    res.json(rows);
  } catch (err) {
    console.error("ERRO:", err);
    res.status(500).json({ error: "Erro ao buscar medicamentos do animal" });
  }
};

// ALERTAS DE CARÊNCIA
exports.alertasCarencia = async (req, res) => {
  const userId = req.usuario.id;
  try {
    const [rows] = await db.query(
      `SELECT m.*, 
        a.brinco, a.raca,
        l.nome as lote_nome,
        DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) as data_fim_carencia,
        DATEDIFF(DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY), CURDATE()) as dias_restantes_carencia
       FROM medicamentos m
       LEFT JOIN animais a ON m.animal_id = a.id
       LEFT JOIN lotes l ON m.lote_id = l.id
       WHERE m.user_id = ?
         AND m.carencia_dias > 0
         AND DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) >= CURDATE()
       ORDER BY data_fim_carencia ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("ERRO:", err);
    res.status(500).json({ error: "Erro ao buscar alertas de carência" });
  }
};

// DELETAR
exports.deletar = async (req, res) => {
  const userId = req.usuario.id;
  const { id } = req.params;
  try {
    await db.query("DELETE FROM medicamentos WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ message: "Registro removido" });
  } catch (err) {
    console.error("ERRO:", err);
    res.status(500).json({ error: "Erro ao remover registro" });
  }
};