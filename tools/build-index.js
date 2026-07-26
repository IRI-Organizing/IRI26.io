/*
 * Rebuilds assets/program-index.json from the program PDF.
 *
 *   npm install pdfjs-dist
 *   node tools/build-index.js
 *
 * The index is what the search box on program.html queries, so it has to be
 * regenerated whenever the PDF is replaced — otherwise the page numbers it
 * jumps to drift out of sync with the document.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PDF = path.join(ROOT, 'assets', 'IEEE_IRI2026_Detailed_Program_Jul24.pdf');
const OUT = path.join(ROOT, 'assets', 'program-index.json');

// A paper starts with its submission id. Each workshop numbers its own track,
// so add the prefix here when a new one joins the program. Matching an
// explicit list rather than a generic acronym pattern keeps paper titles that
// open with an acronym from being mistaken for ids.
const ID_PREFIXES = ['IRI', 'AIHC', 'EMRITE'];
// The "(15 min)" duration sometimes wraps onto its own line in the PDF's
// two-column layout, so the duration is optional here and the leftover
// "min)" is filtered out as structural below.
const ID_RE = new RegExp(
  `^((?:${ID_PREFIXES.join('|')})\\s*\\d+)\\s*(?:\\((\\d+)\\s*(?:min\\))?)?`
);

// Author lists are written surname-first: "Zhang, Yixin, Tran, Hai Anh".
const NAME_LIST_RE = /^[A-Z][^:]{0,60},\s*[A-Z]/;

// Lines that structure the program rather than describe a paper. They land
// between the last paper of one session and the first of the next, so they
// have to be pulled out before the remaining lines are read as title/authors.
const STRUCTURAL = [
  /^Session\s+[A-Z]\d?$/i,
  /^Session\s+Chair\s*:/i,
  /^Room\s*:/i,
  /^IEEE IRI Conference Day/i,
  /^Detailed Program$/i,
  /^\d{1,2}:\d{2}\s*[ap]?m?\s*-\s*\d{1,2}:\d{2}\s*[ap]m/i,
  /^\d{1,2}:\d{2}[ap]m-$/i,
  /^(Coffee\s+)?Break$/i,
  /^Lunch(\s+Break)?$/i,
  /^Dinner/i,
  /^min\)$/i,
  /^\(?\d+\s*min\)$/i,
];

const isStructural = (line) => STRUCTURAL.some((re) => re.test(line.trim()));

/*
 * Splits a page into lines, tagging each with the font it was set in.
 *
 * pdf.js numbers fonts per page, so the same id means different things on
 * different pages — the author font therefore has to be worked out one page
 * at a time. Whichever font is used for the most surname-first name lists is
 * the one the authors are set in, which is what separates a wrapped author
 * list from the tail of a wrapped title.
 */
function toLines(textContent) {
  const lines = [];
  let text = '';
  let font = '';
  let lastY = null;
  for (const item of textContent.items) {
    const y = Math.round(item.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      if (text.trim()) lines.push({ text: text.trim(), font });
      text = '';
    }
    text += item.str;
    font = item.fontName;
    lastY = y;
  }
  if (text.trim()) lines.push({ text: text.trim(), font });
  return lines;
}

function authorFontOf(lines) {
  // Page 1 opens with the at-a-glance grid, whose session chairs are name-like
  // but set in the grid's own font. Calibrating on it would pick the wrong
  // font for the detailed listings that follow, so the grid is skipped.
  const detail = lines.findIndex((l) => /^Detailed Program$/i.test(l.text.trim()));
  const scope = detail === -1 ? lines : lines.slice(detail + 1);
  const votes = {};
  for (const { text, font } of scope) {
    if (!isStructural(text) && NAME_LIST_RE.test(text)) votes[font] = (votes[font] || 0) + 1;
  }
  return Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] || null;
}

async function extractPages() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(PDF)) }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const lines = toLines(await (await doc.getPage(n)).getTextContent());
    pages.push({ page: n, lines, authorFont: authorFontOf(lines) });
  }
  return pages;
}

