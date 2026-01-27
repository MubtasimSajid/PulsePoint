import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsAPI } from "../services/api";

export default function Patients() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    patient_code: "",
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    medical_notes: "",
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await patientsAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: patientsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: patientsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const openModal = (patient = null) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData(patient);
    } else {
      setEditingPatient(null);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        dob: "",
        address: "",
        patient_code: "",
        height_cm: "",
        weight_kg: "",
        blood_group: "",
        medical_notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.user_id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading patients...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
            Patients
          </h1>
          <p className="text-secondary mt-2">Manage patient records and information</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Patient
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients?.map((patient) => (
                <tr key={patient.user_id} className="hover:bg-indigo-50/50 transition-colors duration-200 group">
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm font-mono font-medium">
                      {patient.patient_code}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {patient.full_name?.charAt(0) || 'P'}
                      </div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {patient.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-foreground">{patient.email}</td>
                  <td className="px-6 py-5 text-foreground">{patient.phone}</td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-lg text-sm font-semibold border border-rose-200">
                      {patient.blood_group || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(patient)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(patient.user_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-100 rounded-lg font-medium text-sm transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {editingPatient ? "Edit Patient" : "Add New Patient"}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Patient Code</label>
                  <input
                    type="text"
                    placeholder="Patient Code"
                    value={formData.patient_code}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_code: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Blood Group</label>
                  <input
                    type="text"
                    placeholder="Blood Group"
                    value={formData.blood_group}
                    onChange={(e) =>
                      setFormData({ ...formData, blood_group: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Height (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Height (cm)"
                    value={formData.height_cm}
                    onChange={(e) =>
                      setFormData({ ...formData, height_cm: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Weight (kg)"
                    value={formData.weight_kg}
                    onChange={(e) =>
                      setFormData({ ...formData, weight_kg: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Address</label>
                <textarea
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  rows="2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Medical Notes</label>
                <textarea
                  placeholder="Medical Notes"
                  value={formData.medical_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, medical_notes: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {editingPatient ? "Update Patient" : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
