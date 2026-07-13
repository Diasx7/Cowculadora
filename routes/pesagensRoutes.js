const express = require("express");
const router = express.Router();

const controller = require("../controllers/pesagemController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.criarPesagem);
router.get("/", verificarToken, controller.listarPesagens);
router.get("/animal/:animalId", verificarToken, controller.listarPorAnimal);

module.exports = router;