import React from "react";
import Modal from "../common/Modal";
import styles from "./EventModalView.module.css";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import featureStyles from "../../pages/app/officials/Home.module.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function EventModalView({ isOpen, onClose, event }) {
  if (!event) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
        <div className={styles.emptyState}>No event selected.</div>
      </Modal>
    );
  }

  const creator = event.creator || {};
  const creatorName = creator.full_name || creator.username || "Unknown";
  const creatorPosition = creator.position || "";
  const creatorAffiliation = [creator.department, creator.office]
    .filter(Boolean)
    .join(" | ");
  const creatorSub = [creatorPosition, creatorAffiliation]
    .filter(Boolean)
    .join(" | ");

  const participants = event.participants || {};
  const depts = participants.departments || [];
  const users = participants.users || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"Event Details"}>
      <div className={styles.mainContent}>
        <div className={featureStyles.featuredCard}>
          <div className={featureStyles.badgesStatus}>
            <div className={featureStyles.badgeRow}>
              <div className={featureStyles.badgePill}>
                {event.hierarchy || "Unknown Hierarchy"}
              </div>
              <div className={featureStyles.badgePill}>
                {event.method || "Unknown Method"}
              </div>
              <div className={featureStyles.badgePill}>
                {event.visibility || "Unknown Event Visibility"}
              </div>
              <div className={featureStyles.badgePill}>
                {event.event_type || "Unknown Event Type"}
              </div>
            </div>
            <div className={featureStyles.heading2}>
              <div className={featureStyles.featuredTitle}>{event.title}</div>
            </div>
          </div>

          <div className={featureStyles.featuredCardContent}>
            <div className={featureStyles.titleDescription}>
              <div className={featureStyles.descriptionText}>
                {event.description}
              </div>
            </div>

            <div className={featureStyles.container8}>
              <div className={featureStyles.whenWhereGroup}>
                <div className={featureStyles.sectionHeader}>
                  <EventNoteOutlinedIcon fontSize="small" />
                  <div className={featureStyles.heading4}>
                    <div className={featureStyles.text7}>WHEN & WHERE</div>
                  </div>
                </div>
                <div className={featureStyles.infoGrid}>
                  <div className={featureStyles.infoBlock}>
                    <div className={featureStyles.infoLabel}>DATE RANGE</div>
                    <div className={featureStyles.infoValue}>
                      {formatDate(event.start_datetime)} —{" "}
                      {formatDate(event.end_datetime)}
                    </div>
                  </div>
                  <div className={featureStyles.infoBlock}>
                    <div className={featureStyles.infoLabel}>TIME</div>
                    <div className={featureStyles.infoValue}>
                      {formatTime(event.start_datetime)} —{" "}
                      {formatTime(event.end_datetime)}
                    </div>
                  </div>
                  <div className={featureStyles.infoBlock}>
                    <div className={featureStyles.infoLabel}>LOCATION</div>
                    <div className={featureStyles.infoValue}>
                      {event.venue || event.location || "Online"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={featureStyles.organizerSection}>
                <div className={featureStyles.sectionHeader}>
                  <PersonOutlinedIcon fontSize="small" />
                  <div className={featureStyles.heading4}>
                    <div className={featureStyles.text7}>ORGANIZER</div>
                  </div>
                </div>
                <div className={featureStyles.organizerRow}>
                  <div className={featureStyles.organizerAvatar}>
                    {getInitials(creatorName)}
                  </div>
                  <div className={featureStyles.organizerDetails}>
                    <div className={featureStyles.organizerName}>
                      {creatorName}
                    </div>
                    <div className={featureStyles.organizerTitle}>
                      {creatorSub || "Organizer"}
                    </div>
                  </div>
                </div>
                <div className={featureStyles.participatingBlock}>
                  <div className={featureStyles.infoLabel}>
                    PARTICIPATING DEPARTMENTS
                  </div>
                  <div className={featureStyles.deptBadges}>
                    {depts.slice(0, 4).map((dept) => (
                      <div key={dept} className={featureStyles.deptBadge}>
                        {dept}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={featureStyles.audienceSection}>
                <div className={styles.sectionHeader}>
                  <GroupsOutlinedIcon fontSize="small" />
                  <div className={styles.heading4}>
                    <div className={styles.text7}>AUDIENCE</div>
                  </div>
                </div>
                <div className={styles.audienceRow}>
                  <div className={styles.attendeeStack}>
                    {users.slice(0, 4).map((user, index) => {
                      const name =
                        user.full_name ||
                        user.username ||
                        user.email ||
                        "Unknown";
                      return (
                        <div
                          key={
                            user.id || `${user.email || user.username}-${index}`
                          }
                          className={styles.attendeeAvatar}
                          style={{ background: getAvatarColor(name) }}
                        >
                          {getInitials(name)}
                        </div>
                      );
                    })}
                    {users.length >= 5 && (
                      <div className={styles.attendeeMore}>
                        +{users.length - 4}
                      </div>
                    )}
                  </div>
                  <div className={styles.audienceText}>
                    {users.length > 0
                      ? users.length === 1
                        ? `${users[0].full_name || users[0].username || users[0].email} attending`
                        : `${users[0].full_name || users[0].username || users[0].email} and ${users.length - 1} others attending`
                      : "No attendees yet"}
                  </div>
                </div>
                <button type="button" className={styles.viewAttendeesButton}>
                  <VisibilityOutlinedIcon fontSize="small" />
                  View Attendees
                </button>
              </div>
            </div>

            <div className={styles.actionsRow}>
              {/* Additional modal actions can be added here */}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}