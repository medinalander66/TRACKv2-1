import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // ← ADD
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import {
  FiUsers,
  FiCalendar,
  FiCode,
  FiMail,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUserPlus,
  FiTrendingUp,
  FiActivity,
  FiServer,
  FiArrowRight,
} from "react-icons/fi";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalVenues: 0,
    totalCodes: 0,
    pendingRequests: 0,
    activeUsers: 0,
    blockedUsers: 0,
    codesUsed: 0,
    codesUnused: 0,
    departmentsCount: 0,
    officesCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const usersRes = await apiClient.get("/admin/users");
        const users = usersRes.data.users || [];

        const codesRes = await apiClient.get("/admin/account-codes");
        const codes = codesRes.data.codes || [];

        const requestsRes = await apiClient.get(
          "/account-code-requests?status=pending",
        );
        const requests = requestsRes.data.requests || [];

        const now = new Date();
        const start = now.toISOString().slice(0, 10);
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        const eventsRes = await apiClient.get(
          `/events?start=${start}&end=${end}`,
        );
        const events = eventsRes.data.events || [];

        const deptRes = await apiClient.get("/lookups/departments");
        const officeRes = await apiClient.get("/lookups/offices");

        const activeUsers = users.filter((u) => u.status === "active").length;
        const blockedUsers = users.filter(
          (u) => u.status === "blocked" || u.status === "suspended",
        ).length;
        const codesUsed = codes.filter((c) => c.status === "used").length;
        const codesUnused = codes.filter((c) => c.status === "unused").length;

        setStats({
          totalUsers: users.length,
          totalEvents: events.length,
          totalVenues: 0,
          totalCodes: codes.length,
          pendingRequests: requests.length,
          activeUsers,
          blockedUsers,
          codesUsed,
          codesUnused,
          departmentsCount: deptRes.data.items?.length || 0,
          officesCount: officeRes.data.items?.length || 0,
        });

        setRecentUsers(users.slice(0, 5));
        setRecentRequests(requests.slice(0, 5));
        setUpcomingEvents(events.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Unable to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      active: { class: styles.badgeActive, label: "Active" },
      blocked: { class: styles.badgeBlocked, label: "Blocked" },
      suspended: { class: styles.badgeSuspended, label: "Suspended" },
      pending: { class: styles.badgePending, label: "Pending" },
    };
    const s = map[status] || map.pending;
    return <span className={s.class}>{s.label}</span>;
  };

  const getRequestBadge = (status) => {
    const map = {
      pending: { class: styles.badgePending, label: "Pending" },
      approved: { class: styles.badgeApproved, label: "Approved" },
      rejected: { class: styles.badgeRejected, label: "Rejected" },
    };
    const s = map[status] || map.pending;
    return <span className={s.class}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back, {user?.full_name || user?.username || "Admin"}!
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => window.location.reload()}
          >
            <FiActivity size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#dbeafe", color: "#2563eb" }}
          >
            <FiUsers size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalUsers}</span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#d1fae5", color: "#059669" }}
          >
            <FiUserPlus size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.activeUsers}</span>
            <span className={styles.statLabel}>Active Users</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <FiAlertCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.blockedUsers}</span>
            <span className={styles.statLabel}>Blocked / Suspended</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#d97706" }}
          >
            <FiCode size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalCodes}</span>
            <span className={styles.statLabel}>Total Codes</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#ede9fe", color: "#7c3aed" }}
          >
            <FiCheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.codesUsed}</span>
            <span className={styles.statLabel}>Codes Used</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e0f2fe", color: "#0284c7" }}
          >
            <FiClock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.codesUnused}</span>
            <span className={styles.statLabel}>Codes Unused</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fce7f3", color: "#db2777" }}
          >
            <FiMail size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pendingRequests}</span>
            <span className={styles.statLabel}>Pending Requests</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#d1fae5", color: "#059669" }}
          >
            <FiCalendar size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalEvents}</span>
            <span className={styles.statLabel}>Upcoming Events</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#e0e7ff", color: "#4f46e5" }}
          >
            <FiTrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.departmentsCount}</span>
            <span className={styles.statLabel}>Departments</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "#fef3c7", color: "#d97706" }}
          >
            <FiServer size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.officesCount}</span>
            <span className={styles.statLabel}>Offices</span>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className={styles.tablesRow}>
        {/* Recent Users */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Recent Users</h3>
            <span className={styles.tableCount}>
              {recentUsers.length} users
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.noData}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td className={styles.userCell}>
                        <span className={styles.userAvatar}>
                          {u.full_name?.charAt(0) ||
                            u.username?.charAt(0) ||
                            "?"}
                        </span>
                        {u.full_name || u.username || "—"}
                      </td>
                      <td>{u.email}</td>
                      <td>{getStatusBadge(u.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* ─── View All Link ─── */}
          <div className={styles.tableFooter}>
            <Link to="/users" className={styles.viewAllLink}>
              View All Users <FiArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Pending Account Requests */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>Pending Account Requests</h3>
            <span className={styles.tableCount}>
              {recentRequests.length} pending
            </span>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.noData}>
                      No pending requests
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.full_name || "—"}</td>
                      <td>{r.email}</td>
                      <td>{getRequestBadge(r.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* ─── View All Link ─── */}
          <div className={styles.tableFooter}>
            <Link to="/account-codes" className={styles.viewAllLink}>
              View All Requests <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Events (Full width) */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Upcoming Events (This Week)</h3>
          <span className={styles.tableCount}>
            {upcomingEvents.length} events
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {upcomingEvents.length === 0 ? (
                <tr>
                  <td colSpan="4" className={styles.noData}>
                    No upcoming events
                  </td>
                </tr>
              ) : (
                upcomingEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.title}</td>
                    <td>{new Date(ev.date).toLocaleDateString()}</td>
                    <td>
                      {ev.time} - {ev.endTime}
                    </td>
                    <td>
                      <span className={styles.eventTypeBadge}>
                        {ev.type || ev.event_type || "Event"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Info */}
      <div className={styles.systemInfo}>
        <div className={styles.systemItem}>
          <FiServer size={18} />
          <span>System Status</span>
          <span className={styles.systemStatus}>● Online</span>
        </div>
        <div className={styles.systemItem}>
          <FiClock size={18} />
          <span>Last Updated</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div className={styles.systemItem}>
          <FiTrendingUp size={18} />
          <span>Version</span>
          <span>TRACK v2.0</span>
        </div>
      </div>
    </div>
  );
}
