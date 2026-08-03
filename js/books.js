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
import { encryptField, decryptField } from './crypto.js';

export const MAX_BOOKS = 3;

// Deep-reading reflection (captain 2026-08-03). Six questions that make "deep reading" a
// practice, not a definition (Europa's spec). Optional, private, skippable, NEVER counted
// ("answered 4 of 6" is forbidden - same rule as bookmark/practice). Answers are child-adjacent
// free text, so they encrypt at rest via the crypto field chokepoint (TCC 2026-07-18), exactly
// like guide reflections. `young` wording is the 8-11 (Discovery) register; the rest keep the
// standard phrasing. Stored on book.reflections keyed by question id, each an encrypted envelope.
export const REFLECTION_QUESTIONS = [
  { key: 'authorPurpose',      q: "What do you think the author's purpose was?",    young: 'Why do you think the author wrote it?' },
  { key: 'liked',              q: 'What was something you liked about the story?',  young: 'What was something you liked about the story?' },
  { key: 'characterMirror',    q: 'Did a character reflect something in you?',      young: 'Was a character a little bit like you?' },
  { key: 'characterChange',    q: 'What changes does a main character go through?', young: 'How does a main character change in the story?' },
  { key: 'changedYou',         q: 'How did reading it change you, or your views?',  young: 'Did reading it change how you think about anything?' },
  { key: 'writtenDifferently', q: 'How might you have written it differently?',     young: 'Would you have written it differently? How?' },
];

// Decrypt a book's stored reflections into { key: plaintext } for rendering. Missing/empty stay ''.
export async function getReflections(personId, book) {
  const stored = (book && book.reflections) || {};
  const out = {};
  for (const { key } of REFLECTION_QUESTIONS) {
    out[key] = stored[key] ? await decryptField(personId, stored[key]) : '';
  }
  return out;
}

// Save one reflection answer (encrypted at rest). Empty clears it. Returns the updated books list.
export async function setReflection(learner, bookId, key, value) {
  const enc = await encryptField(learner.id, (value || '').trim());
  const next = getBooks(learner).map((b) => {
    if (b.id !== bookId) return b;
    const reflections = { ...(b.reflections || {}) };
    if (enc) reflections[key] = enc; else delete reflections[key];
    return { ...b, reflections };
  });
  await saveLearner({ id: learner.id, books: next });
  return next;
}

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
