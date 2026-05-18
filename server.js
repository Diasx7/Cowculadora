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

const app = express();

app.use(cors({
  origin: "*",
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🔥 SERVER RODANDO NA ${PORT}`));