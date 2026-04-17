import React, { useCallback, useState } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';
import styles from './file-upload.module.css';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  accept = "image/png, image/jpeg",
  multiple = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div 
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileInput"
        className={styles.hiddenInput}
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
      />
      <label htmlFor="fileInput" className={styles.label}>
        <div className={styles.iconWrapper}>
          <Upload className={styles.icon} />
        </div>
        <div className={styles.textWrapper}>
          <h3 className={styles.title}>Click to upload or drag and drop</h3>
          <p className={styles.subtitle}>PNG or JPG (max. 10MB per file)</p>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
