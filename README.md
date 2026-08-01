# IEEE IRI 2026 — attendee info site

A small static site with the three things attendees need. No build step, no
dependencies — plain HTML and one stylesheet.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Landing page with the three cards |
| `program.html` | Searchable program, plus the PDF itself |
| `map-parking.html` | Venue rooms, parking info, weekend parking map |
| `certificate.html` | Placeholder — content to be added |

## Program search

`program.html` searches `assets/program-index.json`, which lists all 102
papers with their authors, session, day, time, room and — the part that makes
the jump work — the PDF page they appear on. Typing a name filters the list;
picking a result moves the embedded PDF to that page.

Matching ignores case, accents and punctuation, and requires every word typed
to appear somewhere in the record. The program prints names surname-first
("Peng, Zedong"), so this is what lets an attendee find themselves by typing
their name the way they normally write it.

### Updating the PDF

The page numbers in the index belong to one specific version of the PDF, so
the two have to be replaced together:

```
cp <new program>.pdf assets/IEEE_IRI2026_Detailed_Program_Jul31.pdf
npm install pdfjs-dist
node tools/build-index.js
```

If the file is given a new name, update `PDF` in `tools/build-index.js` and
the three references in `program.html`. A new workshop track numbers its
papers with its own prefix (`IRI`, `AIHC`, `EMRITE` so far) — add it to
`ID_PREFIXES` in the build script or its papers will be skipped. The script
prints the entry count; if it drops, something stopped parsing.

## The weekend parking map

`map-parking.html` shows `assets/UWB_Weekend_Parking_Map.jpeg`. To swap in a
newer version, either overwrite that file or update the two references to it
in `map-parking.html`. If the file is ever missing, the page falls back to a
short "posted here shortly" note rather than a broken image.

## Running locally

Open `index.html` in a browser, or:

```
python3 -m http.server
```

then visit http://localhost:8000

## Visibility

Every page carries `<meta name="robots" content="noindex, nofollow">`, so
search engines leave the site out of their results. The URL itself is still
reachable by anyone who has it — GitHub Pages has no password or login on the
free and Pro plans. Treat the link as unlisted, not private.

A `robots.txt` in this repo would have no effect: crawlers only read it from
the domain root (`pengzedong.github.io/robots.txt`), which belongs to a
different repo. The meta tag is what does the work here, and it is the
stronger signal anyway.

## Publishing with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch, then pick this
branch and the `/ (root)` folder. All links are relative, so the site works
from a project subpath (`https://<user>.github.io/<repo>/`) as well as a
custom domain — nothing here hardcodes the repository name, so renaming the
repository needs no code change.

## Reusing this for the next edition

Nothing is generated per year, so the next edition is a content swap rather
than a rebuild:

1. Replace `assets/` — the program PDF and the parking map. Point `PDF` in
   `tools/build-index.js` and the two references in `program.html` at the new
   filename, then rerun `node tools/build-index.js`.
2. Find-and-replace `IEEE IRI 2026` across the four HTML files. It appears in
   each page's `<title>`, description, header brand and footer.
3. Update the dates, which live in the `.hero` paragraph of `index.html` and
   `program.html`.
4. Update the venue list and the parking dates in `map-parking.html`.

Everything else — layout, styles, search — carries over untouched.
