// carrega o .env ANTES de tudo, senão os outros arquivos leem env vazia
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const pesagensRoutes = require("./routes/pesagensRoutes");
const animaisRoutes = require("./routes/animaisRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const lotesRoutes = require("./routes/lotesRoutes");
const medicamentosRoutes = require("./routes/medicamentosRoutes");
const financeiroRoutes = require("./routes/financeiroRoutes");
const agendaRoutes = require("./routes/agendaRoutes");
const insumosRoutes = require("./routes/insumosRoutes");
const verificarToken = require("./middleware/authMiddleware");
const sessoesRoutes = require("./routes/sessoesRoutes");
const movimentacoesRoutes = require("./routes/movimentacoesRoutes");
const app = express();

// em produção só aceita o domínio do front, em dev aceita tudo
const origensPermitidas = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : "*";

app.use(cors({
  origin: origensPermitidas,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/ping", (req, res) => res.send("API funcionando 🚀"));
app.get("/perfil", verificarToken, (req, res) => {
  res.json({ message: "Acesso liberado 🔓", usuario: req.usuario });
});

app.use("/", userRoutes);
app.use("/pesagens", pesagensRoutes);
app.use("/animais", animaisRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/lotes", lotesRoutes);
app.use("/medicamentos", medicamentosRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/agenda", agendaRoutes);
app.use("/insumos", insumosRoutes);
app.use("/sessoes", verificarToken, sessoesRoutes);
app.use("/movimentacoes", verificarToken, movimentacoesRoutes);

// rota que não existe cai aqui
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// se algum controller estourar erro sem tratar, cai aqui
// e o usuário não vê stack trace
app.use((err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🔥 SERVER RODANDO NA ${PORT}`));
