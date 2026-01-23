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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hospitals</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Hospital
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals?.map((hospital) => (
          <div
            key={hospital.hospital_id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{hospital.name}</h3>
              <span className="text-sm text-gray-500">
                Est. {hospital.est_year}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Admin:</strong> {hospital.admin_name}
              </p>
              <p>
                <strong>Email:</strong> {hospital.email}
              </p>
              <p>
                <strong>Phone:</strong> {hospital.phone}
              </p>
              <p>
                <strong>License:</strong> {hospital.license_number}
              </p>
              <p className="text-gray-500">{hospital.address}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => openModal(hospital)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(hospital.hospital_id)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingHospital ? "Edit Hospital" : "Add New Hospital"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Hospital Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border rounded px-3 py-2 col-span-2"
                  required
                />
                <select
                  value={formData.admin_user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_user_id: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Admin</option>
                  {users?.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Established Year"
                  value={formData.est_year}
                  onChange={(e) =>
                    setFormData({ ...formData, est_year: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="License Number"
                  value={formData.license_number}
                  onChange={(e) =>
                    setFormData({ ...formData, license_number: e.target.value })
                  }
                  className="border rounded px-3 py-2 col-span-2"
                />
              </div>
              <textarea
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
                rows="3"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingHospital ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
