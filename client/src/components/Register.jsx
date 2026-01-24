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
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    emergency_contact: "",
    role: "patient",
    // Doctor specific
    license_number: "",
    specialization_id: "",
    experience_years: "",
    qualification: "",
    // Hospital admin specific
    hospital_name: "",
    hospital_license_number: "",
    hospital_address: "",
    hospital_phone: "",
    hospital_email: "",
    hospital_est_year: "",
  });
  const [error, setError] = useState("");
  const [showUserChoice, setShowUserChoice] = useState(false);
  const [hideHospital, setHideHospital] = useState(false);

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
      if (data.onboarding) {
        localStorage.setItem("onboarding", JSON.stringify(data.onboarding));
        if (data.onboarding.required) {
          const missing = data.onboarding.missing_fields?.join(", ") || "profile information";
          window.alert(`Please complete your profile: ${missing}`);
        }
      }

      if (onRegister) onRegister(data.user);

      // Redirect based on role
      if (data.user.role === "doctor") {
        navigate("/doctors");
      } else if (data.user.role === "hospital_admin") {
        navigate("/hospitals");
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

    if (formData.role === "patient") {
      if (!formData.date_of_birth) {
        setError("Date of birth is required for patients");
        return;
      }
      if (!formData.address) {
        setError("Address is required for patients");
        return;
      }
    }

    // Remove confirmPassword before sending
    const { confirmPassword, ...dataToSend } = formData;

    // Prune unused role fields
    if (dataToSend.role !== "doctor") {
      delete dataToSend.license_number;
      delete dataToSend.specialization_id;
      delete dataToSend.experience_years;
      delete dataToSend.qualification;
    }
    if (dataToSend.role !== "hospital_admin") {
      delete dataToSend.hospital_name;
      delete dataToSend.hospital_license_number;
      delete dataToSend.hospital_address;
      delete dataToSend.hospital_phone;
      delete dataToSend.hospital_email;
      delete dataToSend.hospital_est_year;
    }
    if (dataToSend.role !== "patient") {
      delete dataToSend.height_cm;
      delete dataToSend.weight_kg;
      delete dataToSend.blood_group;
      delete dataToSend.emergency_contact;
      delete dataToSend.date_of_birth;
      delete dataToSend.address;
      delete dataToSend.gender;
    }

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
            <div className="auth-demo-btns" style={{ marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowUserChoice((v) => !v);
                  setHideHospital(true);
                }}
                className="auth-secondary-btn"
              >
                Register as User
              </button>
              {!hideHospital && (
                <button
                  type="button"
                  onClick={() => {
                    setHideHospital(false);
                    setShowUserChoice(false);
                    setFormData({ ...formData, role: "hospital_admin" });
                  }}
                  className="auth-secondary-btn"
                >
                  Register as Hospital
                </button>
              )}
            </div>

            {showUserChoice && (
              <div className="auth-demo-btns" style={{ marginTop: "8px", marginBottom: "12px" }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "patient" })}
                  className="auth-secondary-btn"
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "doctor" })}
                  className="auth-secondary-btn"
                >
                  Doctor
                </button>
              </div>
            )}

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

            {formData.role === "patient" && (
              <>
                <div className="auth-form" style={{ gap: "10px" }}>
                  <label className="auth-field">
                    <span>Date of birth</span>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="auth-input"
                      required
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
                    required
                  />
                </label>

                <div className="auth-form" style={{ gap: "10px" }}>
                  <label className="auth-field">
                    <span>Weight (kg)</span>
                    <input
                      type="number"
                      name="weight_kg"
                      value={formData.weight_kg}
                      onChange={handleChange}
                      className="auth-input"
                      min="0"
                      step="0.1"
                    />
                  </label>
                  <label className="auth-field">
                    <span>Height (cm)</span>
                    <input
                      type="number"
                      name="height_cm"
                      value={formData.height_cm}
                      onChange={handleChange}
                      className="auth-input"
                      min="0"
                      step="0.1"
                    />
                  </label>
                </div>

                <div className="auth-form" style={{ gap: "10px" }}>
                  <label className="auth-field">
                    <span>Blood group</span>
                    <input
                      type="text"
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g., A+, O-"
                    />
                  </label>
                  <label className="auth-field">
                    <span>Emergency contact</span>
                    <input
                      type="tel"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Emergency contact phone"
                    />
                  </label>
                </div>
              </>
            )}

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

            {formData.role === "hospital_admin" && (
              <div className="auth-form" style={{ gap: "10px" }}>
                <label className="auth-field">
                  <span>Hospital name</span>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="e.g., Sunrise Medical Center"
                  />
                </label>

                <label className="auth-field">
                  <span>License number</span>
                  <input
                    type="text"
                    name="hospital_license_number"
                    value={formData.hospital_license_number}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>

                <label className="auth-field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    name="hospital_phone"
                    value={formData.hospital_phone}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Front desk phone"
                  />
                </label>

                <label className="auth-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="hospital_email"
                    value={formData.hospital_email}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="info@hospital.com"
                  />
                </label>

                <label className="auth-field">
                  <span>Address</span>
                  <input
                    type="text"
                    name="hospital_address"
                    value={formData.hospital_address}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Street, City"
                  />
                </label>

                <label className="auth-field">
                  <span>Est. year</span>
                  <input
                    type="number"
                    name="hospital_est_year"
                    value={formData.hospital_est_year}
                    onChange={handleChange}
                    className="auth-input"
                    min="1800"
                    max="2100"
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
