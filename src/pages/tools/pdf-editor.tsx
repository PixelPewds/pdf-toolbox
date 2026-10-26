import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { AlertCircle, ArrowLeft, Download, FileText, LoaderCircle, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './pdf-editor.module.css';

GlobalWorkerOptions.workerSrc = workerUrl;

const RENDER_SCALE = 1.25;
const MAX_PDF_SIZE = 100 * 1024 * 1024;

type FontStyle = {
  ascent?: number;
  descent?: number;
  fontFamily?: string;
};

type TextBlock = {
  id: string;
  pageNumber: number;
  text: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfFontSize: number;
  rotation: number;
  left: number;
  top: number;
  width: number;
  height: number;
  fontFamily: string;
  fontType: string;
  fontWeight: '400' | '700';
  fontStyle: 'normal' | 'italic';
};

type EditorPage = {
  pageNumber: number;
  width: number;
  height: number;
  blocks: TextBlock[];
};

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
};

function isTextItem(item: unknown): item is PdfTextItem {
  return Boolean(
    item &&
      typeof item === 'object' &&
      'str' in item &&
      'transform' in item &&
      Array.isArray(item.transform),
  );
}

function multiplyTransforms(first: number[], second: number[]) {
  return [
    first[0] * second[0] + first[2] * second[1],
    first[1] * second[0] + first[3] * second[1],
    first[0] * second[2] + first[2] * second[3],
    first[1] * second[2] + first[3] * second[3],
    first[0] * second[4] + first[2] * second[5] + first[4],
    first[1] * second[4] + first[3] * second[5] + first[5],
  ];
}

function getFontDetails(fontName: string, style?: FontStyle) {
  const name = `${fontName} ${style?.fontFamily ?? ''}`.toLowerCase();
  const isBold = /bold|black|heavy|semibold/.test(name);
  const isItalic = /italic|oblique/.test(name);
  let fontFamily = style?.fontFamily?.trim() || 'sans-serif';

  if (/serif|times|roman|georgia|garamond/.test(name) && !/sans/.test(name)) {
    fontFamily = 'serif';
  } else if (/mono|courier|code|console/.test(name)) {
    fontFamily = 'monospace';
  } else if (!fontFamily || fontFamily === 'sans-serif') {
    fontFamily = 'sans-serif';
  }

  return {
    fontFamily,
    fontType: style?.fontFamily || fontName || 'Unknown font',
    fontWeight: isBold ? ('700' as const) : ('400' as const),
    fontStyle: isItalic ? ('italic' as const) : ('normal' as const),
  };
}

