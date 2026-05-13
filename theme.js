(function (global) {
  const KEY = "todo-theme";

  function getStored() {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") return v;
    } catch {}
    return null;
  }

  function prefersDark() {
    return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function getEffective() {
    return getStored() || (prefersDark() ? "dark" : "light");
  }

  /** @param {"light"|"dark"} mode */
  function apply(mode) {
    document.documentElement.setAttribute("data-theme", mode);
  }

  function init() {
    apply(getEffective());
  }

  /** @param {"light"|"dark"} mode */
  function setTheme(mode) {
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
    apply(mode);
  }

  function toggle() {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    setTheme(next);
    return next;
  }

  global.TodoTheme = { init, setTheme, toggle, getEffective };
})(typeof window !== "undefined" ? window : globalThis);

TodoTheme.init();