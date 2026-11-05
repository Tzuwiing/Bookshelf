"use strict";

export function openEditDialog(dialogEl, formEls, book) {
  if (!book || !dialogEl) return;
  formEls.editTitle.value = book.title;
  formEls.editAuthor.value = book.author;
  formEls.editYear.value = book.year;
  formEls.editIsComplete.checked = book.isComplete;
  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute("open", "");
  }
  formEls.editTitle.focus();
}

export function closeEditDialog(dialogEl) {
  if (dialogEl && dialogEl.open) dialogEl.close();
}
