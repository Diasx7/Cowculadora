const express = require("express");
const router = express.Router();

const { cadastrarUsuario, login, verificarEmail, reenviarVerificacao } = require("../controllers/userController");

router.post("/usuarios", cadastrarUsuario);
router.post("/login", login);
router.get("/verificar-email", verificarEmail);
router.post("/reenviar-verificacao", reenviarVerificacao);

module.exports = router;