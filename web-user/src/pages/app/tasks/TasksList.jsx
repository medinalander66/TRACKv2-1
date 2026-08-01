import React, { useState, useEffect } from "react";
import {
  IoIosArrowForward,
  IoIosArrowBack,
  IoIosArrowUp,
  IoIosArrowDown,
} from "react-icons/io";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import TaskOutlinedIcon from "@mui/icons-material/TaskOutlined";
import styles from "../officials/Home.module.css";
import taskStyles from "./TaskList.module.css";

const DUMMY_TASKS = [
  {
    id: "task1",
    title: "Quarterly Editorial Review",
    description:
      "Review all manuscript submissions for the upcoming winter anthology. Coordinate with...",
    start_datetime: new Date(Date.now() + 86400000).toISOString(),
    end_datetime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    priority: "high",
    type: "personal",
    completed_items: 1,
    total_items: 3,
  },
  {
    id: "task2",
    title: "Visual Identity Sync",
    description:
      "Meeting with the brand conductors to finalize the 'Nocturnal' color palette and...",
    start_datetime: new Date(Date.now() + 172800000).toISOString(),
    end_datetime: new Date(Date.now() + 172800000 + 3600000).toISOString(),
    priority: "medium",
    type: "campus",
    completed_items: 1,
    total_items: 3,
  },
  {
    id: "task3",
    title: "Archive Maintenance",
    description:
      "Backup existing project files to the cold storage server and update the index...",
    start_datetime: new Date(Date.now() + 259200000).toISOString(),
    end_datetime: new Date(Date.now() + 259200000 + 1800000).toISOString(),
    priority: "low",
    type: "personal",
    completed_items: 1,
    total_items: 3,
  },
  {
    id: "task4",
    title: "Faculty Meeting Preparation",
    description: "Prepare slides and agenda for the monthly faculty meeting...",
    start_datetime: new Date(Date.now() + 345600000).toISOString(),
    end_datetime: new Date(Date.now() + 345600000 + 5400000).toISOString(),
    priority: "high",
    type: "department",
    completed_items: 2,
    total_items: 4,
  },
  {
    id: "task5",
    title: "Student Consultation",
    description:
      "Meet with student representatives to discuss upcoming events...",
    start_datetime: new Date(Date.now() + 432000000).toISOString(),
    end_datetime: new Date(Date.now() + 432000000 + 3600000).toISOString(),
    priority: "medium",
    type: "campus",
    completed_items: 0,
    total_items: 2,
  },
  {
    id: "task6",
    title: "Budget Proposal Draft",
    description: "Draft the budget proposal for the next fiscal year...",
    start_datetime: new Date(Date.now() + 518400000).toISOString(),
    end_datetime: new Date(Date.now() + 518400000 + 5400000).toISOString(),
    priority: "low",
    type: "personal",
    completed_items: 0,
    total_items: 5,
  },
];

const getPriorityClass = (priority) => {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return styles.priorityHigh;
    case "medium":
      return styles.priorityMedium;
    case "low":
      return styles.priorityLow;
    default:
      return styles.priorityDefault;
  }
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const formatMonthYear = (date) =>
  date.toLocaleString("en-US", { month: "short", year: "numeric" });

