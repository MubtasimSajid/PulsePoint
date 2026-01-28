import { useQuery } from "@tanstack/react-query";
import { hospitalsAPI } from "../services/api";

export default function HospitalDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["hospital-dashboard-stats"],
    queryFn: async () => (await hospitalsAPI.getMyStats()).data,
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: '128px' }} className="animate-fade-in">
      {/* Hero Header */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.2)', paddingBottom: '160px', marginBottom: '12px' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(48px)', transform: 'translate(48px, -48px)' }}></div>
        <div style={{ position: 'relative', padding: '32px 48px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ marginLeft: '20px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px', color: '#f8fafc' }}>
              Hospital Administration
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '18px', maxWidth: '560px', fontWeight: 500, lineHeight: 1.6 }}>
              {stats?.hospital_name || "Your hospital"}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid rgba(100, 116, 139, 0.5)', padding: '8px 12px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Balance</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                BDT {stats?.total_balance ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 48px', transform: 'translateY(50%)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(100, 116, 139, 0.5)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Doctors</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#f8fafc' }}>{stats?.doctor_count ?? 0}</p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(100, 116, 139, 0.5)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Patients</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#f8fafc' }}>{stats?.patient_count ?? 0}</p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(100, 116, 139, 0.5)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branches</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#f8fafc' }}>{stats?.branch_count ?? 0}</p>
            </div>
            <div style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(100, 116, 139, 0.5)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Balance</p>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#f8fafc' }}>BDT {stats?.total_balance ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginTop: '96px' }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(24px)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(100, 116, 139, 0.5)', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginBottom: '24px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <button style={{ padding: '24px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>Add Doctor</span>
            </button>
            <button style={{ padding: '24px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>Manage Departments</span>
            </button>
            <button style={{ padding: '24px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>View Reports</span>
            </button>
            <button style={{ padding: '24px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(100, 116, 139, 0.5)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>Settings</span>
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(24px)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(100, 116, 139, 0.5)', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginBottom: '24px' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: i < 3 ? '1px solid rgba(100, 116, 139, 0.5)' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3AAFA9', marginTop: '8px' }}></div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc' }}>New appointment booked for Dr. Smith</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
