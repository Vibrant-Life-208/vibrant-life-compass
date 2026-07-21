// Book tracker - the "Currently reading" shelf (captain 2026-07-21).
//
// Up to 3 books per learner. Each: { id, title, bookmark, createdAt }.
// The bookmark is free-text "where you are" - the evolving now, NEVER a progress bar.
// Deliberately absent: streak, pace, "X of Y", books-read count, minutes total. A companion
// that remembers where you were, not a tracker that scores what you did.
//
// Storage: learner.books (patched via saveLearner). Needs a learner column before it syncs,
// like other learner fields; local-store keeps it. Local only for now.
import { saveLearner } from './store.js';

export const MAX_BOOKS = 3;

export function getBooks(learner) {
  return Array.isArray(learner?.books) ? learner.books : [];
}

function newId() {
  return 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export async function addBook(learner, title) {
  const t = (title || '').trim();
  const books = getBooks(learner);
  if (!t || books.length >= MAX_BOOKS) return books;
  const next = [...books, { id: newId(), title: t, bookmark: '', createdAt: new Date().toISOString() }];
  await saveLearner({ id: learner.id, books: next });
  return next;
}

export async function setBookmark(learner, bookId, bookmark) {
  const next = getBooks(learner).map((b) => (b.id === bookId ? { ...b, bookmark: (bookmark || '').trim() } : b));
  await saveLearner({ id: learner.id, books: next });
  return next;
}

export async function removeBook(learner, bookId) {
  const next = getBooks(learner).filter((b) => b.id !== bookId);
  await saveLearner({ id: learner.id, books: next });
  return next;
}
