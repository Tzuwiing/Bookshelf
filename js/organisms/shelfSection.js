"use strict";

import { createBookCard } from "../molecules/bookCard.js";
import { updateBadge } from "../atoms/badge.js";

export function renderShelfList(container, list, freshIds, searchQuery) {
  const fragment = document.createDocumentFragment();
  list.forEach((book, index) =>
    fragment.append(createBookCard(book, index, freshIds, searchQuery))
  );
  container.replaceChildren(fragment);
}

export function getEmptyMessage(shelf, searchQuery) {
  const query = searchQuery.trim();
  if (query) return `Tidak ada buku dengan judul “${query}” di rak ini.`;
  return shelf === "complete"
    ? "Belum ada buku yang selesai dibaca. Semangat, sebentar lagi!"
    : "Rak ini kosong. Tambahkan buku baru dari formulir di samping.";
}

export function updateShelvesUI(elements, incompleteBooks, completeBooks, freshIds, searchQuery) {
  renderShelfList(elements.incompleteList, incompleteBooks, freshIds, searchQuery);
  renderShelfList(elements.completeList, completeBooks, freshIds, searchQuery);

  elements.incompleteEmpty.hidden = incompleteBooks.length > 0;
  elements.completeEmpty.hidden = completeBooks.length > 0;
  elements.incompleteEmptyText.textContent = getEmptyMessage("incomplete", searchQuery);
  elements.completeEmptyText.textContent = getEmptyMessage("complete", searchQuery);

  updateBadge(elements.incompleteCount, incompleteBooks.length);
  updateBadge(elements.completeCount, completeBooks.length);
}
