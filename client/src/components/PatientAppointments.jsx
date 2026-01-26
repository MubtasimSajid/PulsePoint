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
    <div className="space-y-6 animate-fade-in">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No {activeTab} appointments found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <div
              key={appt.appointment_id}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg text-center min-w-[70px]">
                  <div className="text-xs font-bold text-indigo-600 uppercase">
                    {new Date(appt.appt_date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {new Date(appt.appt_date).getDate()}
                  </div>
                  <div className="text-xs text-slate-500">{appt.appt_time}</div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Dr. {appt.doctor_name}
                  </h3>
                  <p className="text-sm text-indigo-600 font-medium mb-1">
                    {appt.department_name}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-semibold">{appt.hospital_name || appt.chamber_name}</span>
                    <span className="text-slate-300 mx-1">•</span>
                    {appt.facility_address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    appt.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : appt.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
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
