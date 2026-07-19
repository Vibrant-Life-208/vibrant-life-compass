// VIA PDF import. Reads the PDF entirely on-device (vendored pdf.js), extracts
// text, and hands it to the parser. The PDF bytes are never uploaded or stored -
// only the parsed strength ids are saved by the caller. Discarded after parse.

import { parseViaStrengths } from './via-parse.js';

let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const mod = await import('./vendor/pdf.min.mjs');
  // Same-origin worker (satisfies the app's default-src 'self' CSP).
  mod.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  _pdfjs = mod;
  return mod;
}

export async function extractPdfText(arrayBuffer) {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(' ') + ' ';
  }
  await doc.destroy(); // release the document; nothing of it is retained
  return text;
}

// Security parameters: only read a genuine VIA Character Strengths Profile PDF.
const MAX_PDF_BYTES = 10 * 1024 * 1024; // a VIA profile is a few MB; reject larger
// Text markers that only a real VIA report carries (every page footer + title).
const VIA_MARKERS = ['character strengths', 'institute on character'];

// File -> parsed VIA ranking, with guardrails. Returns the parser result
// ({ ok, top8, bottom8, ... }) or { ok:false, reason } if the file is rejected.
export async function parseViaPdf(file) {
  // 1) Must be a PDF (declared type or .pdf name).
  const looksPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!looksPdf) {
    return { ok: false, reason: 'That is not a PDF. Please choose your VIA Character Strengths Profile PDF.' };
  }
  // 2) Size guard (cheap abuse / wrong-file protection).
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, reason: 'That file is too large to be a VIA profile. Please choose the VIA PDF.' };
  }
  const buf = await file.arrayBuffer();
  // 3) Real PDFs begin with the "%PDF-" magic header. Reject a renamed non-PDF.
  const magic = String.fromCharCode.apply(null, new Uint8Array(buf.slice(0, 5)));
  if (magic !== '%PDF-') {
    return { ok: false, reason: 'That file is not a valid PDF.' };
  }
  // 4) Extract text on-device.
  let text;
  try { text = await extractPdfText(buf); }
  catch (e) { return { ok: false, reason: 'Could not read that PDF.' }; }
  // 5) Provenance: must carry the VIA report's own markers, not just any PDF.
  const low = text.toLowerCase();
  if (!VIA_MARKERS.every((m) => low.includes(m))) {
    return { ok: false, reason: 'This does not look like a VIA Character Strengths Profile. Please upload the PDF you downloaded from viacharacter.org.' };
  }
  // 6) Parse (also requires all 24 strengths, a further integrity check).
  return parseViaStrengths(text);
}

// ---- Import modal UI -------------------------------------------------------
import { getViaCharacterStrengths, setStrengthRanking } from './store.js';

const _el = (id) => document.getElementById(id);

export async function openViaImportModal({ profileId = null, onSaved } = {}) {
  const labels = {};
  (await getViaCharacterStrengths()).forEach((s) => { labels[s.id] = s.display_label_adult; });

  _el('modal-title').textContent = 'Import your VIA strengths';
  const ff = _el('form-fields');
  const defaultActions = document.querySelector('#goal-form .modal-actions');
  if (defaultActions) defaultActions.style.display = 'none';

  const listHtml = (ids) => `<ul class="strength-pill-list">${ids.map((id) => `<li class="strength-pill">${labels[id] || id}</li>`).join('')}</ul>`;

  function renderDrop(msg) {
    ff.innerHTML = `
      <div class="via-import">
        <p class="via-import-lead">Drop your VIA Character Strengths PDF below, or choose the file. It's read here on your device - never uploaded. Only your strengths are saved.</p>
        <label class="via-drop" id="via-drop">
          <input type="file" id="via-file" accept="application/pdf" hidden>
          <span>Drop PDF here, or <strong>choose a file</strong></span>
        </label>
        ${msg ? `<p class="via-import-error">${msg}</p>` : ''}
      </div>`;
    const input = _el('via-file');
    const drop = _el('via-drop');
    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });
    ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
  }

  async function handleFile(file) {
    ff.innerHTML = `<p class="via-import-lead">Reading your PDF on this device…</p>`;
    let result;
    try { result = await parseViaPdf(file); }
    catch (e) { renderDrop('Could not read that PDF. Make sure it is your VIA Character Strengths Profile.'); return; }
    if (!result.ok) { renderDrop(result.reason || 'Could not read all 24 strengths from that PDF.'); return; }
    renderPreview(result);
  }

  function renderPreview(result) {
    ff.innerHTML = `
      <div class="via-import">
        <p class="via-import-lead">Here's what we read. Nothing was uploaded - the PDF stays on your device.</p>
        <div class="via-preview-cols">
          <div><h4 class="via-preview-title">Your top 8</h4>${listHtml(result.top8)}</div>
          <div><h4 class="via-preview-title">Your lesser 8</h4>${listHtml(result.bottom8)}</div>
        </div>
        <div class="onb-step-actions">
          <button type="button" id="via-redo" class="btn btn-text">Choose a different file</button>
          <button type="button" id="via-save" class="btn btn-primary">Save these</button>
        </div>
      </div>`;
    _el('via-redo').addEventListener('click', () => renderDrop());
    _el('via-save').addEventListener('click', async () => {
      _el('via-save').disabled = true;
      if (profileId) await setStrengthRanking(profileId, { top8: result.top8, bottom8: result.bottom8 });
      if (defaultActions) defaultActions.style.display = '';
      _el('modal')?.classList.remove('active');
      if (onSaved) onSaved(result);
    });
  }

  renderDrop();
  _el('modal')?.classList.add('active');
}
