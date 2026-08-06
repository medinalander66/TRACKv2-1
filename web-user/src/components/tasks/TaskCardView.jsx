import { useState } from "react";
import {
  FiX,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiUser,
  FiUsers,
  FiEdit,
  FiTrash2,
  FiPaperclip,
  FiDownload,
  FiPlus,
  FiSend,
} from "react-icons/fi";
import styles from "./TaskCardView.module.css";

export default function TaskCardView({
  isOpen,
  onClose,
  task,
  onChecklistToggle,
  onAddComment,
  currentUserId,
}) {
  const [commentInputs, setCommentInputs] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});

  if (!isOpen || !task) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAssignee = task.assignees?.some((a) => a.id === currentUserId);
  const isCollaborator = task.collaborators?.some(
    (c) => c.id === currentUserId,
  );
  const isCreator = task.creator?.id === currentUserId;
  const canModifyChecklist = isAssignee || isCreator || isCollaborator;

  // ─── Color luminance check ──────────────────────────────
  const getTextColor = (hexColor) => {
    if (!hexColor) return "#111827"; // default dark
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#111827" : "#ffffff";
  };

  const handleToggle = (itemId, currentStatus) => {
    if (canModifyChecklist) {
      onChecklistToggle(itemId, !currentStatus);
    }
  };

  const handleCommentToggle = (itemId) => {
    setShowCommentInput((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleCommentChange = (itemId, value) => {
    setCommentInputs((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleCommentSubmit = (itemId) => {
    const comment = commentInputs[itemId]?.trim();
    if (comment && canModifyChecklist) {
      onAddComment(itemId, comment);
      setCommentInputs((prev) => ({ ...prev, [itemId]: "" }));
      setShowCommentInput((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleKeyDown = (e, itemId) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(itemId);
    }
  };

  const textColor = getTextColor(task.color);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={24} />
        </button>

        {/* ─── Header with task color background ─── */}
        <div
          className={styles.header}
          style={{
            backgroundColor: task.color || "#3B82F6",
            color: textColor,
          }}
        >
          <h2 className={styles.title} style={{ color: textColor }}>
            {task.title}
          </h2>
          <div className={styles.metaBadges}>
            <span
              className={styles.priorityBadge}
              style={{ color: textColor, borderColor: textColor }}
            >
              {task.priority}
            </span>
            <span
              className={styles.visibilityBadge}
              style={{ color: textColor, borderColor: textColor }}
            >
              {task.visibility}
            </span>
            {task.is_completed ? (
              <span
                className={styles.completedBadge}
                style={{ color: textColor, borderColor: textColor }}
              >
                Completed
              </span>
            ) : (
              <span
                className={styles.ongoingBadge}
                style={{ color: textColor, borderColor: textColor }}
              >
                Ongoing
              </span>
            )}
          </div>
        </div>

        {/* ─── Details ─── */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <FiCalendar size={16} />
            <span>
              Deadline: {formatDate(task.deadline_datetime)} at{" "}
              {formatTime(task.deadline_datetime)}
            </span>
          </div>
          {task.creator && (
            <div className={styles.detailRow}>
              <FiUser size={16} />
              <span>
                Created by: {task.creator.full_name || task.creator.username}
              </span>
            </div>
          )}
          {task.assignees && task.assignees.length > 0 ? (
            <div className={styles.detailRow}>
              <FiUsers size={16} />
              <span>
                Assignees: {task.assignees.map((a) => a.username).join(", ")}
              </span>
            </div>
          ) : (
            <div className={styles.detailRow}>
              <FiUsers size={16} />
              <span className={styles.noAssignees}>No assignees assigned.</span>
            </div>
          )}
        </div>

        {task.description && (
          <div className={styles.description}>
            <p>{task.description}</p>
          </div>
        )}

        {/* ─── Attachments ──────────────────────────────────── */}
        {task.attachments && task.attachments.length > 0 && (
          <div className={styles.attachmentsSection}>
            <h4 className={styles.attachmentsTitle}>
              <FiPaperclip size={16} /> Attachments
            </h4>
            <div className={styles.attachmentList}>
              {task.attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.attachmentItem}
                  download
                >
                  <FiPaperclip size={14} />
                  <span className={styles.attachmentName}>
                    {file.file_name}
                  </span>
                  <span className={styles.attachmentSize}>
                    {file.file_size}
                  </span>
                  <FiDownload size={14} className={styles.downloadIcon} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── Checklist ────────────────────────────────────── */}
        <div className={styles.checklistSection}>
          <h3>Checklist</h3>
          {task.checklist && task.checklist.length > 0 ? (
            <div className={styles.checklist}>
              {task.checklist.map((item) => (
                <div key={item.id} className={styles.checklistItem}>
                  <div className={styles.checklistTop}>
                    <button
                      className={styles.checkToggle}
                      onClick={() => handleToggle(item.id, item.is_completed)}
                      disabled={!canModifyChecklist}
                    >
                      {item.is_completed ? (
                        <FiCheckCircle size={22} color="#16a34a" />
                      ) : (
                        <span className={styles.emptyBox}>⬜</span>
                      )}
                    </button>
                    <span
                      className={
                        item.is_completed ? styles.itemDone : styles.itemText
                      }
                    >
                      {item.text}
                    </span>
                    {item.is_completed && item.completed_by && (
                      <span className={styles.completedBy}>
                        ✓ by{" "}
                        {item.completed_by.full_name ||
                          item.completed_by.username}
                      </span>
                    )}
                  </div>

                  {/* ─── Comments Display ────────────────────── */}
                  {item.comments && (
                    <div className={styles.commentDisplay}>
                      <div className={styles.commentAvatar}>
                        {item.completed_by?.full_name?.charAt(0) || "U"}
                      </div>
                      <div className={styles.commentBubble}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>
                            {item.completed_by?.full_name ||
                              item.completed_by?.username ||
                              "User"}
                          </span>
                          <span className={styles.commentTime}>
                            {item.completed_at
                              ? new Date(item.completed_at).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <div className={styles.commentText}>
                          {item.comments}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── Add Comment Button ───────────────────── */}
                  {canModifyChecklist && (
                    <div className={styles.commentAction}>
                      <button
                        className={styles.addCommentBtn}
                        onClick={() => handleCommentToggle(item.id)}
                      >
                        <FiPlus size={14} />
                        Add comment
                      </button>
                    </div>
                  )}

                  {/* ─── Comment Input ────────────────────────── */}
                  {canModifyChecklist && showCommentInput[item.id] && (
                    <div className={styles.commentInputWrapper}>
                      <div className={styles.commentInputRow}>
                        <textarea
                          className={styles.commentTextarea}
                          placeholder="Write a comment..."
                          value={commentInputs[item.id] || ""}
                          onChange={(e) =>
                            handleCommentChange(item.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          rows={2}
                        />
                      </div>
                      <div className={styles.commentActions}>
                        <button
                          className={styles.cancelCommentBtn}
                          onClick={() => {
                            setShowCommentInput((prev) => ({
                              ...prev,
                              [item.id]: false,
                            }));
                            setCommentInputs((prev) => ({
                              ...prev,
                              [item.id]: "",
                            }));
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.submitCommentBtn}
                          onClick={() => handleCommentSubmit(item.id)}
                        >
                          <FiSend size={14} /> Comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noChecklist}>No checklist items.</p>
          )}
        </div>

        <button className={styles.closeModalBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const getPriorityColor = (priority) => {
  const map = { high: "#dc2626", medium: "#f59e0b", low: "#10b981" };
  return map[priority] || "#6b7280";
};
