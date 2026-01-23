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
      icon: "👥",
      color: "bg-blue-500",
    },
    {
      title: "Total Doctors",
      value: doctors?.length || 0,
      icon: "👨‍⚕️",
      color: "bg-green-500",
    },
    {
      title: "Appointments",
      value: appointments?.length || 0,
      icon: "📅",
      color: "bg-purple-500",
    },
    {
      title: "Hospitals",
      value: hospitals?.length || 0,
      icon: "🏥",
      color: "bg-red-500",
    },
  ];

  const upcomingAppointments = appointments?.slice(0, 5) || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Hospital Management Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 flex items-center"
          >
            <div
              className={`${stat.color} text-white text-4xl p-4 rounded-lg mr-4`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.doctor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(appointment.appt_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {appointment.appt_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === "scheduled"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No appointments found
          </p>
        )}
      </div>
    </div>
  );
}