// Rooms live only in the at-a-glance grid on page 1, never in the detailed
// listings, so they are collected separately and joined on the session code.
// Grid cells wrap mid-value ("Room: DISC" / "162"), hence the lookahead.
function roomsFromGrid(page1) {
  const rooms = {};
  let session = '';
  for (let i = 0; i < page1.lines.length; i++) {
    const line = page1.lines[i].text.trim();
    if (/^Detailed Program$/i.test(line)) break;
    const code = line.match(/^([A-Z]\d)\s*:/);
    if (code) session = code[1];
    const room = line.match(/^Room\s*:\s*(.*)$/i);
    if (room && session) {
      let value = room[1].trim();
      if (!/\d/.test(value)) value = `${value} ${(page1.lines[i + 1] || { text: '' }).text.trim()}`.trim();
      rooms[session] = value.replace(/\s+/g, ' ');
    }
  }
  return rooms;
}

function build(pages) {
  const rooms = roomsFromGrid(pages[0]);
  const entries = [];
  const state = { day: '', time: '', session: '', sessionName: '', chair: '' };
  // Papers carry over page breaks, so the open paper is tracked across pages.
  let open = null;

  const flush = () => {
    if (!open) return;
    const body = open.lines.filter((l) => !isStructural(l.text));
    if (body.length) {
      const authorLines = body.filter((l) => l.font === l.authorFont);
      const titleLines = body.filter((l) => l.font !== l.authorFont);
      // Fall back to "the last line is the authors" when a page has no font
      // to calibrate against, e.g. a session whose papers all fit on one line.
      const authors = authorLines.length
        ? authorLines.map((l) => l.text).join(' ')
        : body.length > 1
          ? body[body.length - 1].text
          : '';
      const title = (authorLines.length ? titleLines : body.slice(0, -1) || body)
        .map((l) => l.text)
        .join(' ');
      entries.push({
        id: open.id,
        title: title.replace(/\s+/g, ' ').trim(),
        authors: authors.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim(),
        session: open.session,
        sessionName: open.sessionName,
        chair: open.chair,
        room: open.room,
        day: open.day,
        time: open.time,
        page: open.page,
      });
    }
    open = null;
  };

  for (const { page, lines, authorFont } of pages) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].text.trim();
      if (!line) continue;

      const day = line.match(/^IEEE IRI Conference Day\s*\d*\s*:\s*(.+?)\s*$/i);
      if (day) {
        flush();
        state.day = day[1].replace(/,\s*20\d\d$/, '');
        continue;
      }

      const slot = line.match(/^(\d{1,2}:\d{2}\s*[ap]?m?\s*-\s*\d{1,2}:\d{2}\s*[ap]m)\s*(Session\s+[A-Z])?/i);
      if (slot) {
        state.time = slot[1].replace(/\s+/g, '');
        if (!open) continue;
      }

      const session = line.match(/^Session\s+([A-Z]\d)$/i);
      if (session) {
        flush();
        state.session = session[1].toUpperCase();
        state.sessionName = (lines[i + 1] || { text: '' }).text.trim();
        state.chair = '';
        continue;
      }

      const chair = line.match(/^Session\s+Chair\s*:\s*(.*)$/i);
      if (chair) {
        state.chair = chair[1].trim();
        continue;
      }

      const id = line.match(ID_RE);
      if (id) {
        flush();
        // Short titles share the id's line; keep whatever trails the match.
        const rest = line.slice(id[0].length).trim();
        open = {
          id: id[1].replace(/\s+/g, ' ').trim(),
          page,
          lines: rest ? [{ text: rest, font: lines[i].font, authorFont }] : [],
          session: state.session,
          sessionName: state.sessionName,
          chair: state.chair,
          room: rooms[state.session] || '',
          day: state.day,
          time: state.time,
        };
        continue;
      }

      if (open) open.lines.push({ text: line, font: lines[i].font, authorFont });
    }
  }
  flush();
  return entries;
}

(async () => {
  const entries = build(await extractPages());
  fs.writeFileSync(
    OUT,
    JSON.stringify({ pdf: path.basename(PDF), entries }, null, 1) + '\n'
  );
  console.log(`${entries.length} entries -> ${path.relative(ROOT, OUT)}`);
})();
