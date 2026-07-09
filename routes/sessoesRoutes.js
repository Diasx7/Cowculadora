const express = require("express");
const router = express.Router();
const sessaoController = require("../controllers/sessaoController");

router.post("/", sessaoController.criarSessao);
router.get("/lote/:loteId", sessaoController.listarSessoes);

module.exports = router;