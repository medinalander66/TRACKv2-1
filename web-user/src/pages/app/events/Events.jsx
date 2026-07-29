import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
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
} from "react-icons/fi";
import styles from "./Events.module.css";

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("created");
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
      // ── Fetch all events (last month to next 2 months) ──
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
        .toISOString()
        .slice(0, 10);
      const eventsRes = await apiClient.get(`/events?start=${start}&end=${end}`);
      const allEventsData = eventsRes.data.events || [];

      // ── Fetch pending invitations with full event details ──
      const invitationsRes = await getInvitations({ response: "pending" });
      const pendingInvitations = invitationsRes.events || [];
      const pendingIds = new Set(pendingInvitations.map((ev) => ev.id));

      // ── Get current user's ID from auth context ──
      const currentUserId = user?.id;

      // ── Separate events based on creator_id (not creatorName) ──
      // Since the backend doesn't return creator_id, we need to match by creatorName
      // But we can use the fact that the user's email/username might be in creatorName
      // Better approach: fetch user's own events from a dedicated endpoint or use invites
      // For now, we'll use a fallback: if creatorName matches user's email or username

      const userIdentifier = user?.username || user?.email?.split("@")[0] || "";

      const created = allEventsData.filter(
        (ev) => ev.creatorName === userIdentifier
      );

      // ── Invited events: events the user is invited to (not created by them) ──
      const invited = allEventsData.filter(
        (ev) => ev.creatorName !== userIdentifier
      );

      // ── Mark response status ──
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

  // ─── Handlers ─────────────────────────────────────────
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
    if (!dateStr) return "TBD";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "TBD";
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

  // ─── Render Event Card ────────────────────────────────
  const renderEventCard = (event, showActions = true) => {
    const isPending = event.response === "pending";
    const isCreator = event.isCreator || false;

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
            <FiCalendar size={14} /> {formatDate(event.date || event.start_datetime)}
          </span>
          <span>
            <FiClock size={14} />{" "}
            {formatTime(event.time || event.start_datetime)} -{" "}
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
              createdEvents.map((ev) => renderEventCard(ev, true))
            )}
          </div>
        );

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
                <div className={styles.emptyState}>
                  {invitedSubTab === "pending"
                    ? "No pending invitations."
                    : "No invited events."}
                </div>
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
              <div className={styles.emptyState}>No events found.</div>
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

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
}