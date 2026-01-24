import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { specializationsAPI, searchAPI } from "../services/api";

export default function DoctorSearch({ onSelectDoctor }) {
  const [filters, setFilters] = useState({
    specialization: "",
    location: "",
    facility_type: "",
    facility_id: "",
    doctor_name: "",
  });

  // Fetch specializations
  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => (await specializationsAPI.getAll()).data,
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await searchAPI.getLocations()).data,
    enabled: !!filters.specialization,
  });

  // Fetch facilities based on location and type
  const { data: facilities } = useQuery({
    queryKey: ["facilities", filters.location, filters.facility_type],
    queryFn: async () =>
      (
        await searchAPI.getFacilities({
          location: filters.location,
          type: filters.facility_type,
        })
      ).data,
    enabled: !!filters.location,
  });

  // Search doctors with all filters
  const {
    data: doctors,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["searchDoctors", filters],
    queryFn: async () => (await searchAPI.searchDoctors(filters)).data,
    enabled: false, // Manual trigger
  });

  const handleSearch = () => {
    refetch();
  };

  const resetFilters = () => {
    setFilters({
      specialization: "",
      location: "",
      facility_type: "",
      facility_id: "",
      doctor_name: "",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Search Doctors</h2>
          <p className="text-slate-500 text-sm">Find the perfect specialist for your needs</p>
        </div>
      </div>

      {/* Cascading Filter Steps */}
      <div className="space-y-6">
        {/* Step 1: Department/Specialization */}
        <div className="animate-fade-in">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <span className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">1</span>
            Select Specialization
          </label>
          <select
            value={filters.specialization}
            onChange={(e) =>
              setFilters({
                ...filters,
                specialization: e.target.value,
                location: "",
                facility_type: "",
                facility_id: "",
              })
            }
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
          >
            <option value="">All Specializations</option>
            {specializations?.map((spec) => (
              <option key={spec.spec_id} value={spec.name}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Location */}
        {filters.specialization && (
          <div className="animate-fade-in">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <span className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">2</span>
              Select Location
            </label>
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  location: e.target.value,
                  facility_type: "",
                  facility_id: "",
                })
              }
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
            >
              <option value="">All Locations</option>
              {locations?.map((location, idx) => (
                <option key={idx} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Facility Type */}
        {filters.location && (
          <div className="animate-fade-in">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <span className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">3</span>
              Select Facility Type
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                { value: "hospital", label: "Hospital", icon: "🏥" },
                { value: "chamber", label: "Clinic/Chamber", icon: "🩺" },
                { value: "", label: "Both", icon: "✨" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 font-medium ${
                    filters.facility_type === option.value
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={filters.facility_type === option.value}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        facility_type: e.target.value,
                        facility_id: "",
                      })
                    }
                    className="sr-only"
                  />
                  <span>{option.icon}</span>
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Specific Facility */}
        {filters.location && facilities && facilities.length > 0 && (
          <div className="animate-fade-in">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <span className="w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">4</span>
              Select Specific Facility (Optional)
            </label>
            <select
              value={filters.facility_id}
              onChange={(e) =>
                setFilters({ ...filters, facility_id: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
            >
              <option value="">All Facilities</option>
              {facilities?.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 5: Doctor Name */}
        <div className="animate-fade-in">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
            <span className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            Search by Doctor Name (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.doctor_name}
              onChange={(e) =>
                setFilters({ ...filters, doctor_name: e.target.value })
              }
              placeholder="Enter doctor name..."
              className="w-full px-4 py-3.5 pl-12 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-medium placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSearch}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Doctors
          </button>
          <button
            onClick={resetFilters}
            className="px-6 py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Searching doctors...</p>
          </div>
        </div>
      )}

      {doctors && doctors.length > 0 && (
        <div className="mt-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Search Results</h3>
            <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm">
              {doctors.length} found
            </span>
          </div>
          <div className="space-y-4">
            {doctors.map((doctor, idx) => (
              <div
                key={doctor.user_id}
                className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                      {doctor.full_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl text-slate-800">{doctor.full_name}</h4>
                      <p className="text-sm text-slate-500 font-mono">
                        {doctor.doctor_code}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doctor.specializations?.map((spec, i) => (
                          <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-700 mt-3 flex items-center gap-2">
                        <span className="text-slate-500">Consultation Fee:</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          ${doctor.consultation_fee}
                        </span>
                      </p>
                      {doctor.facilities && doctor.facilities.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            Available at:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {doctor.facilities.map((facility, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {facility.facility_name} ({facility.facility_type}) - {facility.location}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {doctors && doctors.length === 0 && (
        <div className="mt-8 text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No doctors found</h3>
          <p className="text-slate-500">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
