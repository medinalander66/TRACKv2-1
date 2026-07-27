import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  getDepartments,
  createDepartment,
  toggleDepartment,
  deleteDepartment,
  updateDepartment,
  getOffices,
  createOffice,
  toggleOffice,
  deleteOffice,
  updateOffice,
  getDomains,
  addDomain,
  toggleDomain,
  deleteDomain,
  updateDomain,
  getPositions,
  createPosition,
  togglePosition,
  deletePosition,
  getPositionAssignments,
  removeAssignment,
  reorderPositions,
  updatePosition,
  combinePositions,
} from "../api/admin";
import {
  FiSearch,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
} from "react-icons/fi";
import styles from "./Declaration.module.css";

// ─── Feedback Modal Component ──────────────────────────
function FeedbackModal({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // Auto-close after 10 seconds

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={styles.feedbackOverlay} onClick={onClose}>
      <div
        className={`${styles.feedbackModal} ${type === "error" ? styles.feedbackError : styles.feedbackSuccess}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.feedbackClose} onClick={onClose}>
          <FiX size={18} />
        </button>
        <span className={styles.feedbackIcon}>
          {type === "error" ? "❌" : "✅"}
        </span>
        <span className={styles.feedbackText}>{message}</span>
      </div>
    </div>
  );
}

export default function Declaration() {
  const [tab, setTab] = useState("departments");

  // ─── Data states ──────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [domains, setDomains] = useState([]);
  const [positions, setPositions] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // ─── Form states ──────────────────────────────────────
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newPosition, setNewPosition] = useState({
    name: "",
    allow_multiple: false,
  });

  // ─── Search states ────────────────────────────────────
  const [searchDepartments, setSearchDepartments] = useState("");
  const [searchOffices, setSearchOffices] = useState("");
  const [searchDomains, setSearchDomains] = useState("");
  const [searchPositions, setSearchPositions] = useState("");

  // ─── Edit states for tables ──────────────────────────
  const [editDeptId, setEditDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editOfficeId, setEditOfficeId] = useState(null);
  const [editOfficeName, setEditOfficeName] = useState("");
  const [editDomainId, setEditDomainId] = useState(null);
  const [editDomainValue, setEditDomainValue] = useState("");

  // ─── Edit state for positions (inline) ────────────────
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);

  // ─── Combine Modal state ──────────────────────────────
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [sourcePosition, setSourcePosition] = useState(null);
  const [targetPositionId, setTargetPositionId] = useState("");

  // ─── Feedback state ───────────────────────────────────
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  const [isDragging, setIsDragging] = useState(false);

  // ─── Loading ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // ─── Show feedback ────────────────────────────────────
  const showFeedback = (message, type = "success") => {
    setFeedback({ message, type });
  };

  const clearFeedback = () => {
    setFeedback({ message: "", type: "" });
  };

  // ─── Load data ────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [deptRes, officeRes, domainRes, posRes, assignRes] =
        await Promise.all([
          getDepartments(),
          getOffices(),
          getDomains(),
          getPositions(),
          getPositionAssignments(),
        ]);
      setDepartments(deptRes.items || []);
      setOffices(officeRes.items || []);
      setDomains(domainRes.domains || []);
      setPositions(posRes.positions || []);
      setAssignments(assignRes.assignments || []);
    } catch (err) {
      console.error(err);
      showFeedback("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─── Filter helpers ────────────────────────────────────
  const filterItems = (items, searchKey, searchField = "name") => {
    if (!searchKey) return items;
    return items.filter((item) =>
      item[searchField]?.toLowerCase().includes(searchKey.toLowerCase()),
    );
  };

  const filteredDepartments = useMemo(
    () => filterItems(departments, searchDepartments),
    [departments, searchDepartments],
  );

  const filteredOffices = useMemo(
    () => filterItems(offices, searchOffices),
    [offices, searchOffices],
  );

  const filteredDomains = useMemo(
    () => filterItems(domains, searchDomains, "domain"),
    [domains, searchDomains],
  );

  const filteredPositions = useMemo(
    () => filterItems(positions, searchPositions),
    [positions, searchPositions],
  );

  // ─── Add handlers ──────────────────────────────────────
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createDepartment(newName.trim());
      setNewName("");
      load();
      showFeedback("Department added successfully.");
    } catch (err) {
      showFeedback(err.response?.data?.message || "Failed to add.", "error");
    }
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createOffice(newName.trim());
      setNewName("");
      load();
      showFeedback("Office added successfully.");
    } catch (err) {
      showFeedback(err.response?.data?.message || "Failed to add.", "error");
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await addDomain(newDomain.trim());
      setNewDomain("");
      load();
      showFeedback("Domain added successfully.");
    } catch (err) {
      showFeedback(
        err.response?.data?.message || "Failed to add domain.",
        "error",
      );
    }
  };

  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!newPosition.name.trim()) return;
    try {
      await createPosition({
        name: newPosition.name.trim(),
        allow_multiple: newPosition.allow_multiple,
      });
      setNewPosition({ name: "", allow_multiple: false });
      load();
      showFeedback("Position added successfully.");
    } catch (err) {
      showFeedback(
        err.response?.data?.message || "Failed to add position.",
        "error",
      );
    }
  };

  // ─── Toggle handlers ───────────────────────────────────
  const toggleItem = async (id, currentActive, type) => {
    try {
      if (type === "department") await toggleDepartment(id, !currentActive);
      else if (type === "office") await toggleOffice(id, !currentActive);
      else if (type === "domain") await toggleDomain(id);
      else if (type === "position") await togglePosition(id);
      load();
      showFeedback(`Status toggled successfully.`);
    } catch (err) {
      showFeedback("Failed to toggle status.", "error");
    }
  };

  // ─── Delete handlers ───────────────────────────────────
  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      load();
      showFeedback("Department deleted.");
    } catch (err) {
      showFeedback("Failed to delete department.", "error");
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!window.confirm("Delete this office?")) return;
    try {
      await deleteOffice(id);
      load();
      showFeedback("Office deleted.");
    } catch (err) {
      showFeedback("Failed to delete office.", "error");
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!window.confirm("Remove this domain?")) return;
    try {
      await deleteDomain(id);
      load();
      showFeedback("Domain deleted.");
    } catch (err) {
      showFeedback("Failed to delete domain.", "error");
    }
  };

  const handleDeletePosition = async (id) => {
    if (!window.confirm("Delete this position?")) return;
    try {
      await deletePosition(id);
      load();
      showFeedback("Position deleted.");
    } catch (err) {
      showFeedback("Failed to delete position.", "error");
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await removeAssignment(id);
      load();
      showFeedback("Assignment removed.");
    } catch (err) {
      showFeedback("Failed to remove assignment.", "error");
    }
  };

  // ─── Edit functions for departments ────────────────────
  const startEditDept = (item) => {
    setEditDeptId(item.id);
    setEditDeptName(item.name);
  };

  const cancelEditDept = () => {
    setEditDeptId(null);
    setEditDeptName("");
  };

  const saveEditDept = async (id) => {
    if (!editDeptName.trim()) {
      showFeedback("Department name is required.", "error");
      return;
    }
    try {
      await updateDepartment(id, { name: editDeptName.trim() });
      setEditDeptId(null);
      load();
      showFeedback("Department updated.");
    } catch (err) {
      showFeedback(err.response?.data?.message || "Failed to update.", "error");
    }
  };

  // ─── Edit functions for offices ────────────────────────
  const startEditOffice = (item) => {
    setEditOfficeId(item.id);
    setEditOfficeName(item.name);
  };

  const cancelEditOffice = () => {
    setEditOfficeId(null);
    setEditOfficeName("");
  };

  const saveEditOffice = async (id) => {
    if (!editOfficeName.trim()) {
      showFeedback("Office name is required.", "error");
      return;
    }
    try {
      await updateOffice(id, { name: editOfficeName.trim() });
      setEditOfficeId(null);
      load();
      showFeedback("Office updated.");
    } catch (err) {
      showFeedback(err.response?.data?.message || "Failed to update.", "error");
    }
  };

  // ─── Edit functions for domains ────────────────────────
  const startEditDomain = (item) => {
    setEditDomainId(item.id);
    setEditDomainValue(item.domain);
  };

  const cancelEditDomain = () => {
    setEditDomainId(null);
    setEditDomainValue("");
  };

  const saveEditDomain = async (id) => {
    if (!editDomainValue.trim()) {
      showFeedback("Domain is required.", "error");
      return;
    }
    try {
      await updateDomain(id, { domain: editDomainValue.trim() });
      setEditDomainId(null);
      load();
      showFeedback("Domain updated.");
    } catch (err) {
      showFeedback(err.response?.data?.message || "Failed to update.", "error");
    }
  };

  // ─── Edit functions for positions ──────────────────────
  const startEdit = (pos) => {
    setEditingId(pos.id);
    setEditName(pos.name);
    setEditAllowMultiple(pos.allow_multiple);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditAllowMultiple(false);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      showFeedback("Position name is required.", "error");
      return;
    }
    try {
      await updatePosition(id, {
        name: editName.trim(),
        allow_multiple: editAllowMultiple,
      });
      setEditingId(null);
      load();
      showFeedback("Position updated.");
    } catch (err) {
      showFeedback(
        err.response?.data?.message || "Failed to update position.",
        "error",
      );
    }
  };

  // ─── Combine functions ─────────────────────────────────
  const openCombineModal = (pos) => {
    setSourcePosition(pos);
    setTargetPositionId("");
    setCombineModalOpen(true);
  };

  const handleCombine = async () => {
    if (!sourcePosition || !targetPositionId) {
      showFeedback("Please select a target position.", "error");
      return;
    }
    if (sourcePosition.id === targetPositionId) {
      showFeedback("Cannot combine a position with itself.", "error");
      return;
    }
    if (
      !window.confirm(
        `Combine "${sourcePosition.name}" into the selected position? This will deactivate the source position and transfer all assignments.`,
      )
    ) {
      return;
    }
    try {
      await combinePositions(sourcePosition.id, targetPositionId);
      setCombineModalOpen(false);
      setSourcePosition(null);
      setTargetPositionId("");
      load();
      showFeedback("Positions combined successfully.");
    } catch (err) {
      showFeedback(
        err.response?.data?.message || "Failed to combine positions.",
        "error",
      );
    }
  };

  const getOtherPositions = () => {
    if (!sourcePosition) return [];
    return positions.filter((p) => p.id !== sourcePosition.id && p.is_active);
  };

  // ─── Drag and Drop ─────────────────────────────────────
  const handleDragEnd = async (result) => {
    setIsDragging(false);
    if (!result.destination) return;

    const items = Array.from(positions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    setPositions(items);

    try {
      await reorderPositions(updatedItems);
      showFeedback("Positions reordered successfully.");
      load();
    } catch (err) {
      showFeedback("Failed to reorder positions.", "error");
      load();
    }
  };

  // ─── Render helpers ────────────────────────────────────
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className={styles.badgeActive}>Active</span>
    ) : (
      <span className={styles.badgeInactive}>Inactive</span>
    );
  };

  // ─── Main render ──────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* ─── Feedback Modal ────────────────────────────────── */}
      <FeedbackModal
        message={feedback.message}
        type={feedback.type}
        onClose={clearFeedback}
      />

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Declaration</h1>
          <p className={styles.subtitle}>
            Manage departments, offices, domains, and positions
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={load}>
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={tab === "departments" ? styles.activeTab : ""}
          onClick={() => setTab("departments")}
        >
          Departments
        </button>
        <button
          className={tab === "offices" ? styles.activeTab : ""}
          onClick={() => setTab("offices")}
        >
          Offices
        </button>
        <button
          className={tab === "domains" ? styles.activeTab : ""}
          onClick={() => setTab("domains")}
        >
          Domains
        </button>
        <button
          className={tab === "positions" ? styles.activeTab : ""}
          onClick={() => setTab("positions")}
        >
          Positions
        </button>
      </div>

      {/* ─── DEPARTMENTS ────────────────────────────────── */}
      {tab === "departments" && (
        <div className={styles.tabContent}>
          <div className={styles.leftPanel}>
            <div className={styles.card}>
              <h3>Add Department</h3>
              <form onSubmit={handleAddDepartment} className={styles.addForm}>
                <input
                  type="text"
                  placeholder="Department name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={styles.input}
                />
                <button type="submit" className={styles.btn}>
                  <FiPlus /> Add
                </button>
              </form>
            </div>
            <div className={styles.card}>
              <div className={styles.controls}>
                <div className={styles.searchBar}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchDepartments}
                    onChange={(e) => setSearchDepartments(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Edit</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className={styles.noData}>
                          No departments found
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <button
                              onClick={() => startEditDept(item)}
                              className={styles.editBtn}
                            >
                              <FiEdit size={14} />
                            </button>
                          </td>
                          <td>
                            {editDeptId === item.id ? (
                              <div className={styles.inlineEdit}>
                                <input
                                  type="text"
                                  value={editDeptName}
                                  onChange={(e) =>
                                    setEditDeptName(e.target.value)
                                  }
                                  className={styles.inlineInput}
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveEditDept(item.id)}
                                  className={styles.saveEditBtn}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditDept}
                                  className={styles.cancelEditBtn}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td>{getStatusBadge(item.is_active)}</td>
                          <td>
                            <button
                              onClick={() =>
                                toggleItem(
                                  item.id,
                                  item.is_active,
                                  "department",
                                )
                              }
                              className={styles.toggleBtn}
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(item.id)}
                              className={styles.dangerBtn}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.rightPanel}>
            <div className={styles.card}>
              <h3>Department Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{departments.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {departments.filter((d) => d.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {departments.filter((d) => !d.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── OFFICES ────────────────────────────────────── */}
      {tab === "offices" && (
        <div className={styles.tabContent}>
          <div className={styles.leftPanel}>
            <div className={styles.card}>
              <h3>Add Office</h3>
              <form onSubmit={handleAddOffice} className={styles.addForm}>
                <input
                  type="text"
                  placeholder="Office name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={styles.input}
                />
                <button type="submit" className={styles.btn}>
                  <FiPlus /> Add
                </button>
              </form>
            </div>
            <div className={styles.card}>
              <div className={styles.controls}>
                <div className={styles.searchBar}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search offices..."
                    value={searchOffices}
                    onChange={(e) => setSearchOffices(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Edit</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOffices.length === 0 ? (
                      <tr>
                        <td colSpan="4" className={styles.noData}>
                          No offices found
                        </td>
                      </tr>
                    ) : (
                      filteredOffices.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <button
                              onClick={() => startEditOffice(item)}
                              className={styles.editBtn}
                            >
                              <FiEdit size={14} />
                            </button>
                          </td>
                          <td>
                            {editOfficeId === item.id ? (
                              <div className={styles.inlineEdit}>
                                <input
                                  type="text"
                                  value={editOfficeName}
                                  onChange={(e) =>
                                    setEditOfficeName(e.target.value)
                                  }
                                  className={styles.inlineInput}
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveEditOffice(item.id)}
                                  className={styles.saveEditBtn}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditOffice}
                                  className={styles.cancelEditBtn}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td>{getStatusBadge(item.is_active)}</td>
                          <td>
                            <button
                              onClick={() =>
                                toggleItem(item.id, item.is_active, "office")
                              }
                              className={styles.toggleBtn}
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteOffice(item.id)}
                              className={styles.dangerBtn}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.rightPanel}>
            <div className={styles.card}>
              <h3>Office Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{offices.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {offices.filter((o) => o.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {offices.filter((o) => !o.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DOMAINS ────────────────────────────────────── */}
      {tab === "domains" && (
        <div className={styles.tabContent}>
          <div className={styles.leftPanel}>
            <div className={styles.card}>
              <h3>Add Allowed Domain</h3>
              <form onSubmit={handleAddDomain} className={styles.addForm}>
                <input
                  type="text"
                  placeholder="e.g., pup.edu.ph"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className={styles.input}
                />
                <button type="submit" className={styles.btn}>
                  <FiPlus /> Add
                </button>
              </form>
            </div>
            <div className={styles.card}>
              <div className={styles.controls}>
                <div className={styles.searchBar}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search domains..."
                    value={searchDomains}
                    onChange={(e) => setSearchDomains(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Edit</th>
                      <th>Domain</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDomains.length === 0 ? (
                      <tr>
                        <td colSpan="4" className={styles.noData}>
                          No domains found
                        </td>
                      </tr>
                    ) : (
                      filteredDomains.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <button
                              onClick={() => startEditDomain(item)}
                              className={styles.editBtn}
                            >
                              <FiEdit size={14} />
                            </button>
                          </td>
                          <td>
                            {editDomainId === item.id ? (
                              <div className={styles.inlineEdit}>
                                <input
                                  type="text"
                                  value={editDomainValue}
                                  onChange={(e) =>
                                    setEditDomainValue(e.target.value)
                                  }
                                  className={styles.inlineInput}
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveEditDomain(item.id)}
                                  className={styles.saveEditBtn}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditDomain}
                                  className={styles.cancelEditBtn}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              item.domain
                            )}
                          </td>
                          <td>{getStatusBadge(item.is_active)}</td>
                          <td>
                            <button
                              onClick={() =>
                                toggleItem(item.id, item.is_active, "domain")
                              }
                              className={styles.toggleBtn}
                            >
                              {item.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteDomain(item.id)}
                              className={styles.dangerBtn}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.rightPanel}>
            <div className={styles.card}>
              <h3>Domain Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{domains.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {domains.filter((d) => d.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>
                    {domains.filter((d) => !d.is_active).length}
                  </span>
                  <span className={styles.statLabel}>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── POSITIONS ──────────────────────────────────── */}
      {tab === "positions" && (
        <div className={styles.tabContentPositions}>
          {/* Left Panel: Add Form + All Positions (Cards) */}
          <div className={styles.leftPanelPositions}>
            <div className={styles.card}>
              <h3>Add Position</h3>
              <form onSubmit={handleAddPosition} className={styles.addForm}>
                <input
                  type="text"
                  placeholder="Position name"
                  value={newPosition.name}
                  onChange={(e) =>
                    setNewPosition({ ...newPosition, name: e.target.value })
                  }
                  className={styles.input}
                />
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={newPosition.allow_multiple}
                    onChange={(e) =>
                      setNewPosition({
                        ...newPosition,
                        allow_multiple: e.target.checked,
                      })
                    }
                  />
                  Multiple holders
                </label>
                <button type="submit" className={styles.btn}>
                  <FiPlus /> Add
                </button>
              </form>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>All Positions</h3>
                <div className={styles.searchBarSmall}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={searchPositions}
                    onChange={(e) => setSearchPositions(e.target.value)}
                  />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <DragDropContext
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                >
                  <Droppable droppableId="positions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={styles.positionList}
                      >
                        {filteredPositions.map((pos, index) => (
                          <Draggable
                            key={pos.id}
                            draggableId={pos.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${styles.positionCard} ${snapshot.isDragging ? styles.dragging : ""}`}
                              >
                                <div
                                  className={styles.cardDragHandle}
                                  {...provided.dragHandleProps}
                                >
                                  <span className={styles.dragIcon}>⠿</span>
                                  <span className={styles.positionOrder}>
                                    #{index + 1}
                                  </span>
                                </div>

                                {editingId === pos.id ? (
                                  <div className={styles.editForm}>
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) =>
                                        setEditName(e.target.value)
                                      }
                                      className={styles.editInput}
                                      autoFocus
                                    />
                                    <label className={styles.checkboxRow}>
                                      <input
                                        type="checkbox"
                                        checked={editAllowMultiple}
                                        onChange={(e) =>
                                          setEditAllowMultiple(e.target.checked)
                                        }
                                      />
                                      Multiple
                                    </label>
                                    <button
                                      onClick={() => saveEdit(pos.id)}
                                      className={styles.saveEditBtn}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className={styles.cancelEditBtn}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className={styles.cardContent}>
                                      <span className={styles.positionName}>
                                        {pos.name}
                                      </span>
                                      <span className={styles.positionBadge}>
                                        {pos.allow_multiple
                                          ? "Multiple"
                                          : "Single"}
                                      </span>
                                      {getStatusBadge(pos.is_active)}
                                    </div>
                                    <div className={styles.cardActions}>
                                      <button
                                        onClick={() => startEdit(pos)}
                                        className={styles.editBtn}
                                      >
                                        <FiEdit size={14} />
                                      </button>
                                      <button
                                        onClick={() => openCombineModal(pos)}
                                        className={styles.combineBtn}
                                        disabled={!pos.is_active}
                                      >
                                        Combine
                                      </button>
                                      <button
                                        onClick={() =>
                                          toggleItem(
                                            pos.id,
                                            pos.is_active,
                                            "position",
                                          )
                                        }
                                        className={styles.toggleBtn}
                                      >
                                        {pos.is_active
                                          ? "Deactivate"
                                          : "Activate"}
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeletePosition(pos.id)
                                        }
                                        className={styles.dangerBtn}
                                      >
                                        <FiTrash2 size={14} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
              {filteredPositions.length === 0 && !loading && (
                <p className={styles.noData}>No positions found</p>
              )}
            </div>
          </div>

          {/* Right Panel: Current Assignments */}
          <div className={styles.rightPanelPositions}>
            <div className={styles.card}>
              <h3>Current Assignments</h3>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Position</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className={styles.noData}>
                            No active assignments
                          </td>
                        </tr>
                      ) : (
                        assignments.map((ass) => (
                          <tr key={ass.id}>
                            <td>{ass.Position?.name || "—"}</td>
                            <td>{ass.User?.full_name || "—"}</td>
                            <td>{ass.User?.email || "—"}</td>
                            <td>
                              <span className={styles.badgeActive}>Active</span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleRemoveAssignment(ass.id)}
                                className={styles.dangerBtn}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Combine Modal ───────────────────────────────── */}
      {combineModalOpen && sourcePosition && (
        <div
          className={styles.modalOverlay}
          onClick={() => setCombineModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Combine Positions</h3>
              <button
                className={styles.modalClose}
                onClick={() => setCombineModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Combine <strong>"{sourcePosition.name}"</strong> into which
                position?
              </p>
              <p className={styles.modalNote}>
                This will deactivate "{sourcePosition.name}" and transfer all
                its assignments.
              </p>
              <select
                className={styles.modalSelect}
                value={targetPositionId}
                onChange={(e) => setTargetPositionId(e.target.value)}
              >
                <option value="">Select target position...</option>
                {getOtherPositions().map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {!p.is_active ? "(Inactive)" : ""}
                  </option>
                ))}
              </select>
              {getOtherPositions().length === 0 && (
                <p className={styles.modalWarning}>
                  No other active positions available.
                </p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setCombineModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.combineConfirmBtn}
                onClick={handleCombine}
                disabled={!targetPositionId || getOtherPositions().length === 0}
              >
                Combine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
