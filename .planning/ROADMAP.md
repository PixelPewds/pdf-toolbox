# Roadmap: PDF Toolbox

## Phase 1: Core Dashboard & Infrastructure [COMPLETED]
**Goal:** Setup basic layout, routing, and a styling system based on glassmorphism and modern typography. Create the central hub where users select standard tools.

## Phase 2: Image to PDF Converter
**Goal:** Build a drag-and-drop file interface for converting PNGs and JPGs to PDF on the client-side using `pdf-lib` and canvas API.

## Phase 3: PDF Editor Module
**Goal:** Implement a canvas renderer utilizing `pdfjs-dist` to visualize PDF pages and allow basic text annotation, overlaid on the document.

## Phase 4: PDF Merge & Split Utilities
**Goal:** Interface for selecting multiple PDFs to combine or specifying page ranges from an uploaded PDF to extract into a new file.

## Phase 5: PDF Compression
**Goal:** A best-effort compression tool that strips objects or downscales images via canvas and reconstructs the PDF using `pdf-lib`.
