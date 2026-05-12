// Per Decision 4 of the 2026-05-11 fleet meeting (Worf + Tutela): password
// encryption at rest is a deploy-blocker. AES-GCM 256, per-learner key.
// The key is stored in IndexedDB as a non-extractable CryptoKey - its raw
// bytes are not accessible to JavaScript, only its encrypt/decrypt operations.
//
// "The boundary holds. It requires nothing from you." - Tutela

const DB_NAME = 'heros-compass-crypto';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function readKey(learnerId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(learnerId);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result?.key || null);
  });
}

async function writeKey(learnerId, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ id: learnerId, key });
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

// Get or create the per-learner symmetric key. Non-extractable: the bytes
// of the key are never visible to JS, only its operations.
export async function getOrCreateLearnerKey(learnerId) {
  if (!learnerId) throw new Error('learnerId required');
  let key = await readKey(learnerId);
  if (key) return key;
  key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // extractable=false: the key bytes are never accessible to JS
    ['encrypt', 'decrypt']
  );
  await writeKey(learnerId, key);
  return key;
}

// Encrypt a string. Returns { ct, iv } - both base64-encoded.
export async function encryptString(plaintext, key) {
  if (!plaintext) return { ct: '', iv: '' };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    ct: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

// Decrypt. Accepts { ct, iv } as returned by encryptString.
export async function decryptString(envelope, key) {
  if (!envelope || !envelope.ct) return '';
  const ct = base64ToArrayBuffer(envelope.ct);
  const iv = base64ToArrayBuffer(envelope.iv);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    ct
  );
  return new TextDecoder().decode(plain);
}

// Detect whether a value looks like an encryption envelope (vs plaintext).
// Used for migrating older skeleton data that stored plaintext.
export function isEnvelope(v) {
  return v && typeof v === 'object' && typeof v.ct === 'string' && typeof v.iv === 'string';
}

// ============================================================================
// Password hashing - PBKDF2-SHA256, 100k iterations.
// For local-auth account passwords. Plaintext never stored.
// Stored as { salt: base64, hash: base64 } on the account record.
// ============================================================================
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

export async function hashPassword(plaintext) {
  if (!plaintext) return { salt: '', hash: '' };
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(plaintext, salt);
  return {
    salt: arrayBufferToBase64(salt),
    hash: arrayBufferToBase64(hash),
  };
}

export async function verifyPassword(plaintext, stored) {
  if (!plaintext || !stored?.salt || !stored?.hash) return false;
  const salt = new Uint8Array(base64ToArrayBuffer(stored.salt));
  const candidate = await pbkdf2(plaintext, salt);
  const expected = base64ToArrayBuffer(stored.hash);
  return constantTimeEqual(candidate, expected);
}

async function pbkdf2(plaintext, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(plaintext),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BYTES * 8
  );
}

function constantTimeEqual(a, b) {
  const aBytes = new Uint8Array(a);
  const bBytes = new Uint8Array(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

// Generate a memorable temporary password: word-1234 style.
export function generateTempPassword() {
  const words = [
    'compass', 'lantern', 'river', 'meadow', 'summit', 'harbor',
    'thistle', 'beacon', 'glade', 'cedar', 'willow', 'aspen',
    'ridge', 'cove', 'brook', 'pine', 'oak', 'fern', 'maple',
  ];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${w}-${n}`;
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function base64ToArrayBuffer(b64) {
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}
