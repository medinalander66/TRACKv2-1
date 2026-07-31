import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "react-icons/fi";
import styles from "./Events.module.css";

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

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────
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

      // Invitations (pending)
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
      setCollaborationEvents([]);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Unable to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowInvitationModal(true);
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

  // ─── Format helpers ──────────────────────────────────
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
    if (timeStr.includes(":")) {
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0]);
      const mins = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${mins} ${ampm}`;
    }
    return timeStr;
  };

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

  // ─── Render Event Card ──────────────────────────────
  const renderEventCard = (event, showActions = true) => {
    const isPending = event.response === "pending";
    const isCreator = event.isCreator || false;

    let locationDisplay = "";
    if (event.method === "online") {
      locationDisplay = "Online";
    } else {
      locationDisplay =
        event.venue || event.location || event.locationDisplay || "";
    }

    return (
      <div
        key={event.id}
        className={styles.eventCard}
        style={{ borderLeftColor: event.color || "#800000" }}
      >
        {/* Title */}
        <div className={styles.cardTitleLarge}>{event.title}</div>

        {/* Hierarchy & Event Type */}
        <div className={styles.cardMetaRow}>
          <span className={styles.metaBadge}>{event.hierarchy || "Local"}</span>
          <span className={styles.metaBadge}>
            {event.event_type || "Event"}
          </span>
        </div>

        {/* Details */}
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

        {/* Badges */}
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

        {/* Actions */}
        {showActions && (
          <div className={styles.cardActions}>
            {isCreator ? (
              <>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEditEvent(event.id)}
                >
                  <FiEdit size={14} /> Edit
                </button>
                <button
                  className={styles.viewBtn}
                  onClick={() => handleEventClick(event)}
                >
                  <FiEye size={14} /> View
                </button>
              </>
            ) : isPending ? (
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
                  onClick={() => handleEventClick(event)}
                >
                  <FiEye size={14} /> View
                </button>
              </>
            ) : (
              <button
                className={styles.viewBtn}
                onClick={() => handleEventClick(event)}
              >
                <FiEye size={14} /> View
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Render Content ──────────────────────────────────
  const renderContent = () => {
    if (loading) return <p className={styles.loading}>Loading events...</p>;
    if (error) return <p className={styles.error}>{error}</p>;

    switch (activeTab) {
      case "all": {
        const filteredAll = filterEvents(allEvents);
        return (
          <div className={styles.eventList}>
            {filteredAll.length === 0 ? (
              <div className={styles.emptyState}>No events found.</div>
            ) : (
              filteredAll.map((ev) => renderEventCard(ev, false))
            )}
          </div>
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

      case "collaboration":
        return (
          <div className={styles.eventList}>
            <div className={styles.emptyState}>
              <FiUsers size={24} />
              <span>Collaboration events will appear here.</span>
              <span className={styles.emptySubtext}>Coming soon!</span>
            </div>
          </div>
        );

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
    </div>
  );
}
