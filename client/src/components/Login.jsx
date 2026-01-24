import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "../services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showUserChoice, setShowUserChoice] = useState(false);
  const [hideHospital, setHideHospital] = useState(false);
  const [hideUser, setHideUser] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data) => (await api.post("/auth/login", data)).data,
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.onboarding) {
        localStorage.setItem("onboarding", JSON.stringify(data.onboarding));
        if (data.onboarding.required) {
          const missing = data.onboarding.missing_fields?.join(", ") || "profile information";
          window.alert(`Please complete your profile: ${missing}`);
        }
      }

      // Call parent onLogin callback
      if (onLogin) onLogin(data.user);

      // Redirect based on role
      if (data.user.role === "doctor") {
        navigate("/doctors");
      } else if (data.user.role === "hospital_admin") {
        navigate("/hospitals");
      } else if (data.user.role === "patient") {
        navigate("/my-appointments");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      setError(
        error.response?.data?.error || "Login failed. Please try again.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const fillDemo = (role) => {
    if (role === "patient") {
      setFormData({ email: "patient@test.com", password: "password123" });
    } else if (role === "doctor") {
      setFormData({ email: "doctor@test.com", password: "password123" });
    } else if (role === "admin") {
      setFormData({ email: "admin@test.com", password: "password123" });
    }
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <span className="auth-badge">PulsePoint</span>
          <h1 className="auth-title">Care, simplified.</h1>
          <p className="auth-subtitle">
            Connect with your care team, manage appointments, and stay on top of your health without the clutter.
          </p>

          <div className="auth-highlights">
            <span className="auth-pill">Instant scheduling</span>
            <span className="auth-pill">Personalized updates</span>
            <span className="auth-pill">Secure records</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-eyebrow">Welcome back</p>
              <h2>Sign in to continue</h2>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="••••••••"
                required
              />
            </label>

            <button type="submit" disabled={loginMutation.isPending} className="auth-primary-btn">
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-demo-btns">
            {!hideUser && (
              <button
                type="button"
                onClick={() => {
                  setShowUserChoice((v) => !v);
                  setHideHospital(true);
                }}
                className="auth-secondary-btn"
              >
                Login as User
              </button>
            )}
            {!hideHospital && (
              <button
                type="button"
                onClick={() => {
                  fillDemo("admin");
                  setHideUser(true);
                }}
                className="auth-secondary-btn"
              >
                Login as Hospital
              </button>
            )}
          </div>

          {showUserChoice && (
            <div className="auth-demo-btns" style={{ marginTop: "8px" }}>
              <button type="button" onClick={() => fillDemo("patient")} className="auth-secondary-btn">
                Patient
              </button>
              <button type="button" onClick={() => fillDemo("doctor")} className="auth-secondary-btn">
                Doctor
              </button>
            </div>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <Link to="/register" className="auth-link-btn">
              Create a PulsePoint account
            </Link>
            <p className="auth-demo-note">Demo password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
