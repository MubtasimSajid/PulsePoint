import { useState, useEffect } from "react";
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
      <div className="p-8 text-center text-slate-500">Loading wallet...</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Balance Card */}
      <div className="bg-primary rounded-3xl p-8 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-primary-foreground/80 font-medium mb-1">Total Balance</p>
            <h2 className="text-5xl font-bold tracking-tight">
              {wallet?.currency} {wallet?.balance}
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <span className="text-sm font-medium">Active Account</span>
          </div>
        </div>

        {/* Add Funds Form */}
        <form onSubmit={handleAddFunds} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-primary-foreground/80 mb-2">
              Add Funds
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/60">
                ৳
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 pl-10 py-3 focus:outline-none focus:border-white/50 transition-colors text-white placeholder-white/30"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addFundsMutation.isPending}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {addFundsMutation.isPending ? "Adding..." : "Add Funds"}
          </button>
        </form>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-3xl p-8 shadow-sm border border-border">
        <h3 className="text-xl font-bold text-foreground mb-6">
          Recent Transactions
        </h3>
        <div className="space-y-4">
          {wallet?.transactions?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          ) : (
            wallet?.transactions?.map((tx) => (
              <div
                key={tx.transaction_id || tx.txn_id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  {(() => {
                    const isCredit =
                      tx.direction === "credit" ||
                      tx.type === "deposit" ||
                      tx.type === "refund";
                    return (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCredit
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-100 text-rose-600"
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
                        className={`font-bold ${
                          isCredit ? "text-emerald-600" : "text-slate-900"
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
