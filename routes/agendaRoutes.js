const express = require("express");
const router = express.Router();
const controller = require("../controllers/agendacontroller");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.criar);
router.get("/", verificarToken, controller.listar);
router.patch("/:id/concluir", verificarToken, controller.concluir);
router.delete("/:id", verificarToken, controller.deletar);

module.exports = router;