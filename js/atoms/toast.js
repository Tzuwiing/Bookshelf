"use strict";

import { ICONS } from "./icons.js";

export function showToast(regionEl, message, { type = "success", actionLabel, onAction, duration = 4500 } = {}) {
  if (!regionEl) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.innerHTML = ICONS[type] || ICONS.info;

  const text = document.createElement("span");
  text.className = "toast-text";
  text.textContent = message;

  toast.append(icon, text);

  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    if (!toast.isConnected || toast.classList.contains("is-leaving")) return;
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 260);
  };

  if (actionLabel && onAction) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "toast-action";
    action.textContent = actionLabel;
    action.addEventListener("click", () => {
      onAction();
      dismiss();
    });
    toast.append(action);
  }

  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.setAttribute("aria-label", "Tutup notifikasi");
  close.innerHTML = ICONS.close;
  close.addEventListener("click", dismiss);
  toast.append(close);

  regionEl.append(toast);
  while (regionEl.children.length > 4) regionEl.firstElementChild.remove();
  timer = setTimeout(dismiss, duration);
}
