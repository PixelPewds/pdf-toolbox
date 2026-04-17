import { PDFDocument } from 'pdf-lib';

/**
 * Converts a list of image files to a single PDF document.
 * Each image is placed on its own page using its original aspect ratio.
 */
export async function convertImagesToPdf(files: File[]): Promise<Uint8Array> {
  console.log("Utility: Creating PDF document...");
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Utility: Processing file ${i + 1}/${files.length}: ${file.name}`);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log(`Utility: ArrayBuffer loaded for ${file.name}, size: ${arrayBuffer.byteLength}`);
    
    let image;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      console.warn(`Utility: Unsupported file type: ${file.type}`);
      continue;
    }

    const { width, height } = image.size();
    console.log(`Utility: Image embedded, dimensions: ${width}x${height}`);
    
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    console.log(`Utility: Page added for ${file.name}`);
  }

  console.log("Utility: Saving PDF...");
  const bytes = await pdfDoc.save();
  console.log("Utility: PDF saved, bytes length:", bytes.length);
  return bytes;
}
