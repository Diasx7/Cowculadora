const express = require("express");
const router = express.Router();

const { cadastrarUsuario, login } = require("../controllers/userController");

router.post("/usuarios", cadastrarUsuario);
router.post("/login", login);

module.exports = router;