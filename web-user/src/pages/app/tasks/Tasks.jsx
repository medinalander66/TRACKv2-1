import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTasksFilter } from "../../../context/TasksFilterContext";
import apiClient from "../../../api/client";
import {
  FiEdit,
  FiPlus,
  FiClock,
  FiCalendar,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import styles from "./Tasks.module.css";
import FeedbackModal from "../../../components/common/FeedbackModal";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityColor = (priority) => {
  const map = { high: "#dc2626", medium: "#f59e0b", low: "#10b981" };
  return map[priority] || "#6b7280";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || "?";
};

const AVATAR_COLORS = ["#f9a825", "#43a047", "#1e88e5", "#8e24aa"];
const getAvatarColor = (str) => {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

import TaskCardView from "../../../components/tasks/TaskCardView";
import TaskInvitation from "../../../components/tasks/TaskInvitation";

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchTerm, statusFilter, visibilityFilter } = useTasksFilter();

  const [activeTab, setActiveTab] = useState("all"); // all | invited | created | collaboration

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  const [feedback, setFeedback] = useState({ message: "", type: "success" });
  const showFeedback = (msg, type = "success") =>
    setFeedback({ message: msg, type });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (visibilityFilter && visibilityFilter !== "all")
        params.visibility = visibilityFilter;
      const res = await apiClient.get("/tasks", { params });
      if (res.data.ok) {
        setTasks(res.data.tasks || []);
      } else {
        setError("Failed to load tasks.");
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Unable to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, visibilityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (activeTab === "created") {
      filtered = filtered.filter((t) => t.isCreator);
    } else if (activeTab === "invited") {
      filtered = filtered.filter(
        (t) => !t.isCreator && t.response === "pending",
      );
    } else if (activeTab === "collaboration") {
      filtered = filtered.filter((t) => t.isCollaborator);
    }
    return filtered;
  }, [tasks, activeTab]);

  const handleViewTask = async (task) => {
    try {
      const res = await apiClient.get(`/tasks/${task.id}`);
      if (res.data.ok) {
        setSelectedTask(res.data.task);
      } else {
        setSelectedTask(task);
      }
    } catch (err) {
      console.error("Failed to fetch task details:", err);
      setSelectedTask(task);
    } finally {
      setShowViewModal(true);
    }
  };

  const handleEditTask = (taskId) => {
    navigate(`/edit-task/${taskId}`);
  };

  const handleRespond = async (taskId, response) => {
    try {
      await apiClient.put(`/tasks/${taskId}/respond`, { response });
      fetchTasks();
      setShowInvitationModal(false);
      showFeedback(
        response === "accepted" ? "Task accepted!" : "Task declined.",
        "success",
      );
    } catch (err) {
      console.error("Failed to respond:", err);
      showFeedback("Failed to respond to task.", "error");
    }
  };

  const handleChecklistToggle = async (itemId, isCompleted) => {
    try {
      await apiClient.put(`/tasks/checklist/${itemId}`, {
        is_completed: isCompleted,
      });
      if (selectedTask) {
        const res = await apiClient.get(`/tasks/${selectedTask.id}`);
        if (res.data.ok) {
          setSelectedTask(res.data.task);
        }
      }
      fetchTasks();
    } catch (err) {
      console.error("Failed to toggle checklist:", err);
      showFeedback("Failed to update checklist.", "error");
    }
  };

  const handleAddComment = async (itemId, comment) => {
    try {
      await apiClient.put(`/tasks/checklist/${itemId}`, { comments: comment });
      if (selectedTask) {
        const res = await apiClient.get(`/tasks/${selectedTask.id}`);
        if (res.data.ok) {
          setSelectedTask(res.data.task);
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const renderTaskCard = (task, variant = "all") => {
    const isCreator = task.isCreator;
    const isCollaborator = task.isCollaborator;
    const isPending = task.response === "pending";
    const canEdit = isCreator || isCollaborator;

    const handleCardClick = () => {
      if (variant === "invited" && isPending) {
        setSelectedTask(task);
        setShowInvitationModal(true);
      } else {
        handleViewTask(task);
      }
    };

    const deadline = new Date(task.deadline_datetime);
    const isMissed = deadline < new Date() && !task.is_completed;
    const statusText = task.is_completed
      ? "Completed"
      : isMissed
        ? "Missed"
        : "Ongoing";

    return (
      <div
        key={task.id}
        className={styles.taskCard}
        onClick={handleCardClick}
        style={{ borderLeftColor: task.color || "#3B82F6" }}
      >
        {canEdit && (
          <button
            type="button"
            className={styles.editIconBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleEditTask(task.id);
            }}
          >
            <FiEdit size={14} />
          </button>
        )}

        <div className={styles.cardTitle}>{task.title}</div>

        <div className={styles.cardMeta}>
          <span
            className={styles.priorityBadge}
            style={{ color: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
          <span className={styles.visibilityBadge}>{task.visibility}</span>
          <span className={styles.statusBadge}>{statusText}</span>
        </div>

        <div className={styles.cardDetails}>
          <span>
            <FiCalendar size={14} /> {formatDate(task.deadline_datetime)}
          </span>
          <span>
            <FiClock size={14} /> {formatTime(task.deadline_datetime)}
          </span>
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className={styles.assigneeBlock}>
            <FiUsers size={14} />
            <div className={styles.assigneeAvatars}>
              {task.assignees.slice(0, 3).map((a) => (
                <span
                  key={a.id}
                  className={styles.avatarSmall}
                  style={{ background: getAvatarColor(a.username) }}
                >
                  {getInitials(a.username)}
                </span>
              ))}
              {task.assignees.length > 3 && (
                <span className={styles.avatarMore}>
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className={styles.cardFooter}>
          {task.creator && (
            <span className={styles.creatorInfo}>
              <FiUser size={12} />{" "}
              {task.creator.full_name || task.creator.username}
            </span>
          )}
          {variant === "invited" && isPending && (
            <span className={styles.pendingBadge}>Pending</span>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <p className={styles.loading}>Loading tasks...</p>;
    if (error) return <p className={styles.error}>{error}</p>;

    if (filteredTasks.length === 0) {
      return (
        <div className={styles.emptyState}>
          <FiPlus size={40} />
          <p>No tasks found.</p>
          <button
            className={styles.createBtn}
            onClick={() => navigate("/create-task")}
          >
            Create Task
          </button>
        </div>
      );
    }

    return (
      <div className={styles.taskList}>
        {filteredTasks.map((task) => renderTaskCard(task, activeTab))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`${styles.tab} ${activeTab === "invited" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("invited")}
        >
          Invited
        </button>
        <button
          className={`${styles.tab} ${activeTab === "created" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("created")}
        >
          Created
        </button>
        <button
          className={`${styles.tab} ${activeTab === "collaboration" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("collaboration")}
        >
          Collaboration
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>

      <TaskCardView
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onChecklistToggle={handleChecklistToggle}
        onAddComment={handleAddComment}
        currentUserId={user?.id}
      />

      <TaskInvitation
        isOpen={showInvitationModal}
        onClose={() => {
          setShowInvitationModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onRespond={handleRespond}
      />

      <FeedbackModal
        message={feedback.message}
        type={feedback.type}
        onClose={() => setFeedback({ message: "", type: "success" })}
      />
    </div>
  );
}
