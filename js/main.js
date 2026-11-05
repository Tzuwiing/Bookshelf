"use strict";

import { getGreeting, generateId, burstConfetti, prefersReducedMotion, MAX_RATING } from "./services/utils.js";
import { applyTheme, toggleTheme } from "./services/theme.js";
import { saveDataToStorage, loadDataFromStorage, exportBooksJSON, importBooksJSON, extractRawList, normalizeBook } from "./services/storage.js";
import { showToast } from "./atoms/toast.js";
import { updateStatsUI } from "./molecules/statCard.js";
import { updateShelvesUI } from "./organisms/shelfSection.js";
import { updateSubmitLabel, clearBookForm } from "./organisms/bookFormPanel.js";
import { openEditDialog, closeEditDialog } from "./organisms/editDialog.js";

/* ------------------------------ State ------------------------------------ */

let books = [];
let searchQuery = "";
let sortBy = "oldest";
let lastDeleted = null;
let editingId = null;
const freshIds = new Set();
const els = {};

/* ------------------------------ Utilitas Cache --------------------------- */

function cacheElements() {
  const ids = {
    form: "bookForm",
    formTitle: "bookFormTitle",
    formAuthor: "bookFormAuthor",
    formYear: "bookFormYear",
    formIsComplete: "bookFormIsComplete",
    submitShelf: "submitShelf",
    searchForm: "searchBook",
    searchInput: "searchBookTitle",
    searchClear: "searchClear",
    searchInfo: "searchInfo",
    sortSelect: "sortBooks",
    incompleteList: "incompleteBookList",
    completeList: "completeBookList",
    incompleteEmpty: "incompleteEmpty",
    completeEmpty: "completeEmpty",
    incompleteEmptyText: "incompleteEmptyText",
    completeEmptyText: "completeEmptyText",
    incompleteCount: "incompleteCount",
    completeCount: "completeCount",
    statTotal: "statTotal",
    statDone: "statDone",
    statTodo: "statTodo",
    statPercent: "statPercent",
    ringValue: "ringValue",
    progressText: "progressText",
    greeting: "greeting",
    themeToggle: "themeToggle",
    exportButton: "exportButton",
    importButton: "importButton",
    importInput: "importInput",
    editDialog: "editDialog",
    editForm: "bookEditForm",
    editTitle: "editTitle",
    editAuthor: "editAuthor",
    editYear: "editYear",
    editIsComplete: "editIsComplete",
    editCancel: "editCancel",
    toastRegion: "toastRegion",
  };
  for (const [key, id] of Object.entries(ids)) els[key] = document.getElementById(id);
}

/* ------------------------------ Filter & Sort ---------------------------- */

function getVisibleBooks() {
  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? books.filter((book) => book.title.toLowerCase().includes(query))
    : [...books];

  const collator = new Intl.Collator("id", { sensitivity: "base" });
  const sorters = {
    oldest: (a, b) => a.id - b.id,
    newest: (a, b) => b.id - a.id,
    "title-asc": (a, b) => collator.compare(a.title, b.title),
    "title-desc": (a, b) => collator.compare(b.title, a.title),
    "year-desc": (a, b) => b.year - a.year || a.id - b.id,
    "year-asc": (a, b) => a.year - b.year || a.id - b.id,
  };
  return filtered.sort(sorters[sortBy] || sorters.oldest);
}

function renderBooks() {
  const visible = getVisibleBooks();
  const incomplete = visible.filter((book) => !book.isComplete);
  const complete = visible.filter((book) => book.isComplete);

  updateShelvesUI(els, incomplete, complete, freshIds, searchQuery);

  const query = searchQuery.trim();
  els.searchInfo.hidden = !query;
  els.searchInfo.textContent = query
    ? `Menampilkan ${visible.length} dari ${books.length} buku untuk “${query}”`
    : "";
  els.searchClear.hidden = !searchQuery;

  updateStatsUI(els, books);
  freshIds.clear();
}

/* ------------------------------ CRUD Operations -------------------------- */

function notifyError(msg) {
  showToast(els.toastRegion, msg, { type: "error" });
}

function notifySuccess(msg, opts) {
  showToast(els.toastRegion, msg, { type: "success", ...opts });
}

