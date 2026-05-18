const express = require("express");
const router = express.Router();

const controller = require("../controllers/animalController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, controller.criarAnimal);
router.get("/", verificarToken, controller.listarAnimais);
router.get("/:id", verificarToken, controller.buscarAnimal);
router.delete("/:id", verificarToken, controller.deletarAnimal);

module.exports = router;