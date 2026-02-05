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

  // Group records by year for timeline
  const groupedByYear = history?.reduce((acc, record) => {
    const year = new Date(record.visit_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(record);
    return acc;
  }, {}) || {};

  // Sort years descending
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AAFA9]"></div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No medical history records found.</p>
        <p className="text-sm mt-1">Your medical records will appear here after consultations.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Timeline Container */}
      <div className="relative">
        {sortedYears.map((year, yearIdx) => (
          <div key={year} className="mb-8">
            {/* Year Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#3AAFA9] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-[#3AAFA9]/20">
                {year}
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-[#3AAFA9]/30 to-transparent"></div>
            </div>

            {/* Timeline Events */}
            <div className="relative pl-8">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#3AAFA9]/50 via-slate-300 dark:via-slate-600 to-transparent"></div>

              {groupedByYear[year]
                .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
                .map((record, idx) => {
                  const visitDate = new Date(record.visit_date);
                  const formattedDate = visitDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div key={record.history_id} className="relative pb-8 last:pb-0">
                      {/* Timeline Node */}
                      <div className="absolute left-0 w-6 h-6 -translate-x-1/2 bg-white dark:bg-slate-900 border-4 border-[#3AAFA9] rounded-full shadow-md shadow-[#3AAFA9]/20 z-10"></div>

                      {/* Date Label */}
                      <div className="absolute left-0 -translate-x-full pr-6 text-right" style={{ width: '80px' }}>
                        <span className="text-xs font-bold text-[#3AAFA9]">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Content Card */}
                      <div className="ml-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-5 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 group">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3AAFA9]/10 text-[#3AAFA9] text-xs font-semibold rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                                </svg>
                                Visit
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#3AAFA9] transition-colors">
                              Dr. {record.doctor_name || getDoctorName(record.doctor_id)}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {visitDate.toLocaleDateString("en-US", {
                                weekday: "long",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700/50 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                              Diagnosis
                            </h4>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 font-medium">
                            {record.diagnosis}
                          </p>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" />
                              </svg>
                              <h4 className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                                Doctor's Notes
                              </h4>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Timeline End Marker */}
        <div className="flex items-center gap-4 mt-4 pl-8">
          <div className="relative">
            <div className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            End of medical history
          </p>
        </div>
      </div>
    </div>
  );
}
