(function () {
  const form = document.getElementById("add-form");
  const input = document.getElementById("task-input");
  const prioritySelect = document.getElementById("priority-select");
  const searchInput = document.getElementById("search-input");
  const listEl = document.getElementById("task-list");
  const emptyHint = document.getElementById("empty-hint");
  const statsLine = document.getElementById("stats-line");
  const filterBtns = document.querySelectorAll(".chip");
  const themeBtn = document.getElementById("theme-toggle");
  const dateLine = document.getElementById("date-line");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const exportBtn = document.getElementById("export-btn");
  const importInput = document.getElementById("import-input");

  /** @type {"all"|"active"|"completed"} */
  let statusFilter = "all";
  let searchQuery = "";
  /** @type {ReturnType<typeof TodoStorage.loadTasks>} */
  let tasks = TodoStorage.loadTasks();

  const PRI_LABEL = { normal: "Normal", important: "Important", urgent: "Urgent" };

  function uid() {
    return globalThis.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : "t-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function persist() {
    TodoStorage.saveTasks(tasks);
  }

  function fmtDate() {
    const o = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return o.format(new Date());
  }

  function setDateLine() {
    if (dateLine) dateLine.textContent = fmtDate();
  }

  function setStatusFilter(filter) {
    statusFilter = filter;
    filterBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    });
    render();
  }

  function visibleTasks() {
    let t = TodoStorage.filterByStatus(tasks, statusFilter);
    t = TodoStorage.filterBySearch(t, searchQuery);
    t.sort((a, b) => b.createdAt - a.createdAt);
    return t;
  }

  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter((x) => x.done).length;
    const active = total - done;
    statsLine.textContent = total
      ? `${active} active · ${done} done · ${total} total`
      : "No tasks yet";
  }

  function render() {
    const visible = visibleTasks();
    listEl.innerHTML = "";

    const hasAny = tasks.length > 0;
    const showEmpty = !hasAny || visible.length === 0;
    emptyHint.hidden = !showEmpty;
    if (showEmpty) {
      emptyHint.textContent = !hasAny
        ? "Nothing here yet. Add your first task above."
        : "No tasks match this filter or search.";
    }

    updateStats();

    visible.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " is-done" : "");
      li.dataset.id = task.id;
      li.dataset.priority = task.priority;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "task-item__check";
      check.checked = task.done;
      check.setAttribute("aria-label", task.done ? "Mark as active" : "Mark as done");

      const mid = document.createElement("div");
      mid.className = "task-item__mid";

      const label = document.createElement("span");
      label.className = "task-item__label";
      label.textContent = task.text;
      label.title = "Double-click to edit";

      const meta = document.createElement("div");
      meta.className = "task-item__meta";
      meta.textContent = PRI_LABEL[task.priority] || "Normal";

      mid.append(label, meta);

      const actions = document.createElement("div");
      actions.className = "task-item__actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "task-item__btn task-item__btn--edit";
      editBtn.textContent = "Edit";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "task-item__btn task-item__btn--delete";
      delBtn.textContent = "Delete";

      actions.append(editBtn, delBtn);
      li.append(check, mid, actions);
      listEl.appendChild(li);

      check.addEventListener("change", () => {
        const t = tasks.find((x) => x.id === task.id);
        if (!t) return;
        t.done = check.checked;
        persist();
        TodoToast.show(t.done ? "Marked done" : "Marked active");
        render();
      });

      label.addEventListener("dblclick", () => startEdit(li, task, mid, label, meta));
      editBtn.addEventListener("click", () => startEdit(li, task, mid, label, meta));

      delBtn.addEventListener("click", () => {
        tasks = tasks.filter((x) => x.id !== task.id);
        persist();
        TodoToast.show("Task removed");
        render();
      });
    });
  }

  function startEdit(li, task, mid, label, meta) {
    if (mid.querySelector(".task-item__edit-input")) return;

    const field = document.createElement("input");
    field.type = "text";
    field.className = "task-item__edit-input";
    field.value = task.text;
    field.maxLength = 200;

    label.replaceWith(field);
    meta.hidden = true;
    field.focus();
    field.select();

    function finish(save) {
      const next = (field.value || "").trim();
      field.replaceWith(label);
      meta.hidden = false;
      if (save && next) {
        task.text = next;
        label.textContent = next;
        persist();
        TodoToast.show("Task updated");
      } else if (save && !next) {
        tasks = tasks.filter((x) => x.id !== task.id);
        persist();
        TodoToast.show("Empty task discarded");
        render();
        return;
      }
      render();
    }

    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });

    field.addEventListener("blur", () => finish(true));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;
    const priority =
      prioritySelect && (prioritySelect.value === "important" || prioritySelect.value === "urgent")
        ? prioritySelect.value
        : "normal";
    tasks.push({ id: uid(), text, done: false, priority, createdAt: Date.now() });
    input.value = "";
    persist();
    TodoToast.show("Task added");
    render();
    input.focus();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      if (f === "all" || f === "active" || f === "completed") setStatusFilter(f);
    });
  });

  let searchTimer = 0;
  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      searchQuery = searchInput.value || "";
      render();
    }, 120);
  });

  themeBtn.addEventListener("click", () => {
    const mode = TodoTheme.toggle();
    TodoToast.show(mode === "dark" ? "Dark theme" : "Light theme", 1800);
  });

  clearCompletedBtn.addEventListener("click", () => {
    const before = tasks.length;
    tasks = tasks.filter((t) => !t.done);
    const removed = before - tasks.length;
    if (!removed) {
      TodoToast.show("No completed tasks to clear");
      return;
    }
    persist();
    TodoToast.show(`Cleared ${removed} completed`);
    render();
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([TodoStorage.exportJSON(tasks)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todo-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    TodoToast.show("Backup downloaded");
  });

  importInput.addEventListener("change", () => {
    const file = importInput.files && importInput.files[0];
    importInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const res = TodoStorage.importJSON(text);
      if (!res.ok) {
        TodoToast.show(res.error, 3200);
        return;
      }
      tasks = res.tasks;
      persist();
      TodoToast.show(`Imported ${tasks.length} tasks`);
      render();
    };
    reader.readAsText(file);
  });

  setDateLine();
  render();
})();