"use strict";

import { animateNumber } from "../services/utils.js";

export function updateStatsUI(elements, books) {
  const total = books.length;
  const done = books.filter((book) => book.isComplete).length;
  const todo = total - done;
  const percent = total ? Math.round((done / total) * 100) : 0;

  animateNumber(elements.statTotal, total);
  animateNumber(elements.statDone, done);
  animateNumber(elements.statTodo, todo);
  animateNumber(elements.statPercent, percent, "%");

  const circumference = 2 * Math.PI * 26;
  if (elements.ringValue) {
    elements.ringValue.style.strokeDasharray = String(circumference);
    elements.ringValue.style.strokeDashoffset = String(circumference * (1 - percent / 100));
  }

  if (elements.progressText) {
    elements.progressText.textContent = total
      ? `${done} dari ${total} buku sudah selesai dibaca`
      : "Belum ada buku di rak kamu";
  }
}
