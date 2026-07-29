import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  FiChevronRight,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
} from "react-icons/fi";
import styles from "./Events.module.css";

export default function Events() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("created"); // created | collaboration | invited | all
  const [invitedSubTab, setInvitedSubTab] = useState("pending"); // pending | all

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
      // Fetch all events the user is involved in (created + invited)
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

      // Fetch pending invitations
      const invitationsRes = await getInvitations({ response: "pending" });
      const pendingInvitations = invitationsRes.events || [];

      // Separate events
      const created = allEventsData.filter(
        (ev) => ev.creatorName === "You" || ev.isCreator,
      );
      const invited = allEventsData.filter((ev) => !ev.isCreator);

      setCreatedEvents(created);
      setInvitedEvents(invited);
      setAllEvents(allEventsData);
      setCollaborationEvents([]); // Placeholder for now
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Unable to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ─── Handle Event Click ──────────────────────────────
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
      // Refresh data
      fetchEvents();
      setShowInvitationModal(false);
    } catch (err) {
      console.error("Failed to respond:", err);
    }
  };

  // ─── Format helpers ──────────────────────────────────
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

  // ─── Render Event Card ────────────────────────────────
  const renderEventCard = (event, showActions = true) => {
    const isPending = event.response === "pending";
    const isCreator = event.creatorName === "You" || event.isCreator;

    return (
      <div key={event.id} className={styles.eventCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span className={styles.eventTitle}>{event.title}</span>
            {getVisibilityBadge(event.type || event.visibility)}
          </div>
          {event.response && (
            <div className={styles.cardStatus}>
              {getStatusBadge(event.response)}
            </div>
          )}
        </div>

        <div className={styles.cardDetails}>
          <span>
            <FiCalendar size={14} />{" "}
            {formatDate(event.date || event.start_datetime)}
          </span>
          <span>
            <FiClock size={14} />{" "}
            {formatTime(event.date || event.start_datetime)} -{" "}
            {formatTime(event.endTime || event.end_datetime)}
          </span>
          <span>
            <FiMapPin size={14} /> {event.location || "Online"}
          </span>
          {event.creatorName && (
            <span>
              <FiUsers size={14} /> Created by: {event.creatorName}
            </span>
          )}
        </div>

        {showActions && isCreator && (
          <div className={styles.cardActions}>
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
          </div>
        )}

        {showActions && !isCreator && isPending && (
          <div className={styles.cardActions}>
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
          </div>
        )}

        {showActions && !isCreator && !isPending && (
          <div className={styles.cardActions}>
            <button
              className={styles.viewBtn}
              onClick={() => handleEventClick(event)}
            >
              <FiEye size={14} /> View
            </button>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.eventHierarchy}>
            {event.hierarchy || "Local"}
          </span>
          <span className={styles.eventType}>
            {event.event_type || "Event"}
          </span>
        </div>
      </div>
    );
  };

  // ─── Render Content ──────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return <p className={styles.loading}>Loading events...</p>;
    }

    if (error) {
      return <p className={styles.error}>{error}</p>;
    }

    switch (activeTab) {
      case "created":
        return (
          <div className={styles.eventList}>
            {createdEvents.length === 0 ? (
              <p className={styles.emptyState}>
                <FiPlus size={24} />
                You haven't created any events yet.
                <button
                  className={styles.createBtn}
                  onClick={() => navigate("/create-event")}
                >
                  Create Event
                </button>
              </p>
            ) : (
              createdEvents.map((ev) => renderEventCard(ev, true))
            )}
          </div>
        );

      case "collaboration":
        return (
          <div className={styles.eventList}>
            <p className={styles.emptyState}>
              <FiUsers size={24} />
              Collaboration events will appear here.
              <span className={styles.emptySubtext}>Coming soon!</span>
            </p>
          </div>
        );

      case "invited":
        const filteredInvited =
          invitedSubTab === "pending"
            ? invitedEvents.filter((ev) => ev.response === "pending")
            : invitedEvents;

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
            </div>
            <div className={styles.eventList}>
              {filteredInvited.length === 0 ? (
                <p className={styles.emptyState}>
                  {invitedSubTab === "pending"
                    ? "No pending invitations."
                    : "No invited events."}
                </p>
              ) : (
                filteredInvited.map((ev) => renderEventCard(ev, true))
              )}
            </div>
          </div>
        );

      case "all":
        return (
          <div className={styles.eventList}>
            {allEvents.length === 0 ? (
              <p className={styles.emptyState}>No events found.</p>
            ) : (
              allEvents.map((ev) => renderEventCard(ev, false))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Main Render ──────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Events</h1>
        <button
          className={styles.createBtn}
          onClick={() => navigate("/create-event")}
        >
          <FiPlus size={18} /> New Event
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
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
        <button
          className={`${styles.tab} ${activeTab === "invited" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("invited")}
        >
          <FiCalendar size={16} /> Invited
        </button>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <FiEye size={16} /> All Events
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}
