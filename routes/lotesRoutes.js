const express = require("express");
const router = express.Router();
const controller = require("../controllers/loteController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.criarLote);
router.get("/", verificarToken, controller.listarLotes);
router.delete("/:id", verificarToken, controller.deletarLote);
router.post("/atribuir", verificarToken, controller.atribuirAnimal);
router.get("/:id/animais", verificarToken, controller.animaisDoLote);

module.exports = router;