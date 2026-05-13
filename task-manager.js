(function () {
  const form = document.getElementById("add-form");
  const input = document.getElementById("task-input");
  const listEl = document.getElementById("task-list");
  const emptyHint = document.getElementById("empty-hint");
  const filterBtns = document.querySelectorAll(".filters__btn");

  /** @type {"all"|"active"|"completed"} */
  let currentFilter = "all";
  /** @type {import("./storage.js").Task[]} */
  let tasks = TodoStorage.loadTasks();

  function uid() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : "t-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function persist() {
    TodoStorage.saveTasks(tasks);
  }

  function visibleTasks() {
    return TodoStorage.filterTasks(tasks, currentFilter);
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.filter === filter);
    });
    render();
  }

  function render() {
    const visible = visibleTasks();
    listEl.innerHTML = "";

    emptyHint.hidden = visible.length > 0 || tasks.length === 0;

    visible.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " is-done" : "");
      li.dataset.id = task.id;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "task-item__check";
      check.checked = task.done;
      check.setAttribute("aria-label", "Mark done");

      const middle = document.createElement("div");

      const label = document.createElement("span");
      label.className = "task-item__label";
      label.textContent = task.text;
      label.title = "Double-click to edit";

      middle.appendChild(label);

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
      li.append(check, middle, actions);
      listEl.appendChild(li);

      check.addEventListener("change", () => {
        const t = tasks.find((x) => x.id === task.id);
        if (t) {
          t.done = check.checked;
          persist();
          render();
        }
      });

      label.addEventListener("dblclick", () => startEdit(li, task, middle, label));

      editBtn.addEventListener("click", () => startEdit(li, task, middle, label));

      delBtn.addEventListener("click", () => {
        tasks = tasks.filter((x) => x.id !== task.id);
        persist();
        render();
      });
    });
  }

  /**
   * @param {HTMLElement} li
   * @param {{ id: string, text: string, done: boolean }} task
   * @param {HTMLElement} middle
   * @param {HTMLElement} label
   */
  function startEdit(li, task, middle, label) {
    const existing = middle.querySelector(".task-item__edit-input");
    if (existing) return;

    const field = document.createElement("input");
    field.type = "text";
    field.className = "task-item__edit-input";
    field.value = task.text;
    field.maxLength = 200;

    label.replaceWith(field);
    field.focus();
    field.select();

    function finish(save) {
      const next = (field.value || "").trim();
      field.replaceWith(label);
      if (save && next) {
        task.text = next;
        label.textContent = next;
        persist();
      } else if (save && !next) {
        tasks = tasks.filter((x) => x.id !== task.id);
        persist();
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
    tasks.push({ id: uid(), text, done: false });
    input.value = "";
    persist();
    render();
    input.focus();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      if (f === "all" || f === "active" || f === "completed") setFilter(f);
    });
  });

  render();
})();