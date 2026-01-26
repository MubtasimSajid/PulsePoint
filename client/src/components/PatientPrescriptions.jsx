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
      <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-500">No medicine history found.</p>
      </div>
    );
  }

  const ongoing = prescriptions.filter((p) => p.status === "ongoing");
  const past = prescriptions.filter((p) => p.status === "past");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Ongoing Medicines */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ongoing Medicines
        </h2>
        {ongoing.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No ongoing medicines.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ongoing.map((p) => (
              <div
                key={p.prescription_id}
                className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-bl-xl">
                  {p.days_left} days left
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{p.medicine_name}</h3>
                <div className="text-sm text-slate-600 mt-1 mb-3">
                  <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700 mr-2">
                    {p.dosage}
                  </span>
                  {p.instructions}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
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
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-slate-400">Past Medicines</h2>
        {past.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No past medicines.</p>
        ) : (
          <div className="grid gap-3 opacity-75">
            {past.map((p) => (
              <div
                key={p.prescription_id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-700">{p.medicine_name}</h3>
                  <p className="text-xs text-slate-500">
                    {p.dosage} • {p.instructions}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
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
