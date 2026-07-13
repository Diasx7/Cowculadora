const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { enviarEmailVerificacao } = require("../services/emailService");

const SECRET = process.env.JWT_SECRET;
// tempo de expiração configurável, padrão 7 dias (uso no campo, internet ruim)
const EXPIRA = process.env.JWT_EXPIRES || "7d";

const TOKEN_VALIDADE_HORAS = 24;

function gerarTokenVerificacao() {
  const token = crypto.randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + TOKEN_VALIDADE_HORAS * 60 * 60 * 1000);
  return { token, expira };
}

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
    const { token, expira } = gerarTokenVerificacao();
    const sql = "INSERT INTO usuarios (nome, email, senha, token_verificacao, token_expira) VALUES (?, ?, ?, ?, ?)";
    await db.query(sql, [nome, email, senhaHash, token, expira]);

    // se o email falhar, o cadastro fica valendo mesmo assim - o usuario reenvia depois
    try {
      await enviarEmailVerificacao(email, token);
    } catch (errEmail) {
      console.error("ERRO ao enviar e-mail de verificação:", errEmail);
    }

    res.status(201).json({ message: "Cadastro realizado! Verifique seu e-mail para ativar a conta." });
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

    if (!usuario.email_verificado) {
      return res.status(403).json({ error: "Confirme seu e-mail para entrar", naoVerificado: true });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome },
      SECRET,
      { expiresIn: EXPIRA }
    );

    res.json({ message: "Login OK", token, nome: usuario.nome });
  } catch (err) {
    console.error("ERRO login:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
};

// CONFIRMA O E-MAIL A PARTIR DO LINK
exports.verificarEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token não informado" });
  }

  try {
    const [result] = await db.query(
      "SELECT id FROM usuarios WHERE token_verificacao = ? AND token_expira > NOW()",
      [token]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    await db.query(
      "UPDATE usuarios SET email_verificado = 1, token_verificacao = NULL, token_expira = NULL WHERE id = ?",
      [result[0].id]
    );

    res.json({ message: "E-mail confirmado com sucesso" });
  } catch (err) {
    console.error("ERRO ao verificar e-mail:", err);
    res.status(500).json({ error: "Erro ao verificar e-mail" });
  }
};

// REENVIA O LINK DE VERIFICAÇÃO
exports.reenviarVerificacao = async (req, res) => {
  const { email } = req.body;
  // resposta sempre igual, nao importa o que aconteceu - senao da pra descobrir quais emails existem
  const RESPOSTA_GENERICA = { message: "Se o e-mail existir e ainda não estiver confirmado, reenviamos o link." };

  if (!email) {
    return res.status(400).json({ error: "Informe o e-mail" });
  }

  try {
    const [result] = await db.query(
      "SELECT id, email_verificado FROM usuarios WHERE email = ?",
      [email]
    );

    if (result.length === 0 || result[0].email_verificado) {
      return res.json(RESPOSTA_GENERICA);
    }

    const { token, expira } = gerarTokenVerificacao();
    await db.query(
      "UPDATE usuarios SET token_verificacao = ?, token_expira = ? WHERE id = ?",
      [token, expira, result[0].id]
    );

    try {
      await enviarEmailVerificacao(email, token);
    } catch (errEmail) {
      console.error("ERRO ao reenviar e-mail de verificação:", errEmail);
    }

    res.json(RESPOSTA_GENERICA);
  } catch (err) {
    console.error("ERRO ao reenviar verificação:", err);
    res.status(500).json({ error: "Erro ao reenviar verificação" });
  }
};
