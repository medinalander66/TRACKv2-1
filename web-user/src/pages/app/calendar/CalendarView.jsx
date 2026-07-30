import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import apiClient from "../../../api/client";
import { getInvitations } from "../../../api/notifications";
import { useCalendar } from "../../../context/CalendarContext";
import styles from "./CalendarView.module.css";

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

const generateMonthGrid = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
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

const getWeekDays = (date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const formatHour = (i) =>
  i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`;

const HOUR_HEIGHT = 64;
const SWIPE_THRESHOLD_RATIO = 0.2;
const SWIPE_ANIM_MS = 250;

export default function CalendarView() {
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    duration,
    activeFilters,
  } = useCalendar();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [pendingEventIds, setPendingEventIds] = useState([]);

  const viewportRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    width: 0,
    locked: null,
    dragging: false,
  });
  const navigateRef = useRef(() => {});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const monthGrid = useMemo(
    () => generateMonthGrid(year, month),
    [year, month],
  );

  const visibleRange = useMemo(() => {
    let start, end;
    if (duration === "day") {
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() - 1);
      start = d.toISOString().slice(0, 10);
      d.setDate(d.getDate() + 2);
      end = d.toISOString().slice(0, 10);
    } else if (duration === "week") {
      const s = new Date(weekStart);
      s.setDate(s.getDate() - 7);
      start = s.toISOString().slice(0, 10);
      const e = new Date(weekStart);
      e.setDate(e.getDate() + 13);
      end = e.toISOString().slice(0, 10);
    } else {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month + 2, 0);
      start = firstDay.toISOString().slice(0, 10);
      end = lastDay.toISOString().slice(0, 10);
    }
    return { start, end };
  }, [duration, selectedDate, weekStart, year, month]);

  // Fetch holidays
  useEffect(() => {
    fetch("https://trackv2-68rg.onrender.com/data/holidays.json")
      .then((res) => res.json())
      .then((data) => setHolidays(data))
      .catch(() => {});
  }, []);

  // Fetch user events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get("/events", {
          params: { start: visibleRange.start, end: visibleRange.end },
        });
        setUserEvents(res.data.events || []);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };
    fetchEvents();
  }, [visibleRange.start, visibleRange.end]);

  // Fetch pending invitations
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await getInvitations({ response: "pending" });
        const ids = data.events.map((ev) => ev.id);
        setPendingEventIds(ids);
      } catch (err) {
        console.error("Failed to fetch pending invitations:", err);
      }
    };
    fetchPending();
  }, [visibleRange.start, visibleRange.end]);

  const allEvents = useMemo(() => {
    const filteredUserEvents = userEvents.filter(
      (ev) => !pendingEventIds.includes(ev.id),
    );
    return [...holidays, ...filteredUserEvents];
  }, [holidays, userEvents, pendingEventIds]);

  const filteredEvents = useMemo(() => {
    if (activeFilters.length === 0) return allEvents;
    return allEvents.filter((e) => activeFilters.includes(e.type));
  }, [activeFilters, allEvents]);

  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  const dailyEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWeekday = new Date().getDay();
  const todayNumber = new Date().getDate();
  const todayMonthAbbr = MONTH_NAMES[new Date().getMonth()]
    .slice(0, 3)
    .toUpperCase();

  // Navigation
  const navigate = useCallback(
    (direction) => {
      const date = new Date(currentDate);
      if (duration === "day") {
        date.setDate(date.getDate() + direction);
        setSelectedDate(date.toISOString().slice(0, 10));
      } else if (duration === "week") {
        date.setDate(date.getDate() + direction * 7);
      } else if (duration === "month") {
        date.setMonth(date.getMonth() + direction);
      }
      setCurrentDate(date);
    },
    [currentDate, duration, setCurrentDate, setSelectedDate],
  );

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const goToPrev = () => navigate(-1);
  const goToNext = () => navigate(1);

  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  // Month dropdown
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    const d = new Date(currentDate);
    d.setMonth(newMonth);
    setCurrentDate(d);
    if (duration === "day") {
      const dayDate = new Date(d);
      dayDate.setDate(1);
      setSelectedDate(dayDate.toISOString().slice(0, 10));
    }
  };

  // Measure viewport
  useLayoutEffect(() => {
    const measure = () =>
      setContainerWidth(viewportRef.current?.offsetWidth || 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [duration]);

  // Native touch listeners
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      const t = e.touches[0];
      dragStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        width: el.offsetWidth,
        locked: null,
        dragging: true,
      };
    };

    const onTouchMove = (e) => {
      const state = dragStateRef.current;
      if (!state.dragging) return;
      const t = e.touches[0];
      const deltaX = t.clientX - state.startX;
      const deltaY = t.clientY - state.startY;

      if (!state.locked) {
        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          state.locked = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        }
      }
      if (state.locked === "x") {
        e.preventDefault();
        setDragX(deltaX);
      }
    };

    const onTouchEnd = () => {
      const state = dragStateRef.current;
      if (!state.dragging) return;
      state.dragging = false;

      if (state.locked === "x") {
        setDragX((current) => {
          const threshold = state.width * SWIPE_THRESHOLD_RATIO;
          if (Math.abs(current) > threshold) {
            const dir = current < 0 ? 1 : -1;
            setIsAnimating(true);
            const target = dir === 1 ? -state.width : state.width;
            setTimeout(() => {
              navigateRef.current(dir);
              setIsAnimating(false);
              setDragX(0);
            }, SWIPE_ANIM_MS);
            return target;
          }
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), SWIPE_ANIM_MS * 0.8);
          return 0;
        });
      }
      state.locked = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const handleDayClick = useCallback(
    (dateStr) => {
      setSelectedDate(dateStr);
      setSelectedEvent(null);
      if (duration !== "day") setSheetOpen(true);
    },
    [duration, setSelectedDate],
  );

  const handleEventClick = useCallback((ev) => {
    setSelectedEvent(ev);
    setSheetOpen(true);
  }, []);

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedEvent(null);
  };

  const headerTitle = useMemo(() => {
    if (duration === "day") {
      return new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (duration === "week") {
      const start = new Date(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const startStr = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const endStr = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startStr} – ${endStr}`;
    }
    return `${MONTH_NAMES[month]} ${year}`;
  }, [duration, selectedDate, weekStart, month, year]);

  /* ---------- Panel renderers ---------- */
  const renderMonthPanel = (offset) => {
    const d = new Date(year, month + offset, 1);
    const grid = generateMonthGrid(d.getFullYear(), d.getMonth());
    return (
      <div className={styles.calendarGridContainer}>
        <div className={styles.calendarGrid}>
          {DAY_NAMES.map((day, idx) => (
            <div
              key={day}
              className={`${styles.dayHeader} ${
                idx === todayWeekday ? styles.dayHeaderToday : ""
              }`}
            >
              {day}
            </div>
          ))}
          {grid.map((cell, idx) => {
            const events = eventsByDate[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            return (
              <button
                key={idx}
                className={`${styles.dayCell} ${
                  !cell.isCurrentMonth ? styles.otherMonthCell : ""
                } ${isSelected ? styles.activeCell : ""}`}
                onClick={() => handleDayClick(cell.dateStr)}
              >
                <span
                  className={`${styles.dayNumber} ${
                    isToday ? styles.todayNumber : ""
                  } ${!cell.isCurrentMonth ? styles.otherMonthNumber : ""}`}
                >
                  {cell.day}
                </span>
                {cell.isCurrentMonth && events.length > 0 && (
                  <div className={styles.eventPills}>
                    {events.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={styles.eventPill}
                        style={{ backgroundColor: ev.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(ev);
                        }}
                      >
                        {ev.title.substring(0, 10)}
                        {ev.title.length > 10 ? "…" : ""}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <span className={styles.morePill}>
                        +{events.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekPanel = (offset) => {
    const ws = new Date(weekStart);
    ws.setDate(ws.getDate() + offset * 7);
    const days = getWeekDays(ws);
    return (
      <div className={styles.weekContainer}>
        <div className={styles.weekGrid}>
          <div className={styles.weekDayHeader}>
            <div className={styles.weekHeaderSpacer} />
            {days.map((day, idx) => {
              const dateStr = day.toISOString().slice(0, 10);
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={idx}
                  className={`${styles.weekDayLabel} ${
                    isToday ? styles.weekDayLabelToday : ""
                  }`}
                >
                  <span className={styles.weekDayName}>
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span className={styles.weekDayNumber}>{day.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.weekTimeline}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className={styles.weekHourRow}>
                <span className={styles.weekHourLabel}>{formatHour(hour)}</span>
                {days.map((day, dayIdx) => {
                  const dateStr = day.toISOString().slice(0, 10);
                  const isToday = dateStr === todayStr;
                  const events = eventsByDate[dateStr] || [];
                  const eventsAtHour = events.filter(
                    (ev) => parseInt(ev.time, 10) === hour,
                  );
                  return (
                    <div
                      key={dayIdx}
                      className={`${styles.weekCell} ${
                        isToday ? styles.weekCellToday : ""
                      }`}
                    >
                      {eventsAtHour.map((ev) => (
                        <div
                          key={ev.id}
                          className={styles.weekEvent}
                          style={{ backgroundColor: ev.color }}
                          onClick={() => handleEventClick(ev)}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayPanel = (offset) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().slice(0, 10);
    const events = eventsByDate[dateStr] || [];
    return (
      <div className={styles.dailyContainer}>
        <div className={styles.timelineWrapper}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className={styles.hourSlot}>
              <span className={styles.hourLabel}>{formatHour(i)}</span>
              <div className={styles.hourLine} />
            </div>
          ))}
          {events.map((ev) => {
            const startMin = timeToMinutes(ev.time);
            const endMin = timeToMinutes(ev.endTime);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
            return (
              <div
                key={ev.id}
                className={styles.timelineEvent}
                style={{ backgroundColor: ev.color, top, height }}
                onClick={() => handleEventClick(ev)}
              >
                <span className={styles.eventTitle}>{ev.title}</span>
                <span className={styles.eventTime}>
                  {ev.time} – {ev.endTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPanel = (offset) => {
    if (duration === "day") return renderDayPanel(offset);
    if (duration === "week") return renderWeekPanel(offset);
    return renderMonthPanel(offset);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Top Content */}
        <div className={styles.topContent}>
          <div className={styles.headerLeft}>
            <button onClick={goToPrev} className={styles.navBtn}>
              <FiChevronLeft size={20} />
            </button>
            <h2 className={styles.headerTitle}>{headerTitle}</h2>
            <button onClick={goToNext} className={styles.navBtn}>
              <FiChevronRight size={20} />
            </button>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={goToToday}
              className={styles.todayBtn}
              aria-label="Go to today"
              title="Go to today"
            >
              <span className={styles.todayBtnTop}>{todayMonthAbbr}</span>
              <span className={styles.todayBtnNumber}>{todayNumber}</span>
            </button>
            <select
              className={styles.monthSelect}
              value={month}
              onChange={handleMonthChange}
              aria-label="Jump to month"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name.slice(0, 4).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main swipeable view */}
        <div className={styles.mainContent}>
          <div className={styles.viewport} ref={viewportRef}>
            <div
              className={styles.swipeTrack}
              style={{
                transform: `translateX(${-containerWidth + dragX}px)`,
                transition: isAnimating ? "transform 0.25s ease" : "none",
              }}
            >
              <div className={styles.swipePanel}>{renderPanel(-1)}</div>
              <div className={styles.swipePanel}>{renderPanel(0)}</div>
              <div className={styles.swipePanel}>{renderPanel(1)}</div>
            </div>
          </div>
        </div>

        {/* Bottom Sheet */}
        {sheetOpen && (
          <div className={styles.sheetOverlay} onClick={closeSheet}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.sheetHandle}>
                <FiChevronDown size={20} />
              </div>
              {selectedEvent ? (
                <div className={styles.eventDetail}>
                  <button
                    className={styles.backBtn}
                    onClick={() => setSelectedEvent(null)}
                  >
                    ← Back
                  </button>
                  <h3>{selectedEvent.title}</h3>
                  <div className={styles.meta}>
                    <div>
                      <strong>Date:</strong> {selectedEvent.date}
                    </div>
                    <div>
                      <strong>Time:</strong> {selectedEvent.time} –{" "}
                      {selectedEvent.endTime}
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedEvent.type}
                    </div>
                    {selectedEvent.location && (
                      <div>
                        <strong>Location:</strong> {selectedEvent.location}
                      </div>
                    )}
                  </div>
                  <p className={styles.desc}>{selectedEvent.description}</p>
                </div>
              ) : (
                <div className={styles.agenda}>
                  <h3 className={styles.agendaTitle}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "long", month: "short", day: "numeric" },
                    )}
                  </h3>
                  {dailyEvents.length === 0 && (
                    <p className={styles.noTasks}>No events</p>
                  )}
                  {dailyEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={styles.agendaItem}
                      onClick={() => handleEventClick(ev)}
                      style={{ borderLeftColor: ev.color }}
                    >
                      <div className={styles.agendaTime}>
                        {ev.time} – {ev.endTime}
                      </div>
                      <div className={styles.agendaInfo}>
                        <div className={styles.agendaTitle}>{ev.title}</div>
                        <div className={styles.agendaMeta}>
                          {ev.type} · {ev.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className={styles.closeBtn} onClick={closeSheet}>
                <FiX size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
