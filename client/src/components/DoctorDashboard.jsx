import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesAPI, appointmentsAPI, hospitalsAPI, chambersAPI } from "../services/api";

export default function DoctorDashboard({ doctorId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("appointments");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 30,
    facility_type: "hospital", // or chamber
    facility_id: "",
  });

  const { data: appointments } = useQuery({
    queryKey: ["appointments", "doctor", doctorId],
    queryFn: async () => (await appointmentsAPI.getByDoctor(doctorId)).data,
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

  const { data: chambers } = useQuery({
    queryKey: ["chambers"],
    queryFn: async () => (await chambersAPI.getAll()).data,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => schedulesAPI.createSchedule({ ...data, doctor_id: doctorId }),
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
    createScheduleMutation.mutate(scheduleForm);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Doctor Dashboard</h1>
          <p className="text-slate-500">Manage your practice and patients</p>
        </div>
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "appointments" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "schedule" ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Manage Schedule
          </button>
        </div>
      </div>

      {activeTab === "appointments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Upcoming Appointments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!appointments || appointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No appointments found.</div>
            ) : (
              appointments.map((appt) => (
                <div key={appt.appointment_id} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">
                      {new Date(appt.appt_date).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase">
                        {new Date(appt.appt_date).toLocaleDateString("en-US", { month: "long" })} • {appt.appt_time}
                      </p>
                      <h3 className="text-lg font-bold text-slate-800">{appt.patient_name}</h3>
                      <p className="text-xs text-slate-400">ID: {appt.patient_code}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Weekly Schedule</h2>
                <p className="text-indigo-100 opacity-90 max-w-xl">
                  Define your recurring weekly availability. Once set, generate slots so patients can book them.
                </p>
              </div>
              <button
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all active:scale-95"
              >
                {showScheduleForm ? "Cancel" : "+ New Schedule"}
              </button>
            </div>

            {showScheduleForm && (
              <form onSubmit={handleCreateSchedule} className="mt-8 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-indigo-200 outline-none focus:bg-white/30"
                    value={scheduleForm.day_of_week}
                    onChange={(e) => setScheduleForm({...scheduleForm, day_of_week: e.target.value})}
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <option key={day} value={day} className="text-slate-800">{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white outline-none focus:bg-white/30"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})}
                  />
                  <input
                    type="time"
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white outline-none focus:bg-white/30"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})}
                  />
                  <select
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white outline-none focus:bg-white/30"
                    value={scheduleForm.facility_type}
                    onChange={(e) => setScheduleForm({...scheduleForm, facility_type: e.target.value, facility_id: ""})}
                  >
                    <option value="hospital" className="text-slate-800">Hospital</option>
                    <option value="chamber" className="text-slate-800">Private Chamber</option>
                  </select>
                  <select
                    className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white outline-none focus:bg-white/30"
                    value={scheduleForm.facility_id}
                    onChange={(e) => setScheduleForm({...scheduleForm, facility_id: e.target.value})}
                    required
                  >
                    <option value="" className="text-slate-800">Select Facility</option>
                    {scheduleForm.facility_type === "hospital" 
                      ? hospitals?.map(h => <option key={h.hospital_id} value={h.hospital_id} className="text-slate-800">{h.name}</option>)
                      : chambers?.map(c => <option key={c.chamber_id} value={c.chamber_id} className="text-slate-800">{c.name}</option>)
                    }
                  </select>
                </div>
                <button type="submit" disabled={createScheduleMutation.isPending} className="mt-4 w-full bg-white text-indigo-600 font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors">
                  {createScheduleMutation.isPending ? "Saving..." : "Save Schedule Rule"}
                </button>
              </form>
            )}
          </div>

          <div className="grid gap-4">
            {schedules?.map((schedule) => (
              <div key={schedule.schedule_id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      {schedule.day_of_week}
                    </span>
                    <span className="text-slate-400 text-sm">•</span>
                    <span className="text-slate-600 font-medium">
                      {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800">{schedule.facility_name}</h3>
                  <p className="text-xs text-slate-400">{schedule.location}</p>
                </div>
                <button
                  onClick={() => generateSlotsMutation.mutate({ schedule_id: schedule.schedule_id, weeks: 4 })}
                  disabled={generateSlotsMutation.isPending}
                  className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors"
                >
                  Regenerate Slots
                </button>
              </div>
            ))}
            {(!schedules || schedules.length === 0) && (
              <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500">No schedule rules defined yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
