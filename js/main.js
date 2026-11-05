"use strict";

/* ==========================================================================
   Bookshelf App — Standalone Script
   ========================================================================== */

const MAX_RATING = 5;
const STORAGE_KEY = "BOOKSHELF_APP";
const THEME_KEY = "BOOKSHELF_APP_THEME";

/* ------------------------------ Icons ------------------------------------ */
const ICONS = {
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
  pencil:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11a2.1 2.1 0 00-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5z"/></svg>',
  success:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ------------------------------ Utils ------------------------------------ */
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function generateId(existingBooks = []) {
  let id = Date.now();
  while (existingBooks.some((book) => book.id === id)) id++;
  return id;
}

function hueFor(id) {
  return Math.abs(Number(id) * 47) % 360;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function animateNumber(el, to, suffix = "") {
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

function setHighlightedText(el, text, query = "") {
  el.textContent = "";
  const trimmedQuery = query.trim();
  const index = trimmedQuery
    ? text.toLowerCase().indexOf(trimmedQuery.toLowerCase())
    : -1;
  if (index === -1) {
    el.textContent = text;
    return;
  }
  const mark = document.createElement("mark");
  mark.textContent = text.slice(index, index + trimmedQuery.length);
  el.append(
    text.slice(0, index),
    mark,
    text.slice(index + trimmedQuery.length),
  );
}

function burstConfetti(x, y) {
  if (prefersReducedMotion()) return;
  const colors = [
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#38bdf8",
  ];
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

/* ------------------------------ Theme ------------------------------------ */
function applyTheme(theme, themeToggleEl) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {}
  if (themeToggleEl) {
    themeToggleEl.setAttribute("aria-pressed", String(theme === "dark"));
    themeToggleEl.setAttribute(
      "aria-label",
      theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap",
    );
  }
}

function toggleTheme(themeToggleEl) {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, themeToggleEl);
}

/* ------------------------------ Storage ---------------------------------- */
function normalizeBook(raw) {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title ?? "").trim();
  const author = String(raw.author ?? "").trim();
  const year = parseInt(raw.year, 10);
  if (!title || !author || Number.isNaN(year)) return null;
  const rating = Math.min(
    MAX_RATING,
    Math.max(0, parseInt(raw.rating, 10) || 0),
  );
  return {
    id: Number(raw.id) || null,
    title,
    author,
    year,
    isComplete: Boolean(raw.isComplete),
    rating,
  };
}

function extractRawList(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.books)) return parsed.books;
    const incomplete = (parsed.incompleteBooks || []).map((b) => ({
      ...b,
      isComplete: false,
    }));
    const complete = (parsed.completeBooks || []).map((b) => ({
      ...b,
      isComplete: true,
    }));
    return [...incomplete, ...complete];
  }
  return [];
}

function saveDataToStorage(books, onError) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (error) {
    if (onError) onError("Gagal menyimpan data ke penyimpanan browser.");
  }
  document.dispatchEvent(new Event("saved-buku"));
}

function loadDataFromStorage(onError) {
  let parsed = [];
  let hadData = false;
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      hadData = true;
      parsed = JSON.parse(serialized);
    }
  } catch (error) {
    parsed = [];
  }

  const books = [];
  for (const raw of extractRawList(parsed)) {
    const book = normalizeBook(raw);
    if (!book) continue;
    if (!book.id || books.some((item) => item.id === book.id))
      book.id = generateId(books);
    books.push(book);
  }
  if (hadData) saveDataToStorage(books, onError);
  return books;
}

