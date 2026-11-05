"use strict";

export const THEME_KEY = "BOOKSHELF_APP_THEME";

export function applyTheme(theme, themeToggleEl) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* abaikan */
  }
  if (themeToggleEl) {
    themeToggleEl.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggleEl.setAttribute(
      "aria-label",
      theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"
    );
  }
}

export function toggleTheme(themeToggleEl) {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, themeToggleEl);
}