function getStandardFont(block: TextBlock) {
  if (block.fontFamily === 'monospace') {
    if (block.fontWeight === '700' && block.fontStyle === 'italic') return StandardFonts.CourierBoldOblique;
    if (block.fontWeight === '700') return StandardFonts.CourierBold;
    if (block.fontStyle === 'italic') return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  if (block.fontFamily === 'serif') {
    if (block.fontWeight === '700' && block.fontStyle === 'italic') return StandardFonts.TimesRomanBoldItalic;
    if (block.fontWeight === '700') return StandardFonts.TimesRomanBold;
    if (block.fontStyle === 'italic') return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (block.fontWeight === '700' && block.fontStyle === 'italic') return StandardFonts.HelveticaBoldOblique;
  if (block.fontWeight === '700') return StandardFonts.HelveticaBold;
  if (block.fontStyle === 'italic') return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfEditor() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageScales, setPageScales] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('edited-document.pdf');
  const [error, setError] = useState<string | null>(null);
  const pdfBytes = useRef<Uint8Array | null>(null);
  const documentRef = useRef<Awaited<ReturnType<typeof getDocument>['promise']> | null>(null);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  const allBlocks = pages.flatMap((page) => page.blocks);
  const selectedBlock = allBlocks.find((block) => block.id === selectedId) ?? null;
  const changedBlocks = allBlocks.filter((block) => edits[block.id] !== undefined && edits[block.id] !== block.text);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    for (const page of pages) {
      const element = pageRefs.current[page.pageNumber];
      if (!element) continue;

      const observer = new ResizeObserver(([entry]) => {
        const scale = entry.contentRect.width / page.width;
        setPageScales((current) => {
          if (Math.abs((current[page.pageNumber] ?? 0) - scale) < 0.001) return current;
          return { ...current, [page.pageNumber]: scale };
        });
      });
      observer.observe(element);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, [pages]);

  useEffect(() => {
    let cancelled = false;

    async function renderPages() {
      const documentProxy = documentRef.current;
      if (!documentProxy) return;

      for (const pageData of pages) {
        if (cancelled) return;
        const canvas = canvasRefs.current[pageData.pageNumber];
        if (!canvas) continue;

        const page = await documentProxy.getPage(pageData.pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
      }
    }

    void renderPages();
    return () => {
      cancelled = true;
    };
  }, [pages]);

  const loadPdf = async (nextFile: File) => {
    if (nextFile.type !== 'application/pdf' && !nextFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    if (nextFile.size > MAX_PDF_SIZE) {
      setError('The PDF must be 100 MB or smaller.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFile(nextFile);
    setPages([]);
    setEdits({});
    setSelectedId(null);
    setDownloadUrl(null);

    try {
      const bytes = new Uint8Array(await nextFile.arrayBuffer());
      pdfBytes.current = bytes.slice();
      const documentProxy = await getDocument({ data: bytes }).promise;
      documentRef.current = documentProxy;
      const nextPages: EditorPage[] = [];

      for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
        const page = await documentProxy.getPage(pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const content = await page.getTextContent();
        const blocks: TextBlock[] = [];

        content.items.forEach((rawItem, itemIndex) => {
          if (!isTextItem(rawItem) || !rawItem.str.trim()) return;

          const style = content.styles[rawItem.fontName] as FontStyle | undefined;
          const transformed = multiplyTransforms(viewport.transform, rawItem.transform);
          const fontSize = Math.max(1, Math.hypot(transformed[2], transformed[3]));
          const ascent = style?.ascent ?? 0.8;
          const rotation = Math.atan2(transformed[1], transformed[0]) * (180 / Math.PI);
          const fontDetails = getFontDetails(rawItem.fontName, style);

          blocks.push({
            id: `${pageNumber}-${itemIndex}`,
            pageNumber,
            text: rawItem.str,
            pdfX: rawItem.transform[4],
            pdfY: rawItem.transform[5],
            pdfWidth: rawItem.width,
            pdfFontSize: Math.max(1, Math.hypot(rawItem.transform[2], rawItem.transform[3])),
            rotation,
            left: transformed[4],
            top: transformed[5] - fontSize * ascent,
            width: Math.max(rawItem.width * RENDER_SCALE, fontSize * 0.5),
            height: Math.max(fontSize * 1.2, rawItem.height * RENDER_SCALE),
            ...fontDetails,
          });
        });

        nextPages.push({ pageNumber, width: viewport.width, height: viewport.height, blocks });
      }

      setPages(nextPages);
    } catch (loadError) {
      console.error('PDF load failed:', loadError);
      setFile(null);
      pdfBytes.current = null;
      setError('This PDF could not be opened. It may be encrypted or damaged.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    event.target.value = '';
    if (nextFile) void loadPdf(nextFile);
  };

  const exportPdf = async () => {
    if (!pdfBytes.current || changedBlocks.length === 0) return;

    setIsExporting(true);
    setError(null);
    try {
      const document = await PDFDocument.load(pdfBytes.current);
      const pageFonts = new Map<string, Awaited<ReturnType<typeof document.embedFont>>>();

      for (const block of changedBlocks) {
        const page = document.getPage(block.pageNumber - 1);
        const fontName = getStandardFont(block);
        const fontKey = `${fontName}-${block.pdfFontSize}`;
        let font = pageFonts.get(fontKey);
        if (!font) {
          font = await document.embedFont(fontName);
          pageFonts.set(fontKey, font);
        }

        const replacement = edits[block.id] ?? block.text;
        const replacementWidth = font.widthOfTextAtSize(replacement, block.pdfFontSize);
        const coverWidth = Math.max(block.pdfWidth, replacementWidth) + 4;
        const coverHeight = block.pdfFontSize * 1.25;
        const rotation = block.rotation ? degrees(-block.rotation) : undefined;

        page.drawRectangle({
          x: block.pdfX - 2,
          y: block.pdfY - block.pdfFontSize * 0.3,
          width: coverWidth,
          height: coverHeight,
          color: rgb(1, 1, 1),
          rotate: rotation,
        });
        page.drawText(replacement, {
          x: block.pdfX,
          y: block.pdfY,
          size: block.pdfFontSize,
          font,
          color: rgb(0.08, 0.08, 0.1),
          rotate: rotation,
        });
      }

      const output = await document.save();
      const url = URL.createObjectURL(new Blob([output.slice().buffer as ArrayBuffer], { type: 'application/pdf' }));
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setDownloadName(file ? `${file.name.replace(/\.pdf$/i, '')}-edited.pdf` : 'edited-document.pdf');
    } catch (exportError) {
      console.error('PDF export failed:', exportError);
      setError('The edited PDF could not be generated. Try a different text selection.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearDocument = () => {
    setFile(null);
    setPages([]);
    setEdits({});
    setSelectedId(null);
    setDownloadUrl(null);
    pdfBytes.current = null;
    documentRef.current = null;
  };

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>PDF <span className="text-gradient">Editor</span></h1>
          <p className={styles.subtitle}>Select existing text, change it, and export a polished edited copy locally.</p>
        </div>
        {file && (
          <button type="button" className={styles.changeFileButton} onClick={clearDocument}>
            <X size={16} /> Close PDF
          </button>
        )}
      </header>

      {!file && !isLoading && (
        <section className={styles.uploadCard}>
          <input ref={inputRef} className={styles.hiddenInput} type="file" accept="application/pdf,.pdf" onChange={handleInput} />
          <div className={styles.uploadIcon}><Upload size={28} /></div>
          <h2>Open a PDF to edit</h2>
          <p>Text-based PDFs work best. Everything stays in your browser.</p>
          <button type="button" className={styles.primaryButton} onClick={() => inputRef.current?.click()}>
            <FileText size={19} /> Choose PDF
          </button>
          <span className={styles.fileHint}>PDF files up to 100 MB</span>
        </section>
      )}

      {isLoading && (
        <div className={styles.loadingState} role="status">
          <LoaderCircle className={styles.spinner} size={24} /> Reading PDF text and styles...
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert" aria-live="polite">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {file && pages.length > 0 && (
        <div className={styles.editorLayout}>
          <section className={styles.documentColumn} aria-label="PDF pages">
            <div className={styles.documentToolbar}>
              <div>
                <strong>{file.name}</strong>
                <span>{formatFileSize(file.size)} · {pages.length} page{pages.length === 1 ? '' : 's'}</span>
              </div>
              <span className={styles.instruction}>Click any detected text to edit it</span>
            </div>

            <div className={styles.pages}>
              {pages.map((page) => {
                const scale = pageScales[page.pageNumber] ?? 1;
                return (
                  <div
                    key={page.pageNumber}
                    ref={(element) => { pageRefs.current[page.pageNumber] = element; }}
                    className={styles.pageShell}
                    style={{ aspectRatio: `${page.width} / ${page.height}` }}
                  >
                    <canvas
                      ref={(element) => { canvasRefs.current[page.pageNumber] = element; }}
                      className={styles.canvas}
                      aria-label={`Page ${page.pageNumber}`}
                    />
                    {page.blocks.map((block) => {
                      const isSelected = selectedId === block.id;
                      const value = edits[block.id] ?? block.text;
                      const textStyle = {
                        left: block.left * scale,
                        top: block.top * scale,
                        width: Math.max(block.width * scale, 30),
                        height: block.height * scale,
                        fontSize: block.pdfFontSize * scale,
                        fontFamily: block.fontFamily,
                        fontWeight: block.fontWeight,
                        fontStyle: block.fontStyle,
                        transform: `rotate(${block.rotation}deg)`,
                      };

                      return isSelected ? (
                        <input
                          key={block.id}
                          ref={(element) => {
                            if (element) element.focus();
                          }}
                          className={styles.editInput}
                          style={textStyle}
                          value={value}
                          aria-label={`Edit text: ${block.text}`}
                          onChange={(event) => setEdits((current) => ({ ...current, [block.id]: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setEdits((current) => ({ ...current, [block.id]: block.text }));
                              setSelectedId(null);
                            }
                            if (event.key === 'Enter') event.currentTarget.blur();
                          }}
                          onBlur={() => setSelectedId(null)}
                        />
                      ) : (
                        <button
                          key={block.id}
                          type="button"
                          className={`${styles.textTarget} ${edits[block.id] !== undefined && edits[block.id] !== block.text ? styles.editedTarget : ''}`}
                          style={textStyle}
                          title={`Edit “${block.text}” · ${block.fontType}, ${block.pdfFontSize.toFixed(1)} pt`}
                          aria-label={`Edit text: ${block.text}`}
                          onClick={() => setSelectedId(block.id)}
                        >
                          {value}
                        </button>
                      );
                    })}
                    <span className={styles.pageNumber}>Page {page.pageNumber}</span>
                  </div>
                );
              })}
            </div>
            {allBlocks.length === 0 && (
              <div className={styles.noTextNotice}>
                No selectable text was detected in this PDF. Scanned or image-only pages need OCR before their content can be edited.
              </div>
            )}
          </section>

          <aside className={styles.sidebar} aria-label="Editor controls">
            <div className={styles.controlCard}>
              <h2>Text details</h2>
              {selectedBlock ? (
                <>
                  <p className={styles.selectedHint}>Editing selected text</p>
                  <label className={styles.fieldLabel} htmlFor="editor-text">Text</label>
                  <textarea
                    id="editor-text"
                    className={styles.textarea}
                    rows={3}
                    value={edits[selectedBlock.id] ?? selectedBlock.text}
                    onChange={(event) => setEdits((current) => ({ ...current, [selectedBlock.id]: event.target.value }))}
                  />
                  <div className={styles.styleGrid}>
                    <div><span>Font</span><strong>{selectedBlock.fontType}</strong></div>
                    <div><span>Size</span><strong>{selectedBlock.pdfFontSize.toFixed(1)} pt</strong></div>
                    <div><span>Weight</span><strong>{selectedBlock.fontWeight === '700' ? 'Bold' : 'Regular'}</strong></div>
                    <div><span>Style</span><strong>{selectedBlock.fontStyle === 'italic' ? 'Italic' : 'Normal'}</strong></div>
                  </div>
                </>
              ) : (
                <p className={styles.emptyHint}>Click text on a page to inspect its detected font type, size, and style.</p>
              )}
            </div>

            <div className={styles.controlCard}>
              <div className={styles.summaryRow}><span>Changes</span><strong>{changedBlocks.length}</strong></div>
              <button type="button" className={styles.primaryButton} disabled={changedBlocks.length === 0 || isExporting} onClick={() => void exportPdf()}>
                {isExporting ? <LoaderCircle className={styles.spinner} size={19} /> : <Download size={19} />}
                {isExporting ? 'Creating PDF...' : 'Export edited PDF'}
              </button>
              {downloadUrl && (
                <a className={styles.downloadLink} href={downloadUrl} download={downloadName}>
                  <Download size={17} /> Download {downloadName}
                </a>
              )}
              <p className={styles.privacyNote}>PDF processing happens entirely on this device.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
