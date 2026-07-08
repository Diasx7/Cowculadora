const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
// tempo de expiração configurável, padrão 7 dias (uso no campo, internet ruim)
const EXPIRA = process.env.JWT_EXPIRES || "7d";

// CADASTRO
exports.cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  // senha mínima pra não deixar cadastrar "123"
  if (senha.length < 6) {
    return res.status(400).json({ error: "A senha precisa ter no mínimo 6 caracteres" });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    await db.query(sql, [nome, email, senhaHash]);
    res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  } catch (err) {
    // email duplicado é o erro mais comum, trata separado
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Esse e-mail já está cadastrado" });
    }
    console.error("ERRO cadastro:", err);
    res.status(500).json({ error: "Erro ao cadastrar" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Preencha email e senha" });
  }

  try {
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    const [result] = await db.query(sql, [email]);

    // mesma mensagem pros dois casos, pra não entregar quais emails existem no sistema
    if (result.length === 0) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    const usuario = result[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      SECRET,
      { expiresIn: EXPIRA }
    );

    res.json({ message: "Login OK", token, nome: usuario.nome });
  } catch (err) {
    console.error("ERRO login:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
};
