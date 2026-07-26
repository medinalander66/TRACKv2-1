import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import apiClient from "../../api/client";
import {
  getDepartments,
  getOffices,
  getRoles,
  getPositions,
} from "../../api/lookups";
import BrandHeader from "../../components/common/BrandHeader";
import Footer from "../../components/layout/Footer";
import styles from "./RequestAccountCode.module.css";

export default function RequestAccountCode() {
  const navigate = useNavigate();

  // ─── Form State ──────────────────────────────────────
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");
  const [role, setRole] = useState("");
  const [position, setPosition] = useState("");
  const [description, setDescription] = useState("");

  const [departments, setDepartments] = useState([]);
  const [offices, setOffices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ─── Fetch lookups ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [dRes, oRes, rRes, pRes] = await Promise.all([
          getDepartments(),
          getOffices(),
          getRoles(),
          getPositions(),
        ]);
        if (dRes.ok) setDepartments(dRes.items || []);
        if (oRes.ok) setOffices(oRes.items || []);
        if (rRes.ok) setRoles(rRes.items || []);
        if (pRes.ok) setPositions(pRes.positions || []);
      } catch (err) {
        console.warn("Failed to load lookups", err);
      }
    })();
  }, []);

  // ─── Submit Request ─────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email || !fullName || !department || !office || !role) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        full_name: fullName.trim(),
        department_id: department,
        office_id: office,
        role_id: role,
        position_id: position || null,
        description: description || null,
      };

      const res = await apiClient.post("/account-code-requests", payload);
      if (res.data && res.data.ok) {
        setSuccess(
          "Request submitted successfully! Please wait for admin approval.",
        );
        setEmail("");
        setFullName("");
        setDepartment("");
        setOffice("");
        setRole("");
        setPosition("");
        setDescription("");
      } else {
        setError(res.data?.message || "Submission failed.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Server error";
      setError(msg);
      if (msg.includes("pending request")) {
        setError(
          "You already have a pending request. Please wait for admin review.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.requestAccountCodePage}>
      <div className={styles.pageContent}>
        <BrandHeader />
        <div className={styles.requestCard}>
          <h2 className={styles.title}>Request Account Code</h2>

          <form onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>FULL NAME *</span>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>EMAIL *</span>
              <input
                className={styles.input}
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>DEPARTMENT *</span>
              <select
                className={styles.input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>OFFICE *</span>
              <select
                className={styles.input}
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                required
              >
                <option value="">Select Office</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>ROLE *</span>
              <select
                className={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>POSITION</span>
              <select
                className={styles.input}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="">None</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>ADDITIONAL NOTES</span>
              <textarea
                className={styles.textareaSmall}
                placeholder="Any additional information for the admin..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </label>

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>

            {error && <p className={styles.errorText}>{error}</p>}
            {success && <p className={styles.successText}>{success}</p>}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