function exportBooksJSON(books, onSuccess, onError) {
  if (!books.length) {
    if (onError) onError("Belum ada data untuk diekspor.");
    return;
  }
  const blob = new Blob([JSON.stringify(books, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bookshelf-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (onSuccess) onSuccess(`${books.length} buku berhasil diekspor.`);
}

/* ------------------------------ Component Helpers ----------------------- */
function showToast(
  regionEl,
  message,
  { type = "success", actionLabel, onAction, duration = 4500 } = {},
) {
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

function createActionButton({ testid, action, className, icon, label }) {
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

function createRating(book) {
  const wrapper = document.createElement("div");
  wrapper.className = "rating";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute(
    "aria-label",
    `Rating buku: ${book.rating} dari ${MAX_RATING}`,
  );
  for (let value = 1; value <= MAX_RATING; value++) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `star${value <= book.rating ? " is-active" : ""}`;
    star.dataset.action = "rate";
    star.dataset.value = value;
    star.setAttribute("aria-label", `Beri rating ${value} dari ${MAX_RATING}`);
    star.innerHTML = ICONS.star;
    wrapper.append(star);
  }
  return wrapper;
}

function createBookCard(book, index, freshIds, searchQuery = "") {
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

function updateStatsUI(elements, books) {
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
    elements.ringValue.style.strokeDashoffset = String(
      circumference * (1 - percent / 100),
    );
  }

  if (elements.progressText) {
    elements.progressText.textContent = total
      ? `${done} dari ${total} buku sudah selesai dibaca`
      : "Belum ada buku di rak kamu";
  }
}

function renderShelfList(container, list, freshIds, searchQuery) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  list.forEach((book, index) =>
    fragment.append(createBookCard(book, index, freshIds, searchQuery)),
  );
  container.replaceChildren(fragment);
}

function getEmptyMessage(shelf, searchQuery) {
  const query = searchQuery.trim();
  if (query) return `Tidak ada buku dengan judul “${query}” di rak ini.`;
  return shelf === "complete"
    ? "Belum ada buku yang selesai dibaca. Semangat, sebentar lagi!"
    : "Rak ini kosong. Tambahkan buku baru dari formulir di samping.";
}

function updateShelvesUI(
  elements,
  incompleteBooks,
  completeBooks,
  freshIds,
  searchQuery,
) {
  renderShelfList(
    elements.incompleteList,
    incompleteBooks,
    freshIds,
    searchQuery,
  );
  renderShelfList(elements.completeList, completeBooks, freshIds, searchQuery);

  if (elements.incompleteEmpty)
    elements.incompleteEmpty.hidden = incompleteBooks.length > 0;
  if (elements.completeEmpty)
    elements.completeEmpty.hidden = completeBooks.length > 0;
  if (elements.incompleteEmptyText)
    elements.incompleteEmptyText.textContent = getEmptyMessage(
      "incomplete",
      searchQuery,
    );
  if (elements.completeEmptyText)
    elements.completeEmptyText.textContent = getEmptyMessage(
      "complete",
      searchQuery,
    );

  if (elements.incompleteCount)
    elements.incompleteCount.textContent = incompleteBooks.length;
  if (elements.completeCount)
    elements.completeCount.textContent = completeBooks.length;
}

function updateSubmitLabel(formIsCompleteEl, submitShelfEl) {
  if (submitShelfEl && formIsCompleteEl) {
    submitShelfEl.textContent = formIsCompleteEl.checked
      ? "Selesai dibaca"
      : "Belum selesai dibaca";
  }
}

function clearBookForm(formEl, formIsCompleteEl, submitShelfEl) {
  if (formEl) formEl.reset();
  updateSubmitLabel(formIsCompleteEl, submitShelfEl);
}

function openEditDialog(dialogEl, formEls, book) {
  if (!book || !dialogEl) return;
  if (formEls.editTitle) formEls.editTitle.value = book.title;
  if (formEls.editAuthor) formEls.editAuthor.value = book.author;
  if (formEls.editYear) formEls.editYear.value = book.year;
  if (formEls.editIsComplete) formEls.editIsComplete.checked = book.isComplete;
  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
  } else {
    dialogEl.setAttribute("open", "");
  }
  if (formEls.editTitle) formEls.editTitle.focus();
}

function closeEditDialog(dialogEl) {
  if (dialogEl && dialogEl.open) dialogEl.close();
}

/* ------------------------------ App State & Logic -------------------- */
let books = [];
let searchQuery = "";
let sortBy = "oldest";
let lastDeleted = null;
let editingId = null;
const freshIds = new Set();
const els = {};

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
  for (const [key, id] of Object.entries(ids)) {
    els[key] = document.getElementById(id);
  }
}

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
  if (els.searchInfo) {
    els.searchInfo.hidden = !query;
    els.searchInfo.textContent = query
      ? `Menampilkan ${visible.length} dari ${books.length} buku untuk “${query}”`
      : "";
  }
  if (els.searchClear) {
    els.searchClear.hidden = !searchQuery;
  }

  updateStatsUI(els, books);
  freshIds.clear();
}

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
  if (!els.formTitle || !els.formAuthor || !els.formYear) return;

  const title = els.formTitle.value.trim();
  const author = els.formAuthor.value.trim();
  const year = parseInt(els.formYear.value, 10);
  const isComplete = els.formIsComplete ? els.formIsComplete.checked : false;

  if (!title || !author || Number.isNaN(year)) {
    notifyError("Lengkapi judul, penulis, dan tahun terlebih dahulu.");
    return;
  }

  const book = {
    id: generateId(books),
    title,
    author,
    year,
    isComplete,
    rating: 0,
  };
  books.push(book);
  freshIds.add(book.id);

  if (
    searchQuery &&
    !title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  ) {
    searchQuery = "";
    if (els.searchInput) els.searchInput.value = "";
  }

  saveDataToStorage(books, notifyError);
  renderBooks();
  clearBookForm(els.form, els.formIsComplete, els.submitShelf);
  els.formTitle.focus({ preventScroll: true });

  if (els.form) {
    els.form.classList.remove("is-success");
    void els.form.offsetWidth;
    els.form.classList.add("is-success");
  }

  notifySuccess(
    `“${title}” ditambahkan ke rak ${isComplete ? "Selesai dibaca" : "Belum selesai dibaca"}.`,
  );
}

