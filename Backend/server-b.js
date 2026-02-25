require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Pool } = require("pg"); 

const app = express();

/** ======= CONFIG ======= */
const PORT = process.env.PORT || 3000;

// Pool PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "todo_app_db",
  port: Number(process.env.DB_PORT || 5432),
});

/** ======= MIDDLEWARES ======= */
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

/** ======= ROUTES ======= */
app.get("/health", async (req, res) => {
  // Chequeo rápido de conexión a DB
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (e) {
    res.status(500).json({ ok: false, db: "error", message: e.message });
  }
});

// LISTAR
app.get("/api/tareas", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, titulo, completado, notas, prioridad, fecha_creacion FROM tareas ORDER BY id DESC"
    );
    // Respuesta estructurada como pide el documento
    res.json({ data: rows, error: null });
  } catch (e) {
    next(e);
  }
});

// OBTENER POR ID
app.get("/api/tareas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    // En Postgres usamos $1, $2, etc., en lugar de ?
    const { rows } = await pool.query(
      "SELECT * FROM tareas WHERE id = $1",
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });

    res.json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
});

// CREAR
app.post("/api/tareas", async (req, res, next) => {
  try {
    const { titulo, notas, prioridad } = req.body;

    // Validación manual simple (reemplaza a express-validator)
    if (!titulo || titulo.trim() === "") {
        const err = new Error("El título es obligatorio");
        err.status = 400;
        throw err;
    }

    const { rows } = await pool.query(
      "INSERT INTO tareas (titulo, notas, prioridad) VALUES ($1, $2, $3) RETURNING *",
      [titulo.trim(), notas || null, prioridad || 1]
    );

    res.status(201).json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
});

// ACTUALIZAR 
app.put("/api/tareas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, completado, notas, prioridad } = req.body;

    const check = await pool.query("SELECT id FROM tareas WHERE id = $1", [id]);
    if (check.rows.length === 0) return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });

    const { rows } = await pool.query(
      "UPDATE tareas SET titulo = $1, completado = $2, notas = $3, prioridad = $4, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [titulo, completado !== undefined ? completado : 0, notas, prioridad, id]
    );

    res.json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
});

// ELIMINAR
app.delete("/api/tareas/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query("DELETE FROM tareas WHERE id = $1", [id]);

    if (rowCount === 0) return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });

    res.json({ data: { message: "Tarea eliminada" }, error: null });
  } catch (e) {
    next(e);
  }
});

/** ======= ERROR HANDLER ======= */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    data: null,
    error: { message: err.message || "Error interno" }
  });
});

/** ======= START ======= */
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT} (server-b.js)`);
});