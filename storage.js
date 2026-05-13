(function (global) {
  const STORAGE_KEY = "todo-app-v3";

  /**
   * @typedef {"normal"|"important"|"urgent"} Priority
   * @typedef {{ id: string, text: string, done: boolean, priority: Priority, createdAt: number }} Task
   */

  function normalizePriority(p) {
    return p === "important" || p === "urgent" ? p : "normal";
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (t) =>
            t &&
            typeof t.id === "string" &&
            typeof t.text === "string" &&
            typeof t.done === "boolean"
        )
        .map((t) => ({
          id: t.id,
          text: String(t.text).slice(0, 200),
          done: !!t.done,
          priority: normalizePriority(t.priority),
          createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        }));
    } catch {
      return [];
    }
  }

  /** @param {Task[]} tasks */
  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /**
   * @param {Task[]} tasks
   * @param {"all"|"active"|"completed"} filter
   */
  function filterByStatus(tasks, filter) {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "completed") return tasks.filter((t) => t.done);
    return tasks;
  }

  /**
   * @param {Task[]} tasks
   * @param {string} query
   */
  function filterBySearch(tasks, query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.text.toLowerCase().includes(q));
  }

  /** @returns {string} */
  function exportJSON(tasks) {
    return JSON.stringify({ version: 3, exportedAt: Date.now(), tasks }, null, 2);
  }

  /**
   * @param {string} json
   * @returns {{ ok: true, tasks: Task[] } | { ok: false, error: string }}
   */
  function importJSON(json) {
    try {
      const data = JSON.parse(json);
      const arr = Array.isArray(data) ? data : data && Array.isArray(data.tasks) ? data.tasks : null;
      if (!arr) return { ok: false, error: "Invalid file format." };
      const tasks = arr
        .filter((t) => t && typeof t.text === "string")
        .map((t, i) => ({
          id: typeof t.id === "string" ? t.id : "imp-" + Date.now() + "-" + i,
          text: String(t.text).slice(0, 200),
          done: !!t.done,
          priority: normalizePriority(t.priority),
          createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
        }));
      return { ok: true, tasks };
    } catch {
      return { ok: false, error: "Could not parse JSON." };
    }
  }

  global.TodoStorage = {
    loadTasks,
    saveTasks,
    filterByStatus,
    filterBySearch,
    exportJSON,
    importJSON,
  };
})(typeof window !== "undefined" ? window : globalThis);