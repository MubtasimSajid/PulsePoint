import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesAPI, paymentAPI } from "../services/api";

export default function AppointmentGrid({
  doctor,
  patientId,
  compact = false,
}) {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBranchKey, setSelectedBranchKey] = useState(""); // "type-id"
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [mfsTransactionId, setMfsTransactionId] = useState("");
  const [triageNotes, setTriageNotes] = useState({
    symptoms: "",
    severity: "low",
    notes: "",
  });

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 28); // Show 4 weeks

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

  // Fetch Patient Balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet", patientId],
    queryFn: async () => (await paymentAPI.getBalance()).data,
    enabled: !!patientId && showBookingModal,
  });

  // Identify unique branches
  const branches = slots
    ? Array.from(
        new Map(
          slots.map((s) => [
            `${s.facility_type}-${s.facility_id}`,
            {
              key: `${s.facility_type}-${s.facility_id}`,
              name: s.facility_name,
              type: s.facility_type,
              location: s.location || "Unknown",
            },
          ]),
        ).values(),
      )
    : [];

  // Filter slots by selected branch
  const filteredSlots = selectedBranchKey
    ? slots.filter(
        (s) => `${s.facility_type}-${s.facility_id}` === selectedBranchKey,
      )
    : [];

  // Book slot mutation
  const bookSlotMutation = useMutation({
    mutationFn: async (data) => (await schedulesAPI.bookSlot(data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorSlots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] }); // Update balance
      setShowBookingModal(false);
      setSelectedSlot(null);
      alert("Appointment booked successfully! Confirmation email sent.");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Booking failed");
    },
  });

  const handleSlotClick = (slot) => {
    if (slot.status === "free") {
      setSelectedSlot(slot);
      setShowBookingModal(true);
      setPaymentMethod("wallet");
      setMfsTransactionId("");
    }
  };

  const handleBooking = () => {
    if (!selectedSlot || !patientId) return;

    if (
      paymentMethod === "wallet" &&
      walletData &&
      walletData.balance < (doctor.consultation_fee || 0)
    ) {
      alert("Insufficient balance! Please add funds or choose MFS.");
      return;
    }

    bookSlotMutation.mutate({
      slot_id: selectedSlot.slot_id,
      triage_notes: triageNotes.symptoms ? triageNotes : null,
      payment_method: paymentMethod,
      mfs_transaction_id: paymentMethod === "mfs" ? mfsTransactionId : null,
    });
  };

  const getSlotColor = (status) => {
    if (status === "blocked")
      return "bg-slate-700 cursor-not-allowed text-slate-500 border border-slate-600";
    if (status === "booked")
      return "bg-rose-900/50 cursor-not-allowed text-rose-300 border border-rose-800";
    return "bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white border border-emerald-500 shadow-sm";
  };

  // Group slots by date
  const slotsByDate = filteredSlots?.reduce((acc, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  if (isLoading)
    return (
      <div className="text-sm text-slate-400 p-4">Loading schedule...</div>
    );

  return (
    <div
      className={`bg-slate-900/50 rounded-2xl border border-white/10 ${compact ? "p-4" : "p-8"}`}
    >
      {!compact && (
        <h2 className="text-2xl font-bold mb-6 text-white">
          Available Slots for Dr. {doctor.full_name}
        </h2>
      )}

      {/* Branch Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wide">
          Select Location
        </label>
        {branches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <button
                key={branch.key}
                onClick={() => setSelectedBranchKey(branch.key)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                  selectedBranchKey === branch.key
                    ? "bg-[#A38D5D] border-[#A38D5D] text-white shadow-lg shadow-[#A38D5D]/20 transform scale-[1.02]"
                    : "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 hover:border-white/20"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    selectedBranchKey === branch.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {branch.type === "hospital" ? "🏥" : "🏪"}
                </div>
                <div>
                  <div className="font-bold">{branch.name}</div>
                  <div className="text-xs opacity-70">
                    {branch.location || "General Location"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 italic">No available locations found.</p>
        )}
      </div>

      {/* Slot Grid */}
      {selectedBranchKey ? (
        <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(slotsByDate).length > 0 ? (
            Object.keys(slotsByDate).map((date) => (
              <div key={date} className="animate-fade-in">
                <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A38D5D]"></span>
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {slotsByDate[date].map((slot) => (
                    <button
                      key={slot.slot_id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={slot.status !== "free"}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200 ${getSlotColor(slot.status)}`}
                      title={`${slot.status}`}
                    >
                      {slot.slot_time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
              No open slots at this location for the next 4 weeks.
            </p>
          )}
        </div>
      ) : (
        branches.length > 0 && (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed text-slate-400">
            <span className="text-2xl block mb-2">👆</span>
            Please select a location above to view slots.
          </div>
        )
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg shadow-2xl rounded-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Confirm Appointment
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor</span>
                  <span className="text-white font-medium">
                    {doctor.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time</span>
                  <span className="text-white font-medium">
                    {new Date(selectedSlot.slot_date).toLocaleDateString()} at{" "}
                    {selectedSlot.slot_time.substring(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white font-medium">
                    {selectedSlot.facility_name}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                  <span className="text-slate-400">Consultation Fee</span>
                  <span className="text-[#A38D5D] font-bold text-lg">
                    {doctor.consultation_fee || 0} BDT
                  </span>
                </div>
              </div>

              {/* Triage Form */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wide">
                  Triage Info
                </h4>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Symptoms (Optional)
                  </label>
                  <textarea
                    value={triageNotes.symptoms}
                    onChange={(e) =>
                      setTriageNotes({
                        ...triageNotes,
                        symptoms: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#A38D5D] focus:outline-none"
                    placeholder="Briefly describe your symptoms..."
                    rows="2"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm uppercase tracking-wide">
                  Payment Method
                </h4>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "wallet" ? "bg-[#A38D5D]/10 border-[#A38D5D]" : "bg-slate-800 border-white/10 hover:border-white/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="wallet"
                      checked={paymentMethod === "wallet"}
                      onChange={() => setPaymentMethod("wallet")}
                      className="text-[#A38D5D] focus:ring-[#A38D5D]"
                    />
                    <div>
                      <div className="font-bold text-white">My Wallet</div>
                      <div className="text-xs text-slate-400">
                        Balance:{" "}
                        <span
                          className={
                            walletData?.balance < (doctor.consultation_fee || 0)
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }
                        >
                          {walletData ? walletData.balance : "..."} BDT
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mfs" ? "bg-[#A38D5D]/10 border-[#A38D5D]" : "bg-slate-800 border-white/10 hover:border-white/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="mfs"
                      checked={paymentMethod === "mfs"}
                      onChange={() => setPaymentMethod("mfs")}
                      className="text-[#A38D5D] focus:ring-[#A38D5D]"
                    />
                    <div>
                      <div className="font-bold text-white">
                        Mobile Banking (Bkash/Nagad)
                      </div>
                      <div className="text-xs text-slate-400">
                        Pay directly via phone
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl">📱</span>
                </label>

                {paymentMethod === "mfs" && (
                  <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
                    <label className="block text-xs text-slate-400 mb-1">
                      MFS Transaction ID (optional)
                    </label>
                    <input
                      value={mfsTransactionId}
                      onChange={(e) => setMfsTransactionId(e.target.value)}
                      placeholder="e.g. BKASH123..."
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#A38D5D] focus:outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      For demo, MFS is simulated as a wallet top-up + payment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-800/50">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookSlotMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A38D5D] to-[#8a764d] text-white font-bold hover:shadow-lg hover:shadow-[#A38D5D]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {bookSlotMutation.isPending ? "Processing..." : `Pay & Confirm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
