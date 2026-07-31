import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../context/CalendarContext";
import { useEventsFilter } from "../../context/EventsFilterContext";
import apiClient from "../../api/client";
import styles from "./Menu.module.css";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MENU_CONTENT = {
  home: {
    title: "Home",
    description: "You are currently on the Home screen",
    icon: "🏠",
  },
  venues: {
    title: "Venues",
    description: "You are currently on the Venues screen",
    icon: "📍",
  },
  calendar: {
    title: "Calendar",
    description: "You are currently on the Calendar screen",
    icon: "📅",
  },
  events: {
    title: "Events",
    description: "You are currently on the Events screen",
    icon: "📋",
  },
  tasks: {
    title: "Tasks",
    description: "You are currently on the Tasks screen",
    icon: "✅",
  },
};

/* --- Simple line icons --- */
const IconDay = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="12" y1="9" x2="12" y2="20" />
  </svg>
);

const IconWeek = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="2" y="5" width="20" height="15" rx="2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <line x1="7" y1="9" x2="7" y2="20" />
    <line x1="12" y1="9" x2="12" y2="20" />
    <line x1="17" y1="9" x2="17" y2="20" />
  </svg>
);

const IconMonth = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="9" x2="9" y2="21" />
    <line x1="15" y1="9" x2="15" y2="21" />
    <line x1="3" y1="14.5" x2="21" y2="14.5" />
  </svg>
);

const IconAll = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const IconCampus = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M3 21h18" />
    <path d="M5 21V9l7-5 7 5v12" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const IconDepartment = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconPrivate = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const generateMonthGrid = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = -firstDayOfMonth;
  const totalCells = 42;
  const grid = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 + i + startOffset);
    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isCurrentMonth = m === month && y === year;
    grid.push({ day: d, dateStr, isCurrentMonth });
  }
  return grid;
};

