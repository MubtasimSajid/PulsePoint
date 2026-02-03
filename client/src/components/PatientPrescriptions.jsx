import { useQuery } from "@tanstack/react-query";
import { prescriptionsAPI } from "../services/api";

export default function PatientPrescriptions({ userId }) {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", userId],
    queryFn: async () => (await prescriptionsAPI.getByPatient(userId)).data,
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="text-center p-4 text-slate-500">Loading medicines...</div>;
  }

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="mt-10 text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400">No medicine history found.</p>
      </div>
    );
  }

  const ongoing = prescriptions.filter((p) => p.status === "ongoing");
  const past = prescriptions.filter((p) => p.status === "past");

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-4">
      {/* Ongoing Medicines */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2" style={{ marginLeft: '5px' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ongoing Medicines
        </h2>
        {ongoing.length === 0 ? (
          <p className="text-slate-400 text-sm italic" style={{ marginLeft: '5px' }}>No ongoing medicines.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ongoing.map((p) => (
              <div
                key={`${p.prescription_id}-${p.medicine_name}`}
                className="bg-card p-6 rounded-2xl shadow-sm border border-slate-600/50 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="absolute top-5 right-5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-base font-bold px-10 py-3 rounded-2xl" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                  {p.days_left} days left
                </div>
                <h3 className="font-bold text-white text-lg group-hover:text-emerald-300 transition-colors" style={{ marginLeft: '20px' }}>
                  {p.medicine_name}
                </h3>
                <div className="text-sm text-slate-400 mt-4 mb-4" style={{ marginLeft: '20px', marginTop: '20px', marginBottom: '30px' }}>
                  <span className="font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300 mr-2" style={{ marginRight: '15px' }}>
                    {p.dosage}
                  </span>
                  {p.instructions}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-700/50" style={{ marginLeft: '20px', marginRight: '10px', marginTop: '15px', marginBottom: '15px' }}>
                  <span>Prescribed by {p.doctor_name}</span>
                  <span>Until: {p.end_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Medicines */}
      <div>
        <h2 className="text-lg font-bold text-slate-500 mb-4" style={{ marginLeft: '20px' }}>Past Medicines</h2>
        {past.length === 0 ? (
          <p className="text-slate-500 text-sm italic" style={{ marginLeft: '20px' }}>No past medicines.</p>
        ) : (
          <div className="grid gap-3 opacity-75">
            {past.map((p) => (
              <div
                key={`${p.prescription_id}-${p.medicine_name}`}
                className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-300">{p.medicine_name}</h3>
                  <p className="text-xs text-slate-500">
                    {p.dosage} • {p.instructions}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Ended: {p.end_date}</div>
                  <div>Dr. {p.doctor_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
