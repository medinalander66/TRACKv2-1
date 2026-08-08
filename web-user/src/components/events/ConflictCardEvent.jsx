import React from "react";
import Modal from "../common/Modal";
import { FiAlertTriangle, FiCheckCircle, FiCalendar } from "react-icons/fi";
import styles from "./ConflictCardEvent.module.css";

export default function ConflictCardEvent({ isOpen, onClose, event }) {
  if (!event) return null;
  const conflict = event.conflict || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conflict Details">
      <div className={styles.wrapper}>
        <div
          className={`${styles.statusBanner} ${
            conflict.isPriority ? styles.priorityBanner : styles.conflictBanner
          }`}
        >
          {conflict.isPriority ? (
            <FiCheckCircle size={20} />
          ) : (
            <FiAlertTriangle size={20} />
          )}
          <span>
            {conflict.isPriority
              ? "This event takes priority"
              : "This event is lower priority"}
          </span>
        </div>

        <p className={styles.reasonText}>
          {conflict.reason || "No conflict details available."}
        </p>

        {conflict.conflictsWith && conflict.conflictsWith.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <FiCalendar size={14} /> Conflicting With
            </h4>
            <div className={styles.conflictList}>
              {conflict.conflictsWith.map((c) => (
                <div key={c.id} className={styles.conflictItem}>
                  {c.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
