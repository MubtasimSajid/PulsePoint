import { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Doctors from "./components/Doctors";
import Appointments from "./components/Appointments";
import Hospitals from "./components/Hospitals";
import Prescriptions from "./components/Prescriptions";
import MedicalHistory from "./components/MedicalHistory";
import DoctorSearch from "./components/DoctorSearch";
import PatientDashboard from "./components/PatientDashboard";
import Profile from "./components/Profile";
import DoctorProfile from "./components/DoctorProfile";
import DoctorDashboard from "./components/DoctorDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import PatientMedicalHistory from "./components/PatientMedicalHistory";
import Wallet from "./components/Wallet";

// Theme Context
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light-mode");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light-mode");
      root.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Navigation Component
function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="nav-premium sticky top-0 z-50">
      <div className="container mx-auto pl-4 pr-6">
        <div className="flex items-center justify-between h-18 py-4">
          <Link to="/" className="flex items-center group nav-brand">
            <span className="text-xl font-bold text-primary tracking-tight hover:text-[#3AAFA9] transition-colors">
              PulsePoint
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button - ALWAYS VISIBLE */}
            <button
              onClick={toggleTheme}
              className="p-2 mr-2 rounded-xl text-slate-500 dark:text-secondary hover:text-[#3AAFA9] hover:bg-[#3AAFA9]/10 transition-colors border border-transparent hover:border-[#3AAFA9]/20"
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {user && (
              <>
                {user?.role === "admin" && (
                  <>
                    <Link
                      to="/patients"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Patients
                    </Link>
                    <Link
                      to="/doctors"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Doctors
                    </Link>
                    <Link
                      to="/appointments"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Appointments
                    </Link>
                    <Link
                      to="/hospitals"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Hospitals
                    </Link>
                  </>
                )}

                {user?.role === "patient" && (
                  <>
                    <Link
                      to="/search-doctors"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Find Doctors
                    </Link>
                    <Link
                      to="/my-appointments"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      My Appointments
                    </Link>
                  </>
                )}

                {user?.role === "doctor" && (
                  <>
                    <Link
                      to="/doctor-dashboard"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1-1-3 3-1.5-1.5 3-3-1-1 3-.75m8.25-10.5a3 3 0 11-6 0 3 3 0 016 0zM4 20a8 8 0 0116 0"
                        />
                      </svg>
                      Dashboard
                    </Link>

                    <Link
                      to="/doctor-dashboard?tab=schedule"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Schedule
                    </Link>
                    <Link
                      to="/prescriptions"
                      className="nav-link flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Prescriptions
                    </Link>
                  </>
                )}

                <Link
                  to="/medical-history"
                  className="nav-link flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  History
                </Link>
                <Link to="/wallet" className="nav-link flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4-5h4"
                    />
                  </svg>
                  Wallet
                </Link>
                {(user?.role === "patient" || user?.role === "doctor") && (
                  <Link
                    to="/profile"
                    className="nav-link flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Profile
                  </Link>
                )}

                <div className="ml-4 pl-4 border-l border-slate-200/50 dark:border-white/10 flex items-center gap-4">
                  <div className="flex items-center gap-4 px-6 py-3 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div
                      className="text-right hidden sm:block"
                      style={{ paddingRight: "15px" }}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white leading-none mb-1.5">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-secondary capitalize leading-none">
                        {user?.role?.replace("_", " ") || "User"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
                    title="Logout"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen">
            <Navigation user={user} onLogout={handleLogout} />

            <main className={user ? "container mx-auto px-6 py-10" : ""}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    !user ? (
                      <Login onLogin={handleLogin} />
                    ) : (
                      <Navigate to="/" />
                    )
                  }
                />
                <Route
                  path="/register"
                  element={
                    !user ? (
                      <Register onRegister={handleLogin} />
                    ) : (
                      <Navigate to="/" />
                    )
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      {user?.role === "doctor" ? (
                        <Navigate to="/doctor-dashboard" />
                      ) : user?.role === "patient" ? (
                        <Navigate to="/patient-dashboard" />
                      ) : user?.role === "hospital_admin" ? (
                        <Navigate to="/hospital-dashboard" />
                      ) : user?.role === "admin" ? (
                        <Navigate to="/hospitals" />
                      ) : (
                        <Dashboard user={user} />
                      )}
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute>
                      <Patients />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors"
                  element={
                    <ProtectedRoute>
                      <Doctors />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor Search & Booking (Patient View) */}
                <Route
                  path="/search-doctors"
                  element={
                    <ProtectedRoute>
                      <DoctorSearch />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-appointments"
                  element={
                    <ProtectedRoute>
                      <PatientDashboard patientId={user?.user_id} user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/hospitals"
                  element={
                    <ProtectedRoute>
                      <Hospitals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions"
                  element={
                    <ProtectedRoute>
                      <Prescriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-history"
                  element={
                    <ProtectedRoute>
                      {user?.role === "patient" ? (
                        <PatientMedicalHistory userId={user?.user_id} />
                      ) : (
                        <MedicalHistory />
                      )}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <Wallet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-dashboard"
                  element={
                    <ProtectedRoute>
                      <PatientDashboard patientId={user?.user_id} user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor-dashboard"
                  element={
                    <ProtectedRoute>
                      <DoctorDashboard doctorId={user?.user_id} />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/hospital-dashboard"
                  element={
                    <ProtectedRoute>
                      <HospitalDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      {user?.role === "doctor" ? (
                        <DoctorProfile userId={user?.user_id} />
                      ) : (
                        <Profile userId={user?.user_id} />
                      )}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor-profile/:id"
                  element={
                    <ProtectedRoute>
                      <DoctorProfile />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
