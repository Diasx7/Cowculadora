const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const pesagensRoutes = require("./routes/pesagensRoutes");
const animaisRoutes = require("./routes/animaisRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const lotesRoutes = require("./routes/lotesRoutes");
const medicamentosRoutes = require("./routes/medicamentosRoutes");
const financeiroRoutes = require("./routes/financeiroRoutes");
const agendaRoutes = require("./routes/AgendaRoutes");
const insumosRoutes = require("./routes/Insumosroutes");
const verificarToken = require("./middleware/authMiddleware");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
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

app.listen(3001, () => console.log("🔥 SERVER RODANDO NA 3001"));