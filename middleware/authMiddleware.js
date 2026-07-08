const jwt = require("jsonwebtoken");

// o segredo agora vem do .env, nunca mais hardcoded
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  // se esqueceu de configurar, o servidor nem deve subir
  throw new Error("JWT_SECRET não configurado no .env");
}

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = verificarToken;
