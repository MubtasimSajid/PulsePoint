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
  const [step, setStep] = useState('initial'); // 'initial', 'user_select'
  const [showForm, setShowForm] = useState(false);

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
        navigate("/doctor-dashboard");
      } else if (data.user.role === "hospital_admin") {
        navigate("/hospital-dashboard");
      } else if (data.user.role === "patient") {
        navigate("/patient-dashboard");
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
            {!showForm ? (
              <div className="space-y-4">
                {step === 'initial' && (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('user_select')}
                      className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                    >
                      <span className="text-2xl">👤</span> Login as User
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(true);
                        fillDemo('admin'); // Optional: pre-fill for demo convenience, or remove if strictly manual
                      }}
                      className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                    >
                      <span className="text-2xl">🏥</span> Login as Hospital
                    </button>
                  </div>
                )}

                {step === 'user_select' && (
                  <div className="grid gap-3 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(true);
                        fillDemo('patient');
                      }}
                      className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                    >
                      <span className="text-2xl">🤒</span> Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(true);
                        fillDemo('doctor');
                      }}
                      className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                    >
                      <span className="text-2xl">👨‍⚕️</span> Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('initial')}
                      className="text-slate-500 hover:text-indigo-600 text-sm font-medium pt-2"
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="mb-6 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm group w-fit"
                >
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Change Role
                </button>

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
              </div>
            )}
          </form>



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
