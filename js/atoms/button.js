"use strict";

export function createActionButton({ testid, action, className, icon, label }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn ${className}`;
  button.setAttribute("data-testid", testid);
  button.dataset.action = action;
  button.innerHTML = icon;
  const text = document.createElement("span");
  text.textContent = label;
  button.append(text);
  return button;
}
