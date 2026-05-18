const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicamentocontroller");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.registrar);
router.get("/", verificarToken, controller.listar);
router.get("/alertas", verificarToken, controller.alertasCarencia);
router.get("/animal/:animalId", verificarToken, controller.listarPorAnimal);
router.delete("/:id", verificarToken, controller.deletar);

module.exports = router;