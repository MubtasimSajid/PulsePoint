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
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl relative p-8 md:p-12 animate-fade-in border border-white/10">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-4xl font-bold text-[#A38D5D] mb-10 text-center tracking-tight">
          Find a Doctor Here
        </h2>

        {/* Inputs */}
        <div className="space-y-6 max-w-lg mx-auto">
          
          {/* Department Search */}
          <div className="relative group">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="w-full px-6 py-4 bg-slate-900/60 border-2 border-white/10 rounded-2xl text-slate-200 font-medium appearance-none focus:outline-none focus:border-[#A38D5D] focus:ring-4 focus:ring-[#A38D5D]/10 transition-all duration-300 placeholder-transparent"
            >
              <option value="" className="bg-slate-900 text-slate-400">Search by Department</option>
              {specializations?.map((spec) => (
                <option key={spec.spec_id} value={spec.spec_name} className="bg-slate-900 text-slate-200">
                  {spec.spec_name}
                </option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-[#A38D5D] transition-colors">
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
              className="w-full px-6 py-4 bg-slate-900/60 border-2 border-white/10 rounded-2xl text-slate-200 font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#A38D5D] focus:ring-4 focus:ring-[#A38D5D]/10 transition-all duration-300"
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
             <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wider text-center mb-6">Found {doctors.length} Doctors</h3>
             {doctors.map((doctor) => (
                <div key={doctor.user_id} className="p-4 border border-white/10 rounded-2xl hover:border-[#A38D5D]/30 hover:bg-white/5 transition-all duration-300 bg-slate-800/30 flex flex-col gap-4 group">
                   <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 bg-[#A38D5D]/10 text-[#A38D5D] rounded-full flex items-center justify-center font-bold text-xl group-hover:bg-[#A38D5D] group-hover:text-white transition-colors duration-300">
                           {doctor.full_name?.charAt(0)}
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-200 text-lg">{doctor.full_name}</h4>
                           <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                             {doctor.specializations?.map((s, i) => <span key={i}>{s}</span>)}
                           </div>
                        </div>
                     </div>
                     
                     <button
                        onClick={() => setSelectedDoctorId(selectedDoctorId === doctor.user_id ? null : doctor.user_id)}
                        className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          selectedDoctorId === doctor.user_id
                            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            : "bg-[#A38D5D] text-white hover:bg-[#937d4d] shadow-lg shadow-[#A38D5D]/20"
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
           <div className="mt-12 text-center text-slate-500">
              <p>No doctors found matching your criteria.</p>
           </div>
        )}

      </div>
    </div>
  );
}
