import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Download, AlertCircle } from 'lucide-react';
import FileUpload from '../../components/ui/file-upload';
import { convertImagesToPdf } from '../../utils/pdf-utils';
import styles from './image-to-pdf.module.css';

const ImageToPdf: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    // Filter for images only
    const validFiles = files.filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png'
    );
    
    if (validFiles.length < files.length) {
      setError("Some files were skipped. Only JPG and PNG are supported.");
    } else {
      setError(null);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    // Revoke previous URL if it exists
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const pdfBytes = await convertImagesToPdf(selectedFiles);
      
      const filename = `toolbox-${new Date().getTime()}.pdf`;
      const file = new File([pdfBytes.buffer as ArrayBuffer], filename, { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      setDownloadUrl(url);

      // Create a hidden link and trigger a simulated click
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      
      // Use MouseEvent for more robust triggering in strict environments
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      link.dispatchEvent(clickEvent);
      
      // Keep in DOM for a significant time and don't revoke URL yet
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 10000);
      
    } catch (err) {
      console.error("Conversion failed:", err);
      setError("An error occurred during PDF generation. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/')}>
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
            <div className={styles.errorBanner}>
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
                  onClick={() => setSelectedFiles([])}
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
                        <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeFile(index)}
                      aria-label="Remove file"
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
          <div className={styles.card}>
            <h3>Conversion Ready</h3>
            <p>Your PDF will contain {selectedFiles.length} page{selectedFiles.length !== 1 ? 's' : ''}.</p>
            
            <button 
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
                download={`converted-${new Date().getTime()}.pdf`}
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
