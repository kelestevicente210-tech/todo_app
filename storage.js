(function (global) {
  const STORAGE_KEY = "todo-app-tasks-v1";

  /**
   * @typedef {{ id: string, text: string, done: boolean }} Task
   */

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
        }));
    } catch {
      return [];
    }
  }

  /**
   * @param {Task[]} tasks
   */
  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /**
   * @param {Task[]} tasks
   * @param {"all"|"active"|"completed"} filter
   * @returns {Task[]}
   */
  function filterTasks(tasks, filter) {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "completed") return tasks.filter((t) => t.done);
    return tasks;
  }

  global.TodoStorage = {
    loadTasks,
    saveTasks,
    filterTasks,
  };
})(typeof window !== "undefined" ? window : globalThis);