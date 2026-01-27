import { useQuery } from "@tanstack/react-query";
import { hospitalsAPI } from "../services/api";

export default function HospitalDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["hospital-dashboard-stats"],
    queryFn: async () => (await hospitalsAPI.getMyStats()).data,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      <div className="bg-emerald-600 rounded-3xl p-12 text-white shadow-xl shadow-emerald-200">
        <h1 className="text-4xl font-bold mb-2">Hospital Administration</h1>
        <p className="text-emerald-100 text-lg opacity-90">
          {stats?.hospital_name || "Your hospital"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <p className="text-emerald-100 text-sm font-medium mb-1 uppercase tracking-wider">
              Total Doctors
            </p>
            <p className="text-4xl font-bold text-white">
              {stats?.doctor_count ?? 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <p className="text-emerald-100 text-sm font-medium mb-1 uppercase tracking-wider">
              Total Patients
            </p>
            <p className="text-4xl font-bold text-white">
              {stats?.patient_count ?? 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <p className="text-emerald-100 text-sm font-medium mb-1 uppercase tracking-wider">
              Branches
            </p>
            <p className="text-4xl font-bold text-white">
              {stats?.branch_count ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <button className="p-6 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group">
              <span className="font-bold text-sm block">Add Doctor</span>
            </button>
            <button className="p-6 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group">
              <span className="font-bold text-sm block">
                Manage Departments
              </span>
            </button>
            <button className="p-6 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group">
              <span className="font-bold text-sm block">View Reports</span>
            </button>
            <button className="p-6 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group">
              <span className="font-bold text-sm block">Settings</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-6 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    New appointment booked for Dr. Smith
                  </p>
                  <p className="text-xs text-slate-400">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
