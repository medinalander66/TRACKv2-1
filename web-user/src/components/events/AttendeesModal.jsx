import React, { useState, useMemo } from "react";
import Modal from "../common/Modal";
import styles from "./AttendeesModal.module.css";
import {
  FiUser,
  FiUsers,
  FiMapPin,
  FiHome,
  FiSearch,
  FiX,
} from "react-icons/fi";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || "?";
};

const AVATAR_COLORS = [
  "#f9a825",
  "#43a047",
  "#1e88e5",
  "#8e24aa",
  "#fb8c00",
  "#00897b",
  "#5e35b1",
];

const getAvatarColor = (str) => {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function AttendeesModal({ isOpen, onClose, event }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // ── LAHAT ng hooks ay nasa TOP bago ang anumang conditional return ──
  const participants = event?.participants || {};
  const departments = participants.departments || [];
  const offices = participants.offices || [];
  const users = participants.users || [];

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(lower) ||
        (u.username || "").toLowerCase().includes(lower) ||
        (u.email || "").toLowerCase().includes(lower) ||
        (u.department || "").toLowerCase().includes(lower) ||
        (u.office || "").toLowerCase().includes(lower) ||
        (u.position || "").toLowerCase().includes(lower),
    );
  }, [users, searchTerm]);

  const totalAttendees = users.length;

  // ── Ngayon ay safe na ang conditional return ──
  if (!event) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Attendees">
        <div className={styles.emptyState}>No event selected.</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attendees">
      <div className={styles.container}>
        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <FiUsers size={18} />
            <span className={styles.summaryNumber}>{totalAttendees}</span>
            <span className={styles.summaryLabel}>Total Attendees</span>
          </div>
          <div className={styles.summaryItem}>
            <FiHome size={18} />
            <span className={styles.summaryNumber}>{departments.length}</span>
            <span className={styles.summaryLabel}>Departments</span>
          </div>
          <div className={styles.summaryItem}>
            <FiMapPin size={18} />
            <span className={styles.summaryNumber}>{offices.length}</span>
            <span className={styles.summaryLabel}>Offices</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "users" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <FiUser size={16} /> Users ({users.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "departments" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            <FiHome size={16} /> Departments ({departments.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "offices" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("offices")}
          >
            <FiMapPin size={16} /> Offices ({offices.length})
          </button>
        </div>

        {/* Search */}
        {activeTab === "users" && (
          <div className={styles.searchBar}>
            <FiSearch size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchTerm("")}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "users" && (
            <div className={styles.userList}>
              {filteredUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  {searchTerm
                    ? "No matching attendees found."
                    : "No attendees yet."}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const name =
                    user.full_name || user.username || user.email || "Unknown";
                  const dept = user.department || "";
                  const office = user.office || "";
                  const position = user.position || "";
                  const response = user.response || "accepted";

                  return (
                    <div key={user.id} className={styles.userCard}>
                      <div
                        className={styles.avatar}
                        style={{ background: getAvatarColor(name) }}
                      >
                        {getInitials(name)}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{name}</div>
                        <div className={styles.userDetails}>
                          {position && (
                            <span className={styles.userTag}>{position}</span>
                          )}
                          {dept && (
                            <span className={styles.userTag}>{dept}</span>
                          )}
                          {office && (
                            <span className={styles.userTag}>{office}</span>
                          )}
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                      <div
                        className={`${styles.statusBadge} ${
                          response === "accepted"
                            ? styles.statusAccepted
                            : response === "pending"
                              ? styles.statusPending
                              : styles.statusDeclined
                        }`}
                      >
                        {response === "accepted"
                          ? "Accepted"
                          : response === "pending"
                            ? "Pending"
                            : "Declined"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "departments" && (
            <div className={styles.listGrid}>
              {departments.length === 0 ? (
                <div className={styles.emptyState}>No departments.</div>
              ) : (
                departments.map((dept) => (
                  <div key={dept} className={styles.listItem}>
                    <FiHome size={18} className={styles.listIcon} />
                    <span className={styles.listName}>{dept}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "offices" && (
            <div className={styles.listGrid}>
              {offices.length === 0 ? (
                <div className={styles.emptyState}>No offices.</div>
              ) : (
                offices.map((office) => (
                  <div key={office} className={styles.listItem}>
                    <FiMapPin size={18} className={styles.listIcon} />
                    <span className={styles.listName}>{office}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
