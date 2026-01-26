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
    <div className="space-y-12 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-6 p-4 bg-slate-900/60 border border-white/10 rounded-3xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-14 py-6 rounded-2xl text-2xl font-bold transition-all ${
              activeTab === tab.id
                ? "bg-[#A38D5D] text-white shadow-lg shadow-[#A38D5D]/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-400">No {activeTab} appointments found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <div
              key={appt.appointment_id}
              className="bg-slate-800/40 p-5 rounded-xl shadow-sm border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/60 transition-all hover:border-white/10 hover:translate-y-[-2px]"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-500/10 p-3 rounded-lg text-center min-w-[70px] border border-indigo-500/20">
                  <div className="text-xs font-bold text-indigo-300 uppercase">
                    {new Date(appt.appt_date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {new Date(appt.appt_date).getDate()}
                  </div>
                  <div className="text-xs text-indigo-200/70">
                    {appt.appt_time}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">
                    Dr. {appt.doctor_name}
                  </h3>
                  <p className="text-sm text-[#A38D5D] font-medium mb-1">
                    {appt.department_name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">
                      {appt.hospital_name || appt.chamber_name}
                    </span>
                    <span className="text-slate-600 mx-1">•</span>
                    {appt.facility_address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    appt.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                      : appt.status === "cancelled"
                        ? "bg-red-500/20 text-red-300 border border-red-500/20"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                  }`}
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
