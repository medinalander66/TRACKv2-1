import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useEventsFilter } from "../../../context/EventsFilterContext";
import { getInvitations } from "../../../api/notifications";
import apiClient from "../../../api/client";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiEdit,
  FiEye,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
  FiGlobe,
  FiLink,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import styles from "./Events.module.css";

// ─── Import modals ───
import EventCardView from "../../../components/events/EventCardView";
import EventInvitation from "../../../components/events/EventInvitation";
import AttendeesModal from "../../../components/events/AttendeesModal";

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  if (
    typeof timeStr === "string" &&
    timeStr.includes(":") &&
    !timeStr.includes("T")
  ) {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0]);
    const mins = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${mins} ${ampm}`;
  }
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchTerm, duration, eventType } = useEventsFilter();

  const [activeTab, setActiveTab] = useState("all");
  const [invitedSubTab, setInvitedSubTab] = useState("pending");

  const [createdEvents, setCreatedEvents] = useState([]);
  const [invitedEvents, setInvitedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [collaborationEvents, setCollaborationEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Modal states ───
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // ─── Today's Events ──────────────────────────────────
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayLoading, setTodayLoading] = useState(false);
  const [currentTodayIndex, setCurrentTodayIndex] = useState(0);
  const [todayTouchStartX, setTodayTouchStartX] = useState(0);

  // ─── Fetch Today's Events ──────────────────────────
  const fetchTodayEvents = useCallback(async () => {
    setTodayLoading(true);
    try {
      const res = await apiClient.get("/events/today");
      if (res.data.ok) {
        setTodayEvents(res.data.events || []);
        setCurrentTodayIndex(0);
      } else {
        setTodayEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch today's events:", err);
      setTodayEvents([]);
    } finally {
      setTodayLoading(false);
    }
  }, []);

  // ─── Fetch All Events ──────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        .toISOString()
        .slice(0, 10);
      const eventsRes = await apiClient.get(
        `/events?start=${start}&end=${end}`,
      );
      const allEventsData = eventsRes.data.events || [];

      const invitationsRes = await getInvitations({ response: "pending" });
      const pendingInvitations = invitationsRes.events || [];
      const pendingIds = new Set(pendingInvitations.map((ev) => ev.id));

      const currentUserId = user?.id;

      const created = allEventsData.filter(
        (ev) => ev.creatorId === currentUserId,
      );
      const invited = allEventsData.filter(
        (ev) => ev.creatorId !== currentUserId,
      );

      const createdWithResponse = created.map((ev) => ({
        ...ev,
        response: "accepted",
        isCreator: true,
      }));

      const invitedWithResponse = invited.map((ev) => ({
        ...ev,
        response: pendingIds.has(ev.id) ? "pending" : "accepted",
        isCreator: false,
      }));

      setCreatedEvents(createdWithResponse);
      setInvitedEvents(invitedWithResponse);
      setAllEvents([...createdWithResponse, ...invitedWithResponse]);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Unable to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ─── Fetch Collaboration Events ────────────────────
  const fetchCollaborationEvents = useCallback(async () => {
    try {
      const res = await apiClient.get("/events/collaborations");
      if (res.data.ok) {
        setCollaborationEvents(res.data.events || []);
      } else {
        setCollaborationEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch collaboration events:", err);
      setCollaborationEvents([]);
    }
  }, []);

  useEffect(() => {
    fetchTodayEvents();
    fetchEvents();
    fetchCollaborationEvents();
  }, [fetchTodayEvents, fetchEvents, fetchCollaborationEvents]);

  // ─── Filter events ──────────────────────────────────
  const filterEvents = useCallback(
    (events) => {
      let filtered = events;

      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter((ev) =>
          ev.title.toLowerCase().includes(lower),
        );
      }

      if (eventType !== "all") {
        filtered = filtered.filter((ev) => ev.type === eventType);
      }

      if (duration !== "all") {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        let startDate, endDate;
        if (duration === "day") {
          startDate = today;
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 1);
        } else if (duration === "week") {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startDate = startOfWeek;
          endDate = new Date(startOfWeek);
          endDate.setDate(endDate.getDate() + 7);
        } else if (duration === "month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        filtered = filtered.filter((ev) => {
          const evDate = new Date(ev.date || ev.start_datetime);
          return evDate >= startDate && evDate < endDate;
        });
      }

      return filtered;
    },
    [searchTerm, eventType, duration],
  );

  // ─── Handlers ────────────────────────────────────────
  const handleViewEvent = async (event) => {
    // If the event already has full details (from /events/today), use it
    if (event.creator && event.participants) {
      setSelectedEvent(event);
      setShowViewModal(true);
      return;
    }

    // Otherwise fetch full details
    try {
      const res = await apiClient.get(`/events/${event.id}`);
      if (res.data.ok) {
        setSelectedEvent(res.data.event);
        setShowViewModal(true);
      } else {
        // Fallback: use what we have
        setSelectedEvent(event);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setSelectedEvent(event);
      setShowViewModal(true);
    }
  };

  const handleEditEvent = (eventId) => {
    navigate(`/edit-event/${eventId}`);
  };

  const handleRespond = async (eventId, response) => {
    try {
      await apiClient.put(`/notifications/${eventId}/respond`, { response });
      fetchEvents();
      setShowInvitationModal(false);
    } catch (err) {
      console.error("Failed to respond:", err);
    }
  };

  const handleViewAttendees = async (event) => {
    // If the event already has participants (from /events/today), use it
    if (event.participants && event.participants.users) {
      setSelectedEvent(event);
      setShowAttendeesModal(true);
      return;
    }

    // Otherwise fetch full details
    try {
      const res = await apiClient.get(`/events/${event.id}`);
      if (res.data.ok) {
        setSelectedEvent(res.data.event);
        setShowAttendeesModal(true);
      } else {
        setSelectedEvent(event);
        setShowAttendeesModal(true);
      }
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setSelectedEvent(event);
      setShowAttendeesModal(true);
    }
  };

  // ─── Carousel handlers ──────────────────────────────
  const handleTodayPrev = () => {
    setCurrentTodayIndex((prev) =>
      prev === 0 ? todayEvents.length - 1 : prev - 1,
    );
  };

  const handleTodayNext = () => {
    setCurrentTodayIndex((prev) =>
      prev === todayEvents.length - 1 ? 0 : prev + 1,
    );
  };

  const handleTodayTouchStart = (e) => {
    setTodayTouchStartX(e.touches[0].clientX);
  };

  const handleTodayTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = todayTouchStartX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleTodayNext();
      else handleTodayPrev();
    }
  };

  // ─── Render Today Event Card ────────────────────────
  const renderTodayEventCard = (todayEvent) => {
    if (!todayEvent) return null;

    const creator = todayEvent.creator || {};
    const creatorName = creator.full_name || creator.username || "Unknown";
    const creatorPosition = creator.position || "";
    const creatorAffiliation = [creator.department, creator.office]
      .filter(Boolean)
      .join(" | ");
    const creatorSub = [creatorPosition, creatorAffiliation]
      .filter(Boolean)
      .join(" | ");

    const participants = todayEvent.participants || {};
    const depts = participants.departments || [];
    const users = participants.users || [];

    return (
      <div className={styles.featuredEventSection}>
        <div className={styles.featuredContainer}>
          <div className={styles.featuredCard}>
            <div className={styles.badgesStatus}>
              <div className={styles.badgeRow}>
                <div className={styles.badgePill}>
                  {todayEvent.hierarchy || "Unknown Hierarchy"}
                </div>
                <div className={styles.badgePill}>
                  {todayEvent.method || "Unknown Method"}
                </div>
                <div className={styles.badgePill}>
                  {todayEvent.visibility || "Unknown Event Visibility"}
                </div>
                <div className={styles.badgePill}>
                  {todayEvent.event_type || "Unknown Event Type"}
                </div>
              </div>

              <div className={styles.heading2}>
                <div className={styles.featuredTitle}>{todayEvent.title}</div>
              </div>
            </div>

            <div className={styles.featuredCardContent}>
              <div className={styles.titleDescription}>
                <div className={styles.descriptionText}>
                  {todayEvent.description}
                </div>
              </div>

              <div className={styles.container8}>
                <div className={styles.whenWhereGroup}>
                  <div className={styles.sectionHeader}>
                    <EventNoteOutlinedIcon fontSize="small" />
                    <div className={styles.heading4}>
                      <div className={styles.text7}>WHEN &amp; WHERE</div>
                    </div>
                  </div>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>DATE RANGE</div>
                      <div className={styles.infoValue}>
                        {formatDate(todayEvent.start_datetime)} —{" "}
                        {formatDate(todayEvent.end_datetime)}
                      </div>
                    </div>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>TIME</div>
                      <div className={styles.infoValue}>
                        {formatTime(todayEvent.start_datetime)} —{" "}
                        {formatTime(todayEvent.end_datetime)}
                      </div>
                    </div>
                    <div className={styles.infoBlock}>
                      <div className={styles.infoLabel}>LOCATION</div>
                      <div className={styles.infoValue}>
                        {todayEvent.venue || todayEvent.location || "Online"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.organizerSection}>
                  <div className={styles.sectionHeader}>
                    <PersonOutlinedIcon fontSize="small" />
                    <div className={styles.heading4}>
                      <div className={styles.text7}>ORGANIZER</div>
                    </div>
                  </div>
                  <div className={styles.organizerRow}>
                    <div className={styles.organizerAvatar}>
                      {getInitials(creatorName)}
                    </div>
                    <div className={styles.organizerDetails}>
                      <div className={styles.organizerName}>{creatorName}</div>
                      <div className={styles.organizerTitle}>
                        {creatorSub || "Organizer"}
                      </div>
                    </div>
                  </div>
                  <div className={styles.participatingBlock}>
                    <div className={styles.infoLabel}>
                      PARTICIPATING DEPARTMENTS
                    </div>
                    <div className={styles.deptBadges}>
                      {depts.slice(0, 4).map((dept) => (
                        <div key={dept} className={styles.deptBadge}>
                          {dept}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.audienceSection}>
                  <div className={styles.sectionHeader}>
                    <GroupsOutlinedIcon fontSize="small" />
                    <div className={styles.heading4}>
                      <div className={styles.text7}>AUDIENCE</div>
                    </div>
                  </div>
                  <div className={styles.audienceRow}>
                    <div className={styles.attendeeStack}>
                      {users.slice(0, 4).map((u) => {
                        const name =
                          u.full_name || u.username || u.email || "Unknown";
                        return (
                          <div
                            key={u.id}
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
                        ? `${users[0].full_name || users[0].username || users[0].email} and ${users.length - 1} others attending`
                        : "No attendees yet"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.viewAttendeesButton}
                    onClick={() => handleViewAttendees(todayEvent)}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                    View Attendees
                  </button>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.viewEventButton}
                  onClick={() => handleViewEvent(todayEvent)}
                >
                  View Event Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Today's Events carousel ─────────────────
  const renderTodayEventsCarousel = () => {
    if (todayLoading)
      return <p className={styles.noData}>Loading today's event...</p>;
    if (todayEvents.length === 0)
      return <p className={styles.noData}>No events today</p>;

    return (
      <div
        className={styles.carouselWrapper}
        onTouchStart={handleTodayTouchStart}
        onTouchEnd={handleTodayTouchEnd}
      >
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentTodayIndex * 100}%)` }}
        >
          {todayEvents.map((ev) => (
            <div key={ev.id} className={styles.carouselSlide}>
              {renderTodayEventCard(ev)}
            </div>
          ))}
        </div>

        {todayEvents.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
              onClick={handleTodayPrev}
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
              onClick={handleTodayNext}
            >
              <FiChevronRight size={20} />
            </button>
            <div className={styles.dotsContainer}>
              {todayEvents.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${
                    idx === currentTodayIndex ? styles.dotActive : ""
                  }`}
                  onClick={() => setCurrentTodayIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── Render Event Card (list) ────────────────────────
  const renderEventCard = (event, showActions = true) => {
    const isPending = event.response === "pending";
    const isCreator = event.isCreator || false;
    const isCollaborator =
      !isCreator && !isPending && event.response === "accepted";

    let locationDisplay = "";
    if (event.method === "online") {
      locationDisplay = "Online";
    } else {
      locationDisplay = event.venue || event.location || "";
    }

    return (
      <div
        key={event.id}
        className={styles.eventCard}
        style={{ borderLeftColor: event.color || "#800000" }}
      >
        <div className={styles.cardTitleLarge}>{event.title}</div>

        <div className={styles.cardMetaRow}>
          <span className={styles.metaBadge}>{event.hierarchy || "Local"}</span>
          <span className={styles.metaBadge}>
            {event.event_type || "Event"}
          </span>
        </div>

        <div className={styles.cardDetails}>
          <span>
            <FiCalendar size={14} />{" "}
            {formatDate(event.date || event.start_datetime)}
          </span>
          <span>
            <FiClock size={14} />{" "}
            {formatTime(event.time || event.start_datetime)} -{" "}
            {formatTime(event.endTime || event.end_datetime)}
          </span>
          <span>
            <FiMapPin size={14} /> {locationDisplay}
          </span>
          {event.creatorName && (
            <span>
              <FiUsers size={14} /> {event.creatorName}
            </span>
          )}
        </div>

        <div className={styles.cardBadges}>
          {getVisibilityBadge(event.type || event.visibility)}
          <span className={styles.methodBadge}>
            {event.method === "online" ? (
              <FiLink size={12} />
            ) : (
              <FiGlobe size={12} />
            )}
            {getMethodLabel(event.method)}
          </span>
          {event.response && getStatusBadge(event.response)}
        </div>

        {showActions && (
          <div className={styles.cardActions}>
            {/* ── Created events ── */}
            {isCreator && (
              <>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEditEvent(event.id)}
                >
                  <FiEdit size={14} /> Edit
                </button>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewEvent(event)}
                >
                  <FiEye size={14} /> View
                </button>
              </>
            )}

            {/* ── Collaboration events ── */}
            {isCollaborator && (
              <>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEditEvent(event.id)}
                >
                  <FiEdit size={14} /> Edit
                </button>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewEvent(event)}
                >
                  <FiEye size={14} /> View
                </button>
              </>
            )}

            {/* ── Invited & Accepted (View only) ── */}
            {!isCreator &&
              !isPending &&
              !isCollaborator &&
              event.response === "accepted" && (
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewEvent(event)}
                >
                  <FiEye size={14} /> View
                </button>
              )}

            {/* ── Pending invitation ── */}
            {isPending && (
              <>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleRespond(event.id, "accepted")}
                >
                  <FiCheckCircle size={14} /> Accept
                </button>
                <button
                  className={styles.declineBtn}
                  onClick={() => handleRespond(event.id, "declined")}
                >
                  <FiXCircle size={14} /> Decline
                </button>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleViewEvent(event)}
                >
                  <FiEye size={14} /> View
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Badge helpers ──────────────────────────────────
  const getVisibilityBadge = (type) => {
    const map = {
      campus: { class: styles.badgeCampus, label: "Campus" },
      department: { class: styles.badgeDepartment, label: "Department" },
      private: { class: styles.badgePrivate, label: "Private" },
    };
    const s = map[type] || map.private;
    return <span className={s.class}>{s.label}</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      accepted: {
        class: styles.badgeAccepted,
        icon: FiCheckCircle,
        label: "Accepted",
      },
      declined: {
        class: styles.badgeDeclined,
        icon: FiXCircle,
        label: "Declined",
      },
      pending: {
        class: styles.badgePending,
        icon: FiClockIcon,
        label: "Pending",
      },
    };
    const s = map[status] || map.pending;
    return (
      <span className={s.class}>
        <s.icon size={12} /> {s.label}
      </span>
    );
  };

  const getMethodLabel = (method) => {
    return method === "online" ? "Online" : "Face-to-face";
  };

  // ─── Render Content ──────────────────────────────────
  const renderContent = () => {
    if (loading) return <p className={styles.loading}>Loading events...</p>;
    if (error) return <p className={styles.error}>{error}</p>;

    switch (activeTab) {
      case "all": {
        const filteredAll = filterEvents(allEvents);
        return (
          <>
            <div className={styles.todaySection}>
              <div className={styles.todayHeader}>
                <h2>Today's Event</h2>
                <span className={styles.todayDate}>
                  {formatDate(new Date())}
                </span>
              </div>
              <div className={styles.todayContent}>
                {renderTodayEventsCarousel()}
              </div>
            </div>

            <div className={styles.eventList}>
              {filteredAll.length === 0 ? (
                <div className={styles.emptyState}>No events found.</div>
              ) : (
                filteredAll.map((ev) => renderEventCard(ev, false))
              )}
            </div>
          </>
        );
      }

      case "invited": {
        let invitedFiltered = filterEvents(invitedEvents);
        if (invitedSubTab === "pending") {
          invitedFiltered = invitedFiltered.filter(
            (ev) => ev.response === "pending",
          );
        } else if (invitedSubTab === "declined") {
          invitedFiltered = invitedFiltered.filter(
            (ev) => ev.response === "declined",
          );
        }
        return (
          <div className={styles.invitedContainer}>
            <div className={styles.invitedTabs}>
              <button
                className={`${styles.invitedTab} ${invitedSubTab === "pending" ? styles.activeInvitedTab : ""}`}
                onClick={() => setInvitedSubTab("pending")}
              >
                Pending (
                {invitedEvents.filter((ev) => ev.response === "pending").length}
                )
              </button>
              <button
                className={`${styles.invitedTab} ${invitedSubTab === "all" ? styles.activeInvitedTab : ""}`}
                onClick={() => setInvitedSubTab("all")}
              >
                All ({invitedEvents.length})
              </button>
              <button
                className={`${styles.invitedTab} ${invitedSubTab === "declined" ? styles.activeInvitedTab : ""}`}
                onClick={() => setInvitedSubTab("declined")}
              >
                Declined (
                {
                  invitedEvents.filter((ev) => ev.response === "declined")
                    .length
                }
                )
              </button>
            </div>
            <div className={styles.eventList}>
              {invitedFiltered.length === 0 ? (
                <div className={styles.emptyState}>
                  {invitedSubTab === "pending"
                    ? "No pending invitations."
                    : invitedSubTab === "declined"
                      ? "No declined invitations."
                      : "No invited events."}
                </div>
              ) : (
                invitedFiltered.map((ev) => renderEventCard(ev, true))
              )}
            </div>
          </div>
        );
      }

      case "created": {
        const filteredCreated = filterEvents(createdEvents);
        return (
          <div className={styles.eventList}>
            {filteredCreated.length === 0 ? (
              <div className={styles.emptyState}>
                <FiPlus size={24} />
                <span>You haven't created any events yet.</span>
                <button
                  className={styles.createBtn}
                  onClick={() => navigate("/create-event")}
                >
                  Create Event
                </button>
              </div>
            ) : (
              filteredCreated.map((ev) => renderEventCard(ev, true))
            )}
          </div>
        );
      }

      case "collaboration": {
        const filteredCollaboration = filterEvents(collaborationEvents);
        return (
          <div className={styles.eventList}>
            {filteredCollaboration.length === 0 ? (
              <div className={styles.emptyState}>
                <FiUsers size={24} />
                <span>You are not a collaborator on any events.</span>
              </div>
            ) : (
              filteredCollaboration.map((ev) => renderEventCard(ev, true))
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ─── Main Render ────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <FiEye size={16} /> All Events
        </button>
        <button
          className={`${styles.tab} ${activeTab === "invited" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("invited")}
        >
          <FiCalendar size={16} /> Invited
        </button>
        <button
          className={`${styles.tab} ${activeTab === "created" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("created")}
        >
          <FiEdit size={16} /> Created
        </button>
        <button
          className={`${styles.tab} ${activeTab === "collaboration" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("collaboration")}
        >
          <FiUsers size={16} /> Collaboration
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>

      {/* ─── Modals ─── */}
      <EventCardView
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      <EventInvitation
        isOpen={showInvitationModal}
        onClose={() => {
          setShowInvitationModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onRespond={handleRespond}
      />

      <AttendeesModal
        isOpen={showAttendeesModal}
        onClose={() => {
          setShowAttendeesModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}
