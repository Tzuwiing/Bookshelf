"use strict";

export const MAX_RATING = 5;

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function generateId(existingBooks = []) {
  let id = Date.now();
  while (existingBooks.some((book) => book.id === id)) id++;
  return id;
}

export function hueFor(id) {
  return Math.abs(Number(id) * 47) % 360;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export function animateNumber(el, to, suffix = "") {
  if (!el) return;
  const from = Number(el.dataset.value || 0);
  el.dataset.value = to;
  if (from === to || prefersReducedMotion()) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const start = performance.now();
  const duration = 650;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(from + (to - from) * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function setHighlightedText(el, text, query = "") {
  el.textContent = "";
  const trimmedQuery = query.trim();
  const index = trimmedQuery ? text.toLowerCase().indexOf(trimmedQuery.toLowerCase()) : -1;
  if (index === -1) {
    el.textContent = text;
    return;
  }
  const mark = document.createElement("mark");
  mark.textContent = text.slice(index, index + trimmedQuery.length);
  el.append(text.slice(0, index), mark, text.slice(index + trimmedQuery.length));
}

export function burstConfetti(x, y) {
  if (prefersReducedMotion()) return;
  const colors = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#38bdf8"];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 120;
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 40}px`);
    piece.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty("--c", colors[i % colors.length]);
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${8 + Math.random() * 8}px`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 1200);
  }
}