function toggleComplete(bookId, sourceButton) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  let confettiAt = null;
  if (!book.isComplete && sourceButton) {
    const rect = sourceButton.getBoundingClientRect();
    confettiAt = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  book.isComplete = !book.isComplete;
  freshIds.add(book.id);
  saveDataToStorage(books, notifyError);
  renderBooks();

  if (book.isComplete) {
    if (confettiAt) burstConfetti(confettiAt.x, confettiAt.y);
    notifySuccess(
      `Selamat! “${book.title}” selesai dibaca. Jangan lupa beri rating ya.`,
    );
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
    group.setAttribute(
      "aria-label",
      `Rating buku: ${book.rating} dari ${MAX_RATING}`,
    );
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

  const title = els.editTitle ? els.editTitle.value.trim() : "";
  const author = els.editAuthor ? els.editAuthor.value.trim() : "";
  const year = els.editYear ? parseInt(els.editYear.value, 10) : NaN;
  if (!title || !author || Number.isNaN(year)) {
    notifyError("Judul, penulis, dan tahun tidak boleh kosong.");
    return;
  }

  const movedShelf =
    book.isComplete !==
    (els.editIsComplete ? els.editIsComplete.checked : false);
  Object.assign(book, {
    title,
    author,
    year,
    isComplete: els.editIsComplete ? els.editIsComplete.checked : false,
  });
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
          item.year === book.year,
      );
      if (isDuplicate) {
        skipped++;
        continue;
      }
      if (!book.id || books.some((item) => item.id === book.id))
        book.id = generateId(books);
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
      { type: added ? "success" : "info" },
    );
  };
  reader.readAsText(file);
}

function bindBookListEvents(listEl) {
  if (!listEl) return;
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
        openEditDialog(
          els.editDialog,
          els,
          books.find((b) => b.id === bookId),
        );
        break;
      case "rate":
        rateBook(bookId, Number(button.dataset.value));
        break;
    }
  });
}

function init() {
  cacheElements();

  if (els.themeToggle) {
    applyTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      els.themeToggle,
    );
    els.themeToggle.addEventListener("click", () =>
      toggleTheme(els.themeToggle),
    );
  }

  if (els.greeting) els.greeting.textContent = getGreeting();
  if (els.formYear) els.formYear.placeholder = String(new Date().getFullYear());

  books = loadDataFromStorage(notifyError);
  books.forEach((book) => freshIds.add(book.id));

  if (els.form) {
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAddBook();
    });
  }

  if (els.formIsComplete) {
    els.formIsComplete.addEventListener("change", () =>
      updateSubmitLabel(els.formIsComplete, els.submitShelf),
    );
  }

  if (els.searchForm) {
    els.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (els.searchInput) searchQuery = els.searchInput.value;
      renderBooks();
    });
  }

  if (els.searchInput) {
    els.searchInput.addEventListener("input", () => {
      searchQuery = els.searchInput.value;
      renderBooks();
    });
  }

  if (els.searchClear) {
    els.searchClear.addEventListener("click", () => {
      searchQuery = "";
      if (els.searchInput) {
        els.searchInput.value = "";
        els.searchInput.focus();
      }
      renderBooks();
    });
  }

  if (els.sortSelect) {
    els.sortSelect.addEventListener("change", () => {
      sortBy = els.sortSelect.value;
      renderBooks();
    });
  }

  bindBookListEvents(els.incompleteList);
  bindBookListEvents(els.completeList);

  if (els.editForm) {
    els.editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSaveEdit();
    });
  }

  if (els.editCancel) {
    els.editCancel.addEventListener("click", () => {
      editingId = null;
      closeEditDialog(els.editDialog);
    });
  }

  if (els.editDialog) {
    els.editDialog.addEventListener("click", (e) => {
      if (e.target === els.editDialog) {
        editingId = null;
        closeEditDialog(els.editDialog);
      }
    });
    els.editDialog.addEventListener("close", () => {
      editingId = null;
    });
  }

  if (els.exportButton) {
    els.exportButton.addEventListener("click", () =>
      exportBooksJSON(books, notifySuccess, notifyInfo),
    );
  }

  if (els.importButton && els.importInput) {
    els.importButton.addEventListener("click", () => els.importInput.click());
    els.importInput.addEventListener("change", () => {
      handleImportFile(els.importInput.files[0]);
      els.importInput.value = "";
    });
  }

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (e.key === "/" && !typing && (!els.editDialog || !els.editDialog.open)) {
      e.preventDefault();
      if (els.searchInput) els.searchInput.focus();
    }
  });

  updateSubmitLabel(els.formIsComplete, els.submitShelf);
  renderBooks();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
