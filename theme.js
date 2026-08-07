const savedTheme = localStorage.getItem("theme") || "system";

function applyTheme() {

  let theme = savedTheme;

  if (theme === "system") {

    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  }

  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);

}

applyTheme();

window.matchMedia("(prefers-color-scheme: dark)")
.addEventListener("change", () => {

  if ((localStorage.getItem("theme") || "system") === "system") {

    applyTheme();

  }

});

export { applyTheme };
