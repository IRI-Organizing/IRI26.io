# IEEE IRI 2026 — attendee info site

A small static site with the three things attendees need. No build step, no
dependencies — plain HTML and one stylesheet.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Landing page with the three cards |
| `program.html` | Embeds / links the detailed program PDF |
| `map-parking.html` | Venue rooms, parking info, weekend parking map |
| `certificate.html` | Placeholder — content to be added |

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
from a project subpath (`https://<user>.github.io/IRI26.io/`) as well as a
custom domain.
