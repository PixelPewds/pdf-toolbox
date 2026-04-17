import { PDFDocument } from 'pdf-lib';

/**
 * Converts a list of image files to a single PDF document.
 * Each image is placed on its own page using its original aspect ratio.
 */
export async function convertImagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;

    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      console.warn(`Unsupported file type: ${file.type}`);
      continue;
    }

    // Original dimensions
    const { width, height } = image.size();
    
    // Add a page with the same dimensions as the image
    const page = pdfDoc.addPage([width, height]);

    // Draw the image to fill the page
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
  }

  return await pdfDoc.save();
}
