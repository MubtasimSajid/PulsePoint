import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { specializationsAPI, searchAPI } from "../services/api";
import AppointmentGrid from "./AppointmentGrid";

export default function DoctorSearch({ onSelectDoctor }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    specialization: "",
    location: "",
    facility_type: "",
    facility_id: "",
    doctor_name: "",
  });
  const [patientId, setPatientId] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setPatientId(parsed?.user_id || null);
      } catch {
        setPatientId(null);
      }
    }
  }, []);

  // Fetch specializations
  const { data: specializations, isLoading: isLoadingSpecs } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => (await specializationsAPI.getAll()).data,
  });

  // Search doctors
  const {
    data: doctors,
    isLoading: isLoadingSearch,
    refetch,
  } = useQuery({
    queryKey: ["searchDoctors", filters],
    queryFn: async () => (await searchAPI.searchDoctors(filters)).data,
    enabled: !!filters.specialization || (!!filters.doctor_name && filters.doctor_name.length >= 2),
  });

  // Auto-trigger search when typing a doctor name (2+ chars)
  useEffect(() => {
    if (filters.doctor_name && filters.doctor_name.trim().length >= 2) {
      refetch();
    }
  }, [filters.doctor_name, refetch]);

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="bg-white/95 dark:bg-[rgba(30,41,59,0.95)] border border-slate-200/50 dark:border-none"
        style={{ backdropFilter: 'blur(24px)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', width: '100%', maxWidth: '768px', position: 'relative', padding: '48px 64px' }}
      >
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          style={{ position: 'absolute', top: '24px', right: '24px', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer', background: 'transparent', border: 'none', transition: 'all 0.2s' }}
        >
          <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-slate-900 dark:text-[#f8fafc]" style={{ fontSize: '36px', fontWeight: 700, marginBottom: '40px', textAlign: 'center', letterSpacing: '-0.025em' }}>
          Find a Doctor Here
        </h2>

        {/* Inputs */}
        <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Department Search */}
          <div style={{ position: 'relative' }}>
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="bg-slate-100 dark:bg-[rgba(30,41,59,0.5)] text-slate-900 dark:text-[#f8fafc]"
              style={{ 
                width: '100%', 
                border: '2px solid rgba(100, 116, 139, 0.3)', 
                borderRadius: '16px', 
                fontWeight: 500, 
                appearance: 'none', 
                padding: '20px 28px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>Search by Department</option>
              {specializations?.map((spec) => (
                <option key={spec.spec_id} value={spec.spec_name} style={{ background: '#1e293b', color: '#f8fafc' }}>
                  {spec.spec_name}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Doctor Name Search */}
          <div style={{ position: 'relative' }}>
             <input
              type="text"
              value={filters.doctor_name}
              onChange={(e) => setFilters({ ...filters, doctor_name: e.target.value })}
              placeholder="Search With Doctor's Name ..."
              className="bg-slate-100 dark:bg-[rgba(30,41,59,0.5)] text-slate-900 dark:text-[#f8fafc] placeholder:text-slate-400 dark:placeholder:text-[#94a3b8]"
              style={{ 
                width: '100%', 
                border: '2px solid rgba(100, 116, 139, 0.3)', 
                borderRadius: '16px', 
                fontWeight: 500, 
                padding: '20px 28px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

        </div>

        {/* Loading Spinner */}
        {(isLoadingSpecs || isLoadingSearch) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px', marginBottom: '16px' }}>
             <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', background: '#64748b', borderRadius: '50%' }} className="animate-bounce [animation-delay:-0.3s]"></span>
                <span style={{ width: '12px', height: '12px', background: '#64748b', borderRadius: '50%' }} className="animate-bounce [animation-delay:-0.15s]"></span>
                <span style={{ width: '12px', height: '12px', background: '#64748b', borderRadius: '50%' }} className="animate-bounce"></span>
             </div>
          </div>
        )}

        {/* Results List (if any) */}
        {!isLoadingSearch && doctors && doctors.length > 0 && (
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }} className="animate-fade-in custom-scrollbar">
             <h3 style={{ color: '#94a3b8', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '24px' }}>Found {doctors.length} Doctors</h3>
             {doctors.map((doctor) => (
                <div 
                  key={doctor.user_id} 
                  className="bg-slate-100 dark:bg-[rgba(30,41,59,0.5)]"
                  style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(100, 116, 139, 0.3)', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.2s' }}
                >
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '56px', background: 'rgba(58, 175, 169, 0.15)', color: '#3AAFA9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px' }}>
                           {doctor.full_name?.charAt(0)}
                        </div>
                        <div>
                           <h4 className="text-slate-900 dark:text-[#f8fafc]" style={{ fontWeight: 700, fontSize: '18px' }}>{doctor.full_name}</h4>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '14px', color: '#94a3b8' }}>
                             {doctor.specializations?.map((s, i) => <span key={i}>{s}</span>)}
                           </div>
                        </div>
                     </div>
                     
                     <button
                        onClick={() => setSelectedDoctorId(selectedDoctorId === doctor.user_id ? null : doctor.user_id)}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '14px',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: selectedDoctorId === doctor.user_id ? 'rgba(100, 116, 139, 0.3)' : 'rgba(58, 175, 169, 0.2)',
                          color: selectedDoctorId === doctor.user_id ? '#94a3b8' : '#3AAFA9',
                          border: selectedDoctorId === doctor.user_id ? '1px solid rgba(100, 116, 139, 0.5)' : '1px solid rgba(58, 175, 169, 0.3)',
                          cursor: 'pointer'
                        }}
                     >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedDoctorId === doctor.user_id ? '#94a3b8' : '#3AAFA9' }}></span>
                       {selectedDoctorId === doctor.user_id ? "Close Slots" : "Book Appointment"}
                     </button>
                   </div>
                   
                   {/* Slots Accordion */}
                   {selectedDoctorId === doctor.user_id && (
                     <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(100, 116, 139, 0.2)' }} className="animate-fade-in">
                        <AppointmentGrid 
                           doctor={doctor} 
                           patientId={patientId} 
                           compact={true} 
                        />
                     </div>
                   )}
                </div>
             ))}
          </div>
        )}
        
        {!isLoadingSearch && doctors && doctors.length === 0 && (filters.specialization || filters.doctor_name) && (
           <div style={{ marginTop: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <p>No doctors found matching your criteria.</p>
           </div>
        )}

      </div>
    </div>
  );
}
