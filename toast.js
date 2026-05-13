(function (global) {
  const DEFAULT_MS = 2600;

  function root() {
    return document.getElementById("toast-root");
  }

  /**
   * @param {string} message
   * @param {number} [ms]
   */
  function show(message, ms) {
    const r = root();
    if (!r) return;

    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    r.appendChild(el);

    const duration = typeof ms === "number" ? ms : DEFAULT_MS;
    const t = global.setTimeout(() => {
      el.classList.add("is-out");
      global.setTimeout(() => el.remove(), 380);
    }, duration);

    el.addEventListener("click", () => {
      global.clearTimeout(t);
      el.classList.add("is-out");
      global.setTimeout(() => el.remove(), 380);
    });
  }

  global.TodoToast = { show };
})(typeof window !== "undefined" ? window : globalThis);