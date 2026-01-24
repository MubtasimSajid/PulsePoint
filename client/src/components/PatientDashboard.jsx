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
        return "text-slate-600";
    }
  };

  const tabs = [
    { id: "today", label: "Today", icon: "📍", gradient: "from-blue-500 to-indigo-600" },
    { id: "upcoming", label: "Upcoming", icon: "📅", gradient: "from-emerald-500 to-teal-600" },
    { id: "past", label: "Past", icon: "🕒", gradient: "from-slate-500 to-slate-600" },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading appointments...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header with notification bell */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
            My Appointments
          </h1>
          <p className="text-slate-500 mt-2">View and manage your scheduled visits</p>
        </div>
        <div className="relative">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 relative group">
            <svg className="w-6 h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount?.count > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount.count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      <div className="space-y-5">
        {appointments?.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No {activeTab} appointments</h3>
            <p className="text-slate-500">Your appointments will appear here</p>
          </div>
        )}

        {appointments?.map((appt, idx) => (
          <div
            key={appt.appt_id}
            className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl animate-fade-in ${
              activeTab === "today" ? "ring-2 ring-indigo-500/20" : ""
            }`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {/* Top accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${
              activeTab === "today" ? "from-blue-500 to-indigo-600" :
              activeTab === "upcoming" ? "from-emerald-500 to-teal-600" : "from-slate-400 to-slate-500"
            }`}></div>
            
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                      {appt.doctor_name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Dr. {appt.doctor_name}</h3>
                      {appt.status && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                            appt.status === "confirmed"
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                              : appt.status === "pending"
                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200"
                                : "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            appt.status === "confirmed" ? "bg-emerald-500" :
                            appt.status === "pending" ? "bg-amber-500" : "bg-slate-500"
                          }`}></span>
                          {appt.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date
                      </div>
                      <p className="font-semibold text-slate-800">
                        {new Date(appt.appt_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Time
                      </div>
                      <p className="font-semibold text-slate-800">{appt.appt_time}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location
                      </div>
                      <p className="font-semibold text-slate-800">{appt.location || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Fee
                      </div>
                      <p className="font-semibold text-emerald-600">${appt.consultation_fee || "N/A"}</p>
                    </div>
                  </div>

                  {/* Triage Notes Section */}
                  {appt.symptoms && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Triage Information
                      </h4>
                      <div className="text-sm space-y-2">
                        <p className="text-slate-700">
                          <span className="font-semibold">Symptoms:</span> {appt.symptoms}
                        </p>
                        {appt.severity && (
                          <p className="text-slate-700">
                            <span className="font-semibold">Severity:</span>{" "}
                            <span className={`font-bold uppercase ${getSeverityColor(appt.severity)}`}>
                              {appt.severity}
                            </span>
                          </p>
                        )}
                        {appt.triage_notes && (
                          <p className="text-slate-700">
                            <span className="font-semibold">Notes:</span> {appt.triage_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(activeTab === "today" || activeTab === "upcoming") && (
                  <div className="ml-6">
                    <button
                      onClick={() => handleCancelAppointment(appt.appt_id)}
                      disabled={cancelMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Sidebar */}
      {notifications && notifications.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Recent Notifications</h2>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.notification_id}
                className={`bg-white rounded-xl p-4 shadow-lg border-l-4 transition-all duration-300 hover:-translate-y-0.5 ${
                  notif.is_read
                    ? "border-slate-300"
                    : "border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-white"
                }`}
              >
                <p className="text-sm text-slate-700">{notif.message}</p>
                <p className="text-xs text-slate-500 mt-2">
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
