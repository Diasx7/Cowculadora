const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "segredo_super_secreto";

// CADASTRO
exports.cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).send("Preencha todos os campos");
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    await db.query(sql, [nome, email, senhaHash]); // ✅ await, sem callback
    res.send("Usuário cadastrado com sucesso");
  } catch (err) {
    console.log("ERRO:", err);
    res.status(500).send("Erro ao cadastrar");
  }
};

// LOGIN
exports.login = async (req, res) => { // ✅ virou async
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).send("Preencha email e senha");
  }

  try {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    const [result] = await db.query(sql, [email]); // ✅ await + desestrutura

    if (result.length === 0) {
      return res.status(401).send("Usuário não encontrado");
    }

    const usuario = result[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).send("Senha incorreta");
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login OK", token });
  } catch (err) {
    console.log("ERRO:", err);
    res.status(500).send("Erro no servidor");
  }
};