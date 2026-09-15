// poster.js - on-device poster/drawing pipeline for the community board (extracted from
// community-board.js 2026-09-15 so it can be verified in isolation; no store/backend imports).
//
// A learner picks a PDF or a raster image; we render it to a downscaled JPEG data URL entirely on
// device and store THAT (the original bytes are never uploaded or kept). TCC upload hardening
// (blocker #1): SVG is refused outright (the one "image" that can carry script); everything accepted
// is drawn to a <canvas> and re-encoded to JPEG, which strips EXIF/GPS + any active content, so the
// stored value is always inert pixels; the canvas is dimension-capped (memory-DoS guard) and pdf.js
// runs under a time budget (device-hang guard). Verify: scripts/verify-poster-upload.html.

let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const mod = await import('./vendor/pdf.min.mjs');
  mod.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  _pdfjs = mod;
  return mod;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // reject anything larger than a plausible poster/photo
const POSTER_MAX_W = 700;                // downscale to this width...
const POSTER_MAX_H = 1000;               // ...and this height, so a very tall file can't allocate an
                                         //    unbounded canvas bitmap (memory-DoS guard).
const POSTER_MAX_LEN = 600000;           // matches the DB column cap on the data URL
const PDF_BUDGET_MS = 8000;              // hard ceiling on pdf.js load+render so a hostile/complex
                                         //    PDF can't hang a young learner's device.

const RASTER_MIME_RE = /^image\/(png|jpe?g|webp|gif|bmp|heic|heif)$/i;
const RASTER_EXT_RE = /\.(png|jpe?g|jpg|webp|gif|bmp|heic|heif)$/i;

// Guard for rendering a stored poster into an <img src>: only ever emit a data:image/... value, so a
// poisoned or legacy DB value (a javascript:, data:text/html, or data:image/svg+xml URL) can never
// reach the DOM. Defense in depth behind the re-encode.
export function safePosterSrc(v) {
  return (typeof v === 'string' && /^data:image\/(jpeg|png|webp);/i.test(v)) ? v : '';
}

// Race a promise against a timeout so a hostile input can't hang the device.
function withTimeout(promise, ms, label) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(label || 'timeout')), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

function canvasToPoster(canvas) {
  let out = canvas.toDataURL('image/jpeg', 0.72);
  if (out.length > POSTER_MAX_LEN) out = canvas.toDataURL('image/jpeg', 0.55);
  return out;
}

// Scale so the canvas fits within BOTH the max width and max height (never upscales).
// Exported (with clampDims + posterKind) so the regression suite can test the real decision
// functions in Node, not drift-prone copies. See scripts/board-regression.sh.
export function fitScale(w, h) {
  return Math.min(1, POSTER_MAX_W / (w || POSTER_MAX_W), POSTER_MAX_H / (h || POSTER_MAX_H));
}

// The clamped output dimensions for a source of (w, h): fits within the caps, never upscales, never
// below 1px. This is THE dimension-cap guard (memory-DoS). Pure; tested in Node.
export function clampDims(w, h) {
  const s = fitScale(w, h);
  return [Math.max(1, Math.min(POSTER_MAX_W, Math.round(w * s))), Math.max(1, Math.min(POSTER_MAX_H, Math.round(h * s)))];
}

// The allowlist DECISION for a file's (name, type): 'svg' (rejected), 'pdf', 'image' (raster), or
// 'other' (rejected). Pure; tested in Node. renderPosterFromFile routes on this.
export function posterKind(name = '', type = '') {
  if (/svg/i.test(type) || /\.svg$/i.test(name)) return 'svg';
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  if (RASTER_MIME_RE.test(type) || (!type && RASTER_EXT_RE.test(name))) return 'image';
  return 'other';
}

async function renderPdfPoster(buf) {
  let doc;
  try {
    const pdfjs = await getPdfjs();
    doc = await withTimeout(pdfjs.getDocument({ data: buf }).promise, PDF_BUDGET_MS, 'pdf-load');
  } catch (e) { return { ok: false, reason: 'Could not read that PDF.' }; }
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: fitScale(base.width, base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.min(POSTER_MAX_W, Math.ceil(viewport.width)));
    canvas.height = Math.max(1, Math.min(POSTER_MAX_H, Math.ceil(viewport.height)));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // flatten for JPEG
    await withTimeout(page.render({ canvasContext: ctx, viewport }).promise, PDF_BUDGET_MS, 'pdf-render');
    const out = canvasToPoster(canvas);
    if (out.length > POSTER_MAX_LEN) return { ok: false, reason: 'That poster is too detailed to store - try a simpler file.' };
    return { ok: true, image: out };
  } catch (e) { return { ok: false, reason: 'Could not render that poster.' }; }
}

async function renderImagePoster(file) {
  // Decode via a data: URL (FileReader), NOT a blob: URL. The app's CSP is `img-src 'self' data:`
  // (no blob:), so a createObjectURL/blob source is CSP-blocked and every image upload silently
  // fails - a data: URL is permitted. (2026-09-15, caught by the Gate C browser verify.)
  const dataUrl = await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(null);
    fr.readAsDataURL(file);
  });
  if (typeof dataUrl !== 'string') return { ok: false, reason: 'Could not read that image.' };
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('image'));
      i.src = dataUrl;
    });
    const w = img.naturalWidth || POSTER_MAX_W;
    const h = img.naturalHeight || w;
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = clampDims(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // re-encode: strips EXIF/GPS + active content
    const out = canvasToPoster(canvas);
    if (out.length > POSTER_MAX_LEN) return { ok: false, reason: 'That image is too detailed to store - try a smaller one.' };
    return { ok: true, image: out };
  } catch (e) {
    return { ok: false, reason: 'Could not read that image.' };
  }
}

export async function renderPosterFromFile(file) {
  if (!file) return { ok: false, reason: 'No file chosen.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'That file is too large (15MB max).' };
  const kind = posterKind(file.name, file.type); // pure, Node-testable allowlist decision
  if (kind === 'svg') {
    // SVG is the one "image" that can carry script - refused outright.
    return { ok: false, reason: "SVG files aren't supported - please use a PDF, a photo, or a PNG." };
  }
  if (kind === 'pdf') {
    const buf = await file.arrayBuffer();
    const magic = new TextDecoder().decode(new Uint8Array(buf.slice(0, 5)));
    if (magic !== '%PDF-') return { ok: false, reason: 'That file is not a valid PDF.' };
    return renderPdfPoster(buf);
  }
  if (kind === 'image') return renderImagePoster(file);
  return { ok: false, reason: 'Please choose a PDF or a photo/PNG (a photo of a drawing works too).' };
}
