const express = require("express");
const router = express.Router();
const movimentacaoController = require("../controllers/movimentacaoController");

router.post("/", movimentacaoController.criarMovimentacao);
router.get("/lote/:loteId", movimentacaoController.listarMovimentacoes);

module.exports = router;
