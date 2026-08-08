import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../api/client";
import InputField from "../../../components/common/InputField";
import Button from "../../../components/common/Button";
import RadioGroup from "../../../components/common/RadioGroup";
import TaskColor from "../../../components/tasks/TaskColor";
import InviteAssigneeModal from "../../../components/tasks/InviteAssigneeModal";
import InvitationModal from "../../../components/tasks/InvitationModal";
import FileAttachment from "../../../components/common/FileAttachment";
import {
  FiCalendar,
  FiClock,
  FiInfo,
  FiList,
  FiPlus,
  FiUserPlus,
  FiUsers,
  FiFileText,
  FiPaperclip,
} from "react-icons/fi";
import { FaRegSquare, FaCheckSquare } from "react-icons/fa";
import styles from "./CreateTask.module.css";

export default function CreateTask() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    color: "#3B82F6",
    priority: "medium",
    visibility: "personal",
    deadlineDate: "",
    deadlineTime: "",
    description: "",
    remind_before_minutes: "",
    is_email_reminder: false,
  });

  const [assigneeIds, setAssigneeIds] = useState([]);
  const [collaboratorIds, setCollaboratorIds] = useState([]);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [checklistCards, setChecklistCards] = useState([
    { id: 1, title: "Checklist", items: [], newItemText: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Checklist helpers
  const toggleChecklistItem = (cardId, itemId) => {
    setChecklistCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              items: card.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : card
      )
    );
  };

  const handleAddChecklistItem = (cardId) => {
    setChecklistCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const text = card.newItemText?.trim();
        if (!text) return card;
        return {
          ...card,
          items: [...card.items, { id: Date.now(), text, done: false }],
          newItemText: "",
        };
      })
    );
  };

  const handleNewItemTextChange = (cardId, value) => {
    setChecklistCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, newItemText: value } : card
      )
    );
  };

  const handleAddChecklistCard = () => {
    setChecklistCards((prev) => [
      ...prev,
      { id: Date.now(), title: "Checklist", items: [], newItemText: "" },
    ]);
  };

  const handleDeleteChecklistCard = (cardId) => {
    if (checklistCards.length <= 1) return;
    setChecklistCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleEditChecklistTitle = (cardId, value) => {
    setChecklistCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, title: value } : c))
    );
  };

  // File attachment handlers
  const handleFileAdd = () => {
    // Trigger file input (we can add a hidden input in the component)
    document.getElementById("taskFileInput")?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleRemoveFile = (fileToRemove) => {
    setAttachments((prev) => prev.filter((f) => f !== fileToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    // Validation
    if (!formData.title.trim()) {
      setStatusMessage("Please enter a task title.");
      setLoading(false);
      return;
    }
    if (!formData.deadlineDate) {
      setStatusMessage("Please select a deadline date.");
      setLoading(false);
      return;
    }
    if (!formData.deadlineTime) {
      setStatusMessage("Please select a deadline time.");
      setLoading(false);
      return;
    }

    const deadline_datetime = `${formData.deadlineDate}T${formData.deadlineTime}:00`;

    const checklistItems = [];
    checklistCards.forEach((card) => {
      card.items.forEach((item) => {
        checklistItems.push({ text: item.text });
      });
    });

    const payload = {
      title: formData.title.trim(),
      color: formData.color,
      priority: formData.priority,
      visibility: formData.visibility,
      deadline_datetime,
      description: formData.description.trim(),
      remind_before_minutes: formData.remind_before_minutes || null,
      is_email_reminder: formData.is_email_reminder,
      assignee_ids: assigneeIds,
      collaborator_ids: collaboratorIds,
      checklist_items: checklistItems,
    };

    try {
      const res = await apiClient.post("/tasks", payload);
      if (res.data?.ok) {
        const taskId = res.data.task.id;
        // Upload attachments if any
        if (attachments.length > 0) {
          const formDataObj = new FormData();
          attachments.forEach(({ file }) => formDataObj.append("files", file));
          await apiClient.post(`/attachments/task/${taskId}`, formDataObj, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        setStatusMessage("Task created successfully!");
        setTimeout(() => navigate("/tasks"), 1000);
      } else {
        setStatusMessage(res.data?.message || "Failed to create task.");
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Server error.");
    } finally {
      setLoading(false);
    }
  };

  const totalCompleted = (items) => items.filter((it) => it.done).length;
  const progressFor = (items) =>
    items.length ? Math.round((totalCompleted(items) / items.length) * 100) : 0;

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div
          className={styles.titleSection}
          style={{ backgroundColor: formData.color }}
        >
          <InputField
            className={styles.titleInput}
            name="title"
            value={formData.title}
            placeholder="Enter title for your task.."
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.sectionContent}>
          {/* Basics */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiInfo size={16} className={styles.cardHeaderIcon} />
              <span>Task Basics</span>
            </div>
            <TaskColor
              value={formData.color}
              onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
            />
            <RadioGroup
              name="priority"
              label="PRIORITY"
              groupClassName={styles.labelGroup}
              optionsClassName={styles.labelOptions}
              radioLabelClassName={styles.labelRadioLabel}
              labelClassName={styles.labelLabel}
              optionContentClassName={styles.labelOptionContent}
              options={[
                { value: "high", label: "High", color: "#800000" },
                { value: "medium", label: "Medium", color: "#AF4402" },
                { value: "low", label: "Low", color: "#095000" },
              ]}
              value={formData.priority}
              onChange={handleInputChange}
            />
          </div>

          {/* Visibility */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiUsers size={16} className={styles.cardHeaderIcon} />
              <span>Visibility</span>
            </div>
            <RadioGroup
              name="visibility"
              label="VISIBILITY"
              options={[
                { value: "personal", label: "Personal" },
                { value: "department", label: "Department" },
                { value: "campus", label: "Campus" },
              ]}
              value={formData.visibility}
              onChange={handleInputChange}
            />
          </div>

          {/* Assignees & Collaborators */}
          <div className={styles.row}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <FiUserPlus size={16} className={styles.cardHeaderIcon} />
                <span>Assignees</span>
              </div>
              <button
                type="button"
                className={styles.inviteButton}
                onClick={() => setShowAssigneeModal(true)}
              >
                Add Assignees ({assigneeIds.length})
              </button>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <FiUsers size={16} className={styles.cardHeaderIcon} />
                <span>Collaborators</span>
              </div>
              <button
                type="button"
                className={styles.collabBtn}
                onClick={() => setShowCollaboratorModal(true)}
              >
                Add Collaborators ({collaboratorIds.length})
              </button>
            </div>
          </div>

          {/* Deadline */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiCalendar size={16} className={styles.cardHeaderIcon} />
              <span>Deadline</span>
            </div>
            <div className={styles.row}>
              <InputField
                label="DATE"
                type="date"
                name="deadlineDate"
                value={formData.deadlineDate}
                onChange={handleInputChange}
              />
              <InputField
                label="TIME"
                type="time"
                name="deadlineTime"
                value={formData.deadlineTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiList size={16} className={styles.cardHeaderIcon} />
              <span>Checklist</span>
            </div>

            <div className={styles.multiChecklistWrapper}>
              {checklistCards.map((card) => {
                const completed = totalCompleted(card.items);
                const prog = progressFor(card.items);
                return (
                  <div key={card.id} className={styles.checklistCardMulti}>
                    <div className={styles.checklistHeaderRow}>
                      <div className={styles.checklistTitleBlockRow}>
                        <input
                          className={styles.checklistTitleInput}
                          value={card.title}
                          onChange={(e) =>
                            handleEditChecklistTitle(card.id, e.target.value)
                          }
                        />
                        <span className={styles.checklistSubtitleSmall}>
                          {card.items.length} items
                        </span>
                      </div>
                      <div className={styles.checklistActions}>
                        <button
                          type="button"
                          className={styles.deleteChecklistBtn}
                          onClick={() => handleDeleteChecklistCard(card.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${prog}%` }}
                      />
                    </div>

                    <div className={styles.checklistList}>
                      {card.items.map((item) => (
                        <div
                          key={item.id}
                          className={`${styles.checklistItem} ${
                            item.done ? styles.checklistItemCompleted : ""
                          }`}
                        >
                          <button
                            type="button"
                            className={styles.checklistToggle}
                            onClick={() =>
                              toggleChecklistItem(card.id, item.id)
                            }
                          >
                            {item.done ? (
                              <FaCheckSquare
                                className={styles.checklistToggleIcon}
                              />
                            ) : (
                              <FaRegSquare
                                className={styles.checklistToggleIcon}
                              />
                            )}
                          </button>
                          <span
                            className={`${styles.checklistText} ${
                              item.done ? styles.checklistTextCompleted : ""
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))}

                      <div className={styles.checklistAddRow}>
                        <button
                          type="button"
                          className={styles.checklistAddButton}
                          onClick={() => handleAddChecklistItem(card.id)}
                        >
                          <FiPlus className={styles.icon} />
                        </button>
                        <input
                          className={styles.checklistAddInput}
                          value={card.newItemText}
                          placeholder="Add item..."
                          onChange={(e) =>
                            handleNewItemTextChange(card.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChecklistItem(card.id);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className={styles.addChecklistCardRow}>
                <button
                  type="button"
                  className={styles.addChecklistCardBtn}
                  onClick={handleAddChecklistCard}
                >
                  + Add checklist card
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiFileText size={16} className={styles.cardHeaderIcon} />
              <span>Description</span>
            </div>
            <InputField
              as="textarea"
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add details about your task..."
            />
          </div>

          {/* Attachments */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiPaperclip size={16} className={styles.cardHeaderIcon} />
              <span>Attachments</span>
            </div>
            <FileAttachment
              files={attachments.map(({ name, size }) => ({ name, size }))}
              onRemove={handleRemoveFile}
              onAdd={handleFileAdd}
            />
            <input
              type="file"
              id="taskFileInput"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Reminder */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiClock size={16} className={styles.cardHeaderIcon} />
              <span>Reminder</span>
            </div>
            <div className={styles.row}>
              <select
                className={styles.select}
                name="remind_before_minutes"
                value={formData.remind_before_minutes}
                onChange={handleInputChange}
              >
                <option value="">None</option>
                <option value="5">5 min before</option>
                <option value="10">10 min before</option>
                <option value="15">15 min before</option>
                <option value="30">30 min before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_email_reminder"
                  checked={formData.is_email_reminder}
                  onChange={handleCheckboxChange}
                />
                Email Reminder
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className={styles.submitBar}>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
            {statusMessage && (
              <p
                className={styles.statusMessage}
                style={{
                  color: statusMessage.includes("success")
                    ? "#0f766e"
                    : "#b91c1c",
                }}
              >
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </form>

      <InviteAssigneeModal
        isOpen={showAssigneeModal}
        onClose={() => setShowAssigneeModal(false)}
        selectedIds={assigneeIds}
        onSave={setAssigneeIds}
      />

      <InvitationModal
        isOpen={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        selectedIds={collaboratorIds}
        onSave={setCollaboratorIds}
        title="Add Collaborators"
        type="collaborators"
      />
    </div>
  );
}