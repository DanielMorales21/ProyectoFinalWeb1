const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// 1. IMPORTAMOS LAS RUTAS DE TAREAS
const tareasRoutes = require("./routes/tareas.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

// 2. CONECTAMOS LAS RUTAS AL ENDPOINT PRINCIPAL
app.use("/api/tareas", tareasRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Error interno",
  });
});

module.exports = app;