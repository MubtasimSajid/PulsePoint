import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appointmentsAPI } from "../services/api";

export default function PatientAppointments({ userId }) {
  const [activeTab, setActiveTab] = useState("upcoming");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "patient", userId, activeTab],
    queryFn: async () =>
      (await appointmentsAPI.getByPatient(userId, { filter: activeTab })).data,
    enabled: !!userId,
  });

  const tabs = [
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-6 bg-card/60 border border-slate-600/50 rounded-xl w-fit" style={{ padding: '32px 48px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md text-base font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
            }`}
            style={{ padding: '20px 48px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="mt-10 text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No {activeTab} appointments found.</p>
        </div>
      ) : (
        <div className="!mt-3 grid gap-3">
          {appointments.map((appt) => (
            <div
              key={appt.appointment_id}
              className="bg-card p-7 rounded-2xl shadow-sm border border-slate-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all hover:translate-y-[-2px]"
            >
              <div className="flex items-start gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl text-center min-w-[84px] border border-slate-600/50">
                  <div className="text-xs font-bold text-slate-400 uppercase">
                    {new Date(appt.appt_date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {new Date(appt.appt_date).getDate()}
                  </div>
                  <div className="text-xs text-slate-400">
                    {appt.appt_time?.substring(0, 5)}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Dr. {appt.doctor_name}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium mb-1">
                    {appt.department_name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">
                      {appt.hospital_name || appt.chamber_name}
                    </span>
                    <span className="text-slate-500 mx-1">•</span>
                    {appt.facility_address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full text-xs font-bold capitalize ${
                    appt.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                      : appt.status === "cancelled"
                        ? "bg-red-500/20 text-red-300 border border-red-500/20"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                  }`}
                  style={{ padding: '8px 20px' }}
                >
                  {appt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
