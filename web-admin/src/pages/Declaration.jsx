import { useEffect, useState, useMemo } from "react";
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
  updatePosition,
  combinePositions,
} from "../api/admin";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiUser,
  FiMail,
} from "react-icons/fi";
import styles from "./Declaration.module.css";

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

  // ─── Search & Sort states ────────────────────────────
  const [searchDepartments, setSearchDepartments] = useState("");
  const [sortDepartments, setSortDepartments] = useState("name_asc");
  const [searchOffices, setSearchOffices] = useState("");
  const [sortOffices, setSortOffices] = useState("name_asc");
  const [searchDomains, setSearchDomains] = useState("");
  const [sortDomains, setSortDomains] = useState("name_asc");
  const [searchPositions, setSearchPositions] = useState("");
  const [sortPositions, setSortPositions] = useState("order_asc");

  // ─── Edit state ────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAllowMultiple, setEditAllowMultiple] = useState(false);

  // ─── Combine Modal state ──────────────────────────────
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [sourcePosition, setSourcePosition] = useState(null);
  const [targetPositionId, setTargetPositionId] = useState("");

  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // ─── Loading ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─── Filter & sort helpers ────────────────────────────
  const filterAndSort = (items, searchKey, sortKey, searchField = "name") => {
    let filtered = items.filter((item) =>
      item[searchField]?.toLowerCase().includes(searchKey.toLowerCase()),
    );
    if (sortKey === "name_asc")
      filtered.sort((a, b) => a[searchField].localeCompare(b[searchField]));
    else if (sortKey === "name_desc")
      filtered.sort((a, b) => b[searchField].localeCompare(a[searchField]));
    else if (sortKey === "status_active")
      filtered.sort((a) => (a.is_active ? -1 : 1));
    else if (sortKey === "status_inactive")
      filtered.sort((a) => (a.is_active ? 1 : -1));
    else if (sortKey === "newest")
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortKey === "oldest")
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return filtered;
  };

  const filteredDepartments = useMemo(
    () => filterAndSort(departments, searchDepartments, sortDepartments),
    [departments, searchDepartments, sortDepartments],
  );

  const filteredOffices = useMemo(
    () => filterAndSort(offices, searchOffices, sortOffices),
    [offices, searchOffices, sortOffices],
  );

  const filteredDomains = useMemo(
    () => filterAndSort(domains, searchDomains, sortDomains, "domain"),
    [domains, searchDomains, sortDomains],
  );

  const filteredPositions = useMemo(
    () => filterAndSort(positions, searchPositions, sortPositions),
    [positions, searchPositions, sortPositions],
  );

  // ─── Add handlers (with form onSubmit) ────────────────
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createDepartment(newName.trim());
      setNewName("");
      load();
      setMessage("Department added.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add.");
    }
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createOffice(newName.trim());
      setNewName("");
      load();
      setMessage("Office added.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add.");
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
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
      setMessage("Position added.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add position.");
    }
  };

  // ─── Toggle / Delete handlers ──────────────────────────
  const toggleItem = async (id, currentActive, type) => {
    try {
      if (type === "department") await toggleDepartment(id, !currentActive);
      else if (type === "office") await toggleOffice(id, !currentActive);
      else if (type === "domain") await toggleDomain(id);
      else if (type === "position") await togglePosition(id);
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

  // ─── Edit functions ────────────────────────────────────
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

  // ─── Combine functions ─────────────────────────────────
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

  // ─── Render helpers ────────────────────────────────────
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className={styles.badgeActive}>Active</span>
    ) : (
      <span className={styles.badgeInactive}>Inactive</span>
    );
  };

  const renderTable = (items, type, fields) => {
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={fields.length + 1} className={styles.noData}>
                No items found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                {fields.map((f) => (
                  <td key={f.key}>{f.render ? f.render(item) : item[f.key]}</td>
                ))}
                <td>
                  <button
                    onClick={() => toggleItem(item.id, item.is_active, type)}
                    className={styles.toggleBtn}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                  {type === "domain" && (
                    <button
                      onClick={() => handleDeleteDomain(item.id)}
                      className={styles.dangerBtn}
                    >
                      Delete
                    </button>
                  )}
                  {type === "position" && (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openCombineModal(item)}
                        className={styles.combineBtn}
                        disabled={!item.is_active}
                      >
                        Combine
                      </button>
                      <button
                        onClick={() => handleDeletePosition(item.id)}
                        className={styles.dangerBtn}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  // ─── Main render ──────────────────────────────────────
  return (
    <div className={styles.container}>
      {/* Header */}
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

      {/* Tabs */}
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

      {message && <div className={styles.message}>{message}</div>}

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
                <div className={styles.sortWrapper}>
                  <FiFilter className={styles.filterIcon} />
                  <select
                    value={sortDepartments}
                    onChange={(e) => setSortDepartments(e.target.value)}
                  >
                    <option value="name_asc">Name A→Z</option>
                    <option value="name_desc">Name Z→A</option>
                    <option value="status_active">Active First</option>
                    <option value="status_inactive">Inactive First</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <FiChevronDown className={styles.sortChevron} />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                renderTable(filteredDepartments, "department", [
                  { key: "name", label: "Name" },
                  {
                    key: "is_active",
                    label: "Status",
                    render: (item) => getStatusBadge(item.is_active),
                  },
                ])
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
                <div className={styles.sortWrapper}>
                  <FiFilter className={styles.filterIcon} />
                  <select
                    value={sortOffices}
                    onChange={(e) => setSortOffices(e.target.value)}
                  >
                    <option value="name_asc">Name A→Z</option>
                    <option value="name_desc">Name Z→A</option>
                    <option value="status_active">Active First</option>
                    <option value="status_inactive">Inactive First</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <FiChevronDown className={styles.sortChevron} />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                renderTable(filteredOffices, "office", [
                  { key: "name", label: "Name" },
                  {
                    key: "is_active",
                    label: "Status",
                    render: (item) => getStatusBadge(item.is_active),
                  },
                ])
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
                <div className={styles.sortWrapper}>
                  <FiFilter className={styles.filterIcon} />
                  <select
                    value={sortDomains}
                    onChange={(e) => setSortDomains(e.target.value)}
                  >
                    <option value="name_asc">Name A→Z</option>
                    <option value="name_desc">Name Z→A</option>
                    <option value="status_active">Active First</option>
                    <option value="status_inactive">Inactive First</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  <FiChevronDown className={styles.sortChevron} />
                </div>
              </div>
              {loading ? (
                <p className={styles.loading}>Loading...</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDomains.length === 0 ? (
                      <tr>
                        <td colSpan="3" className={styles.noData}>
                          No domains found
                        </td>
                      </tr>
                    ) : (
                      filteredDomains.map((d) => (
                        <tr key={d.id}>
                          <td>{d.domain}</td>
                          <td>{getStatusBadge(d.is_active)}</td>
                          <td>
                            <button
                              onClick={() =>
                                toggleItem(d.id, d.is_active, "domain")
                              }
                              className={styles.toggleBtn}
                            >
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

      {/* ─── POSITIONS (Account Codes Layout) ───────────── */}
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
                <div className={styles.cardControls}>
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
