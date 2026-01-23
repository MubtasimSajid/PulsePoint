import { useState, useEffect } from "react";
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

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Navigation Component
function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold">
            🏥 PulsePoint HMS
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">
              Dashboard
            </Link>

            {user.role === "admin" && (
              <>
                <Link
                  to="/patients"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Patients
                </Link>
                <Link
                  to="/doctors"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Doctors
                </Link>
                <Link
                  to="/appointments"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  All Appointments
                </Link>
                <Link
                  to="/hospitals"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Hospitals
                </Link>
              </>
            )}

            {user.role === "patient" && (
              <>
                <Link
                  to="/search-doctors"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Search Doctors
                </Link>
                <Link
                  to="/my-appointments"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  My Appointments
                </Link>
              </>
            )}

            {user.role === "doctor" && (
              <>
                <Link
                  to="/appointments"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  My Appointments
                </Link>
                <Link
                  to="/prescriptions"
                  className="hover:bg-blue-700 px-3 py-2 rounded"
                >
                  Prescriptions
                </Link>
              </>
            )}

            <Link
              to="/medical-history"
              className="hover:bg-blue-700 px-3 py-2 rounded"
            >
              History
            </Link>

            <div className="border-l border-blue-500 pl-4 flex items-center space-x-3">
              <span className="text-sm">
                👤 {user.full_name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation user={user} onLogout={handleLogout} />

          <main className={user ? "container mx-auto px-4 py-8" : ""}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Register onRegister={handleLogin} />
                  )
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
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
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search-doctors"
                element={
                  <ProtectedRoute>
                    <DoctorSearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-appointments"
                element={
                  <ProtectedRoute>
                    <PatientDashboard patientId={user?.user_id} />
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
                    <MedicalHistory />
                  </ProtectedRoute>
                }
              />

              {/* Redirect to login for any unknown route */}
              <Route
                path="*"
                element={<Navigate to={user ? "/" : "/login"} replace />}
              />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
