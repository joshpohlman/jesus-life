# Jesus Life

Fresh project scaffold for an interactive, scroll-driven website tracing the life of Jesus Christ across Israel.

## Location

`C:\Users\joshs\jesus-life`

## Quick start

```bash
cd C:\Users\joshs\jesus-life
npm install
npm run dev
```

Open http://localhost:5180

## Folder structure

```
jesus-life/
├── index.html          # Entry page
├── public/
│   ├── favicon.svg
│   └── images/         # Photos & reconstructions
└── src/
    ├── data/
    │   └── timeline.js # Phases + chronological events
    ├── scripts/
    │   └── main.js     # App entry point
    └── styles/
        └── main.css    # Styles
```

## Planned stack

- Vite (dev server & build)
- GSAP (scroll animations)
- Leaflet (interactive Holy Land map)
- Wikimedia Commons photos + generated reconstructions where needed