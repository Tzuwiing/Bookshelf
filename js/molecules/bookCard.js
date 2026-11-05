"use strict";

import { hueFor, setHighlightedText } from "../services/utils.js";
import { ICONS } from "../atoms/icons.js";
import { createActionButton } from "../atoms/button.js";
import { createRating } from "../atoms/rating.js";

export function createBookCard(book, index, freshIds, searchQuery = "") {
  const bookItem = document.createElement("div");
  bookItem.setAttribute("data-bookid", book.id);
  bookItem.setAttribute("data-testid", "bookItem");
  bookItem.className = "book-card";
  bookItem.style.setProperty("--hue", hueFor(book.id));
  if (freshIds.has(book.id)) {
    bookItem.classList.add("is-entering");
    bookItem.style.setProperty("--i", Math.min(index, 12));
  }

  const cover = document.createElement("div");
  cover.className = "book-cover";
  cover.setAttribute("aria-hidden", "true");
  cover.textContent = book.title.trim().charAt(0).toUpperCase();

  const titleElement = document.createElement("h3");
  titleElement.setAttribute("data-testid", "bookItemTitle");
  setHighlightedText(titleElement, book.title, searchQuery);

  const authorElement = document.createElement("p");
  authorElement.setAttribute("data-testid", "bookItemAuthor");
  authorElement.textContent = `Penulis: ${book.author}`;

  const yearElement = document.createElement("p");
  yearElement.setAttribute("data-testid", "bookItemYear");
  yearElement.textContent = `Tahun: ${book.year}`;

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "book-actions";

  const completeButton = createActionButton({
    testid: "bookItemIsCompleteButton",
    action: "toggle",
    className: book.isComplete ? "btn-soft" : "btn-success",
    icon: book.isComplete ? ICONS.undo : ICONS.check,
    label: book.isComplete ? "Belum selesai dibaca" : "Selesai dibaca",
  });
  const deleteButton = createActionButton({
    testid: "bookItemDeleteButton",
    action: "delete",
    className: "btn-danger",
    icon: ICONS.trash,
    label: "Hapus Buku",
  });
  const editButton = createActionButton({
    testid: "bookItemEditButton",
    action: "edit",
    className: "btn-warning",
    icon: ICONS.pencil,
    label: "Edit Buku",
  });
  buttonContainer.append(completeButton, deleteButton, editButton);

  bookItem.append(cover, titleElement, authorElement, yearElement);
  if (book.isComplete) bookItem.append(createRating(book));
  bookItem.append(buttonContainer);
  return bookItem;
}
