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

## Adding the weekend parking map

`map-parking.html` expects the map image at:

```
assets/weekend-parking-map.png
```

Drop the file there and it appears automatically. Until it exists, the page
shows a short "posted here shortly" note instead of a broken image. A `.jpg`
works too — just update the two `assets/weekend-parking-map.png` references in
`map-parking.html`.

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
