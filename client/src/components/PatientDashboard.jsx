import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { notificationsAPI, paymentAPI } from "../services/api";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";
import PatientMedicalHistory from "./PatientMedicalHistory";

export default function PatientDashboard({ patientId, user }) {
  const location = useLocation();
  const isMyAppointmentsRoute = location.pathname === "/my-appointments";
  const [activeSection, setActiveSection] = useState("appointments"); // appointments, medicines, history

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadNotifications", patientId],
    queryFn: async () =>
      (await notificationsAPI.getUnreadCount(patientId)).data,
    enabled: !!patientId,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await paymentAPI.getBalance()).data,
    enabled: !!user,
  });

  const sections = [
    { id: "appointments", label: "Appointments" },
    { id: "medicines", label: "Medicines" },
    { id: "history", label: "Medical History" },
  ];

  // If on /my-appointments route, show only appointments
  if (isMyAppointmentsRoute) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-600/50 p-6 min-h-[800px]">
          <PatientAppointments userId={patientId} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-32 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient shadow-xl shadow-primary/20 pb-32 md:pb-40 !mb-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div style={{ marginLeft: '20px' }}>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-relaxed mb-16 text-white">
                Welcome Back, {user?.full_name?.split(" ")[0] || "User"}
              </h1>
              <p className="text-slate-300 text-lg max-w-xl font-medium leading-loose">
                Ready to take control of your health today?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50" style={{ padding: '8px 12px' }}>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Balance</p>
              <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                {wallet ? `${wallet.currency} ${wallet.balance}` : "..."}
              </p>
            </div>

            {/* Notification Bell */}

          </div>
        </div>

        {/* Stats Row within Hero */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12">
          {/* Tabs */}
          <div className="flex items-center gap-6 bg-card/60 border border-slate-600/50 rounded-xl w-fit backdrop-blur-sm overflow-x-auto max-w-full mt-16 md:mt-20 mb-10" style={{ padding: '32px 48px' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`rounded-md font-semibold text-base transition-all duration-200 whitespace-nowrap ${
                  activeSection === section.id
                    ? "bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                style={{ padding: '20px 48px' }}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-600/50 p-6 min-h-[800px] !mt-3">
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
