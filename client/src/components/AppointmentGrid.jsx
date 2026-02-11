import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesAPI, paymentAPI } from "../services/api";

export default function AppointmentGrid({
  doctor,
  patientId,
  compact = false,
}) {
  const BOOKING_TIMEOUT_MS = 25000;
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBranchKey, setSelectedBranchKey] = useState(""); // "type-id"
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [mfsTransactionId, setMfsTransactionId] = useState("");
  const bookingAbortRef = useRef(null);
  const bookingCancelledByUserRef = useRef(false);
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
    queryKey: ["doctorSlots", doctor?.user_id],
    queryFn: async () =>
      (
        await schedulesAPI.getAvailableSlots(doctor.user_id, {
          start_date: today.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
      ).data,
    enabled: !!doctor?.user_id,
  });

  const { data: schedules } = useQuery({
    queryKey: ["doctorSchedules", doctor?.user_id],
    queryFn: async () =>
      (await schedulesAPI.getDoctorSchedules(doctor.user_id)).data,
    enabled: !!doctor?.user_id,
  });

  // Fetch Patient Balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await paymentAPI.getBalance()).data,
    enabled: !!patientId && showBookingModal,
  });

  // Identify unique branches
  const branches = slots
    ? Array.from(
      new Map(
        slots.map((s) => {
          const key = `${s.facility_type}-${s.facility_id}-${s.branch_name || "default"}`;
          return [
            key,
            {
              key,
              name: s.facility_name,
              type: s.facility_type,
              location: s.branch_name || s.location || "Unknown", // Prefer branch name
              branch_name: s.branch_name,
            },
          ];
        }),
      ).values(),
    )
    : [];

  useEffect(() => {
    if (!selectedBranchKey && branches.length > 0) {
      setSelectedBranchKey(branches[0].key);
    }
  }, [branches, selectedBranchKey]);

  // Filter slots by selected branch
  const filteredSlots = selectedBranchKey
    ? slots.filter((s) => {
      const key = `${s.facility_type}-${s.facility_id}-${s.branch_name || "default"}`;
      return key === selectedBranchKey;
    })
    : [];

  // Book slot mutation
  const bookSlotMutation = useMutation({
    mutationFn: async (data) => {
      const controller = new AbortController();
      bookingAbortRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, BOOKING_TIMEOUT_MS);

      try {
        const response = await schedulesAPI.bookSlot(data, {
          signal: controller.signal,
        });
        return response.data;
      } finally {
        clearTimeout(timeoutId);
        bookingAbortRef.current = null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorSlots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] }); // Update balance
      setShowBookingModal(false);
      setSelectedSlot(null);
      alert("Appointment booked successfully! Confirmation email sent.");
    },
    onError: (err) => {
      if (bookingCancelledByUserRef.current) {
        bookingCancelledByUserRef.current = false;
        return;
      }

      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Booking failed. Please try again.";
      alert(message);
    },
  });

  const closeBookingModal = () => {
    if (bookSlotMutation.isPending && bookingAbortRef.current) {
      bookingCancelledByUserRef.current = true;
      bookingAbortRef.current.abort();
    }

    setShowBookingModal(false);
  };

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
      parseFloat(walletData.balance) <
      parseFloat(doctor.consultation_fee || 0) * 1.1
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
      <div style={{ fontSize: "14px", color: "#94a3b8", padding: "16px" }}>
        Loading schedule...
      </div>
    );

  return (
    <div
      style={{
        background: "transparent",
        borderRadius: "16px",
        padding: compact ? "16px" : "32px",
        border: "none",
      }}
    >
      {!compact && (
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "24px",
            color: "#f8fafc",
          }}
        >
          Available Slots for Dr. {doctor.full_name}
        </h2>
      )}

      <div
        style={{ marginBottom: "32px", marginLeft: "16px", marginTop: "24px" }}
      >
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            color: "#94a3b8",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Select Location
        </label>
        {branches.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            {branches.map((branch) => (
              <button
                key={branch.key}
                onClick={() => setSelectedBranchKey(branch.key)}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  textAlign: "left",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  cursor: "pointer",
                  background:
                    selectedBranchKey === branch.key
                      ? "rgba(58, 175, 169, 0.15)"
                      : "rgba(30, 41, 59, 0.5)",
                  border:
                    selectedBranchKey === branch.key
                      ? "1px solid rgba(58, 175, 169, 0.5)"
                      : "1px solid rgba(100, 116, 139, 0.3)",
                  boxShadow:
                    selectedBranchKey === branch.key
                      ? "0 4px 14px rgba(58, 175, 169, 0.2)"
                      : "none",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      selectedBranchKey === branch.key
                        ? "#3AAFA9"
                        : "rgba(100, 116, 139, 0.3)",
                    color:
                      selectedBranchKey === branch.key ? "white" : "#94a3b8",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>
                    {branch.type === "hospital" ? "H" : "C"}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        selectedBranchKey === branch.key
                          ? "#3AAFA9"
                          : "#f8fafc",
                    }}
                  >
                    {branch.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {branch.location || "General Location"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontStyle: "italic" }}>
            {schedules && schedules.length === 0
              ? "This doctor has not published a schedule yet."
              : "No slots available in the next 4 weeks."}
          </p>
        )}
      </div>

      {/* Slot Grid */}
      {selectedBranchKey ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            maxHeight: "500px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
          className="custom-scrollbar"
        >
          {Object.keys(slotsByDate).length > 0 ? (
            Object.keys(slotsByDate).map((date) => (
              <div key={date} className="animate-fade-in">
                <h3
                  style={{
                    fontWeight: 600,
                    color: "#f8fafc",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3AAFA9",
                    }}
                  ></span>
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "16px",
                  }}
                >
                  {slotsByDate[date].map((slot) => (
                    <button
                      key={slot.slot_id}
                      onClick={() => handleSlotClick(slot)}
                      disabled={slot.status !== "free"}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        transition: "all 0.2s",
                        cursor:
                          slot.status === "free" ? "pointer" : "not-allowed",
                        background:
                          slot.status === "free"
                            ? "rgba(58, 175, 169, 0.2)"
                            : slot.status === "booked"
                              ? "rgba(244, 63, 94, 0.2)"
                              : "rgba(100, 116, 139, 0.2)",
                        color:
                          slot.status === "free"
                            ? "#3AAFA9"
                            : slot.status === "booked"
                              ? "#fb7185"
                              : "#64748b",
                        border:
                          slot.status === "free"
                            ? "1px solid rgba(58, 175, 169, 0.3)"
                            : slot.status === "booked"
                              ? "1px solid rgba(244, 63, 94, 0.3)"
                              : "1px solid rgba(100, 116, 139, 0.3)",
                      }}
                      title={`${slot.status}`}
                    >
                      {slot.slot_time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p
              style={{
                color: "#94a3b8",
                textAlign: "center",
                padding: "32px",
                background: "rgba(30, 41, 59, 0.3)",
                borderRadius: "12px",
                border: "1px dashed rgba(100, 116, 139, 0.3)",
              }}
            >
              No open slots at this location for the next 4 weeks.
            </p>
          )}
        </div>
      ) : null}

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
          <div className="relative bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-white/10 w-full max-w-lg shadow-2xl rounded-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Confirm Appointment
              </h3>
              <button
                onClick={closeBookingModal}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Doctor
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {doctor.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Date & Time
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {new Date(selectedSlot.slot_date).toLocaleDateString()} at{" "}
                    {selectedSlot.slot_time.substring(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Location
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {selectedSlot.facility_name}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Consultation Fee
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {parseFloat(doctor.consultation_fee || 0).toFixed(2)} BDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Service Fee (10%)
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {(parseFloat(doctor.consultation_fee || 0) * 0.1).toFixed(
                      2,
                    )}{" "}
                    BDT
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">
                    Total Fee
                  </span>
                  <span className="text-[#A38D5D] font-bold text-lg">
                    {(parseFloat(doctor.consultation_fee || 0) * 1.1).toFixed(
                      2,
                    )}{" "}
                    BDT
                  </span>
                </div>
              </div>

              {/* Triage Form */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                  Triage Info
                </h4>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
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
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-[#A38D5D] focus:outline-none"
                    placeholder="Briefly describe your symptoms..."
                    rows="2"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
                  Payment Method
                </h4>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "wallet" ? "bg-[#A38D5D]/10 border-[#A38D5D]" : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-white/10 dark:hover:border-white/30"}`}
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
                      <div className="font-bold text-slate-900 dark:text-white">
                        My Wallet
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Balance:{" "}
                        <span
                          className={
                            parseFloat(walletData?.balance) <
                              parseFloat(doctor.consultation_fee || 0) * 1.1
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }
                        >
                          {walletData ? walletData.balance : "..."} BDT
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-slate-500 dark:text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2 7.5A2.5 2.5 0 014.5 5h15A2.5 2.5 0 0122 7.5v9A2.5 2.5 0 0119.5 19h-15A2.5 2.5 0 012 16.5v-9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2 9h20"
                    />
                  </svg>
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mfs" ? "bg-[#A38D5D]/10 border-[#A38D5D]" : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-white/10 dark:hover:border-white/30"}`}
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
                      <div className="font-bold text-slate-900 dark:text-white">
                        Mobile Banking (Bkash/Nagad)
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Pay directly via phone
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-6 h-6 text-slate-500 dark:text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 18h2"
                    />
                  </svg>
                </label>

                {paymentMethod === "mfs" && (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      MFS Transaction ID (optional)
                    </label>
                    <input
                      value={mfsTransactionId}
                      onChange={(e) => setMfsTransactionId(e.target.value)}
                      placeholder="e.g. BKASH123..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:border-[#A38D5D] focus:outline-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      For demo, MFS is simulated as a wallet top-up + payment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={closeBookingModal}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={bookSlotMutation.isPending}
                style={{
                  padding: "10px 24px",
                  borderRadius: "9999px",
                  fontWeight: 700,
                  fontSize: "14px",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: bookSlotMutation.isPending
                    ? "rgba(100, 116, 139, 0.3)"
                    : "rgba(58, 175, 169, 0.2)",
                  color: bookSlotMutation.isPending ? "#94a3b8" : "#3AAFA9",
                  border: bookSlotMutation.isPending
                    ? "1px solid rgba(100, 116, 139, 0.5)"
                    : "1px solid rgba(58, 175, 169, 0.3)",
                  cursor: bookSlotMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                  opacity: bookSlotMutation.isPending ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: bookSlotMutation.isPending
                      ? "#94a3b8"
                      : "#3AAFA9",
                  }}
                ></span>
                {bookSlotMutation.isPending ? "Processing..." : `Pay & Confirm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
