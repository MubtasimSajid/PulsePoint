import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { notificationsAPI } from "../services/api";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";
import PatientMedicalHistory from "./PatientMedicalHistory";

export default function PatientDashboard({ patientId }) {
  const [activeSection, setActiveSection] = useState("appointments"); // appointments, medicines, history

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadNotifications", patientId],
    queryFn: async () =>
      (await notificationsAPI.getUnreadCount(patientId)).data,
    enabled: !!patientId,
  });

  const sections = [
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "medicines", label: "Medicines", icon: "💊" },
    { id: "history", label: "Medical History", icon: "📋" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-xl shadow-indigo-200/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-indigo-100 text-lg max-w-xl">
              Ready to take control of your health today?
            </p>
          </div>

          <div className="flex items-center gap-4">
             {/* Notification Bell */}
            <button className="relative p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all duration-200 group border border-white/10">
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount?.count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse ring-2 ring-indigo-600">
                  {unreadCount.count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Row within Hero */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/10 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-white font-semibold">Health Profile</p>
                <p className="text-indigo-200 text-sm">Complete</p>
              </div>
           </div>
           {/* Add more stats here if needed */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12 space-y-6">
           {/* Tabs */}
           <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 border border-white/5 rounded-xl w-fit backdrop-blur-sm overflow-x-auto max-w-full">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeSection === section.id
                    ? "bg-[#A38D5D] text-white shadow-lg shadow-[#A38D5D]/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 min-h-[500px]">
            {activeSection === "appointments" && (
              <PatientAppointments userId={patientId} />
            )}
            {activeSection === "medicines" && (
              <PatientPrescriptions userId={patientId} />
            )}
            {activeSection === "history" && (
              <PatientMedicalHistory userId={patientId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
