import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalHistoryAPI, patientsAPI, doctorsAPI } from "../services/api";

export default function MedicalHistory() {
  const queryClient = useQueryClient();
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
        patient_id: history.patient_id,
        doctor_id: history.doctor_id,
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Medical History</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Record
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {medicalHistory?.map((history) => (
          <div
            key={history.history_id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-600">
                  {history.patient_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Doctor: {history.doctor_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {new Date(history.visit_date).toLocaleDateString()}
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => openModal(history)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(history.history_id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Diagnosis:</strong> {history.diagnosis || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Notes:</strong> {history.notes || "No notes"}
              </p>
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
                {editingHistory
                  ? "Edit Medical History"
                  : "Add New Medical History"}
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
                <select
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients?.map((patient) => (
                    <option key={patient.user_id} value={patient.user_id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.doctor_id}
                  onChange={(e) =>
                    setFormData({ ...formData, doctor_id: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors?.map((doctor) => (
                    <option key={doctor.user_id} value={doctor.user_id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) =>
                    setFormData({ ...formData, visit_date: e.target.value })
                  }
                  className="border rounded px-3 py-2 col-span-2"
                  required
                />
              </div>
              <textarea
                placeholder="Diagnosis"
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
                rows="3"
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
                rows="4"
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
                  {editingHistory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
