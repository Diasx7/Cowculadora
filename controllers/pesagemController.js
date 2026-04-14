const Pesagem = require("../models/Pesagem");

exports.criarPesagem = async (req, res) => {
  try {
    const { peso, animal, animalId } = req.body;
    const userId = req.usuario.id;

    if (!peso) {
      return res.status(400).json({ error: "Peso é obrigatório" });
    }

    await Pesagem.criar({ peso, animal, animalId, userId });
    res.status(201).json({ message: "Pesagem criada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar pesagem" });
  }
};

exports.listarPesagens = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const pesagens = await Pesagem.listar(userId);
    res.json(pesagens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar pesagens" });
  }
};

exports.listarPorAnimal = async (req, res) => {
  try {
    const { animalId } = req.params;
    const userId = req.usuario.id;
    const pesagens = await Pesagem.listarPorAnimal(animalId, userId);
    res.json(pesagens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar pesagens do animal" });
  }
};