export default function TasksList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortOption, setSortOption] = useState("due_date");
  const [sortDirection, setSortDirection] = useState("asc");
  const [displayDate, setDisplayDate] = useState(new Date());

  useEffect(() => {
    setTasks(DUMMY_TASKS);
    setLoading(false);
  }, []);

  const pendingCount = tasks.filter(
    (task) => task.completed_items < task.total_items,
  ).length;
  const completedCount = tasks.filter(
    (task) => task.completed_items >= task.total_items,
  ).length;

  const handlePrevDate = () => {
    const next = new Date(displayDate);
    next.setMonth(next.getMonth() - 1);
    setDisplayDate(next);
  };

  const handleNextDate = () => {
    const next = new Date(displayDate);
    next.setMonth(next.getMonth() + 1);
    setDisplayDate(next);
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (statusFilter === "pending") {
        return task.completed_items < task.total_items;
      }
      if (statusFilter === "completed") {
        return task.completed_items >= task.total_items;
      }
      return true;
    })
    .filter((task) => {
      if (typeFilter === "all") return true;
      return task.type === typeFilter;
    })
    .filter((task) => {
      if (labelFilter === "all") return true;
      return (task.priority || "").toLowerCase() === labelFilter;
    })
    .filter((task) => {
      if (!searchTerm.trim()) return true;
      const value = searchTerm.trim().toLowerCase();
      return (
        task.title.toLowerCase().includes(value) ||
        task.description.toLowerCase().includes(value) ||
        task.type.toLowerCase().includes(value)
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.start_datetime).getTime();
      const bDate = new Date(b.start_datetime).getTime();
      if (sortOption === "due_tomorrow") {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const aTomorrow =
          aDate >= tomorrow.getTime() && aDate < dayAfter.getTime() ? 0 : 1;
        const bTomorrow =
          bDate >= tomorrow.getTime() && bDate < dayAfter.getTime() ? 0 : 1;
        if (aTomorrow !== bTomorrow) return aTomorrow - bTomorrow;
      }
      if (sortDirection === "asc") {
        return aDate - bDate;
      }
      return bDate - aDate;
    });

  return (
    <div className={styles.mainContainer}>
      <div className={taskStyles.taskControls}>
        <div className={taskStyles.searchRow}>
          <div className={taskStyles.searchInputWrapper}>
            <SearchOutlinedIcon className={taskStyles.searchIcon} />
            <input
              type="search"
              placeholder="Search tasks..."
              className={taskStyles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={taskStyles.toggleRow}>
          <button
            type="button"
            className={`${taskStyles.toggleButton} ${statusFilter === "pending" ? taskStyles.toggleActive : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <span className={taskStyles.icon}>
              <PendingActionsOutlinedIcon fontSize="small" />
            </span>
            Pending <span className={taskStyles.count}>{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`${taskStyles.toggleButton} ${statusFilter === "completed" ? taskStyles.toggleActive : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            <span className={taskStyles.icon}>
              <TaskOutlinedIcon fontSize="small" />
            </span>
            Completed <span className={taskStyles.count}>{completedCount}</span>
          </button>
        </div>

        <div className={taskStyles.dropdownRow}>
          <div className={taskStyles.selectGroup}>
            <label htmlFor="typeFilter">Task Type</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={taskStyles.selectBox}
            >
              <option value="all">All task</option>
              <option value="personal">Personal Task</option>
              <option value="department">Department Task</option>
              <option value="campus">Campus Task</option>
            </select>
          </div>
          <div className={taskStyles.selectGroup}>
            <label htmlFor="labelFilter">Label</label>
            <select
              id="labelFilter"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className={taskStyles.selectBox}
            >
              <option value="all">All Label</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className={taskStyles.bottomRow}>
          <div className={taskStyles.pageNavRow}>
            <button
              type="button"
              className={taskStyles.pageNavButton}
              onClick={handlePrevDate}
            >
              <IoIosArrowBack />
            </button>
            <div className={taskStyles.pageDateLabel}>
              {formatMonthYear(displayDate)}
            </div>
            <button
              type="button"
              className={taskStyles.pageNavButton}
              onClick={handleNextDate}
            >
              <IoIosArrowForward />
            </button>
          </div>
          <div className={taskStyles.directionToggle}>
            <span className={taskStyles.directionLabel}>
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </span>
            <button
              type="button"
              className={taskStyles.directionButton}
              onClick={() =>
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {sortDirection === "asc" ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.noData}>Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <p className={styles.noData}>No tasks available</p>
      ) : (
        <div className={styles.upcomingList}>
          {filteredTasks.map((task) => {
            const pct =
              task.total_items > 0
                ? Math.round((task.completed_items / task.total_items) * 100)
                : 0;
            return (
              <div
                key={task.id}
                className={`${styles.taskCard} ${getPriorityClass(task.priority)}`}
              >
                <div className={styles.taskCardTop}>
                  <span className={styles.taskCheckbox} />
                  {task.priority && (
                    <span className={styles.priorityBadge}>
                      {task.priority} priority
                    </span>
                  )}
                </div>

                <h4 className={styles.taskTitle}>{task.title}</h4>

                <div className={styles.taskMetaRow}>
                  <span className={styles.taskMetaItem}>
                    <AccessTimeOutlinedIcon fontSize="small" />
                    {formatTime(task.start_datetime)} —{" "}
                    {formatTime(task.end_datetime)}
                  </span>
                </div>

                <div className={styles.taskMetaRow}>
                  <span className={styles.taskMetaItem}>
                    <VisibilityOutlinedIcon fontSize="small" />
                    {task.type}
                  </span>
                </div>

                <p className={styles.taskDesc}>
                  {task.description?.substring(0, 60)}...
                </p>

                <div className={styles.checklistRow}>
                  <span className={styles.checklistLabel}>
                    <ChecklistOutlinedIcon fontSize="small" />
                    Checklist Progress
                  </span>
                  <span className={styles.checklistFraction}>
                    {task.completed_items}/{task.total_items}
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
