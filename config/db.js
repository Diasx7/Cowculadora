const mysql = require("mysql2/promise");

// sem fallback de senha aqui - se a env não estiver configurada,
// é melhor o servidor quebrar na hora do que conectar errado sem avisar
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error("Variáveis do banco não configuradas (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // limites do pool pra não estourar conexão no plano do Railway
  connectionLimit: 10,
  waitForConnections: true
});

module.exports = db;
