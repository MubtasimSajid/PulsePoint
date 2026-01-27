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
    consultation_fee: "",
    qualification: "",
    // Hospital admin specific
    hospital_name: "",
    hospital_license_number: "",
    hospital_tax_id: "",
    hospital_type: "",
    hospital_category: "",
    hospital_specialty: "",
    hospital_website_url: "",
    hospital_branch_count: 1,
    hospital_branch_addresses: [""],
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState("initial"); // 'initial', 'user_select', 'form'

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
          const missing =
            data.onboarding.missing_fields?.join(", ") || "profile information";
          window.alert(`Please complete your profile: ${missing}`);
        }
      }

      if (onRegister) onRegister(data.user);

      // Redirect based on role
      if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (data.user.role === "hospital_admin") {
        navigate("/hospitals");
      } else {
        navigate("/my-appointments");
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.error || "Registration failed.";
      const details = error.response?.data?.details
        ? ` (${error.response.data.details})`
        : "";
      setError(msg + details);
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

    if (formData.role === "hospital_admin") {
      if (!formData.email || !formData.hospital_name) {
        setError("Please provide hospital name and official email");
        return;
      }

      if (!formData.hospital_license_number) {
        setError("Registration/License number is required");
        return;
      }
      if (!formData.hospital_tax_id) {
        setError("Tax ID / EIN is required");
        return;
      }
      if (!formData.hospital_type) {
        setError("Hospital type is required");
        return;
      }
      if (!formData.hospital_category) {
        setError("Hospital category is required");
        return;
      }
      if (
        formData.hospital_category === "single_specialty" &&
        !formData.hospital_specialty
      ) {
        setError("Please specify the hospital specialty");
        return;
      }
      if (!formData.hospital_website_url) {
        setError("Website URL is required");
        return;
      }

      const branchAddresses = Array.isArray(formData.hospital_branch_addresses)
        ? formData.hospital_branch_addresses
        : [];
      const filledBranches = branchAddresses
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
      if (filledBranches.length !== (formData.hospital_branch_count || 0)) {
        setError("Please enter a full address for every branch");
        return;
      }
    } else {
      if (!formData.email || !formData.full_name || !formData.phone) {
        setError("Please fill in all required fields");
        return;
      }
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
    const { confirmPassword: _confirmPassword, ...dataToSend } = formData;

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
      delete dataToSend.hospital_tax_id;
      delete dataToSend.hospital_type;
      delete dataToSend.hospital_category;
      delete dataToSend.hospital_specialty;
      delete dataToSend.hospital_website_url;
      delete dataToSend.hospital_branch_count;
      delete dataToSend.hospital_branch_addresses;
    }
    if (dataToSend.role === "hospital_admin") {
      delete dataToSend.height_cm;
      delete dataToSend.weight_kg;
      delete dataToSend.blood_group;
      delete dataToSend.emergency_contact;
      delete dataToSend.date_of_birth;
      delete dataToSend.address;
      delete dataToSend.gender;

      // Hospital registration uses official email as the admin login email.

      // Not collected for hospitals; backend derives an admin display name.
      delete dataToSend.full_name;
      delete dataToSend.phone;
    } else if (dataToSend.role === "doctor") {
      delete dataToSend.height_cm;
      delete dataToSend.weight_kg;
      delete dataToSend.blood_group;
      delete dataToSend.emergency_contact;
    }

    // Sanitize numeric fields before sending
    if (dataToSend.experience_years === "") dataToSend.experience_years = null;

    if (dataToSend.role === "hospital_admin") {
      const count = parseInt(dataToSend.hospital_branch_count, 10);
      dataToSend.hospital_branch_count = Number.isFinite(count) ? count : 1;
      dataToSend.hospital_branch_addresses = Array.isArray(
        dataToSend.hospital_branch_addresses,
      )
        ? dataToSend.hospital_branch_addresses.map((v) =>
            typeof v === "string" ? v.trim() : "",
          )
        : [];
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

  const handleBranchCountChange = (e) => {
    const nextCountRaw = e.target.value;
    const nextCount = Math.max(
      1,
      Math.min(20, parseInt(nextCountRaw, 10) || 1),
    );

    setFormData((prev) => {
      const existing = Array.isArray(prev.hospital_branch_addresses)
        ? prev.hospital_branch_addresses
        : [];
      const nextAddresses = Array.from({ length: nextCount }, (_, i) =>
        typeof existing[i] === "string" ? existing[i] : "",
      );

      return {
        ...prev,
        hospital_branch_count: nextCount,
        hospital_branch_addresses: nextAddresses,
      };
    });
    setError("");
  };

  const handleBranchAddressChange = (index, value) => {
    setFormData((prev) => {
      const next = Array.isArray(prev.hospital_branch_addresses)
        ? [...prev.hospital_branch_addresses]
        : [];
      next[index] = value;
      return { ...prev, hospital_branch_addresses: next };
    });
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell--split">
        <div className="auth-hero">
          <span className="auth-badge">PulsePoint</span>
          <h1 className="auth-title">Care, simplified.</h1>
          <p className="auth-subtitle">
            Connect with your care team, manage appointments, and stay on top of
            your health without the clutter.
          </p>
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
            {step === "initial" && (
              <div className="grid gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep("user_select")}
                  className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                >
                  Register as User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setFormData({ ...formData, role: "hospital_admin" });
                  }}
                  className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                >
                  Register as Hospital
                </button>
              </div>
            )}

            {step === "user_select" && (
              <div className="grid gap-3 mb-6 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setFormData({ ...formData, role: "patient" });
                  }}
                  className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setFormData({ ...formData, role: "doctor" });
                  }}
                  className="auth-secondary-btn py-4 text-lg flex items-center justify-center gap-3"
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setStep("initial")}
                  className="text-slate-500 hover:text-indigo-600 text-sm font-medium pt-2"
                >
                  ← Back
                </button>
              </div>
            )}

            {step === "form" && (
              <div className="animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setStep("initial");
                    setError("");
                  }}
                  className="mb-6 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-sm group w-fit"
                >
                  <svg
                    className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Change Role
                </button>

                {formData.role !== "hospital_admin" && (
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
                )}

                {formData.role === "hospital_admin" && (
                  <>
                    <label className="auth-field">
                      <span>Hospital Name (Official registered name)</span>
                      <input
                        type="text"
                        name="hospital_name"
                        value={formData.hospital_name}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="e.g., Sunrise Medical Center"
                        required
                      />
                    </label>

                    <label className="auth-field">
                      <span>Registration / License Number</span>
                      <input
                        type="text"
                        name="hospital_license_number"
                        value={formData.hospital_license_number}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="Government-issued registration/license ID"
                        required
                      />
                    </label>

                    <label className="auth-field">
                      <span>Tax ID / EIN</span>
                      <input
                        type="text"
                        name="hospital_tax_id"
                        value={formData.hospital_tax_id}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="Tax identifier (for financial processing)"
                        required
                      />
                    </label>

                    <div className="auth-form" style={{ gap: "10px" }}>
                      <label className="auth-field">
                        <span>Hospital Type</span>
                        <select
                          name="hospital_type"
                          value={formData.hospital_type}
                          onChange={handleChange}
                          className="auth-input"
                          required
                        >
                          <option value="">Select</option>
                          <option value="public">Public (Govt)</option>
                          <option value="private">Private</option>
                          <option value="trust_charity">Trust / Charity</option>
                          <option value="military">Military</option>
                        </select>
                      </label>

                      <label className="auth-field">
                        <span>Category</span>
                        <select
                          name="hospital_category"
                          value={formData.hospital_category}
                          onChange={handleChange}
                          className="auth-input"
                          required
                        >
                          <option value="">Select</option>
                          <option value="general">General</option>
                          <option value="multi_specialty">
                            Multi-Specialty
                          </option>
                          <option value="single_specialty">
                            Single Specialty
                          </option>
                        </select>
                      </label>
                    </div>

                    {formData.hospital_category === "single_specialty" && (
                      <label className="auth-field">
                        <span>Specialty (e.g., Cardiac, Eye, Ortho)</span>
                        <input
                          type="text"
                          name="hospital_specialty"
                          value={formData.hospital_specialty}
                          onChange={handleChange}
                          className="auth-input"
                          placeholder="e.g., Cardiac"
                          required
                        />
                      </label>
                    )}

                    <label className="auth-field">
                      <span>Website URL</span>
                      <input
                        type="url"
                        name="hospital_website_url"
                        value={formData.hospital_website_url}
                        onChange={handleChange}
                        className="auth-input"
                        placeholder="https://www.examplehospital.com"
                        required
                      />
                    </label>

                    <label className="auth-field">
                      <span>Number of branches</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        name="hospital_branch_count"
                        value={formData.hospital_branch_count}
                        onChange={handleBranchCountChange}
                        className="auth-input"
                        required
                      />
                    </label>

                    {(formData.hospital_branch_addresses || []).map(
                      (addr, idx) => (
                        <label className="auth-field" key={idx}>
                          <span>Branch Address {idx + 1} (Full Address)</span>
                          <input
                            type="text"
                            value={addr}
                            onChange={(e) =>
                              handleBranchAddressChange(idx, e.target.value)
                            }
                            className="auth-input"
                            placeholder="Street, City, State, ZIP, Country"
                            required
                          />
                        </label>
                      ),
                    )}
                  </>
                )}

                <label className="auth-field">
                  <span>
                    {formData.role === "hospital_admin"
                      ? "Official Email Address"
                      : "Email"}
                  </span>
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

                {formData.role !== "hospital_admin" && (
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
                )}

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
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
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
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
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
                      <span>Consultation Fee ($)</span>
                      <input
                        type="number"
                        step="0.01"
                        name="consultation_fee"
                        value={formData.consultation_fee}
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

                {/* Hospital admin registration is intentionally minimal (name + email only). */}

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
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </button>
              </div>
            )}
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
