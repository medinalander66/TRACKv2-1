import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../api/client";
import InputField from "../../../components/common/InputField";
import Button from "../../../components/common/Button";
import RadioGroup from "../../../components/common/RadioGroup";
import TaskColor from "../../../components/tasks/TaskColor";
import InvitationModal from "../../../components/tasks/InvitationModal";
import InviteAssigneeModal from "../../../components/tasks/InviteAssigneeModal";
import styles from "./CreateTask.module.css";
import radioStyles from "./../../../components/common/RadioGroup.module.css";

import { IoCreateOutline } from "react-icons/io5";

import {
  FiCalendar,
  FiFileText,
  FiInfo,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

export default function CreateTask() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    color: "#3B82F6",
    label: "medium",
    visibility: "personal",
    dueDate: "",
    description: "",
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [collaboratorIds, setCollaboratorIds] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    try {
      const payload = {
        title: formData.title,
        color: formData.color,
        label: formData.label,
        visibility: formData.visibility,
        due_date: formData.dueDate,
        description: formData.description,
        collaborator_ids: collaboratorIds,
        assignee_ids: assigneeIds,
      };

      const res = await apiClient.post("/tasks", payload);
      if (res.data?.ok) {
        setStatusMessage(
          `Task created successfully for ${user?.username || "you"}.`,
        );
        setTimeout(() => navigate("/tasks"), 1000);
        return;
      }

      setStatusMessage(res.data?.message || "Failed to create task.");
    } catch (error) {
      setStatusMessage(
        error.response?.data?.message || "Failed to create task.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div
          className={styles.titleSection}
          style={{ backgroundColor: formData.color, transition: "background-color 0.15s ease" }}
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
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiInfo size={16} className={styles.cardHeaderIcon} />
              <span>Task Basics</span>
            </div>
            <TaskColor
              value={formData.color}
              onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
            />

            <div className={styles.stackRow}>
              <RadioGroup
                name="label"
                label="LABEL"
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
                value={formData.label}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <FiUsers size={16} className={styles.cardHeaderIcon} />
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
                <FiUserPlus size={16} className={styles.cardHeaderIcon} />
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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiCalendar size={16} className={styles.cardHeaderIcon} />
              <span>Date</span>
            </div>

            <div className={styles.section}>
              <div className={styles.row}>
                <InputField
                  label="DEADLINE DATE"
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <FiFileText size={16} className={styles.cardHeaderIcon} />
              <span>Task Description</span>
            </div>
            <div className={styles.section}>
              <InputField
                as="textarea"
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add details about your task..."
              />
            </div>
          </div>

          <div className={styles.section}>
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

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <IoCreateOutline size={16} className={styles.cardHeaderIcon} />
                <span>Submit Task</span>
              </div>
              <p className={styles.submitInfo}>
                Once you submit, the task will be created and visible to the
                selected assignees and collaborators.
              </p>
              <Button
                className={styles.submitButton}
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <InvitationModal
        isOpen={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        selectedIds={collaboratorIds}
        onSave={setCollaboratorIds}
        title="Add Collaborators"
        type="collaborators"
      />

      <InviteAssigneeModal
        isOpen={showAssigneeModal}
        onClose={() => setShowAssigneeModal(false)}
        selectedIds={assigneeIds}
        onSave={setAssigneeIds}
      />
    </div>
  );
}
