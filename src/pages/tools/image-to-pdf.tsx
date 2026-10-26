import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Download, AlertCircle } from 'lucide-react';
import FileUpload from '../../components/ui/file-upload';
import { convertImagesToPdf, getImageMimeType } from '../../utils/pdf-utils';
import styles from './image-to-pdf.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ImageToPdf: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter((file) => getImageMimeType(file) && file.size <= MAX_FILE_SIZE);
    const unsupportedCount = files.filter((file) => !getImageMimeType(file)).length;
    const oversizedCount = files.filter((file) => file.size > MAX_FILE_SIZE).length;

    if (unsupportedCount > 0 || oversizedCount > 0) {
      const reasons = [];
      if (unsupportedCount > 0) reasons.push('only JPG and PNG files are supported');
      if (oversizedCount > 0) reasons.push('files must be 10 MB or smaller');
      setError(`Some files were skipped: ${reasons.join('; ')}.`);
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setDownloadUrl(null);
    setDownloadName(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setDownloadUrl(null);
    setDownloadName(null);
    setError(null);
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);
    setDownloadName(null);
    
    try {
      const pdfBytes = await convertImagesToPdf(selectedFiles);
      
      const filename = `toolbox-${Date.now()}.pdf`;
      const blob = new Blob([pdfBytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(filename);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      console.error('Conversion failed:', err);
      setError('An error occurred during PDF generation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Image to <span className="text-gradient">PDF</span></h1>
        <p className={styles.subtitle}>Convert your images into a single professional PDF document instantly.</p>
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <FileUpload onFilesSelected={handleFilesSelected} />
          
          {error && (
            <div className={styles.errorBanner} role="alert" aria-live="polite">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className={styles.fileListSection}>
              <div className={styles.listHeader}>
                <h3>Selected Images ({selectedFiles.length})</h3>
                <button 
                  className={styles.clearButton}
                  type="button"
                  onClick={() => {
                    setSelectedFiles([]);
                    setDownloadUrl(null);
                    setDownloadName(null);
                    setError(null);
                  }}
                >
                  Clear All
                </button>
              </div>
              
              <div className={styles.fileList}>
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileIcon}>
                        <FileText size={20} />
                      </div>
                      <div className={styles.fileDetails}>
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionSection}>
          <div className={styles.card} aria-busy={isProcessing}>
            <h3>Conversion Ready</h3>
            <p>Your PDF will contain {selectedFiles.length} page{selectedFiles.length !== 1 ? 's' : ''}.</p>
            
            <button
              type="button"
              className={styles.convertButton}
              disabled={selectedFiles.length === 0 || isProcessing}
              onClick={handleConvert}
            >
              {isProcessing ? (
                <>
                  <div className={styles.spinner} />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={20} />
                  {downloadUrl ? 'Regenerate PDF' : 'Convert to PDF'}
                </>
              )}
            </button>

            {downloadUrl && !isProcessing && (
              <a 
                href={downloadUrl} 
                download={downloadName ?? 'toolbox.pdf'}
                className={styles.downloadLink}
              >
                <Download size={18} />
                Download PDF Ready
              </a>
            )}
            
            <p className={styles.privacyNote}>No files leave your browser. Privacy is guaranteed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToPdf;
