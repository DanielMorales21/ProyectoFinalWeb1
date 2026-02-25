const db = require("../db"); 

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT id, titulo, completado, notas, prioridad, fecha_creacion FROM tareas ORDER BY id DESC"
    );
    res.json({ data: rows, error: null });
  } catch (e) {
    next(e);
  }
};

exports.obtenerPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "SELECT * FROM tareas WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });
    }

    res.json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { titulo, notas, prioridad } = req.body;

    if (!titulo || titulo.trim() === "") {
        return res.status(400).json({ data: null, error: { message: "El título es obligatorio" } });
    }

    const { rows } = await db.query(
      "INSERT INTO tareas (titulo, notas, prioridad) VALUES ($1, $2, $3) RETURNING *",
      [titulo.trim(), notas || null, prioridad || 1]
    );

    res.status(201).json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, completado, notas, prioridad } = req.body;

    const check = await db.query("SELECT id FROM tareas WHERE id = $1", [id]);
    if (check.rows.length === 0) {
        return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });
    }

    const { rows } = await db.query(
      "UPDATE tareas SET titulo = $1, completado = $2, notas = $3, prioridad = $4, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [titulo, completado !== undefined ? completado : 0, notas, prioridad, id]
    );

    res.json({ data: rows[0], error: null });
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query("DELETE FROM tareas WHERE id = $1", [id]);

    if (rowCount === 0) {
        return res.status(404).json({ data: null, error: { message: "Tarea no encontrada" } });
    }

    res.json({ data: { message: "Tarea eliminada correctamente" }, error: null });
  } catch (e) {
    next(e);
  }
};