import { FiTrash2, FiPlus, FiPaperclip } from "react-icons/fi";
import styles from "./FileAttachment.module.css";

export default function FileAttachment({ files = [], onRemove, onAdd }) {
  const hasFiles = files.length > 0;

  return (
    <div className={styles.container}>
      {hasFiles && (
        <div className={styles.fileList}>
          {files.map((file) => (
            <div key={file.name} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <FiPaperclip size={14} className={styles.fileIcon} />
                <span className={styles.fileName}>{file.name}</span>
                {file.size && (
                  <span className={styles.fileSize}>{file.size}</span>
                )}
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemove(file)}
                aria-label={`Remove ${file.name}`}
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className={hasFiles ? styles.addButtonCompact : styles.addButton}
        onClick={onAdd}
      >
        <FiPlus size={16} />
        Add File
      </button>
    </div>
  );
}
