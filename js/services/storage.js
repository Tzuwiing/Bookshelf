"use strict";

import { MAX_RATING, generateId } from "./utils.js";

export const STORAGE_KEY = "BOOKSHELF_APP";

export function normalizeBook(raw) {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title ?? "").trim();
  const author = String(raw.author ?? "").trim();
  const year = parseInt(raw.year, 10);
  if (!title || !author || Number.isNaN(year)) return null;
  const rating = Math.min(MAX_RATING, Math.max(0, parseInt(raw.rating, 10) || 0));
  return {
    id: Number(raw.id) || null,
    title,
    author,
    year,
    isComplete: Boolean(raw.isComplete),
    rating,
  };
}

export function extractRawList(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.books)) return parsed.books;
    const incomplete = (parsed.incompleteBooks || []).map((b) => ({ ...b, isComplete: false }));
    const complete = (parsed.completeBooks || []).map((b) => ({ ...b, isComplete: true }));
    return [...incomplete, ...complete];
  }
  return [];
}

export function saveDataToStorage(books, onError) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (error) {
    if (onError) onError("Gagal menyimpan data ke penyimpanan browser.");
  }
  document.dispatchEvent(new Event("saved-buku"));
}

export function loadDataFromStorage(onError) {
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
    if (!book.id || books.some((item) => item.id === book.id)) book.id = generateId(books);
    books.push(book);
  }
  if (hadData) saveDataToStorage(books, onError);
  return books;
}

export function exportBooksJSON(books, onSuccess, onError) {
  if (!books.length) {
    if (onError) onError("Belum ada data untuk diekspor.");
    return;
  }
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
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
