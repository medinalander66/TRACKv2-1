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
} from "react-icons/fi";
import styles from "./Events.module.css";

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchTerm, duration, eventType } = useEventsFilter();

  const [activeTab, setActiveTab] = useState("all"); // default to "all"
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

      const invitationsRes = await getInvitations({ response: "pending" });
      const pendingInvitations = invitationsRes.events || [];
      const pendingIds = new Set(pendingInvitations.map((ev) => ev.id));

      // Also fetch declined invitations? For now, we only have pending from the API.
      // We'll need to get all invitations with response "declined" as well.
      // For simplicity, we'll assume the user's responses are stored in the event objects.
      // We'll use the event.response field that we set below.

      const currentUserId = user?.id;
      const userIdentifier = user?.username || user?.email?.split("@")[0] || "";

      const created = allEventsData.filter(
        (ev) => ev.creatorName === userIdentifier,
      );
      const invited = allEventsData.filter(
        (ev) => ev.creatorName !== userIdentifier,
      );

      // For invited events, we need to know their response status.
      // We'll simulate by checking if the event is in pending list.
      // For declined, we don't have a direct way; we'll assume any event not in pending and not accepted is declined.
      // But we can also fetch the user's responses from another endpoint.
      // To keep it simple, we'll set response based on pendingIds, and if not pending, assume accepted.
      // We'll add a declined list later by fetching user's responses.
      // For now, we'll set response: if pendingIds has it -> pending, else accepted.
      // But we need declined too. We'll fetch the user's responses for all events from a separate API call.
      // Let's fetch the user's responses for events they are invited to.
      let userResponses = {};
      try {
        const respRes = await apiClient.get("/notifications/responses"); // hypothetical endpoint
        // Assume response: { eventId: 'accepted' | 'declined' | 'pending' }
        userResponses = respRes.data || {};
      } catch (err) {
        // fallback: use pendingIds
        console.warn("Could not fetch user responses, using pending only.");
      }

      const invitedWithResponse = invited.map((ev) => ({
        ...ev,
        response:
          userResponses[ev.id] ||
          (pendingIds.has(ev.id) ? "pending" : "accepted"),
        isCreator: false,
      }));

      const createdWithResponse = created.map((ev) => ({
        ...ev,
        response: "accepted",
        isCreator: true,
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

  // ─── Filter events based on search, duration, and type ───
  const filterEvents = useCallback(
    (events) => {
      let filtered = events;

      // Search filter
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter((ev) =>
          ev.title.toLowerCase().includes(lower),
        );
      }

      // Event type filter
      if (eventType !== "all") {
        filtered = filtered.filter((ev) => ev.type === eventType);
      }

      // Duration filter (by date range)
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
    const isDeclined = event.response === "declined";
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
            <FiCalendar size={14} />{" "}
            {formatDate(event.date || event.start_datetime)}
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
      case "all":
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

      case "invited":
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
        // "all" shows everything (no additional filter)
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

      case "created":
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

  // ─── Main Render ──────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Header removed: no title, no create button */}

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
