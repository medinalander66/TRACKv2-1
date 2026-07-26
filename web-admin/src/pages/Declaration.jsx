import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  getDepartments,
  createDepartment,
  toggleDepartment,
  getOffices,
  createOffice,
  toggleOffice,
  getDomains,
  addDomain,
  toggleDomain,
  deleteDomain,
  getPositions,
  createPosition,
  togglePosition,
  deletePosition,
  getPositionAssignments,
  removeAssignment,
  reorderPositions,
  updatePosition, // ← NEW API call
  combinePositions, // ← NEW API call
} from "../api/admin";
import styles from "./Declaration.module.css";

export default function Declaration() {
  const [tab, setTab] = useState("departments");
  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [domains, setDomains] = useState([]);
  const [positions, setPositions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newPosition, setNewPosition] = useState({
    name: "",
    allow_multiple: false,
  });
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ─── Edit State ────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);

  // ─── Combine Modal State ──────────────────────────────
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [sourcePosition, setSourcePosition] = useState(null);
  const [targetPositionId, setTargetPositionId] = useState("");

  const load = async () => {
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
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Generic add for departments / offices ──
  const addItem = async () => {
    if (!newName.trim()) return;
    try {
      if (tab === "departments") await createDepartment(newName.trim());
      else if (tab === "offices") await createOffice(newName.trim());
      setNewName("");
      load();
      setMessage("Added successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add.");
    }
  };

  // ── Domain add ──
  const addDomainItem = async () => {
    if (!newDomain.trim()) return;
    try {
      await addDomain(newDomain.trim());
      setNewDomain("");
      load();
      setMessage("Domain added.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add domain.");
    }
  };

  // ── Position add ──
  const addPositionItem = async () => {
    if (!newPosition.name.trim()) return;
    try {
      await createPosition({
        name: newPosition.name.trim(),
        allow_multiple: newPosition.allow_multiple,
      });
      setNewPosition({ name: "", allow_multiple: false });
      load();
      setMessage("Position added.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add position.");
    }
  };

  // ── Toggle functions ──
  const toggleItem = async (id, currentActive) => {
    try {
      if (tab === "departments") await toggleDepartment(id, !currentActive);
      else if (tab === "offices") await toggleOffice(id, !currentActive);
      else if (tab === "domains") await toggleDomain(id);
      else if (tab === "positions") await togglePosition(id);
      load();
    } catch (err) {
      setMessage("Failed to toggle status.");
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!window.confirm("Remove this domain?")) return;
    try {
      await deleteDomain(id);
      load();
    } catch (err) {
      setMessage("Failed to delete domain.");
    }
  };

  const handleDeletePosition = async (id) => {
    if (!window.confirm("Delete this position?")) return;
    try {
      await deletePosition(id);
      load();
    } catch (err) {
      setMessage("Failed to delete position.");
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await removeAssignment(id);
      load();
    } catch (err) {
      setMessage("Failed to remove assignment.");
    }
  };

  // ─── Edit Position ────────────────────────────────────
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
      setMessage("Position name is required.");
      return;
    }
    try {
      await updatePosition(id, {
        name: editName.trim(),
        allow_multiple: editAllowMultiple,
      });
      setEditingId(null);
      setMessage("Position updated successfully.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update position.");
    }
  };

  // ─── Combine / Merge Positions ────────────────────────
  const openCombineModal = (pos) => {
    setSourcePosition(pos);
    setTargetPositionId("");
    setCombineModalOpen(true);
  };

  const handleCombine = async () => {
    if (!sourcePosition || !targetPositionId) {
      setMessage("Please select a target position.");
      return;
    }
    if (sourcePosition.id === targetPositionId) {
      setMessage("Cannot combine a position with itself.");
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
      setMessage("Positions combined successfully.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to combine positions.");
    }
  };

  // ─── Drag and Drop Handler ────────────────────────────
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
    setMessage("Updating order...");

    try {
      await reorderPositions(updatedItems);
      setMessage("Positions reordered successfully.");
      load();
    } catch (err) {
      setMessage("Failed to reorder positions.");
      load();
    }
  };

  // ─── Helper to get other positions (for combine) ─────
  const getOtherPositions = () => {
    if (!sourcePosition) return [];
    return positions.filter((p) => p.id !== sourcePosition.id && p.is_active);
  };

  return (
    <div>
      <h1>Declaration</h1>
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

      {/* ─── Departments / Offices ───────────────────────── */}
      {(tab === "departments" || tab === "offices") && (
        <div className={styles.card}>
          <div className={styles.addForm}>
            <input
              type="text"
              placeholder={`New ${tab.slice(0, -1)} name`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={styles.input}
            />
            <button onClick={addItem} className={styles.btn}>
              Add
            </button>
          </div>
          {message && <p className={styles.msg}>{message}</p>}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "departments" ? departments : offices).map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button onClick={() => toggleItem(item.id, item.is_active)}>
                      {item.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {(tab === "departments" ? departments : offices).length === 0 && (
                <tr>
                  <td colSpan="3">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Domains ─────────────────────────────────────── */}
      {tab === "domains" && (
        <div className={styles.card}>
          <div className={styles.addForm}>
            <input
              type="text"
              placeholder="e.g., pup.edu.ph"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className={styles.input}
            />
            <button onClick={addDomainItem} className={styles.btn}>
              Add Domain
            </button>
          </div>
          {message && <p className={styles.msg}>{message}</p>}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id}>
                  <td>{d.domain}</td>
                  <td>{d.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button onClick={() => toggleItem(d.id, d.is_active)}>
                      {d.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteDomain(d.id)}
                      className={styles.dangerBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr>
                  <td colSpan="3">No domains added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Positions ───────────────────────────────────── */}
      {tab === "positions" && (
        <>
          <div className={styles.card}>
            <h3>Add Position</h3>
            <div className={styles.addForm}>
              <input
                type="text"
                placeholder="Position name (e.g. Chancellor)"
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
                Allow multiple holders
              </label>
              <button onClick={addPositionItem} className={styles.btn}>
                Add Position
              </button>
            </div>
            {message && <p className={styles.msg}>{message}</p>}
          </div>

          {/* ─── Position Cards ──────────────────────────── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>All Positions</h3>
              <span className={styles.hint}>
                ↕ Drag to reorder (top = highest priority)
              </span>
            </div>

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
                    {positions.map((pos, index) => (
                      <Draggable
                        key={pos.id}
                        draggableId={pos.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${styles.positionCard} ${
                              snapshot.isDragging ? styles.dragging : ""
                            }`}
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

                            {/* ── Edit Mode ── */}
                            {editingId === pos.id ? (
                              <div className={styles.editForm}>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
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
                                  Multiple holders
                                </label>
                                <div className={styles.editActions}>
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
                              </div>
                            ) : (
                              // ── View Mode ──
                              <>
                                <div className={styles.cardContent}>
                                  <span className={styles.positionName}>
                                    {pos.name}
                                  </span>
                                  <span className={styles.positionBadge}>
                                    {pos.allow_multiple ? "Multiple" : "Single"}
                                  </span>
                                  <span
                                    className={
                                      pos.is_active
                                        ? styles.statusActive
                                        : styles.statusInactive
                                    }
                                  >
                                    {pos.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <div className={styles.cardActions}>
                                  <button
                                    onClick={() => startEdit(pos)}
                                    className={styles.editBtn}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openCombineModal(pos)}
                                    className={styles.combineBtn}
                                    disabled={!pos.is_active}
                                    title={
                                      !pos.is_active
                                        ? "Cannot combine inactive position"
                                        : "Combine with another position"
                                    }
                                  >
                                    Combine
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleItem(pos.id, pos.is_active)
                                    }
                                    className={styles.toggleBtn}
                                  >
                                    {pos.is_active ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => handleDeletePosition(pos.id)}
                                    className={styles.dangerBtn}
                                  >
                                    Delete
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

            {positions.length === 0 && (
              <p className={styles.noData}>No positions defined.</p>
            )}
          </div>

          {/* ─── Assignments list ─────────────────────────── */}
          <div className={styles.card}>
            <h3>Current Assignments</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>User Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((ass) => (
                  <tr key={ass.id}>
                    <td>{ass.Position?.name}</td>
                    <td>{ass.User?.email}</td>
                    <td>{ass.status}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveAssignment(ass.id)}
                        className={styles.dangerBtn}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan="4">No active assignments.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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
                its assignments to the target position.
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
                  No other active positions available to combine with.
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
