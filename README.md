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

## Publishing with GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch, then pick this
branch and the `/ (root)` folder. All links are relative, so the site works
from a project subpath (`https://<user>.github.io/IRI26.io/`) as well as a
custom domain.
