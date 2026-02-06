import { useQuery } from "@tanstack/react-query";
import { hospitalsAPI, paymentAPI } from "../services/api";
import StaffManagement from "./StaffManagement";

export default function HospitalDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["hospital-dashboard-stats"],
    queryFn: async () => (await hospitalsAPI.getMyStats()).data,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await paymentAPI.getBalance()).data,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["hospital-recent-activity"],
    queryFn: async () =>
      (await hospitalsAPI.getMyRecentActivity({ limit: 10 })).data,
  });

  return (
    <div
      className="animate-fade-in"
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
      }}
    >
      {/* Hero Header */}
      <div
        className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700/50"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="bg-white/30 dark:bg-white/10"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "256px",
            height: "256px",
            borderRadius: "50%",
            filter: "blur(48px)",
            transform: "translate(48px, -48px)",
          }}
        ></div>
        <div
          style={{
            position: "relative",
            padding: "32px 48px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ marginLeft: "20px" }}>
            <h1
              className="text-slate-900 dark:text-white"
              style={{
                fontSize: "48px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Hospital Administration
            </h1>
            <p
              className="text-slate-600 dark:text-slate-300"
              style={{
                fontSize: "18px",
                maxWidth: "560px",
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              {stats?.hospital_name || "Your hospital"}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ position: "relative", padding: "0 48px 32px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            <div
              className="bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-600/50"
              style={{
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="text-slate-500 dark:text-slate-400"
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Doctors
              </p>
              <p
                className="text-slate-900 dark:text-white"
                style={{ fontSize: "30px", fontWeight: 700 }}
              >
                {stats?.doctor_count ?? 0}
              </p>
            </div>
            <div
              className="bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-600/50"
              style={{
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="text-slate-500 dark:text-slate-400"
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Patients
              </p>
              <p
                className="text-slate-900 dark:text-white"
                style={{ fontSize: "30px", fontWeight: 700 }}
              >
                {stats?.patient_count ?? 0}
              </p>
            </div>
            <div
              className="bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-600/50"
              style={{
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="text-slate-500 dark:text-slate-400"
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Branches
              </p>
              <p
                className="text-slate-900 dark:text-white"
                style={{ fontSize: "30px", fontWeight: 700 }}
              >
                {stats?.branch_count ?? 0}
              </p>
            </div>
            <div
              className="bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-600/50"
              style={{
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <p
                className="text-slate-500 dark:text-slate-400"
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Balance
              </p>
              <p
                className="text-slate-900 dark:text-white"
                style={{ fontSize: "30px", fontWeight: 700 }}
              >
                {wallet ? `${wallet.currency} ${wallet.balance}` : "..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "32px",
        }}
      >
        <div
          className="bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-600/50"
          style={{
            backdropFilter: "blur(24px)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
            padding: "32px",
          }}
        >
          <h2
            className="text-slate-900 dark:text-white"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "24px",
            }}
          >
            Quick Actions
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            <button
              className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              style={{
                padding: "24px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                className="text-slate-900 dark:text-white"
                style={{ fontWeight: 700, fontSize: "14px" }}
              >
                Add Doctor
              </span>
            </button>
            <button
              className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              style={{
                padding: "24px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                className="text-slate-900 dark:text-white"
                style={{ fontWeight: 700, fontSize: "14px" }}
              >
                Manage Departments
              </span>
            </button>
            <button
              className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              style={{
                padding: "24px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                className="text-slate-900 dark:text-white"
                style={{ fontWeight: 700, fontSize: "14px" }}
              >
                View Reports
              </span>
            </button>
            <button
              className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-200/80 dark:hover:bg-slate-800/50"
              style={{
                padding: "24px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                className="text-slate-900 dark:text-white"
                style={{ fontWeight: 700, fontSize: "14px" }}
              >
                Settings
              </span>
            </button>
          </div>
        </div>

        {/* Staff Management Section */}
        <div
          className="bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-600/50"
          style={{
            backdropFilter: "blur(24px)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
            padding: "32px",
          }}
        >
          <StaffManagement />
        </div>

        <div
          className="bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-600/50"
          style={{
            backdropFilter: "blur(24px)",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
            padding: "32px",
          }}
        >
          <h2
            className="text-slate-900 dark:text-white"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "24px",
            }}
          >
            Recent Activity
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => {
                const dateLabel = item?.appt_date
                  ? new Date(item.appt_date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                const timeLabel = item?.appt_time
                  ? String(item.appt_time).substring(0, 5)
                  : "";

                return (
                  <div
                    key={item.appointment_id ?? idx}
                    className="border-slate-200/50 dark:border-slate-600/50"
                    style={{
                      display: "flex",
                      gap: "24px",
                      alignItems: "flex-start",
                      paddingBottom: "24px",
                      borderBottom:
                        idx < recentActivity.length - 1
                          ? "1px solid"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#3AAFA9",
                        marginTop: "8px",
                      }}
                    ></div>
                    <div>
                      <p
                        className="text-slate-900 dark:text-white"
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        Appointment scheduled with Dr. {item.doctor_name}
                        {item.patient_name
                          ? ` • Patient: ${item.patient_name}`
                          : ""}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "12px" }}>
                        {dateLabel}
                        {dateLabel && timeLabel ? " • " : ""}
                        {timeLabel}
                        {item.status ? ` • ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "14px" }}>
                No recent activity yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