export default function Menu({ activePath, onCloseDrawer }) {
  const navigate = useNavigate();

  // Calendar context
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    duration,
    setDuration,
    activeFilters,
    setActiveFilters,
  } = useCalendar();

  // Events filter context
  const {
    searchTerm: eventsSearchTerm,
    setSearchTerm: setEventsSearchTerm,
    duration: eventsDuration,
    setDuration: setEventsDuration,
    eventType,
    setEventType,
  } = useEventsFilter();

  // --- Calendar search ---
  const [calendarSearchTerm, setCalendarSearchTerm] = useState("");
  const [allEventsForSearch, setAllEventsForSearch] = useState([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear() - 2, 0, 1)
          .toISOString()
          .slice(0, 10);
        const end = new Date(now.getFullYear() + 2, 11, 31)
          .toISOString()
          .slice(0, 10);
        const res = await apiClient.get("/events", {
          params: { start, end },
        });
        setAllEventsForSearch(res.data.events || []);
      } catch (err) {
        console.error("Failed to fetch events for search:", err);
      }
    };
    fetchAllEvents();
  }, []);

  const calendarSearchResults = useMemo(() => {
    if (!calendarSearchTerm.trim()) return [];
    const lower = calendarSearchTerm.toLowerCase();
    return allEventsForSearch
      .filter((ev) => ev.title.toLowerCase().includes(lower))
      .slice(0, 10);
  }, [calendarSearchTerm, allEventsForSearch]);

  const handleCalendarSelectResult = (event) => {
    setSelectedDate(event.date);
    const dateParts = event.date.split("-");
    const newDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
    );
    setCurrentDate(newDate);
    setCalendarSearchTerm("");
    onCloseDrawer();
  };

  // --- Determine active menu key ---
  let activeKey = "home";
  if (activePath.includes("/venues")) activeKey = "venues";
  else if (activePath.includes("/calendar")) activeKey = "calendar";
  else if (activePath.includes("/events")) activeKey = "events";
  else if (activePath.includes("/tasks")) activeKey = "tasks";

  const menu = MENU_CONTENT[activeKey];

  // --- Calendar specific logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthGrid = useMemo(
    () => generateMonthGrid(year, month),
    [year, month],
  );

  // Arrow functions - NO onCloseDrawer() here
  const goToPrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goToNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    onCloseDrawer();
  };

  const handleCreateEvent = () => {
    onCloseDrawer();
    navigate("/create-event");
  };

  const handleViewChange = (view) => {
    setDuration(view);
    onCloseDrawer();
  };

  const handleFilterToggle = (filter) => {
    if (filter === "all") {
      setActiveFilters([]);
    } else {
      setActiveFilters((prev) =>
        prev.includes(filter)
          ? prev.filter((f) => f !== filter)
          : [...prev, filter],
      );
    }
    onCloseDrawer();
  };

  const isFilterActive = (filter) => {
    if (filter === "all") return activeFilters.length === 0;
    return activeFilters.includes(filter);
  };

  const durationOptions = [
    { key: "day", label: "Day", icon: <IconDay /> },
    { key: "week", label: "Week", icon: <IconWeek /> },
    { key: "month", label: "Month", icon: <IconMonth /> },
  ];

  const filterOptions = [
    { key: "all", label: "All", icon: <IconAll /> },
    { key: "campus", label: "Campus", icon: <IconCampus /> },
    { key: "department", label: "Department", icon: <IconDepartment /> },
    { key: "personal", label: "Private", icon: <IconPrivate /> },
  ];

  // --- Events specific options ---
  const eventsDurationOptions = [
    { key: "all", label: "All", icon: <IconAll /> },
    { key: "day", label: "Today", icon: <IconDay /> },
    { key: "week", label: "This Week", icon: <IconWeek /> },
    { key: "month", label: "This Month", icon: <IconMonth /> },
  ];

  const eventsTypeOptions = [
    { key: "all", label: "All", icon: <IconAll /> },
    { key: "campus", label: "Campus", icon: <IconCampus /> },
    { key: "department", label: "Department", icon: <IconDepartment /> },
    { key: "personal", label: "Private", icon: <IconPrivate /> },
  ];

  // --- Handlers for events filters ---
  const handleEventsDurationChange = (key) => {
    setEventsDuration(key);
    onCloseDrawer();
  };

  const handleEventsTypeChange = (key) => {
    setEventType(key);
    onCloseDrawer();
  };

  return (
    <div className={styles.menuContainer}>
      {activeKey === "calendar" && (
        <div className={styles.calendarMenuContent}>
          {/* Search Field */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search events..."
              value={calendarSearchTerm}
              onChange={(e) => setCalendarSearchTerm(e.target.value)}
            />
            {calendarSearchTerm && calendarSearchResults.length > 0 && (
              <div className={styles.searchResults}>
                {calendarSearchResults.map((ev) => (
                  <div
                    key={ev.id}
                    className={styles.searchResultItem}
                    onClick={() => handleCalendarSelectResult(ev)}
                  >
                    <div className={styles.resultTitle}>{ev.title}</div>
                    <div className={styles.resultDate}>{ev.date}</div>
                  </div>
                ))}
              </div>
            )}
            {calendarSearchTerm && calendarSearchResults.length === 0 && (
              <div className={styles.searchNoResults}>No events found</div>
            )}
          </div>

          {/* Create Event */}
          <button className={styles.createEventBtn} onClick={handleCreateEvent}>
            + Create Event
          </button>

          {/* Mini Calendar */}
          <div className={styles.miniCalendar}>
            <div className={styles.miniHeader}>
              <button onClick={goToPrevMonth} className={styles.miniNav}>
                ‹
              </button>
              <span className={styles.miniMonthYear}>
                {MONTH_NAMES[month]} {year}
              </span>
              <button onClick={goToNextMonth} className={styles.miniNav}>
                ›
              </button>
            </div>
            <div className={styles.miniGrid}>
              {DAY_NAMES.map((day) => (
                <div key={day} className={styles.miniDayHeader}>
                  {day.slice(0, 2)}
                </div>
              ))}
              {monthGrid.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                return (
                  <button
                    key={idx}
                    className={`${styles.miniDayCell} ${
                      !cell.isCurrentMonth ? styles.miniOtherMonth : ""
                    } ${isSelected ? styles.miniSelected : ""}`}
                    onClick={() => handleDateClick(cell.dateStr)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Switcher */}
          <div className={styles.listGroup}>
            {durationOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.listBtn} ${
                  duration === opt.key ? styles.listBtnActive : ""
                }`}
                onClick={() => handleViewChange(opt.key)}
              >
                <span className={styles.listIcon}>{opt.icon}</span>
                <span className={styles.listLabel}>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.listDivider} />

          {/* Filter Buttons */}
          <div className={styles.listGroup}>
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.listBtn} ${
                  isFilterActive(opt.key) ? styles.listBtnActive : ""
                }`}
                onClick={() => handleFilterToggle(opt.key)}
              >
                <span className={styles.listIcon}>{opt.icon}</span>
                <span className={styles.listLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeKey === "events" && (
        <div className={styles.eventsMenuContent}>
          {/* Search Field */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search events..."
              value={eventsSearchTerm}
              onChange={(e) => setEventsSearchTerm(e.target.value)}
            />
          </div>

          {/* Create Event */}
          <button className={styles.createEventBtn} onClick={handleCreateEvent}>
            + Create Event
          </button>

          {/* Duration Filters */}
          <div className={styles.listGroup}>
            {eventsDurationOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.listBtn} ${
                  eventsDuration === opt.key ? styles.listBtnActive : ""
                }`}
                onClick={() => handleEventsDurationChange(opt.key)}
              >
                <span className={styles.listIcon}>{opt.icon}</span>
                <span className={styles.listLabel}>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.listDivider} />

          {/* Event Type Filters */}
          <div className={styles.listGroup}>
            {eventsTypeOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.listBtn} ${
                  eventType === opt.key ? styles.listBtnActive : ""
                }`}
                onClick={() => handleEventsTypeChange(opt.key)}
              >
                <span className={styles.listIcon}>{opt.icon}</span>
                <span className={styles.listLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeKey !== "calendar" && activeKey !== "events" && (
        <div className={styles.menuPlaceholder}>
          <p>
            Menu content for <strong>{menu.title}</strong> will be placed here.
          </p>
        </div>
      )}
    </div>
  );
}
