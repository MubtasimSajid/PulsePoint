import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionsAPI, appointmentsAPI } from "../services/api";

export default function Prescriptions() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [formData, setFormData] = useState({
    appointment_id: "",
    medicine_name: "",
    dosage: "",
    instructions: "",
    duration_days: "",
  });

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => (await prescriptionsAPI.getAll()).data,
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await appointmentsAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: prescriptionsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => prescriptionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: prescriptionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });

  const openModal = (prescription = null) => {
    if (prescription) {
      setEditingPrescription(prescription);
      setFormData(prescription);
    } else {
      setEditingPrescription(null);
      setFormData({
        appointment_id: "",
        medicine_name: "",
        dosage: "",
        instructions: "",
        duration_days: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPrescription(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPrescription) {
      updateMutation.mutate({
        id: editingPrescription.prescription_id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this prescription?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Prescription
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dosage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prescriptions?.map((prescription) => (
              <tr key={prescription.prescription_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  #{prescription.prescription_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prescription.patient_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prescription.doctor_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prescription.medicine_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prescription.dosage}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {prescription.duration_days} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(prescription)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(prescription.prescription_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingPrescription
                  ? "Edit Prescription"
                  : "Add New Prescription"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={formData.appointment_id}
                onChange={(e) =>
                  setFormData({ ...formData, appointment_id: e.target.value })
                }
                className="border rounded px-3 py-2 w-full"
                required
              >
                <option value="">Select Appointment</option>
                {appointments?.map((appointment) => (
                  <option
                    key={appointment.appointment_id}
                    value={appointment.appointment_id}
                  >
                    {appointment.patient_name} - {appointment.doctor_name} (
                    {new Date(appointment.appt_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Medicine Name"
                  value={formData.medicine_name}
                  onChange={(e) =>
                    setFormData({ ...formData, medicine_name: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg)"
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Duration (days)"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_days: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              </div>
              <textarea
                placeholder="Instructions"
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
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
                  {editingPrescription ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
