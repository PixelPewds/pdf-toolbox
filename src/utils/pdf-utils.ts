import { PDFDocument } from 'pdf-lib';

export function getImageMimeType(file: File): 'image/jpeg' | 'image/png' | null {
  const type = file.type.toLowerCase();

  if (type === 'image/png') {
    return 'image/png';
  }

  if (type === 'image/jpeg' || type === 'image/jpg') {
    return 'image/jpeg';
  }

  // Some browsers provide an empty MIME type for files selected from disk.
  if (!type) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'png') return 'image/png';
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  }

  return null;
}

/**
 * Converts a list of image files to a single PDF document.
 * Each image is placed on its own page using its original aspect ratio.
 */
export async function convertImagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let imageCount = 0;

  for (const file of files) {
    const mimeType = getImageMimeType(file);
    let image: Awaited<ReturnType<typeof pdfDoc.embedJpg>>;

    if (mimeType === 'image/jpeg') {
      image = await pdfDoc.embedJpg(await file.arrayBuffer());
    } else if (mimeType === 'image/png') {
      image = await pdfDoc.embedPng(await file.arrayBuffer());
    } else {
      continue;
    }

    const { width, height } = image.size();
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    imageCount += 1;
  }

  if (imageCount === 0) {
    throw new Error('At least one supported image is required.');
  }

  return await pdfDoc.save();
}
