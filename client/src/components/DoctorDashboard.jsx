import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  schedulesAPI,
  appointmentsAPI,
  hospitalsAPI,
  paymentAPI,
} from "../services/api";
import PrescriptionModal from "./PrescriptionModal";

export default function DoctorDashboard({ doctorId }) {
  const location = useLocation();
  const initialTab = (() => {
    try {
      const tab = new URLSearchParams(location.search).get("tab");
      return tab === "schedule" ? "schedule" : "appointments";
    } catch {
      return "appointments";
    }
  })();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [prescribingAppt, setPrescribingAppt] = useState(null);
  const [selectedHospitalName, setSelectedHospitalName] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 30,
    facility_type: "hospital",
    facility_id: "",
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", "doctor", doctorId],
    queryFn: async () => (await appointmentsAPI.getByDoctor(doctorId)).data,
    enabled: !!doctorId,
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, reason }) =>
      appointmentsAPI.cancel(appointmentId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments", "doctor", doctorId]);
      queryClient.invalidateQueries({ queryKey: ["doctorSlots"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      alert("Appointment cancelled. Slot is now free.");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to cancel appointment");
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await paymentAPI.getBalance()).data,
    enabled: !!doctorId,
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules", doctorId],
    queryFn: async () => (await schedulesAPI.getDoctorSchedules(doctorId)).data,
    enabled: !!doctorId,
  });

  const { data: hospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => (await hospitalsAPI.getAll()).data,
  });

  const hospitalNames = hospitals
    ? Array.from(
        new Set(
          hospitals
            .map((h) => h?.name)
            .filter((name) => typeof name === "string" && name.trim()),
        ),
      ).sort((a, b) => a.localeCompare(b))
    : [];

  const hospitalBranches = selectedHospitalName
    ? (hospitals || []).filter((h) => h?.name === selectedHospitalName)
    : [];

  const createScheduleMutation = useMutation({
    mutationFn: (data) =>
      schedulesAPI.createSchedule({ ...data, doctor_id: doctorId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["schedules", doctorId]);
      setShowScheduleForm(false);
      alert("Schedule created successfully!");
    },
  });

  const generateSlotsMutation = useMutation({
    mutationFn: ({ schedule_id, weeks }) => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + weeks * 7);
      return schedulesAPI.generateSlots({
        schedule_id,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      alert("Slots generated for the next 4 weeks!");
    },
  });

  const handleCreateSchedule = (e) => {
    e.preventDefault();
    createScheduleMutation.mutate({
      ...scheduleForm,
      facility_type: "hospital",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-32 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient shadow-xl shadow-primary/20 pb-32 md:pb-40 !mb-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div style={{ marginLeft: "20px" }}>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-relaxed mb-4 text-slate-900 dark:text-white">
                Doctor Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg max-w-xl font-medium leading-loose">
                Manage your practice and patients.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance */}
            <div
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50"
              style={{ padding: "8px 12px" }}
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Balance
              </p>
              <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                {wallet ? `${wallet.currency} ${wallet.balance}` : "..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12">
          {/* Tabs */}
          <div
            className="flex items-center gap-6 bg-card/60 border border-slate-200 dark:border-slate-600/50 rounded-xl w-fit backdrop-blur-sm overflow-x-auto max-w-full mt-16 md:mt-20 mb-10"
            style={{ padding: "32px 48px" }}
          >
            <button
              onClick={() => setActiveTab("appointments")}
              className={`rounded-md font-semibold text-base transition-all duration-200 whitespace-nowrap ${
                activeTab === "appointments"
                  ? "bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{ padding: "20px 48px" }}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`rounded-md font-semibold text-base transition-all duration-200 whitespace-nowrap ${
                activeTab === "schedule"
                  ? "bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{ padding: "20px 48px" }}
            >
              Manage Schedule
            </button>
          </div>

          <div className="bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-600/50 p-6 min-h-[800px] !mt-3">
            {activeTab === "appointments" && (
              <div className="!mt-3 space-y-3">
                {!appointments || appointments.length === 0 ? (
                  <div className="text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">
                      No appointments found.
                    </p>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div
                      key={appt.appointment_id}
                      className="bg-card p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all hover:translate-y-[-2px]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl text-center min-w-[84px] border border-slate-200 dark:border-slate-600/50">
                          <div className="text-xs font-bold text-slate-400 uppercase">
                            {new Date(appt.appt_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                              },
                            )}
                          </div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {new Date(appt.appt_date).getDate()}
                          </div>
                          <div className="text-xs text-slate-400">
                            {appt.appt_time?.substring(0, 5)}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                            {appt.patient_name}
                          </h3>
                          <p className="text-sm text-slate-400 font-medium mb-1">
                            ID: {appt.patient_code}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            {/* Add other details if available */}
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                               Patient
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {appt.status !== "scheduled" && (
                          <span
                            className={`rounded-full text-xs font-bold capitalize ${
                              appt.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                                : appt.status === "cancelled"
                                  ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20"
                                  : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20"
                            }`}
                            style={{ padding: "8px 20px", minWidth: "110px", display: "inline-block", textAlign: "center" }}
                          >
                            {appt.status}
                          </span>
                        )}

                        {appt.status !== "cancelled" &&
                          appt.status !== "completed" && (
                            <button
                              onClick={() => {
                                const reason = window.prompt(
                                  "Cancel reason (optional):",
                                  "Doctor cancelled",
                                );
                                if (reason === null) return;
                                cancelAppointmentMutation.mutate({
                                  appointmentId: appt.appointment_id,
                                  reason,
                                });
                              }}
                              disabled={cancelAppointmentMutation.isPending}
                              className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 transition-colors rounded-full text-xs font-bold"
                              style={{ padding: "8px 20px", minWidth: "110px", display: "inline-block", textAlign: "center" }}
                            >
                              {cancelAppointmentMutation.isPending
                                ? "Cancelling..."
                                : "Cancel"}
                            </button>
                          )}
                        
                        {appt.status !== "cancelled" && (() => {
                          // Robust Date Parsing
                          const d = new Date(appt.appt_date);
                          const dateStr = [
                            d.getFullYear(),
                            ('0' + (d.getMonth() + 1)).slice(-2),
                            ('0' + d.getDate()).slice(-2)
                          ].join('-');
                          
                          const apptDateTime = new Date(`${dateStr}T${appt.appt_time}`);
                          const now = new Date();
                          const diffMs = now - apptDateTime;
                          
                          // Window: 0 to 2 hours
                          const isTooEarly = diffMs < 0;
                          const isExpired = diffMs > 7200000;
                          const isValid = !isTooEarly && !isExpired;

                          let styleClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300";
                          let titleText = "Create Prescription";

                          if (isTooEarly) {
                             styleClass = "bg-slate-700/50 text-slate-500 border-slate-700/50 cursor-not-allowed opacity-70";
                             titleText = `Coming soon (${Math.round(Math.abs(diffMs)/60000)}m)`;
                          } else if (isExpired) {
                             styleClass = "bg-amber-900/20 text-amber-500/50 border-amber-500/20 cursor-not-allowed opacity-70";
                             titleText = "Prescription window expired (2 hours)";
                          }

                          return (
                            <button
                              onClick={() => isValid && setPrescribingAppt(appt)}
                              disabled={!isValid}
                              title={titleText}
                              className={`border transition-colors rounded-full text-xs font-bold flex items-center gap-2 ${styleClass}`}
                              style={{ padding: "8px 20px", minWidth: "110px", justifyContent: "center" }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Prescribe
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center" style={{ marginLeft: "20px" }}>
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                      Weekly Schedule
                    </h2>
                    <p className="text-muted-foreground max-w-xl leading-relaxed">
                      Define your recurring weekly availability. Once set,
                      generate slots so patients can book them.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors rounded-full text-sm font-bold"
                    style={{ padding: "8px 24px" }}
                  >
                    {showScheduleForm ? "Cancel" : "+ New Schedule"}
                  </button>
                </div>

                    {showScheduleForm && (
                  <form
                    onSubmit={handleCreateSchedule}
                    className="bg-card/60 backdrop-blur-sm p-6 rounded-xl border border-slate-600/50"
                    style={{ marginLeft: "20px" }}
                  >
                    <div className="flex items-center gap-6 bg-card/60 border border-slate-600/50 rounded-xl w-fit backdrop-blur-sm overflow-x-auto max-w-full mb-6" style={{ padding: '24px 32px' }}>
                      <button
                        type="button"
                        onClick={() => setScheduleForm({...scheduleForm, schedule_type: 'weekly'})}
                        className={`rounded-md font-semibold text-base transition-all duration-200 whitespace-nowrap ${
                          (scheduleForm.schedule_type || 'weekly') === 'weekly' 
                            ? 'bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        style={{ padding: '16px 32px' }}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleForm({...scheduleForm, schedule_type: 'single'})}
                        className={`rounded-md font-semibold text-base transition-all duration-200 whitespace-nowrap ${
                          scheduleForm.schedule_type === 'single' 
                            ? 'bg-[#3AAFA9] text-white shadow-lg shadow-[#3AAFA9]/30' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                        style={{ padding: '16px 32px' }}
                      >
                        Single Day
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scheduleForm.schedule_type === 'single' ? (
                        <input
                          type="date"
                          className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                          style={{ height: "60px", paddingLeft: "25px" }}
                          value={scheduleForm.specific_date || ''}
                          min={(() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            return d.toISOString().split("T")[0];
                          })()}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              specific_date: e.target.value,
                            })
                          }
                          required
                        />
                      ) : (
                        <select
                          className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                          style={{ height: "60px", paddingLeft: "25px" }}
                          value={scheduleForm.day_of_week}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              day_of_week: e.target.value,
                            })
                          }
                        >
                          {[
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <option
                              key={day}
                              value={day}
                              className="bg-slate-800 text-white"
                            >
                              {day}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="time"
                        className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                        style={{ height: "60px", paddingLeft: "25px" }}
                        value={scheduleForm.start_time}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            start_time: e.target.value,
                          })
                        }
                      />
                      <input
                        type="time"
                        className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                        style={{ height: "60px", paddingLeft: "25px" }}
                        value={scheduleForm.end_time}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            end_time: e.target.value,
                          })
                        }
                      />
                      <select
                        className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                        style={{ height: "60px", paddingLeft: "25px" }}
                        value={selectedHospitalName}
                        onChange={(e) => {
                          const name = e.target.value;
                          const hospital = hospitals?.find(h => h.name === name);
                          setSelectedHospitalName(name);
                          setScheduleForm({
                            ...scheduleForm,
                            facility_type: "hospital",
                            facility_id: hospital ? hospital.hospital_id : "",
                            branch_name: "", // Reset branch on hospital change
                          });
                        }}
                      >
                        <option value="" className="bg-slate-800 text-white">
                          Select Hospital Name
                        </option>
                        {hospitalNames.map((name) => (
                          <option
                            key={name}
                            value={name}
                            className="bg-slate-800 text-white"
                          >
                            {name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-foreground outline-none focus:border-[#3AAFA9]"
                        style={{ height: "60px", paddingLeft: "25px" }}
                        value={scheduleForm.branch_name || ""}
                        onChange={(e) =>
                          setScheduleForm({
                            ...scheduleForm,
                            branch_name: e.target.value,
                          })
                        }
                        required
                        disabled={!selectedHospitalName}
                      >
                        <option value="" className="bg-slate-800 text-white">
                          Select Branch
                        </option>
                        {hospitalBranches.flatMap((h) => 
                           // If new array format exists, use it. Detailed fallback for older data.
                           (h.branch_names && h.branch_names.length > 0) 
                             ? h.branch_names.map(bn => ({ name: bn, id: bn }))
                             : (h.location ? [{ name: h.location, id: h.location }] : [])
                        ).map((b, idx) => (
                          <option
                            key={`${b.id}-${idx}`}
                            value={b.name}
                            className="bg-slate-800 text-white"
                          >
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={createScheduleMutation.isPending}
                      className="mt-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-50 transition-colors rounded-full text-sm font-bold"
                      style={{ padding: "8px 24px" }}
                    >
                      {createScheduleMutation.isPending
                        ? "Saving..."
                        : "Save Schedule"}
                    </button>
                  </form>
                )}

                <div className="!mt-3 space-y-3">
                  {schedules?.map((schedule) => (
                    <div
                      key={schedule.schedule_id}
                      className="bg-card p-7 rounded-2xl shadow-sm border border-slate-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all hover:translate-y-[-2px]"
                    >
                      <div style={{ marginLeft: "20px" }}>
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="bg-[#3AAFA9]/20 text-[#3AAFA9] border border-[#3AAFA9]/30 rounded-full text-xs font-bold uppercase tracking-wide"
                            style={{ padding: "4px 12px" }}
                          >
                            {schedule.schedule_type === 'single' 
                              ? new Date(schedule.specific_date).toLocaleDateString() 
                              : schedule.day_of_week}
                          </span>
                          {schedule.schedule_type === 'single' && (
                             <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
                                Single
                             </span>
                          )}
                          <span className="text-slate-500 mx-1">•</span>
                          <span className="text-slate-400 font-medium">
                            {schedule.start_time.slice(0, 5)} -{" "}
                            {schedule.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg mt-2">
                          {schedule.facility_name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {schedule.location}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          generateSlotsMutation.mutate({
                            schedule_id: schedule.schedule_id,
                            weeks: 4,
                          })
                        }
                        disabled={generateSlotsMutation.isPending}
                        className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 disabled:opacity-50 transition-colors rounded-full text-sm font-bold"
                        style={{ padding: "8px 24px" }}
                      >
                        Regenerate Slots
                      </button>
                    </div>
                  ))}
                  {(!schedules || schedules.length === 0) && (
                    <div className="text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-slate-500 dark:text-slate-400">
                        No schedule rules defined yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {prescribingAppt && (
        <PrescriptionModal
          appointment={prescribingAppt}
          onClose={() => setPrescribingAppt(null)}
        />
      )}
    </div>
  );
}
