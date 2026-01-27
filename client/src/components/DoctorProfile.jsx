import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsAPI, usersAPI } from "../services/api";

export default function DoctorProfile({ userId, onUserUpdate }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    license_number: "",
    experience_years: "",
    qualification: "",
    consultation_fee: "",
    doctor_code: "",
    specializations: [],
  });

  const toInputDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const { data: doctorData, isLoading } = useQuery({
    queryKey: ["doctor", userId],
    queryFn: async () => (await doctorsAPI.getById(userId)).data,
    enabled: !!userId,
  });

  useEffect(() => {
    if (doctorData) {
      const resolvedSpecs = (doctorData.specializations || [])
        .map((spec) =>
          typeof spec === "string" ? spec : spec?.spec_name || spec?.name || "",
        )
        .filter(Boolean);

      setForm((prev) => ({
        ...prev,
        full_name: doctorData.full_name || "",
        email: doctorData.email || "",
        phone: doctorData.phone || "",
        date_of_birth: toInputDate(doctorData.date_of_birth),
        gender: doctorData.gender || "",
        address: doctorData.address || "",
        license_number: doctorData.license_number || "",
        experience_years: doctorData.experience_years ?? "",
        qualification: doctorData.qualification || "",
        consultation_fee: doctorData.consultation_fee ?? "",
        doctor_code: doctorData.doctor_code || "",
        specializations: resolvedSpecs,
      }));
    }
  }, [doctorData]);

  const genderLocked = Boolean(doctorData?.gender);
  const dobLocked = Boolean(doctorData?.date_of_birth);
  const licenseLocked = Boolean(doctorData?.license_number);
  const experienceLocked =
    doctorData?.experience_years !== null &&
    doctorData?.experience_years !== undefined;
  const qualificationLocked = Boolean(doctorData?.qualification);

  const updateProfile = useMutation({
    mutationFn: async () => {
      // Send only the fields this screen is meant to edit.
      // Important: do NOT send `specializations` here because the API expects specialization IDs (integers),
      // while the GET endpoint returns specialization names (e.g. "Dermatology").
      const payload = {
        address: form.address,
        consultation_fee:
          form.consultation_fee === "" ? null : Number(form.consultation_fee),
        ...(genderLocked ? {} : { gender: form.gender }),
        ...(dobLocked ? {} : { date_of_birth: form.date_of_birth }),
        ...(licenseLocked ? {} : { license_number: form.license_number }),
        ...(qualificationLocked ? {} : { qualification: form.qualification }),
        ...(experienceLocked
          ? {}
          : {
              experience_years:
                form.experience_years === ""
                  ? null
                  : Number(form.experience_years),
            }),
      };

      if (
        payload.consultation_fee !== null &&
        Number.isNaN(payload.consultation_fee)
      ) {
        payload.consultation_fee = null;
      }
      if (
        Object.prototype.hasOwnProperty.call(payload, "experience_years") &&
        payload.experience_years !== null &&
        Number.isNaN(payload.experience_years)
      ) {
        payload.experience_years = null;
      }
      await doctorsAPI.update(userId, payload);
    },
    onSuccess: async () => {
      const freshUser = await usersAPI.getById(userId).then((r) => r.data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor", userId] }),
        queryClient.invalidateQueries({ queryKey: ["user", userId] }),
      ]);
      if (onUserUpdate && freshUser) {
        localStorage.setItem("user", JSON.stringify(freshUser));
        onUserUpdate(freshUser);
      }
      alert("Doctor profile updated.");
    },
    onError: (err) => {
      alert(err?.response?.data?.error || err.message || "Update failed");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!userId)
    return <div className="text-center text-muted-foreground">No user found.</div>;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl p-10 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">
            Profile
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Update your details
          </h1>
        </div>
      </div>

      {form.specializations && form.specializations.length > 0 && (
        <div className="mb-6 bg-background border border-border rounded-xl p-4 text-sm text-muted-foreground">
          <div className="font-semibold text-foreground mb-2">
            Specializations
          </div>
          <div className="flex flex-wrap gap-2">
            {form.specializations.map((spec, idx) => (
              <span
                key={`${spec}-${idx}`}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile.mutate();
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-10"
      >
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input-premium"
            required
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Full Name
          </label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            className="input-premium"
            required
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="input-premium"
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Date of Birth
          </label>
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth || ""}
            onChange={handleChange}
            className="input-premium"
            disabled={dobLocked}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">Gender</label>
          <select
            name="gender"
            value={form.gender || ""}
            onChange={handleChange}
            className="input-premium"
            disabled={genderLocked}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="input-premium"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            License Number
          </label>
          <input
            name="license_number"
            value={form.license_number}
            onChange={handleChange}
            className="input-premium"
            disabled={licenseLocked}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Experience (years)
          </label>
          <input
            type="number"
            name="experience_years"
            value={form.experience_years}
            onChange={handleChange}
            className="input-premium"
            min="0"
            disabled={experienceLocked}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Qualification
          </label>
          <input
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
            className="input-premium"
            disabled={qualificationLocked}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Consultation Fee
          </label>
          <input
            type="number"
            step="0.01"
            name="consultation_fee"
            value={form.consultation_fee}
            onChange={handleChange}
            className="input-premium"
            min="0"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
