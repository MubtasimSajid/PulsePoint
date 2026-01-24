import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { specializationsAPI } from "../services/api";
import api from "../services/api";

export default function Register({ onRegister }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    role: "patient",
    // Doctor specific
    license_number: "",
    specialization_id: "",
    experience_years: "",
    qualification: "",
  });
  const [error, setError] = useState("");

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => (await specializationsAPI.getAll()).data,
    enabled: formData.role === "doctor",
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => (await api.post("/auth/register", data)).data,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onRegister) onRegister(data.user);

      // Redirect based on role
      if (data.user.role === "doctor") {
        navigate("/doctors");
      } else {
        navigate("/my-appointments");
      }
    },
    onError: (error) => {
      setError(
        error.response?.data?.error || "Registration failed. Please try again.",
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.email || !formData.full_name || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    // Remove confirmPassword before sending
    const { confirmPassword, ...dataToSend } = formData;
    registerMutation.mutate(dataToSend);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-hero">
          <span className="auth-badge">PulsePoint</span>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Join the PulsePoint network to manage appointments, records, and communication in one secure place.
          </p>
          <div className="auth-highlights">
            <span className="auth-pill">Patients & doctors</span>
            <span className="auth-pill">Secure by default</span>
            <span className="auth-pill">Fast scheduling</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-eyebrow">Get started</p>
              <h2>Set up your profile</h2>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Dr. Jane Smith"
                required
              />
            </label>

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
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="auth-input"
                placeholder="+1 (555) 123-4567"
                required
              />
            </label>

            <div className="auth-form" style={{ gap: "10px" }}>
              <label className="auth-field">
                <span>Date of birth</span>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="auth-input"
                />
              </label>

              <label className="auth-field">
                <span>Gender</span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="auth-input"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <label className="auth-field">
              <span>Address</span>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="auth-input"
                placeholder="Street, City"
              />
            </label>

            <label className="auth-field">
              <span>Role</span>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="auth-input"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>

            {formData.role === "doctor" && (
              <div className="auth-form" style={{ gap: "10px" }}>
                <label className="auth-field">
                  <span>License number</span>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>

                <label className="auth-field">
                  <span>Specialization</span>
                  <select
                    name="specialization_id"
                    value={formData.specialization_id}
                    onChange={handleChange}
                    className="auth-input"
                  >
                    <option value="">Select specialization</option>
                    {specializations?.map((spec) => (
                      <option key={spec.spec_id} value={spec.spec_id}>
                        {spec.spec_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="auth-field">
                  <span>Experience (years)</span>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    className="auth-input"
                    min="0"
                  />
                </label>

                <label className="auth-field">
                  <span>Qualification</span>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="e.g., MBBS, MD"
                  />
                </label>
              </div>
            )}

            <div className="auth-form" style={{ gap: "10px" }}>
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Min. 6 characters"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="auth-input"
                  required
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="auth-primary-btn"
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p className="auth-demo-note">Already registered?</p>
            <Link to="/login" className="auth-link-btn">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
