const express = require("express");
const router = express.Router();
const controller = require("../controllers/financeiroController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/cotacao", verificarToken, controller.getCotacao);
router.post("/", verificarToken, controller.salvarFinanceiro);
router.get("/", verificarToken, controller.listarFinanceiro);

module.exports = router;