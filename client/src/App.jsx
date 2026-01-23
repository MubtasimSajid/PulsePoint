import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Doctors from "./components/Doctors";
import Appointments from "./components/Appointments";
import Hospitals from "./components/Hospitals";
import Prescriptions from "./components/Prescriptions";
import MedicalHistory from "./components/MedicalHistory";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          {/* Navigation Bar */}
          <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link to="/" className="text-2xl font-bold">
                  🏥 PulsePoint HMS
                </Link>
                <div className="flex space-x-4">
                  <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">
                    Dashboard
                  </Link>
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
                    Appointments
                  </Link>
                  <Link
                    to="/hospitals"
                    className="hover:bg-blue-700 px-3 py-2 rounded"
                  >
                    Hospitals
                  </Link>
                  <Link
                    to="/prescriptions"
                    className="hover:bg-blue-700 px-3 py-2 rounded"
                  >
                    Prescriptions
                  </Link>
                  <Link
                    to="/medical-history"
                    className="hover:bg-blue-700 px-3 py-2 rounded"
                  >
                    History
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/medical-history" element={<MedicalHistory />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
