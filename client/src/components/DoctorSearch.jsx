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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Search Doctors</h2>

      {/* Cascading Filter Steps */}
      <div className="space-y-4">
        {/* Step 1: Department/Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step 1: Select Specialization
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
            className="w-full border rounded px-3 py-2"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 2: Select Location
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
              className="w-full border rounded px-3 py-2"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 3: Select Facility Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hospital"
                  checked={filters.facility_type === "hospital"}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      facility_type: e.target.value,
                      facility_id: "",
                    })
                  }
                  className="mr-2"
                />
                Hospital
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="chamber"
                  checked={filters.facility_type === "chamber"}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      facility_type: e.target.value,
                      facility_id: "",
                    })
                  }
                  className="mr-2"
                />
                Clinic/Chamber
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value=""
                  checked={filters.facility_type === ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      facility_type: "",
                      facility_id: "",
                    })
                  }
                  className="mr-2"
                />
                Both
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Specific Facility */}
        {filters.location && facilities && facilities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 4: Select Specific Facility (Optional)
            </label>
            <select
              value={filters.facility_id}
              onChange={(e) =>
                setFilters({ ...filters, facility_id: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Doctor Name (Optional)
          </label>
          <input
            type="text"
            value={filters.doctor_name}
            onChange={(e) =>
              setFilters({ ...filters, doctor_name: e.target.value })
            }
            placeholder="Enter doctor name..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔍 Search Doctors
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && <p className="mt-4 text-center">Searching...</p>}

      {doctors && doctors.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">
            Search Results ({doctors.length})
          </h3>
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.user_id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{doctor.full_name}</h4>
                    <p className="text-sm text-gray-600">
                      {doctor.doctor_code}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {doctor.specializations?.join(", ")}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Consultation Fee:{" "}
                      <span className="font-semibold">
                        ${doctor.consultation_fee}
                      </span>
                    </p>
                    {doctor.facilities && doctor.facilities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500">
                          Available at:
                        </p>
                        {doctor.facilities.map((facility, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-2 mt-1"
                          >
                            {facility.facility_name} ({facility.facility_type})
                            - {facility.location}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectDoctor && onSelectDoctor(doctor)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {doctors && doctors.length === 0 && (
        <p className="mt-6 text-center text-gray-500">
          No doctors found with the selected criteria.
        </p>
      )}
    </div>
  );
}
