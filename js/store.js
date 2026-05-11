// Local storage wrapper. Supabase-ready interface.
// When shared backend is added, only this file changes.

const KEYS = {
  session: 'hc_session',
  learners: 'hc_learners',
  guides: 'hc_guides',
  goals: 'hc_goals',
  checkIns: 'hc_check_ins',
  posts: 'hc_everyone_posts',
  yearQuotes: 'hc_year_quotes',  // keyed by learner.id OR guide.id (both UUIDs)
  yearTraits: 'hc_year_traits',  // same
  logins: 'hc_logins',
  tasks: 'hc_tasks',
};

function read(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Session (currently signed-in user, placeholder until OAuth wires in)
export function getSession() {
  return read(KEYS.session);
}

export function setSession(session) {
  write(KEYS.session, session);
}

export function clearSession() {
  localStorage.removeItem(KEYS.session);
}

// Learners
export function getLearners() {
  return read(KEYS.learners) || [];
}

export function getLearner(id) {
  return getLearners().find((l) => l.id === id) || null;
}

export function saveLearner(data) {
  const learners = getLearners();
  if (data.id) {
    const idx = learners.findIndex((l) => l.id === data.id);
    if (idx >= 0) learners[idx] = { ...learners[idx], ...data, updatedAt: new Date().toISOString() };
  } else {
    learners.push({ id: generateId(), createdAt: new Date().toISOString(), ...data });
  }
  write(KEYS.learners, learners);
  return learners;
}

// Guides - mirror shape of learners. Guides have their own quote + traits,
// stored in yearQuotes / yearTraits by guide.id (same map as learners; UUIDs
// don't collide).
export function getGuides() {
  return read(KEYS.guides) || [];
}

export function getGuide(id) {
  return getGuides().find((g) => g.id === id) || null;
}

export function saveGuide(data) {
  const guides = getGuides();
  if (data.id) {
    const idx = guides.findIndex((g) => g.id === data.id);
    if (idx >= 0) guides[idx] = { ...guides[idx], ...data, updatedAt: new Date().toISOString() };
  } else {
    guides.push({ id: generateId(), createdAt: new Date().toISOString(), ...data });
  }
  write(KEYS.guides, guides);
  return guides;
}

// Goals (year + per-session)
// Goal shape: { id, learnerId, categoryId, scope: 'year' | 'session', sessionIndex?, text, breakdown?, status, createdAt }
export function getGoals(learnerId) {
  const all = read(KEYS.goals) || [];
  return all.filter((g) => g.learnerId === learnerId);
}

export function saveGoal(goal) {
  const all = read(KEYS.goals) || [];
  if (goal.id) {
    const idx = all.findIndex((g) => g.id === goal.id);
    if (idx >= 0) all[idx] = { ...all[idx], ...goal, updatedAt: new Date().toISOString() };
  } else {
    all.push({ id: generateId(), createdAt: new Date().toISOString(), ...goal });
  }
  write(KEYS.goals, all);
  return all.find((g) => g.id === goal.id) || all[all.length - 1];
}

// Check-ins
// Shape: { id, learnerId, goalId, sessionIndex, date, note, mark }
export function getCheckIns(learnerId) {
  const all = read(KEYS.checkIns) || [];
  return all.filter((c) => c.learnerId === learnerId);
}

export function addCheckIn(checkIn) {
  const all = read(KEYS.checkIns) || [];
  const record = { id: generateId(), createdAt: new Date().toISOString(), ...checkIn };
  all.push(record);
  write(KEYS.checkIns, all);
  return record;
}

// Everyone Page posts
// Shape: { id, authorRole, authorName, body, createdAt }
export function getPosts() {
  return read(KEYS.posts) || [];
}

export function addPost(post) {
  const all = getPosts();
  const record = { id: generateId(), createdAt: new Date().toISOString(), ...post };
  all.unshift(record);
  write(KEYS.posts, all);
  return record;
}

// Year quote per learner
export function getYearQuote(learnerId) {
  const all = read(KEYS.yearQuotes) || {};
  return all[learnerId] || '';
}

export function setYearQuote(learnerId, text) {
  const all = read(KEYS.yearQuotes) || {};
  all[learnerId] = text;
  write(KEYS.yearQuotes, all);
}

// Year character traits per learner (3-5 traits the learner is anchoring on)
export function getYearTraits(learnerId) {
  const all = read(KEYS.yearTraits) || {};
  return all[learnerId] || [];
}

export function setYearTraits(learnerId, traits) {
  const all = read(KEYS.yearTraits) || {};
  all[learnerId] = traits;
  write(KEYS.yearTraits, all);
}

// External-service logins per learner.
// Shape: { id, kind, service, username, password: { ct, iv }, url, note }
// Password is stored as an AES-GCM envelope (Decision 4). Decryption only
// happens at reveal-time via decryptString() in crypto.js.
//
// Stored in localStorage with the same privacy scope as goals: learner +
// parents + guides only.
import { getOrCreateLearnerKey, encryptString, decryptString, isEnvelope } from './crypto.js';

export function getLogins(learnerId) {
  const all = read(KEYS.logins) || {};
  return all[learnerId] || [];
}

// Save a login. If `login.password` is a plain string, encrypt it before
// writing. If it's already an envelope, keep it. Empty password stays empty.
export async function saveLogin(learnerId, login) {
  const all = read(KEYS.logins) || {};
  const list = all[learnerId] || [];

  let passwordField = login.password;
  if (typeof passwordField === 'string' && passwordField.length > 0) {
    const key = await getOrCreateLearnerKey(learnerId);
    passwordField = await encryptString(passwordField, key);
  } else if (typeof passwordField === 'string' && passwordField.length === 0) {
    passwordField = { ct: '', iv: '' };
  }

  const sanitized = { ...login, password: passwordField };

  if (login.id) {
    const idx = list.findIndex((l) => l.id === login.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...sanitized, updatedAt: new Date().toISOString() };
  } else {
    list.push({ id: generateId(), createdAt: new Date().toISOString(), ...sanitized });
  }
  all[learnerId] = list;
  write(KEYS.logins, all);
  return list;
}

// Reveal a single password. Called only on explicit per-reveal action.
export async function revealLoginPassword(learnerId, id) {
  const list = getLogins(learnerId);
  const login = list.find((l) => l.id === id);
  if (!login) return '';
  if (!isEnvelope(login.password)) {
    // Backward-compat: pre-encryption skeleton may have stored plaintext.
    // Return as-is and flag for migration on next edit.
    return typeof login.password === 'string' ? login.password : '';
  }
  const key = await getOrCreateLearnerKey(learnerId);
  return decryptString(login.password, key);
}

export function deleteLogin(learnerId, id) {
  const all = read(KEYS.logins) || {};
  const list = (all[learnerId] || []).filter((l) => l.id !== id);
  all[learnerId] = list;
  write(KEYS.logins, all);
  return list;
}

// Tasks - per-learner, per-day. Shape:
// { id, text, plannedFor: 'YYYY-MM-DD', goalId?, categoryId?, status: 'open'|'done', createdAt, completedAt? }
export function getTasks(learnerId) {
  const all = read(KEYS.tasks) || {};
  return all[learnerId] || [];
}

export function getTasksForDate(learnerId, isoDate) {
  return getTasks(learnerId).filter((t) => t.plannedFor === isoDate);
}

export function getTasksForRange(learnerId, startISO, endISO) {
  return getTasks(learnerId).filter((t) => t.plannedFor >= startISO && t.plannedFor <= endISO);
}

export function saveTask(learnerId, task) {
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  if (task.id) {
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...task, updatedAt: new Date().toISOString() };
    else list.push({ ...task, createdAt: new Date().toISOString() });
  } else {
    list.push({
      id: generateId(),
      status: 'open',
      createdAt: new Date().toISOString(),
      ...task,
    });
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export function moveTask(learnerId, id, newPlannedFor) {
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    list[idx].plannedFor = newPlannedFor;
    list[idx].updatedAt = new Date().toISOString();
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export function toggleTaskDone(learnerId, id) {
  const all = read(KEYS.tasks) || {};
  const list = all[learnerId] || [];
  const idx = list.findIndex((t) => t.id === id);
  if (idx >= 0) {
    const isDone = list[idx].status === 'done';
    list[idx].status = isDone ? 'open' : 'done';
    list[idx].completedAt = isDone ? null : new Date().toISOString();
  }
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}

export function deleteTask(learnerId, id) {
  const all = read(KEYS.tasks) || {};
  const list = (all[learnerId] || []).filter((t) => t.id !== id);
  all[learnerId] = list;
  write(KEYS.tasks, all);
  return list;
}
