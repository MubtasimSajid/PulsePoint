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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#f8fafc' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '18px' }}>Welcome to your healthcare management center</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{ 
              position: 'relative', 
              background: 'rgba(30, 41, 59, 0.7)', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid rgba(100, 116, 139, 0.5)', 
              overflow: 'hidden',
              transition: 'all 0.3s',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '56px', 
                height: '56px', 
                background: '#3AAFA9', 
                borderRadius: '12px', 
                marginBottom: '16px', 
                color: 'white',
                boxShadow: '0 4px 14px rgba(58, 175, 169, 0.3)'
              }}>
                {stat.icon}
              </div>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>{stat.value}</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', border: '1px solid rgba(100, 116, 139, 0.5)', overflow: 'hidden', backdropFilter: 'blur(12px)' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(100, 116, 139, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#3AAFA9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 14px rgba(58, 175, 169, 0.3)' }}>
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>Recent Appointments</h2>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>Latest scheduled visits</p>
              </div>
            </div>
          </div>
        </div>
        
        {upcomingAppointments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Patient
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Doctor
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Time
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((appointment, idx) => (
                  <tr key={appointment.appointment_id} style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#3AAFA9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px' }}>
                          {appointment.patient_name?.charAt(0) || 'P'}
                        </div>
                        <span style={{ fontWeight: 500, color: '#f8fafc' }}>
                          {appointment.patient_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#3AAFA9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px' }}>
                          {appointment.doctor_name?.charAt(0) || 'D'}
                        </div>
                        <span style={{ fontWeight: 500, color: '#f8fafc' }}>
                          {appointment.doctor_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: '#cbd5e1', fontWeight: 500 }}>
                      {new Date(appointment.appt_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={{ padding: '20px 24px', color: '#cbd5e1', fontWeight: 500 }}>
                      {appointment.appt_time?.substring(0, 5) || appointment.appt_time}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 16px', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          borderRadius: '9999px',
                          background: appointment.status === 'scheduled' ? 'rgba(58, 175, 169, 0.2)' : appointment.status === 'completed' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                          color: appointment.status === 'scheduled' ? '#3AAFA9' : appointment.status === 'completed' ? '#818cf8' : '#fb7185',
                          border: `1px solid ${appointment.status === 'scheduled' ? 'rgba(58, 175, 169, 0.3)' : appointment.status === 'completed' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                        }}
                      >
                        <span style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%',
                          background: appointment.status === 'scheduled' ? '#3AAFA9' : appointment.status === 'completed' ? '#818cf8' : '#fb7185'
                        }}></span>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(100, 116, 139, 0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg style={{ width: '40px', height: '40px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ color: '#94a3b8', fontWeight: 500 }}>No appointments found</p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Appointments will appear here once scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