function notifyInfo(msg, opts) {
  showToast(els.toastRegion, msg, { type: "info", ...opts });
}

function handleAddBook() {
  const title = els.formTitle.value.trim();
  const author = els.formAuthor.value.trim();
  const year = parseInt(els.formYear.value, 10);
  const isComplete = els.formIsComplete.checked;

  if (!title || !author || Number.isNaN(year)) {
    notifyError("Lengkapi judul, penulis, dan tahun terlebih dahulu.");
    return;
  }

  const book = { id: generateId(books), title, author, year, isComplete, rating: 0 };
  books.push(book);
  freshIds.add(book.id);

  if (searchQuery && !title.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
    searchQuery = "";
    els.searchInput.value = "";
  }

  saveDataToStorage(books, notifyError);
  renderBooks();
  clearBookForm(els.form, els.formIsComplete, els.submitShelf);
  els.formTitle.focus({ preventScroll: true });

  els.form.classList.remove("is-success");
  void els.form.offsetWidth;
  els.form.classList.add("is-success");

  notifySuccess(`“${title}” ditambahkan ke rak ${isComplete ? "Selesai dibaca" : "Belum selesai dibaca"}.`);
}

function toggleComplete(bookId, sourceButton) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  let confettiAt = null;
  if (!book.isComplete && sourceButton) {
    const rect = sourceButton.getBoundingClientRect();
    confettiAt = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  book.isComplete = !book.isComplete;
  freshIds.add(book.id);
  saveDataToStorage(books, notifyError);
  renderBooks();

  if (book.isComplete) {
    if (confettiAt) burstConfetti(confettiAt.x, confettiAt.y);
    notifySuccess(`Selamat! “${book.title}” selesai dibaca. Jangan lupa beri rating ya.`);
  } else {
    notifyInfo(`“${book.title}” dipindahkan ke rak Belum selesai dibaca.`);
  }
}

function undoDelete() {
  if (!lastDeleted) return;
  const { book, index } = lastDeleted;
  lastDeleted = null;
  if (books.some((item) => item.id === book.id)) book.id = generateId(books);
  books.splice(Math.min(index, books.length), 0, book);
  freshIds.add(book.id);
  saveDataToStorage(books, notifyError);
  renderBooks();
  notifySuccess(`“${book.title}” dikembalikan ke rak.`);
}

function deleteBook(bookId, cardElement) {
  const index = books.findIndex((book) => book.id === bookId);
  if (index === -1) return;

  const [removed] = books.splice(index, 1);
  lastDeleted = { book: removed, index };
  saveDataToStorage(books, notifyError);

  if (cardElement) cardElement.classList.add("is-leaving");
  const delay = prefersReducedMotion() ? 0 : 280;
  setTimeout(renderBooks, delay);
  updateStatsUI(els, books);

  notifyInfo(`“${removed.title}” dihapus.`, {
    actionLabel: "Urungkan",
    duration: 6000,
    onAction: undoDelete,
  });
}

function rateBook(bookId, value) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;
  book.rating = book.rating === value ? 0 : value;
  saveDataToStorage(books, notifyError);

  const card = document.querySelector(`[data-bookid="${bookId}"]`);
  const group = card && card.querySelector(".rating");
  if (group) {
    group.setAttribute("aria-label", `Rating buku: ${book.rating} dari ${MAX_RATING}`);
    group.querySelectorAll(".star").forEach((star) => {
      const active = Number(star.dataset.value) <= book.rating;
      star.classList.toggle("is-active", active);
      if (Number(star.dataset.value) === value && active) {
        star.classList.remove("pop");
        void star.offsetWidth;
        star.classList.add("pop");
      }
    });
  }
}

function handleSaveEdit() {
  const book = books.find((b) => b.id === editingId);
  if (!book) return closeEditDialog(els.editDialog);

  const title = els.editTitle.value.trim();
  const author = els.editAuthor.value.trim();
  const year = parseInt(els.editYear.value, 10);
  if (!title || !author || Number.isNaN(year)) {
    notifyError("Judul, penulis, dan tahun tidak boleh kosong.");
    return;
  }

  const movedShelf = book.isComplete !== els.editIsComplete.checked;
  Object.assign(book, { title, author, year, isComplete: els.editIsComplete.checked });
  if (movedShelf) freshIds.add(book.id);

  saveDataToStorage(books, notifyError);
  closeEditDialog(els.editDialog);
  editingId = null;
  renderBooks();
  notifySuccess(`Perubahan “${title}” berhasil disimpan.`);
}

function handleImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onerror = () => notifyError("Gagal membaca berkas.");
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (error) {
      notifyError("Berkas bukan JSON yang valid.");
      return;
    }

    let added = 0;
    let skipped = 0;
    for (const raw of extractRawList(parsed)) {
      const book = normalizeBook(raw);
      if (!book) {
        skipped++;
        continue;
      }
      const isDuplicate = books.some(
        (item) =>
          item.title.toLowerCase() === book.title.toLowerCase() &&
          item.author.toLowerCase() === book.author.toLowerCase() &&
          item.year === book.year
      );
      if (isDuplicate) {
        skipped++;
        continue;
      }
      if (!book.id || books.some((item) => item.id === book.id)) book.id = generateId(books);
      books.push(book);
      freshIds.add(book.id);
      added++;
    }

    if (added) {
      saveDataToStorage(books, notifyError);
      renderBooks();
    }
    showToast(
      els.toastRegion,
      added
        ? `${added} buku diimpor${skipped ? `, ${skipped} dilewati (duplikat/tidak valid)` : ""}.`
        : "Tidak ada buku baru yang bisa diimpor.",
      { type: added ? "success" : "info" }
    );
  };
  reader.readAsText(file);
}

/* ------------------------------ Event Binding ---------------------------- */

function bindBookListEvents(listEl) {
  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest("[data-bookid]");
    if (!card) return;
    const bookId = Number(card.getAttribute("data-bookid"));

    switch (button.dataset.action) {
      case "toggle":
        toggleComplete(bookId, button);
        break;
      case "delete":
        deleteBook(bookId, card);
        break;
      case "edit":
        editingId = bookId;
        openEditDialog(els.editDialog, els, books.find((b) => b.id === bookId));
        break;
      case "rate":
        rateBook(bookId, Number(button.dataset.value));
        break;
    }
  });
}

function init() {
  cacheElements();
  applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", els.themeToggle);
  els.greeting.textContent = getGreeting();
  els.formYear.placeholder = String(new Date().getFullYear());

  books = loadDataFromStorage(notifyError);
  books.forEach((book) => freshIds.add(book.id));

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAddBook();
  });
  els.formIsComplete.addEventListener("change", () =>
    updateSubmitLabel(els.formIsComplete, els.submitShelf)
  );

  els.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    searchQuery = els.searchInput.value;
    renderBooks();
  });
  els.searchInput.addEventListener("input", () => {
    searchQuery = els.searchInput.value;
    renderBooks();
  });
  els.searchClear.addEventListener("click", () => {
    searchQuery = "";
    els.searchInput.value = "";
    renderBooks();
    els.searchInput.focus();
  });
  els.sortSelect.addEventListener("change", () => {
    sortBy = els.sortSelect.value;
    renderBooks();
  });

  bindBookListEvents(els.incompleteList);
  bindBookListEvents(els.completeList);

  els.editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSaveEdit();
  });
  els.editCancel.addEventListener("click", () => {
    editingId = null;
    closeEditDialog(els.editDialog);
  });
  els.editDialog.addEventListener("click", (e) => {
    if (e.target === els.editDialog) {
      editingId = null;
      closeEditDialog(els.editDialog);
    }
  });
  els.editDialog.addEventListener("close", () => {
    editingId = null;
  });

  els.themeToggle.addEventListener("click", () => toggleTheme(els.themeToggle));
  els.exportButton.addEventListener("click", () =>
    exportBooksJSON(books, notifySuccess, notifyInfo)
  );
  els.importButton.addEventListener("click", () => els.importInput.click());
  els.importInput.addEventListener("change", () => {
    handleImportFile(els.importInput.files[0]);
    els.importInput.value = "";
  });

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (e.key === "/" && !typing && !els.editDialog.open) {
      e.preventDefault();
      els.searchInput.focus();
    }
  });

  updateSubmitLabel(els.formIsComplete, els.submitShelf);
  renderBooks();
}

document.addEventListener("DOMContentLoaded", init);
