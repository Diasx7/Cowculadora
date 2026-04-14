const db = require("../config/db");

const Pesagem = {
  async criar({ peso, animal, animalId, userId }) {
    const [result] = await db.query(
      "INSERT INTO pesagens (peso, animal, animal_id, usuario_id) VALUES (?, ?, ?, ?)",
      [peso, animal || null, animalId || null, userId]
    );
    return result;
  },

  async listar(userId) {
    const [rows] = await db.query(
      `SELECT p.*, a.brinco, a.raca, a.sexo 
       FROM pesagens p
       LEFT JOIN animais a ON p.animal_id = a.id
       WHERE p.usuario_id = ? 
       ORDER BY p.id DESC`,
      [userId]
    );
    return rows;
  },

  async listarPorAnimal(animalId, userId) {
    const [rows] = await db.query(
      `SELECT p.* 
       FROM pesagens p
       WHERE p.animal_id = ? AND p.usuario_id = ?
       ORDER BY p.created_at DESC`,
      [animalId, userId]
    );
    return rows;
  }
};

module.exports = Pesagem;