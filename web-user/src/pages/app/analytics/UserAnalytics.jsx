import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiMapPin,
  FiTrendingUp,
  FiPieChart,
  FiCheckSquare,
  FiAlertTriangle,
  FiUser,
  FiActivity,
  FiInfo,
} from "react-icons/fi";
import {
  getCampusOfficeStats,
  getDepartmentOfficePerformance,
  getConflictForecast,
  getVenuePie,
  getSchedulingConflicts,
  getPersonalEvents,
  getTaskStats,
} from "../../../api/analytics";
import styles from "./UserAnalytics.module.css";

const PIE_COLORS = [
  "#7c2d12",
  "#4c1d95",
  "#2563eb",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#84cc16",
  "#8b5cf6",
  "#ef4444",
];

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 90 Days" },
];

const FORECAST_DAY_OPTIONS = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

export default function UserAnalytics() {
  const [range, setRange] = useState(30);

  // ── Campus / Department / Office KPI ──
  const [campusOfficeData, setCampusOfficeData] = useState(null);
  const [campusOfficeLoading, setCampusOfficeLoading] = useState(true);

  // ── Venues (for Conflict Forecast dropdown) ──
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [forecastDays, setForecastDays] = useState(7);
  const [conflictForecast, setConflictForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // ── Venue Pie ──
  const [venuePie, setVenuePie] = useState(null);
  const [venuePieLoading, setVenuePieLoading] = useState(true);

  // ── Task Velocity + Department/Office Performance ──
  const [taskStats, setTaskStats] = useState(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(true);
  const [deptPerf, setDeptPerf] = useState(null);
  const [deptPerfLoading, setDeptPerfLoading] = useState(true);
  const [perfTab, setPerfTab] = useState("departments");

  // ── Scheduling Conflicts ──
  const [schedulingConflicts, setSchedulingConflicts] = useState(null);
  const [schedulingLoading, setSchedulingLoading] = useState(true);

  // ── Personal Events ──
  const [personalEvents, setPersonalEvents] = useState(null);
  const [personalLoading, setPersonalLoading] = useState(true);

  // ── Fetch venues once ──
  useEffect(() => {
    setVenuesLoading(true);
    apiClient
      .get("/venues")
      .then((res) => {
        const list = res.data.venues || [];
        setVenues(list);
        if (list.length > 0) setSelectedVenueId(list[0].id);
      })
      .catch((err) => console.error("Failed to fetch venues:", err))
      .finally(() => setVenuesLoading(false));
  }, []);

  // ── Fetch range-dependent sections ──
  const fetchRangeData = useCallback(async (currentRange) => {
    setCampusOfficeLoading(true);
    setVenuePieLoading(true);
    setTaskStatsLoading(true);
    setDeptPerfLoading(true);
    setSchedulingLoading(true);
    setPersonalLoading(true);

    try {
      const res = await getCampusOfficeStats(currentRange);
      if (res.ok) setCampusOfficeData(res);
    } catch (err) {
      console.error("Campus/office stats error:", err);
    } finally {
      setCampusOfficeLoading(false);
    }

    try {
      const res = await getVenuePie(currentRange);
      if (res.ok) setVenuePie(res);
    } catch (err) {
      console.error("Venue pie error:", err);
    } finally {
      setVenuePieLoading(false);
    }

    try {
      const res = await getTaskStats(currentRange);
      if (res.ok) setTaskStats(res);
    } catch (err) {
      console.error("Task stats error:", err);
    } finally {
      setTaskStatsLoading(false);
    }

    try {
      const res = await getDepartmentOfficePerformance(currentRange);
      if (res.ok) setDeptPerf(res);
    } catch (err) {
      console.error("Department performance error:", err);
    } finally {
      setDeptPerfLoading(false);
    }

    try {
      const res = await getSchedulingConflicts(currentRange);
      if (res.ok) setSchedulingConflicts(res);
    } catch (err) {
      console.error("Scheduling conflicts error:", err);
    } finally {
      setSchedulingLoading(false);
    }

    try {
      const res = await getPersonalEvents(currentRange);
      if (res.ok) setPersonalEvents(res);
    } catch (err) {
      console.error("Personal events error:", err);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRangeData(range);
  }, [range, fetchRangeData]);

  // ── Fetch Conflict Forecast (venue + days dependent) ──
  useEffect(() => {
    if (!selectedVenueId) {
      // Walang venue na mapipili — huwag ipilit ang loading state, tapusin agad
      // para hindi ma-stuck sa "Loading..." kahit walang venue.
      setForecastLoading(false);
      setConflictForecast(null);
      return;
    }
    setForecastLoading(true);
    getConflictForecast(selectedVenueId, forecastDays)
      .then((res) => {
        if (res.ok) setConflictForecast(res);
      })
      .catch((err) => console.error("Conflict forecast error:", err))
      .finally(() => setForecastLoading(false));
  }, [selectedVenueId, forecastDays]);

  const selectedVenueName =
    venues.find((v) => v.id === selectedVenueId)?.name || "Venue";

  // ── Render helpers ──
  const renderKpiCard = (label, data) => {
    if (!data) return null;
    return (
      <div className={styles.kpiCard}>
        <span className={styles.kpiFlowLabel}>INSTITUTIONAL FLOW</span>
        <h3 className={styles.kpiTitle}>{label}</h3>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiStatBlock}>
            <span className={styles.kpiStatLabel}>TOTAL</span>
            <span className={styles.kpiStatValue}>{data.total}</span>
          </div>
          <div className={styles.kpiStatBlock}>
            <span className={styles.kpiStatLabel}>PENDING</span>
            <span className={`${styles.kpiStatValue} ${styles.kpiGold}`}>
              {data.pending}
            </span>
          </div>
          <div className={styles.kpiStatBlock}>
            <span className={styles.kpiStatLabel}>DECLINED</span>
            <span className={`${styles.kpiStatValue} ${styles.kpiMaroon}`}>
              {data.declined}
            </span>
          </div>
          <div className={styles.kpiStatBlock}>
            <span className={styles.kpiStatLabel}>MISSED</span>
            <span className={`${styles.kpiStatValue} ${styles.kpiMaroon}`}>
              {data.missed}
            </span>
          </div>
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.chart}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" fill="#0f4a1e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.mainContainer}>
      {/* ── Header ── */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Insights</h1>
          <p className={styles.pageSubtitle}>Analytics &amp; Performance</p>
        </div>
        <div className={styles.stickyFilterWrap}>
          <select
            className={styles.rangeSelect}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Section 1: Campus + Department + Office Events KPI ── */}
      {campusOfficeLoading ? (
        <p className={styles.loadingText}>Loading institutional flow...</p>
      ) : (
        <>
          {renderKpiCard("Campus Events", campusOfficeData?.campus)}
          {renderKpiCard("Department Events", campusOfficeData?.department)}
          {renderKpiCard("Office Events", campusOfficeData?.office)}
        </>
      )}

      {/* ── Section 2: Conflict Forecast ── */}
      <div className={styles.sectionHeaderBlock}>
        <h2 className={styles.sectionTitle}>Conflict Forecast</h2>
        <p className={styles.sectionSubtitle}>
          Intelligent room allocation projections
        </p>
      </div>

      {venuesLoading ? (
        <p className={styles.loadingText}>Loading venues...</p>
      ) : venues.length === 0 ? (
        <div className={styles.emptyNotice}>
          <FiInfo size={18} />
          <span>
            Wala pang naitalang venue sa sistema — magsisimulang lumabas ang
            forecast kapag may naidagdag nang venue.
          </span>
        </div>
      ) : (
        <>
          <div className={styles.filterRow}>
            <select
              className={styles.filterSelect}
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
            >
              {FORECAST_DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {forecastLoading ? (
            <p className={styles.loadingText}>Loading conflict forecast...</p>
          ) : !conflictForecast ? (
            <div className={styles.emptyNotice}>
              <FiInfo size={18} />
              <span>
                Hindi makuha ang forecast data para sa venue na ito. Subukan
                mong pumili ng ibang venue.
              </span>
            </div>
          ) : (
            <>
              {conflictForecast.insights.totalConflictsLast4Weeks === 0 && (
                <div className={styles.emptyNotice}>
                  <FiInfo size={18} />
                  <span>
                    Wala pang naitalang venue conflict para sa{" "}
                    <strong>{selectedVenueName}</strong> sa nakaraang 4 na
                    linggo — magsisimulang maging makabuluhan ang forecast kapag
                    may sapat nang datos.
                  </span>
                </div>
              )}

              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <FiMapPin size={16} className={styles.cardHeaderIcon} />
                  <h3 className={styles.cardHeaderTitle}>
                    Conflicted Venue Trend
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={conflictForecast.trend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="actual"
                      name="Actual (4wk avg)"
                      fill="#7c0a02"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="predicted"
                      name="Predicted"
                      fill="#e8a0a0"
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className={styles.legendRow}>
                  <span className={styles.legendItem}>
                    <span
                      className={styles.legendDot}
                      style={{ background: "#7c0a02" }}
                    />
                    Actual (4wk avg)
                  </span>
                  <span className={styles.legendItem}>
                    <span
                      className={styles.legendDot}
                      style={{ background: "#e8a0a0" }}
                    />
                    Predicted
                  </span>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <FiTrendingUp size={16} className={styles.cardHeaderIcon} />
                  <h3 className={styles.cardHeaderTitle}>
                    Insights for {selectedVenueName}
                  </h3>
                </div>
                <div className={styles.insightGrid}>
                  <div className={styles.insightBlock}>
                    <span className={styles.insightLabel}>TOTAL CONFLICTS</span>
                    <span className={styles.insightValue}>
                      {conflictForecast.insights.totalConflictsLast4Weeks}
                    </span>
                    <span className={styles.insightSub}>Last 4 weeks</span>
                  </div>
                  <div className={styles.insightBlock}>
                    <span className={styles.insightLabel}>FORECAST</span>
                    <span
                      className={`${styles.insightValue} ${styles.insightRed}`}
                    >
                      {conflictForecast.insights.forecastTotal}
                    </span>
                    <span className={styles.insightSub}>
                      {conflictForecast.insights.percentChange >= 0 ? "+" : ""}
                      {conflictForecast.insights.percentChange}% ·{" "}
                      {conflictForecast.insights.forecastDays} Days
                    </span>
                  </div>
                  <div className={styles.insightBlock}>
                    <span className={styles.insightLabel}>PEAK DAY</span>
                    <span className={styles.insightValue}>
                      {conflictForecast.insights.peakDay}
                    </span>
                  </div>
                </div>

                {conflictForecast.highRisk && (
                  <div className={styles.highRiskAlert}>
                    <FiAlertTriangle size={16} />
                    <span>
                      High risk on {conflictForecast.highRisk.day}:{" "}
                      {conflictForecast.highRisk.predicted} conflicts predicted
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Section 3: Venue Pie Chart ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <FiPieChart size={16} className={styles.cardHeaderIcon} />
          <h3 className={styles.cardHeaderTitle}>Venue Pie Chart</h3>
        </div>
        {venuePieLoading ? (
          <p className={styles.loadingText}>Loading venue distribution...</p>
        ) : !venuePie || venuePie.venues.length === 0 ? (
          <div className={styles.emptyNotice}>
            <FiInfo size={18} />
            <span>
              Wala pang venue conflict data para sa napiling time range.
            </span>
          </div>
        ) : (
          <>
            <div className={styles.pieWrapper}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={venuePie.venues}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {venuePie.venues.map((entry, idx) => (
                      <Cell
                        key={entry.id}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieCenterLabel}>
                <span className={styles.pieCenterValue}>{venuePie.total}</span>
                <span className={styles.pieCenterSub}>Total Conflict</span>
              </div>
            </div>
            <div className={styles.pieLegendList}>
              {venuePie.venues.map((v, idx) => (
                <div key={v.id} className={styles.pieLegendRow}>
                  <span className={styles.pieLegendLeft}>
                    <span
                      className={styles.legendDot}
                      style={{
                        background: PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                    {v.name}
                  </span>
                  <span className={styles.pieLegendPercent}>{v.percent}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Section 4: Task Velocity ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <FiCheckSquare size={16} className={styles.cardHeaderIcon} />
          <h3 className={styles.cardHeaderTitle}>Task Velocity</h3>
        </div>
        <p className={styles.cardHeaderSubtitle}>
          Campus &amp; Personal completion rate
        </p>

        {taskStatsLoading ? (
          <p className={styles.loadingText}>Loading task velocity...</p>
        ) : (
          <>
            <div className={styles.velocityStatsRow}>
              <div>
                <span
                  className={`${styles.velocityValue} ${styles.velocityGreen}`}
                >
                  {taskStats?.completed ?? 0}
                </span>
                <span className={styles.velocityLabel}>COMPLETED</span>
              </div>
              <div>
                <span
                  className={`${styles.velocityValue} ${styles.velocityRed}`}
                >
                  {taskStats?.missed ?? 0}
                </span>
                <span className={styles.velocityLabel}>MISSED</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={taskStats?.chart || []}>
                <defs>
                  <linearGradient
                    id="taskVelocityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#taskVelocityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* ── Department / Office Performance (separate section) ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <FiActivity size={16} className={styles.cardHeaderIcon} />
          <h3 className={styles.cardHeaderTitle}>
            Department / Office Performance
          </h3>
        </div>
        <p className={styles.cardHeaderSubtitle}>
          Based on accepted attendees + event creator affiliation
        </p>

        <div className={styles.perfTabs}>
          <button
            type="button"
            className={`${styles.perfTab} ${perfTab === "departments" ? styles.perfTabActive : ""}`}
            onClick={() => setPerfTab("departments")}
          >
            Departments
          </button>
          <button
            type="button"
            className={`${styles.perfTab} ${perfTab === "offices" ? styles.perfTabActive : ""}`}
            onClick={() => setPerfTab("offices")}
          >
            Offices
          </button>
        </div>

        {deptPerfLoading ? (
          <p className={styles.loadingText}>Loading performance data...</p>
        ) : (
          (() => {
            const list =
              perfTab === "departments"
                ? deptPerf?.departments
                : deptPerf?.offices;
            if (!list || list.length === 0) {
              return (
                <div className={styles.emptyNotice}>
                  <FiInfo size={18} />
                  <span>
                    Wala pang participation data para sa napiling time range.
                  </span>
                </div>
              );
            }
            const maxCount = Math.max(...list.map((l) => l.count));
            return (
              <div className={styles.perfList}>
                {list.map((item) => (
                  <div key={item.id} className={styles.perfRow}>
                    <div className={styles.perfRowTop}>
                      <span className={styles.perfName}>{item.name}</span>
                      <span className={styles.perfCount}>{item.count}</span>
                    </div>
                    <div className={styles.perfBarTrack}>
                      <div
                        className={styles.perfBarFill}
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>

      {/* ── Section 5: Scheduling Conflicts ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <FiAlertTriangle size={16} className={styles.cardHeaderIcon} />
          <h3 className={styles.cardHeaderTitle}>Scheduling Conflicts</h3>
        </div>
        {schedulingLoading ? (
          <p className={styles.loadingText}>Loading scheduling conflicts...</p>
        ) : (
          <div className={styles.overlapsList}>
            <div className={`${styles.overlapItem} ${styles.overlapCampus}`}>
              <span className={styles.overlapLabel}>Campus Overlaps</span>
              <span className={styles.overlapValue}>
                {schedulingConflicts?.campusOverlaps ?? 0}
              </span>
            </div>
            <div
              className={`${styles.overlapItem} ${styles.overlapDepartment}`}
            >
              <span className={styles.overlapLabel}>Department Overlaps</span>
              <span className={styles.overlapValue}>
                {schedulingConflicts?.departmentOverlaps ?? 0}
              </span>
            </div>
            <div className={`${styles.overlapItem} ${styles.overlapPrivate}`}>
              <span className={styles.overlapLabel}>Private Overlaps</span>
              <span className={styles.overlapValue}>
                {schedulingConflicts?.privateOverlaps ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 6: Personal Events ── */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <FiUser size={16} className={styles.cardHeaderIcon} />
          <h3 className={styles.cardHeaderTitle}>Personal Events</h3>
        </div>
        {personalLoading ? (
          <p className={styles.loadingText}>Loading personal events...</p>
        ) : (
          <>
            <div className={styles.ringWrapper}>
              <svg viewBox="0 0 160 160" className={styles.ringSvg}>
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#e5f9ea"
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="14"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className={styles.ringCenter}>
                <span className={styles.ringValue}>
                  {personalEvents?.total ?? 0}
                </span>
                <span className={styles.ringLabel}>TOTAL EVENTS</span>
              </div>
            </div>
            <div className={styles.personalStatsRow}>
              <div className={styles.personalStatBox}>
                <span
                  className={`${styles.personalStatValue} ${styles.velocityGreen}`}
                >
                  {personalEvents?.ongoing ?? 0}
                </span>
                <span className={styles.personalStatLabel}>ACTIVE ONGOING</span>
              </div>
              <div className={styles.personalStatBox}>
                <span
                  className={`${styles.personalStatValue} ${styles.velocityRed}`}
                >
                  {personalEvents?.missed ?? 0}
                </span>
                <span className={styles.personalStatLabel}>EVENTS MISSED</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
