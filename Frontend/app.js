const API_BASE = "http://localhost:3000/api/tareas";

// 1. CAPTURAR ELEMENTOS DEL DOM
const els = {
  inputNew: document.getElementById("new-todo"),
  btnAdd: document.getElementById("add-btn"),
  todoList: document.getElementById("todo-list"),
  todoCount: document.getElementById("todo-count")
};

let state = {
  tareas: []
};

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json.error?.message || "Error en la petición";
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  // Retornamos directamente el array o el objeto que viene dentro de "data"
  return json.data; 
}

// 4. RENDERIZAR EL DOM
function render() {
  els.todoList.innerHTML = state.tareas.map(t => `
    <li class="todo-item" data-id="${t.id}">
        <label class="todo-content">
            <input type="checkbox" class="todo-checkbox" ${t.completado === 1 ? "checked" : ""}>
            <span class="todo-text" style="${t.completado === 1 ? 'text-decoration: line-through; color: #999;' : ''}">
                ${t.titulo}
            </span>
        </label>
        <button class="delete-btn" aria-label="Eliminar">X</button>
    </li>
  `).join("");

  // Actualizar contador de pendientes
  const pendientes = state.tareas.filter(t => t.completado === 0).length;
  els.todoCount.textContent = `${pendientes} items remaining`;
}

// 5. FUNCIONES CRUD
async function loadTareas() {
  try {
    state.tareas = await api(API_BASE);
    render();
  } catch (e) {
    console.error("Error al cargar:", e.message);
  }
}

async function createTarea(titulo) {
  try {
    await api(API_BASE, { method: "POST", body: JSON.stringify({ titulo }) });
    els.inputNew.value = ""; // Limpiar el input
    await loadTareas(); // Recargar la lista
  } catch (e) {
    alert("Error al crear: " + e.message);
  }
}

async function toggleTarea(id, completadoActual) {
  try {
    const nuevoEstado = completadoActual === 1 ? 0 : 1;
    await api(`${API_BASE}/${id}`, { 
      method: "PUT", 
      body: JSON.stringify({ completado: nuevoEstado }) 
    });
    await loadTareas();
  } catch (e) {
    alert("Error al actualizar: " + e.message);
  }
}

async function deleteTarea(id) {
  // Confirmación simple antes de borrar
  if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
  
  try {
    await api(`${API_BASE}/${id}`, { method: "DELETE" });
    await loadTareas();
  } catch (e) {
    alert("Error al eliminar: " + e.message);
  }
}

// 6. EVENT LISTENERS
// Agregar con el botón
els.btnAdd.addEventListener("click", () => {
  const titulo = els.inputNew.value.trim();
  if (titulo) createTarea(titulo);
});

// Agregar presionando Enter
els.inputNew.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const titulo = els.inputNew.value.trim();
    if (titulo) createTarea(titulo);
  }
});

// Escuchar clics dentro de la lista (Delegación de eventos para editar/borrar)
els.todoList.addEventListener("click", (e) => {
  // Buscamos el elemento <li> padre más cercano al lugar donde hicimos clic
  const item = e.target.closest(".todo-item");
  if (!item) return;
  
  const id = item.dataset.id;
  const tarea = state.tareas.find(t => String(t.id) === String(id));

  // Si hizo clic en el botón de la "X"
  if (e.target.classList.contains("delete-btn")) {
    deleteTarea(id);
  }
  
  // Si hizo clic en el checkbox
  if (e.target.classList.contains("todo-checkbox")) {
    toggleTarea(id, tarea.completado);
  }
});

// 7. INICIALIZAR
(async function init() {
  await loadTareas();
})();