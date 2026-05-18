const express = require("express");
const router = express.Router();
const controller = require("../controllers/insumosController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.criarInsumo);
router.get("/", verificarToken, controller.listarInsumos);
router.delete("/:id", verificarToken, controller.deletarInsumo);

router.post("/consumo", verificarToken, controller.registrarConsumo);
router.get("/consumo", verificarToken, controller.listarConsumos);
router.delete("/consumo/:id", verificarToken, controller.deletarConsumo);

module.exports = router;