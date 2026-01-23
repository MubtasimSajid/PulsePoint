import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsAPI, patientsAPI, doctorsAPI } from "../services/api";

export default function Appointments() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    appt_date: "",
    appt_time: "",
    status: "scheduled",
    note: "",
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await appointmentsAPI.getAll()).data,
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
    mutationFn: appointmentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appointmentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: appointmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const openModal = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appt_date: appointment.appt_date.split("T")[0],
        appt_time: appointment.appt_time,
        status: appointment.status,
        note: appointment.note || "",
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        patient_id: "",
        doctor_id: "",
        appt_date: "",
        appt_time: "",
        status: "scheduled",
        note: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAppointment) {
      updateMutation.mutate({
        id: editingAppointment.appointment_id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Schedule Appointment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments?.map((appointment) => (
              <tr key={appointment.appointment_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.patient_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.doctor_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(appointment.appt_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {appointment.appt_time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === "scheduled"
                        ? "bg-green-100 text-green-800"
                        : appointment.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => openModal(appointment)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(appointment.appointment_id)}
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
                {editingAppointment
                  ? "Edit Appointment"
                  : "Schedule New Appointment"}
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
                  value={formData.appt_date}
                  onChange={(e) =>
                    setFormData({ ...formData, appt_date: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="time"
                  value={formData.appt_time}
                  onChange={(e) =>
                    setFormData({ ...formData, appt_time: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                  required
                />
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <textarea
                placeholder="Notes"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
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
                  {editingAppointment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
