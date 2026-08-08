import {
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiClock,
  FiUser,
} from "react-icons/fi";
import styles from "./TaskInvitation.module.css";

export default function TaskInvitation({ isOpen, onClose, task, onRespond }) {
  if (!isOpen || !task) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAccept = () => {
    onRespond(task.id, "accepted");
  };
  const handleDecline = () => {
    onRespond(task.id, "declined");
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={24} />
        </button>

        <h2 className={styles.title}>Task Invitation</h2>

        <div className={styles.content}>
          <h3>{task.title}</h3>
          {task.creator && (
            <div className={styles.creator}>
              <FiUser size={16} /> Created by: {task.creator.username}
            </div>
          )}
          <div className={styles.details}>
            <span>
              <FiCalendar size={14} /> {formatDate(task.deadline_datetime)}
            </span>
            <span>
              <FiClock size={14} /> {formatTime(task.deadline_datetime)}
            </span>
          </div>
          <p className={styles.description}>
            {task.description || "No description provided."}
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.acceptBtn} onClick={handleAccept}>
            <FiCheckCircle size={18} /> Accept
          </button>
          <button className={styles.declineBtn} onClick={handleDecline}>
            <FiXCircle size={18} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}
