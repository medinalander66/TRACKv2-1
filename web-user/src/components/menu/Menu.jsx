import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../context/CalendarContext";
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

export default function Menu({ activePath }) {
  const navigate = useNavigate();
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    activeFilters,
    setActiveFilters,
  } = useCalendar();

  // Determine which menu to show based on active path
  let activeKey = "home";
  if (activePath.includes("/venues")) activeKey = "venues";
  else if (activePath.includes("/calendar")) activeKey = "calendar";
  else if (activePath.includes("/events")) activeKey = "events";
  else if (activePath.includes("/tasks")) activeKey = "tasks";

  const menu = MENU_CONTENT[activeKey];

  // Mini calendar for calendar screen
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthGrid = useMemo(
    () => generateMonthGrid(year, month),
    [year, month],
  );

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
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    if (value === "all") {
      setActiveFilters([]);
    } else {
      setActiveFilters([value]);
    }
  };

  const handleCreateEvent = () => {
    navigate("/create-event");
  };

  return (
    <div className={styles.menuContainer}>
      <div className={styles.menuIcon}>{menu.icon}</div>
      <h3 className={styles.menuTitle}>{menu.title} Menu</h3>
      <p className={styles.menuDescription}>{menu.description}</p>
      <div className={styles.menuDivider} />

      {/* Calendar-specific content */}
      {activeKey === "calendar" && (
        <div className={styles.calendarMenuContent}>
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

          {/* Filter Dropdown */}
          <div className={styles.filterSection}>
            <label htmlFor="filterSelect" className={styles.filterLabel}>
              Filter by:
            </label>
            <select
              id="filterSelect"
              className={styles.filterSelect}
              value={
                activeFilters.length === 0 ? "all" : activeFilters[0] || "all"
              }
              onChange={handleFilterChange}
            >
              <option value="all">All</option>
              <option value="campus">Campus</option>
              <option value="department">Department</option>
              <option value="personal">Private</option>
            </select>
          </div>

          {/* Create Event Button */}
          <button className={styles.createEventBtn} onClick={handleCreateEvent}>
            + Create Event
          </button>
        </div>
      )}

      {/* Placeholder for other screens */}
      {activeKey !== "calendar" && (
        <div className={styles.menuPlaceholder}>
          <p>
            Menu content for <strong>{menu.title}</strong> will be placed here.
          </p>
        </div>
      )}
    </div>
  );
}
