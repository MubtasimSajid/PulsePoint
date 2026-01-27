import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI, patientsAPI } from "../services/api";

export default function Profile({ userId, onUserUpdate }) {
  const queryClient = useQueryClient();
  const toInputDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    emergency_contact: "",
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => (await usersAPI.getById(userId)).data,
    enabled: !!userId,
  });

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", userId],
    queryFn: async () => (await patientsAPI.getById(userId)).data,
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData) {
      setForm((prev) => ({
        ...prev,
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        date_of_birth: toInputDate(userData.date_of_birth),
        address: userData.address || "",
        gender: userData.gender || "",
      }));
    }
    if (patientData) {
      setForm((prev) => ({
        ...prev,
        height_cm: patientData.height_cm ?? "",
        weight_kg: patientData.weight_kg ?? "",
        blood_group: patientData.blood_group || "",
        emergency_contact: patientData.emergency_contact || "",
      }));
    }
  }, [userData, patientData]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const heightVal = form.height_cm === "" ? null : Number(form.height_cm);
      const weightVal = form.weight_kg === "" ? null : Number(form.weight_kg);

      const genderLocked = Boolean(userData?.gender);
      const bloodGroupLocked = Boolean(patientData?.blood_group);
      const patientPayload = {
        height_cm: Number.isNaN(heightVal) ? null : heightVal,
        weight_kg: Number.isNaN(weightVal) ? null : weightVal,
        address: form.address,
        gender: genderLocked ? userData.gender : form.gender,
        blood_group: bloodGroupLocked
          ? patientData.blood_group
          : form.blood_group,
        emergency_contact: form.emergency_contact,
      };
      await patientsAPI.update(userId, patientPayload);
    },
    onSuccess: async () => {
      const [freshUser] = await Promise.all([
        usersAPI.getById(userId).then((r) => r.data),
        queryClient.invalidateQueries({ queryKey: ["patient", userId] }),
        queryClient.invalidateQueries({ queryKey: ["user", userId] }),
      ]);
      if (onUserUpdate && freshUser) {
        localStorage.setItem("user", JSON.stringify(freshUser));
        onUserUpdate(freshUser);
      }
      alert("Profile updated. Age and BMI recalculated.");
    },
    onError: (err) => {
      alert(err?.response?.data?.message || err.message || "Update failed");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!userId)
    return <div className="text-center text-slate-600">No user found.</div>;
  if (userData && userData.role !== "patient") {
    return (
      <div className="text-center text-slate-600">
        Profile editing is only available for patients.
      </div>
    );
  }
  if (userLoading || patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const computedAge = userData?.age_years ?? "-";
  const computedBmi = patientData?.bmi ?? "-";

  const genderLocked = Boolean(userData?.gender);
  const bloodGroupLocked = Boolean(patientData?.blood_group);

  return (
    <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl p-10 animate-fade-in" style={{ marginLeft: '40px' }}>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[#3AAFA9] uppercase tracking-wide">
            Profile
          </h1>
        </div>
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50" style={{ padding: '12px 20px' }}>
          <div className="flex items-center gap-2">
            <span className="text-base text-slate-500 dark:text-slate-400 font-medium">Age:</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{computedAge}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base text-slate-500 dark:text-slate-400 font-medium">BMI:</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{computedBmi}</span>
          </div>
        </div>
      </div>

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
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">Gender</label>
          <select
            name="gender"
            value={form.gender || ""}
            onChange={handleChange}
            className="input-premium"
            disabled
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
            Height (cm)
          </label>
          <input
            type="number"
            step="0.1"
            name="height_cm"
            value={form.height_cm}
            onChange={handleChange}
            className="input-premium"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            name="weight_kg"
            value={form.weight_kg}
            onChange={handleChange}
            className="input-premium"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Blood Group
          </label>
          <input
            name="blood_group"
            value={form.blood_group}
            onChange={handleChange}
            className="input-premium"
            disabled={bloodGroupLocked}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground">
            Emergency Contact
          </label>
          <input
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={handleChange}
            className="input-premium"
          />
        </div>

        <div className="md:col-span-2 flex justify-end" style={{ marginTop: '-25px', marginBottom: '30px' }}>
          <button
            type="submit"
            className="bg-[#3AAFA9] text-white text-base font-semibold rounded-lg shadow-lg shadow-[#3AAFA9]/30 hover:-translate-y-0.5 transition-all"
            style={{ padding: '10px 22px' }}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
