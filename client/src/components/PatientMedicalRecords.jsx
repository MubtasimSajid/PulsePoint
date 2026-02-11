import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsAPI } from "../services/api";

export default function PatientMedicalRecords({ userId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    record_type: "Report",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
    file_url: "",
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["medicalRecords", userId],
    queryFn: async () => (await medicalRecordsAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => medicalRecordsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["medicalRecords"]);
      setShowForm(false);
      setFormData({
        title: "",
        record_type: "Report",
        description: "",
        record_date: new Date().toISOString().split("T")[0],
        file_url: "",
      });
    },
    onError: (error) => {
      alert(
        "Failed to create record: " +
          (error.response?.data?.error || error.message),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => medicalRecordsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["medicalRecords"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getIcon = (type) => {
    switch (type) {
      case "Report":
        return "📄";
      case "Prescription":
        return "💊";
      case "Lab":
        return "🧪";
      default:
        return "📁";
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-400">Loading records...</div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Medical Records
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
        >
          + Add Record
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Add New Record
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Type *
                  </label>
                  <select
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    value={formData.record_type}
                    onChange={(e) =>
                      setFormData({ ...formData, record_type: e.target.value })
                    }
                  >
                    <option value="Report">Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Lab">Lab Result</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    value={formData.record_date}
                    onChange={(e) =>
                      setFormData({ ...formData, record_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white h-24"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  File Link (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/file.pdf"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                  value={formData.file_url}
                  onChange={(e) =>
                    setFormData({ ...formData, file_url: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                >
                  {createMutation.isPending ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {records?.map((record) => (
          <div
            key={record.record_id}
            className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-emerald-500/30 transition group relative shadow-sm"
          >
            <button
              onClick={() => deleteMutation.mutate(record.record_id)}
              className="absolute top-4 right-4 text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
              title="Delete Record"
            >
              🗑️
            </button>
            <div className="flex items-start gap-4">
              <div className="text-3xl">{getIcon(record.record_type)}</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {record.title}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold mt-1">
                  {record.record_type} •{" "}
                  {new Date(record.record_date).toLocaleDateString()}
                </p>
                {record.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 line-clamp-2">
                    {record.description}
                  </p>
                )}
                {record.file_url && (
                  <a
                    href={record.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                  >
                    View Document →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {records?.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-600 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            You haven't added any records yet.
          </div>
        )}
      </div>
    </div>
  );
}
