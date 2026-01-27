import { useQuery } from "@tanstack/react-query";
import {
  patientsAPI,
  doctorsAPI,
  appointmentsAPI,
  hospitalsAPI,
} from "../services/api";

export default function Dashboard() {
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await patientsAPI.getAll()).data,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => (await doctorsAPI.getAll()).data,
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await appointmentsAPI.getAll()).data,
  });

  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => (await hospitalsAPI.getAll()).data,
  });

  const stats = [
    {
      title: "Total Patients",
      value: patients?.length || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      shadowColor: "shadow-blue-500/20",
    },
    {
      title: "Total Doctors",
      value: doctors?.length || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-50 to-teal-50",
      shadowColor: "shadow-emerald-500/20",
    },
    {
      title: "Appointments",
      value: appointments?.length || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50",
      shadowColor: "shadow-violet-500/20",
    },
    {
      title: "Hospitals",
      value: hospitals?.length || 0,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      shadowColor: "shadow-rose-500/20",
    },
  ];

  const upcomingAppointments = appointments?.slice(0, 5) || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-primary">
          Dashboard Overview
        </h1>
        <p className="text-secondary mt-2 text-lg">Welcome to your healthcare management center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative bg-white rounded-2xl p-6 shadow-xl ${stat.shadowColor} border border-white/50 overflow-hidden group hover:-translate-y-2 transition-all duration-500 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
            
            {/* Decorative Circle */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
            
            <div className="relative">
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg mb-4 text-white transform group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <p className="text-4xl font-extrabold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-secondary uppercase tracking-wide">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Recent Appointments</h2>
                <p className="text-sm text-secondary">Latest scheduled visits</p>
              </div>
            </div>
          </div>
        </div>
        
        {upcomingAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingAppointments.map((appointment, idx) => (
                  <tr key={appointment.appointment_id} className="hover:bg-indigo-50/50 transition-colors duration-200 group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {appointment.patient_name?.charAt(0) || 'P'}
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {appointment.patient_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                          {appointment.doctor_name?.charAt(0) || 'D'}
                        </div>
                        <span className="font-medium text-slate-700">
                          {appointment.doctor_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      {new Date(appointment.appt_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      {appointment.appt_time}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full ${
                          appointment.status === "scheduled"
                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                            : appointment.status === "completed"
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
                              : "bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          appointment.status === "scheduled" ? "bg-emerald-500" :
                          appointment.status === "completed" ? "bg-blue-500" : "bg-rose-500"
                        }`}></span>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No appointments found</p>
            <p className="text-sm text-slate-400 mt-1">Appointments will appear here once scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
