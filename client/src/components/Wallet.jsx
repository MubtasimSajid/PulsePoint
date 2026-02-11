import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentAPI } from "../services/api";

export default function Wallet() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await paymentAPI.getBalance()).data,
  });

  const addFundsMutation = useMutation({
    mutationFn: async (amt) => (await paymentAPI.addFunds(amt)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(["wallet"]);
      setAmount("");
      alert("Funds added successfully!");
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to add funds");
    },
  });

  const handleAddFunds = (e) => {
    e.preventDefault();
    setError("");
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    addFundsMutation.mutate(parseFloat(amount));
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading wallet...</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Balance Card */}
      <div
        className="bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50"
        style={{ padding: "32px" }}
      >
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <p className="text-muted-foreground" style={{ fontSize: "14px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Total Balance</p>
              <div
                className="bg-[#3AAFA9]/10 border border-[#3AAFA9]/30"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "20px",
                  padding: "0 10px",
                  borderRadius: "999px"
                }}
              >
                <span className="text-[#3AAFA9]" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>Active</span>
              </div>
            </div>
            <h2 className="text-foreground" style={{ fontSize: "48px", fontWeight: 700, lineHeight: 1, margin: 0 }}>
              {wallet?.currency} {wallet?.balance}
            </h2>
          </div>

          {/* Add Funds Form */}
          <form onSubmit={handleAddFunds} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "nowrap" }}>
            <div style={{ position: "relative", width: "160px" }}>
              <label className="text-muted-foreground" style={{ display: "block", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                Add Funds
              </label>
              <div style={{ position: "relative" }}>
                <span className="text-muted-foreground" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
                  ৳
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:border-[#3AAFA9]"
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 32px",
                    borderRadius: "12px",
                    outline: "none",
                    fontSize: "14px",
                    transition: "all 0.2s"
                  }}
                  min="0"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addFundsMutation.isPending}
              className="bg-[#3AAFA9] hover:bg-[#2d9d97] text-white"
              style={{
                height: "42px",
                padding: "0 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 6px -1px rgba(58, 175, 169, 0.2)"
              }}
            >
              {addFundsMutation.isPending ? "..." : "Add"}
            </button>
          </form>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>

      {/* Transactions */}
      <div className="bg-card/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
        <h3 className="text-xl font-bold text-foreground mb-6">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {wallet?.transactions?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          ) : (
            wallet?.transactions?.map((tx) => (
              <div
                key={tx.transaction_id || tx.txn_id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  {(() => {
                    const isCredit =
                      tx.direction === "credit" ||
                      tx.type === "deposit" ||
                      tx.type === "refund";
                    return (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-rose-500/15 text-rose-500"
                          }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {isCredit ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          )}
                        </svg>
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()} •{" "}
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    const isCredit =
                      tx.direction === "credit" ||
                      tx.type === "deposit" ||
                      tx.type === "refund";
                    return (
                      <p
                        className={`font-bold ${isCredit ? "text-emerald-500" : "text-foreground"
                          }`}
                      >
                        {isCredit ? "+" : "-"} {wallet.currency} {tx.amount}
                      </p>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {tx.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
