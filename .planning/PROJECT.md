# PDF Toolbox

## What This Project Is
A suite of entirely client-side PDF modification tools built with React. It provides utilities like converting images to PDF, a PDF editor, a compressor, merge, and split, ensuring users' privacy by keeping all text and documents within the browser.

## Core Value Proposition
- **Privacy First**: No server-side processing. All modifications happen locally via WebAssembly and JavaScript using `pdf-lib` and `pdfjs-dist`.
- **Free and Fast**: No server costs means no requisite subscription models; fast because there are no upload/download times.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [x] Create a dashboard selecting different PDF tools.
- [ ] Image to PDF converter tool (e.g. PNG/JPG to PDF).
- [ ] PDF Merge tool (combine multiple PDFs).
- [ ] PDF Split tool (select pages from a PDF to export).
- [ ] PDF Compressor tool (best effort object stripping/scaling).
- [ ] PDF Editor tool (canvas-based page editor with text overlays).

### Out of Scope

- OCR (Optical Character Recognition) — Extremely difficult to do efficiently 100% on the client side without massive models.
- Server-side processing — The core value prop is privacy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite | Fast startup and excellent component ecosystem for building interactive file tools. | Pending |
| pdf-lib & pdfjs-dist | Robust manipulation (`pdf-lib`) and reliable canvas rendering (`pdfjs-dist`) suitable for browsers. | Pending |

---
*Last updated: 2026-04-16 after initialization*
