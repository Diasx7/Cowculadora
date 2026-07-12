const express = require("express");
const router = express.Router();
const sessaoController = require("../controllers/sessaoController");
const gmdController = require("../controllers/gmdController");

router.post("/", sessaoController.criarSessao);
router.get("/lote/:loteId", sessaoController.listarSessoes);
router.get("/lote/:loteId/gmd", gmdController.calcularGMD);

module.exports = router;