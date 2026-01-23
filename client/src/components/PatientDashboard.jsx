import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsAPI, notificationsAPI } from "../services/api";

export default function PatientDashboard({ patientId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today"); // today, upcoming, past

  // Fetch appointments with filter
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["patientAppointments", patientId, activeTab],
    queryFn: async () =>
      (await appointmentsAPI.getByPatient(patientId, { filter: activeTab }))
        .data,
    enabled: !!patientId,
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["notifications", patientId],
    queryFn: async () =>
      (await notificationsAPI.getNotifications(patientId)).data,
    enabled: !!patientId,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadNotifications", patientId],
    queryFn: async () =>
      (await notificationsAPI.getUnreadCount(patientId)).data,
    enabled: !!patientId,
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async (appointmentId) =>
      (await appointmentsAPI.delete(appointmentId)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientAppointments"] });
      alert("Appointment cancelled successfully");
    },
  });

  const handleCancelAppointment = (appointmentId) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      cancelMutation.mutate(appointmentId);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-600 font-bold";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const tabs = [
    { id: "today", label: "Today", icon: "📍", color: "bg-blue-500" },
    { id: "upcoming", label: "Upcoming", icon: "📅", color: "bg-green-500" },
    { id: "past", label: "Past", icon: "🕒", color: "bg-gray-500" },
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* Header with notification bell */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <div className="relative">
          <button className="text-2xl relative">
            🔔
            {unreadCount?.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount.count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {appointments?.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No {activeTab} appointments found.
          </div>
        )}

        {appointments?.map((appt) => (
          <div
            key={appt.appt_id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              activeTab === "today"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">Dr. {appt.doctor_name}</h3>
                  {appt.status && (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        appt.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : appt.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {appt.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(appt.appt_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div>
                    <strong>Time:</strong> {appt.appt_time}
                  </div>
                  <div>
                    <strong>Location:</strong> {appt.location || "N/A"}
                  </div>
                  <div>
                    <strong>Consultation Fee:</strong> $
                    {appt.consultation_fee || "N/A"}
                  </div>
                </div>

                {/* Triage Notes Section */}
                {appt.symptoms && (
                  <div className="bg-gray-50 rounded p-3 mt-3 border-l-2 border-gray-300">
                    <h4 className="font-semibold text-sm mb-2">
                      Triage Information:
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Symptoms:</strong> {appt.symptoms}
                      </p>
                      {appt.severity && (
                        <p>
                          <strong>Severity:</strong>{" "}
                          <span className={getSeverityColor(appt.severity)}>
                            {appt.severity.toUpperCase()}
                          </span>
                        </p>
                      )}
                      {appt.triage_notes && (
                        <p>
                          <strong>Notes:</strong> {appt.triage_notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(activeTab === "today" || activeTab === "upcoming") && (
                <div className="ml-4">
                  <button
                    onClick={() => handleCancelAppointment(appt.appt_id)}
                    disabled={cancelMutation.isPending}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Sidebar (Optional - can be moved to a separate component) */}
      {notifications && notifications.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Notifications</h2>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.notification_id}
                className={`p-3 rounded border-l-4 ${
                  notif.is_read
                    ? "bg-gray-50 border-gray-300"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
