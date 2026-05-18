const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const verificarToken = require("../middleware/authMiddleware");

router.get("/", verificarToken, controller.getDashboard);

module.exports = router;