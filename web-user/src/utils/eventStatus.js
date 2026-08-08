export function getEventStatus(event) {
  const now = new Date();
  const start = event.start_datetime
    ? new Date(event.start_datetime)
    : new Date(`${event.date}T${event.time || "00:00"}`);
  const end = event.end_datetime
    ? new Date(event.end_datetime)
    : new Date(`${event.date}T${event.endTime || "23:59"}`);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "past";
}

export const EVENT_STATUS_CONFIG = {
  upcoming: { label: "Upcoming", className: "statusUpcoming" },
  ongoing: { label: "Ongoing", className: "statusOngoing" },
  past: { label: "Past Event", className: "statusPast" },
};

export const EVENT_STATUS_SORT_ORDER = { ongoing: 0, upcoming: 1, past: 2 };

export function isMissedInvitation(event) {
  return event.response === "pending" && getEventStatus(event) === "past";
}