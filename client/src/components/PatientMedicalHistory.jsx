import { useQuery } from "@tanstack/react-query";
import { medicalHistoryAPI, doctorsAPI } from "../services/api";

export default function PatientMedicalHistory({ userId }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["medicalHistory", userId],
    queryFn: async () => (await medicalHistoryAPI.getByPatient(userId)).data,
    enabled: !!userId,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => (await doctorsAPI.getAll()).data,
  });

  const getDoctorName = (doctorId) => {
    if (!doctors) return "Unknown Doctor";
    const doc = doctors.find((d) => d.user_id === doctorId);
    return doc ? doc.full_name : "Unknown Doctor";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No medical history records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {history.map((record) => (
        <div
          key={record.history_id}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-6 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-1">
                {new Date(record.visit_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Dr. {record.doctor_name || getDoctorName(record.doctor_id)}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
                Diagnosis
              </h4>
              <p className="text-slate-700 dark:text-slate-200">{record.diagnosis}</p>
            </div>

            {record.notes && (
              <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
                  Notes
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {record.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
