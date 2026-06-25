// VIA Character Strengths PDF parser. Pure text -> ranking, no I/O.
//
// The VIA "Character Strengths Profile" PDF lists all 24 strengths in rank order
// as `N. Name` lines (1..24). We map each name to the canonical id used in the
// via_character_strengths reference table and return the ranked list plus the
// top 8 and bottom 8. The PDF itself is never stored; only these ids are saved.

// PDF display name (lowercased, trimmed) -> reference-table id.
const NAME_TO_ID = {
  'curiosity': 'curiosity',
  'leadership': 'leadership',
  'creativity': 'creativity',
  'love of learning': 'love_of_learning',
  'honesty': 'honesty',
  'kindness': 'kindness',
  'humor': 'humor',
  'fairness': 'fairness',
  'hope': 'hope',
  'appreciation of beauty & excellence': 'appreciation_of_beauty',
  'appreciation of beauty and excellence': 'appreciation_of_beauty',
  'appreciation of beauty': 'appreciation_of_beauty',
  'love': 'love',
  'judgment': 'judgment',
  'forgiveness': 'forgiveness',
  'bravery': 'bravery',
  'spirituality': 'spirituality',
  'social intelligence': 'social_intelligence',
  'teamwork': 'teamwork',
  'humility': 'humility',
  'gratitude': 'gratitude',
  'perspective': 'perspective',
  'prudence': 'prudence',
  'zest': 'zest',
  'perseverance': 'perseverance',
  'self-regulation': 'self_regulation',
  'self regulation': 'self_regulation',
};

function normalizeName(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[’‘]/g, "'")   // curly -> straight apostrophe
    .replace(/\s+/g, ' ')
    .trim();
}

// The six VIA virtue categories that always follow a strength's name in the PDF.
// Using them as a delimiter makes parsing robust to however the PDF text extractor
// breaks fragments (it may split "1." from "Curiosity", or run lines together).
const VIRTUES = '(?:WISDOM|COURAGE|HUMANITY|JUSTICE|TEMPERANCE|TRANSCENDENCE)';

// Parse extracted PDF text. Returns { ok, ranked:[id..], top8:[id..], bottom8:[id..],
// found, unmapped } or { ok:false, reason }.
export function parseViaStrengths(text) {
  // Collapse all whitespace so line breaks from PDF extraction don't matter.
  const t = String(text || '').replace(/\s+/g, ' ');
  // rank (1..24) -> id, first occurrence wins.
  const byRank = new Map();
  const unmapped = [];
  const re = new RegExp(`(\\d{1,2})\\.\\s+([A-Za-z][A-Za-z &'’.\\-]*?)\\s+${VIRTUES}\\b`, 'g');
  let m;
  while ((m = re.exec(t)) !== null) {
    const rank = parseInt(m[1], 10);
    if (rank < 1 || rank > 24 || byRank.has(rank)) continue;
    const id = NAME_TO_ID[normalizeName(m[2])];
    if (id) byRank.set(rank, id);
    else unmapped.push(m[2].trim());
  }

  const ranked = [];
  for (let r = 1; r <= 24; r += 1) {
    if (byRank.has(r)) ranked.push(byRank.get(r));
  }
  // De-dup defensively (a strength should appear once).
  const seen = new Set();
  const cleanRanked = ranked.filter((id) => (seen.has(id) ? false : seen.add(id)));

  if (cleanRanked.length < 24) {
    return {
      ok: false,
      reason: `Found ${cleanRanked.length} of 24 strengths. Make sure this is a VIA Character Strengths Profile PDF.`,
      found: cleanRanked.length,
      unmapped,
    };
  }

  return {
    ok: true,
    ranked: cleanRanked,
    top8: cleanRanked.slice(0, 8),
    bottom8: cleanRanked.slice(16, 24),
    found: cleanRanked.length,
    unmapped,
  };
}
