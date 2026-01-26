import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsAPI } from "../services/api";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";

export default function PatientDashboard({ patientId }) {
  const [activeSection, setActiveSection] = useState("appointments"); // appointments, medicines

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadNotifications", patientId],
    queryFn: async () =>
      (await notificationsAPI.getUnreadCount(patientId)).data,
    enabled: !!patientId,
  });

  const sections = [
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "medicines", label: "Medicines", icon: "💊" },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
            Patient Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Manage your health journey</p>
        </div>
        
        {/* Notification Bell */}
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

      {/* Main Navigation */}
      <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm w-fit">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
              activeSection === section.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl shadow-xl p-6 min-h-[500px]">
        {activeSection === "appointments" && (
          <PatientAppointments userId={patientId} />
        )}
        {activeSection === "medicines" && (
          <PatientPrescriptions userId={patientId} />
        )}
      </div>
    </div>
  );
}
