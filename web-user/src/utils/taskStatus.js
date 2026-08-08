export function getTaskStatus(task) {
  if (task.is_completed) return "completed";
  const now = new Date();
  const deadline = new Date(task.deadline_datetime);
  if (now > deadline) return "missed";
  return "ongoing";
}

export const TASK_STATUS_CONFIG = {
  ongoing: { label: "Ongoing", className: "statusOngoing" },
  completed: { label: "Completed", className: "statusCompleted" },
  missed: { label: "Missed", className: "statusMissed" },
};

export const TASK_STATUS_SORT_ORDER = { ongoing: 0, completed: 1, missed: 2 };

export function isMissedTaskInvitation(task) {
  return task.response === "pending" && new Date(task.deadline_datetime) < new Date();
}