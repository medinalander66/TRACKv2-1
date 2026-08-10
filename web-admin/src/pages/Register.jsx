import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client"; // ⚠️ i-adjust kung iba ang path ng axios instance mo
import Footer from "../components/login/Footer";
import BrandHeader from "../components/login/BrandHeader";
import styles from "./Login.module.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    accountCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/admin/register", {
        username: form.username.trim(),
        password: form.password,
        account_code: form.accountCode.trim(),
      });

      if (data.ok) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.message || "Failed to create account.");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError(
          "Too many attempts. Please wait a few minutes before trying again.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.pageContent}>
        <BrandHeader />
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Admin Register</h1>
          <p className={styles.subTitle}>Create a new admin account</p>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputContainer}>
              <label htmlFor="accountCode">Admin Account Code: </label>
              <input
                type="text"
                id="accountCode"
                name="accountCode"
                placeholder="Enter Admin Account Code"
                value={form.accountCode}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="username">Username: </label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a Username"
                value={form.username}
                onChange={handleChange}
                className={styles.input}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="password">Password: </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter Password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="confirmPassword">Confirm Password: </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
          {success && (
            <p style={{ color: "#16a34a", marginTop: "8px" }}>{success}</p>
          )}
          <p
            style={{
              textAlign: "center",
              marginTop: "16px",
              fontFamily: "sans-serif",
            }}
          >
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
