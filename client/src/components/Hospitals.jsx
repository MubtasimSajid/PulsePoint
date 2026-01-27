import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hospitalsAPI, usersAPI } from "../services/api";

export default function Hospitals() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [formData, setFormData] = useState({
    admin_user_id: "",
    name: "",
    est_year: "",
    email: "",
    phone: "",
    address: "",
    license_number: "",
  });

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => (await hospitalsAPI.getAll()).data,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await usersAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: hospitalsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => hospitalsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: hospitalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
    },
  });

  const openModal = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital);
      setFormData(hospital);
    } else {
      setEditingHospital(null);
      setFormData({
        admin_user_id: "",
        name: "",
        est_year: "",
        email: "",
        phone: "",
        address: "",
        license_number: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHospital(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHospital) {
      updateMutation.mutate({
        id: editingHospital.hospital_id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this hospital?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading hospitals...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
            Hospitals
          </h1>
          <p className="text-slate-500 mt-2">Manage healthcare facilities</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Hospital
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals?.map((hospital, idx) => (
          <div
            key={hospital.hospital_id}
            className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Top accent */}
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                    {hospital.name?.charAt(0) || 'H'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{hospital.name}</h3>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Est. {hospital.est_year}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-secondary block">Admin</span>
                    <span className="font-medium text-foreground">{hospital.admin_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-secondary block">Email</span>
                    <span className="font-medium text-foreground">{hospital.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-secondary block">Phone</span>
                    <span className="font-medium text-foreground">{hospital.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs text-secondary block">License</span>
                    <span className="font-medium text-slate-700 font-mono">{hospital.license_number}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-muted-foreground text-xs">{hospital.address}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => openModal(hospital)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(hospital.hospital_id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 font-semibold rounded-xl hover:bg-rose-100 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fade-in">
          <div className="relative top-10 mx-auto p-8 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingHospital ? "Edit Hospital" : "Add New Hospital"}
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
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Hospital Name</label>
                <input
                  type="text"
                  placeholder="Enter hospital name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-foreground font-medium placeholder-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Admin</label>
                  <select
                    value={formData.admin_user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, admin_user_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    required
                  >
                    <option value="">Select Admin</option>
                    {users?.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Established Year</label>
                  <input
                    type="number"
                    placeholder="e.g., 2020"
                    value={formData.est_year}
                    onChange={(e) =>
                      setFormData({ ...formData, est_year: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-foreground font-medium placeholder-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="hospital@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-foreground font-medium placeholder-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-muted/50 border-2 border-border rounded-xl text-foreground font-medium placeholder-muted-foreground focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">License Number</label>
                <input
                  type="text"
                  placeholder="Enter license number"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData({ ...formData, license_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium font-mono placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Address</label>
                <textarea
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  rows="3"
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
                  {editingHospital ? "Update Hospital" : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
