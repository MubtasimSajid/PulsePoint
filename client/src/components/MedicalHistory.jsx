import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalHistoryAPI, patientsAPI, doctorsAPI } from "../services/api";

export default function MedicalHistory() {
  const queryClient = useQueryClient();
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    visit_date: "",
    diagnosis: "",
    notes: "",
  });

  const { data: medicalHistory, isLoading } = useQuery({
    queryKey: ["medicalHistory"],
    queryFn: async () => (await medicalHistoryAPI.getAll()).data,
  });

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await patientsAPI.getAll()).data,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => (await doctorsAPI.getAll()).data,
  });

  const derivedDoctors = useMemo(() => {
    const list = [];
    const seen = new Set();
    doctors?.forEach((doc) => {
      if (!doc?.user_id) return;
      const id = String(doc.user_id);
      if (seen.has(id)) return;
      seen.add(id);
      list.push({ user_id: id, full_name: doc.full_name || "Unknown" });
    });

    // Ensure the logged-in doctor is available as an option
    if (currentUser?.role === "doctor" && currentUser?.user_id) {
      const id = String(currentUser.user_id);
      if (!seen.has(id)) {
        seen.add(id);
        list.push({ user_id: id, full_name: currentUser.full_name || "Current Doctor" });
      }
    }

    // Fallback: build from existing medical history if doctor list is empty
    if (!list.length && medicalHistory?.length) {
      medicalHistory.forEach((h) => {
        if (!h.doctor_id) return;
        const id = String(h.doctor_id);
        if (seen.has(id)) return;
        seen.add(id);
        list.push({ user_id: id, full_name: h.doctor_name || "Unknown" });
      });
    }

    return list;
  }, [doctors, medicalHistory]);

  const doctorLookup = useMemo(() => {
    const map = {};
    derivedDoctors.forEach((doc) => {
      if (doc?.user_id) map[String(doc.user_id)] = doc.full_name;
    });
    return map;
  }, [derivedDoctors]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const createMutation = useMutation({
    mutationFn: medicalHistoryAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalHistory"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => medicalHistoryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalHistory"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: medicalHistoryAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicalHistory"] });
    },
  });

  const openModal = (history = null) => {
    if (history) {
      setEditingHistory(history);
      setFormData({
        patient_id: history.patient_id ? String(history.patient_id) : "",
        doctor_id: history.doctor_id ? String(history.doctor_id) : "",
        visit_date: history.visit_date.split("T")[0],
        diagnosis: history.diagnosis || "",
        notes: history.notes || "",
      });
    } else {
      setEditingHistory(null);
      setFormData({
        patient_id: "",
        doctor_id: "",
        visit_date: "",
        diagnosis: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHistory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHistory) {
      updateMutation.mutate({ id: editingHistory.history_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this medical history record?",
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading medical records...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center gap-4 sticky top-4 z-10 bg-white/90 backdrop-blur border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
              Medical History
            </h1>
            <p className="text-slate-500 mt-2">Patient visit records and diagnoses</p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
        {medicalHistory?.map((history, idx) => (
          <div
            key={history.history_id}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex">
              {/* Left accent bar */}
              <div className="w-2 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                      {history.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {history.patient_name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Dr. {history.doctor_name || doctorLookup[String(history.doctor_id)] || "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(history.visit_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button
                        onClick={() => openModal(history)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium text-sm hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(history.history_id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-rose-600 bg-rose-50 rounded-lg font-medium text-sm hover:bg-rose-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Diagnosis
                    </div>
                    <p className="text-slate-700 font-medium">{history.diagnosis || "N/A"}</p>
                  </div>
                  {history.notes && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Clinical Notes
                      </div>
                      <p className="text-slate-600">{history.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-start md:items-center p-4 md:p-8 overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-slide-in mt-10 md:mt-0 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingHistory
                    ? "Edit Medical History"
                    : "Add New Medical History"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Patient</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients?.map((patient) => (
                      <option key={patient.user_id} value={patient.user_id}>
                        {patient.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor</label>
                  <select
                    value={formData.doctor_id}
                    onChange={(e) =>
                      setFormData({ ...formData, doctor_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {derivedDoctors.length === 0 && (
                      <option disabled>No doctors found</option>
                    )}
                    {derivedDoctors.map((doctor) => (
                      <option key={doctor.user_id} value={doctor.user_id}>
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Visit Date</label>
                <input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) =>
                    setFormData({ ...formData, visit_date: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis</label>
                <textarea
                  placeholder="Enter diagnosis details"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Clinical Notes</label>
                <textarea
                  placeholder="Enter additional notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  rows="4"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
                >
                  {editingHistory ? "Update Record" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
