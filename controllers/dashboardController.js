const db = require("../config/db");

exports.getDashboard = async (req, res) => {
  const userId = req.usuario.id;

  try {
    const [[{ totalAnimais }]] = await db.query(
      "SELECT COUNT(*) as totalAnimais FROM animais WHERE user_id = ?", [userId]
    );

    const [[{ totalPesagens }]] = await db.query(
      "SELECT COUNT(*) as totalPesagens FROM pesagens WHERE usuario_id = ?", [userId]
    );

    const [[{ pesoMedio }]] = await db.query(
      "SELECT AVG(peso) as pesoMedio FROM pesagens WHERE usuario_id = ?", [userId]
    );

    const [[ultimaPesagem]] = await db.query(
      `SELECT p.peso, p.created_at, a.brinco, a.raca
       FROM pesagens p
       LEFT JOIN animais a ON p.animal_id = a.id
       WHERE p.usuario_id = ?
       ORDER BY p.created_at DESC LIMIT 1`, [userId]
    );

    const [[{ semPesar }]] = await db.query(
      `SELECT COUNT(*) as semPesar FROM animais a
       WHERE a.user_id = ?
       AND (
         NOT EXISTS (SELECT 1 FROM pesagens p WHERE p.animal_id = a.id)
         OR (SELECT MAX(p2.created_at) FROM pesagens p2 WHERE p2.animal_id = a.id) < DATE_SUB(NOW(), INTERVAL 30 DAY)
       )`, [userId]
    );

    const [animaisComPeso] = await db.query(
      `SELECT a.id,
        (SELECT p1.peso FROM pesagens p1 WHERE p1.animal_id = a.id ORDER BY p1.created_at DESC LIMIT 1) as pesoAtual,
        (SELECT p2.peso FROM pesagens p2 WHERE p2.animal_id = a.id ORDER BY p2.created_at ASC LIMIT 1) as pesoInicial,
        DATEDIFF(
          (SELECT p3.created_at FROM pesagens p3 WHERE p3.animal_id = a.id ORDER BY p3.created_at DESC LIMIT 1),
          (SELECT p4.created_at FROM pesagens p4 WHERE p4.animal_id = a.id ORDER BY p4.created_at ASC LIMIT 1)
        ) as dias
       FROM animais a WHERE a.user_id = ?
       HAVING pesoAtual IS NOT NULL AND pesoInicial IS NOT NULL AND dias > 0`, [userId]
    );

    const gmdMedio = animaisComPeso.length > 0
      ? (animaisComPeso.reduce((acc, a) => acc + (Number(a.pesoAtual) - Number(a.pesoInicial)) / a.dias, 0) / animaisComPeso.length).toFixed(3)
      : null;

    // GMD baixo (menos de 0.5 kg/dia)
    const gmdBaixo = animaisComPeso.filter(a => {
      const gmd = (Number(a.pesoAtual) - Number(a.pesoInicial)) / a.dias;
      return gmd < 0.5;
    }).length;

    const [distribuicao] = await db.query(
      "SELECT sexo, COUNT(*) as total FROM animais WHERE user_id = ? GROUP BY sexo", [userId]
    );

    // alertas de carência ativa
    const [[{ emCarencia }]] = await db.query(
      `SELECT COUNT(*) as emCarencia FROM medicamentos m
       WHERE m.user_id = ?
         AND m.carencia_dias > 0
         AND DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) >= CURDATE()`, [userId]
    );

    // últimos medicamentos aplicados
    const [ultimosMedicamentos] = await db.query(
      `SELECT m.nome, m.data_aplicacao, m.carencia_dias,
        a.brinco, l.nome as lote_nome,
        DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY) as data_fim_carencia,
        DATEDIFF(DATE_ADD(m.data_aplicacao, INTERVAL m.carencia_dias DAY), CURDATE()) as dias_restantes_carencia
       FROM medicamentos m
       LEFT JOIN animais a ON m.animal_id = a.id
       LEFT JOIN lotes l ON m.lote_id = l.id
       WHERE m.user_id = ?
       ORDER BY m.data_aplicacao DESC LIMIT 5`, [userId]
    );

    res.json({
      totalAnimais, totalPesagens,
      pesoMedio: pesoMedio ? Number(pesoMedio).toFixed(1) : null,
      ultimaPesagem: ultimaPesagem || null,
      semPesar, gmdMedio, gmdBaixo,
      distribuicao, emCarencia,
      ultimosMedicamentos,
    });
  } catch (err) {
    console.error("ERRO dashboard:", err);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
};