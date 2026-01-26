import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesAPI } from "../services/api";

export default function AppointmentGrid({ doctor, patientId, compact = false }) {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [triageNotes, setTriageNotes] = useState({
    symptoms: "",
    severity: "low",
    notes: "",
  });

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 14); // Show 2 weeks ahead

  // Fetch doctor's available slots
  const { data: slots, isLoading } = useQuery({
    queryKey: ["doctorSlots", doctor.user_id],
    queryFn: async () =>
      (
        await schedulesAPI.getAvailableSlots(doctor.user_id, {
          start_date: today.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
      ).data,
  });

  // Book slot mutation
  const bookSlotMutation = useMutation({
    mutationFn: async (data) => (await schedulesAPI.bookSlot(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorSlots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setShowBookingModal(false);
      setSelectedSlot(null);
      alert("Appointment booked successfully!");
    },
  });

  const handleSlotClick = (slot) => {
    if (slot.status === "free") {
      setSelectedSlot(slot);
      setShowBookingModal(true);
    }
  };

  const handleBooking = () => {
    if (!selectedSlot || !patientId) return;

    bookSlotMutation.mutate({
      slot_id: selectedSlot.slot_id,
      patient_id: patientId,
      doctor_id: doctor.user_id,
      triage_notes: triageNotes.symptoms ? triageNotes : null,
    });
  };

  const getSlotColor = (status, facilityType) => {
    if (status === "blocked") return "bg-gray-400 cursor-not-allowed";
    if (status === "booked" && facilityType === "hospital")
      return "bg-red-400 cursor-not-allowed";
    if (status === "booked" && facilityType === "chamber")
      return "bg-orange-400 cursor-not-allowed";
    if (status === "free" && facilityType === "hospital")
      return "bg-green-400 hover:bg-green-500 cursor-pointer";
    if (status === "free" && facilityType === "chamber")
      return "bg-blue-400 hover:bg-blue-500 cursor-pointer";
    return "bg-gray-200";
  };

  const getSlotIcon = (status) => {
    if (status === "blocked") return "✕";
    if (status === "booked") return "✓";
    return "";
  };

  // Group slots by date
  const slotsByDate = slots?.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  if (isLoading) return <div className="text-sm text-slate-400">Loading slots...</div>;

  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-2 border border-slate-100' : 'p-6 shadow-md'}`}>
      {!compact && (
        <>
          <h2 className="text-2xl font-bold mb-4">
            Available Slots for Dr. {doctor.full_name}
          </h2>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-400 rounded mr-2"></div>
              <span>Hospital - Free</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-400 rounded mr-2"></div>
              <span>Clinic - Free</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-400 rounded mr-2"></div>
              <span>Hospital - Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-orange-400 rounded mr-2"></div>
              <span>Clinic - Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-400 rounded mr-2"></div>
              <span>Blocked</span>
            </div>
          </div>
        </>
      )}

      {/* Slot Grid by Date */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {slotsByDate &&
          Object.keys(slotsByDate).map((date) => (
            <div key={date}>
              <h3 className="font-bold text-lg mb-3">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {slotsByDate[date].map((slot) => (
                  <button
                    key={slot.slot_id}
                    onClick={() => handleSlotClick(slot)}
                    className={`p-3 rounded text-white font-semibold text-sm relative ${getSlotColor(slot.status, slot.facility_type)}`}
                    disabled={slot.status !== "free"}
                    title={`${slot.facility_name} - ${slot.status}`}
                  >
                    <div>{slot.slot_time.substring(0, 5)}</div>
                    <div className="text-xs">
                      {slot.facility_type === "hospital" ? "🏥" : "🏪"}
                    </div>
                    {getSlotIcon(slot.status) && (
                      <span className="absolute top-1 right-1 text-xs">
                        {getSlotIcon(slot.status)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>

      {!slotsByDate ||
        (Object.keys(slotsByDate).length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No slots available for the next 2 weeks.
          </p>
        ))}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Confirm Appointment</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p>
                <strong>Doctor:</strong> {doctor.full_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedSlot.slot_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {selectedSlot.slot_time}
              </p>
              <p>
                <strong>Location:</strong> {selectedSlot.facility_name} (
                {selectedSlot.facility_type})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms (Optional)
                </label>
                <textarea
                  value={triageNotes.symptoms}
                  onChange={(e) =>
                    setTriageNotes({ ...triageNotes, symptoms: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  placeholder="Describe your symptoms..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={triageNotes.severity}
                  onChange={(e) =>
                    setTriageNotes({ ...triageNotes, severity: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={triageNotes.notes}
                  onChange={(e) =>
                    setTriageNotes({ ...triageNotes, notes: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows="2"
                  placeholder="Any additional information..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookSlotMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {bookSlotMutation.isPending ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
