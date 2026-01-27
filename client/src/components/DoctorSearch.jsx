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
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4">
      <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl relative animate-fade-in border border-slate-600/50" style={{ padding: '48px 64px' }}>
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-4xl font-bold text-foreground mb-10 text-center tracking-tight">
          Find a Doctor Here
        </h2>

        {/* Inputs */}
        <div className="space-y-6 max-w-lg mx-auto">
          
          {/* Department Search */}
          <div className="relative group">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="w-full bg-muted/30 border-2 border-slate-600/50 rounded-2xl text-foreground font-medium appearance-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-transparent"
              style={{ padding: '20px 28px' }}
            >
              <option value="" className="bg-card text-muted-foreground">Search by Department</option>
              {specializations?.map((spec) => (
                <option key={spec.spec_id} value={spec.spec_name} className="bg-card text-foreground">
                  {spec.spec_name}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Doctor Name Search */}
          <div className="relative">
             <input
              type="text"
              value={filters.doctor_name}
              onChange={(e) => setFilters({ ...filters, doctor_name: e.target.value })}
              placeholder="Search With Doctor's Name ..."
              className="w-full bg-muted/30 border-2 border-slate-600/50 rounded-2xl text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
              style={{ padding: '20px 28px' }}
            />
          </div>

        </div>

        {/* Loading Spinner */}
        {(isLoadingSpecs || isLoadingSearch) && (
          <div className="flex justify-center mt-12 mb-4">
             <div className="flex gap-2">
                <span className="w-3 h-3 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-3 h-3 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-3 h-3 bg-slate-500 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}

        {/* Results List (if any) */}
        {!isLoadingSearch && doctors && doctors.length > 0 && (
          <div className="mt-12 space-y-4 animate-fade-in max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             <h3 className="text-muted-foreground font-medium text-sm uppercase tracking-wider text-center mb-6">Found {doctors.length} Doctors</h3>
             {doctors.map((doctor) => (
                <div key={doctor.user_id} className="p-4 border border-border rounded-2xl hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 bg-card/50 flex flex-col gap-4 group">
                   <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                           {doctor.full_name?.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-bold text-foreground text-lg">{doctor.full_name}</h4>
                           <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                             {doctor.specializations?.map((s, i) => <span key={i}>{s}</span>)}
                           </div>
                        </div>
                     </div>
                     
                     <button
                        onClick={() => setSelectedDoctorId(selectedDoctorId === doctor.user_id ? null : doctor.user_id)}
                        className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          selectedDoctorId === doctor.user_id
                            ? "bg-muted text-muted-foreground hover:bg-muted/80"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        }`}
                     >
                       {selectedDoctorId === doctor.user_id ? "Close Slots" : "Book Appointment"}
                     </button>
                   </div>
                   
                   {/* Slots Accordion */}
                   {selectedDoctorId === doctor.user_id && (
                     <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
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
           <div className="mt-12 text-center text-muted-foreground">
              <p>No doctors found matching your criteria.</p>
           </div>
        )}

      </div>
    </div>
  );
}
