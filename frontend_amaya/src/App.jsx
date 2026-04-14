import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import Sidebar from './components/Sidebar'

// Patient Service pages
import PatientPage from './components/PatientPage'

// Appointment Service pages
import AppointmentPage from './components/AppointmentPage'

function App() {
  return (
    <Router>
      <div className="flex h-screen w-full bg-[#f4f7fe]">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 md:p-8 lg:p-10 max-w-[1200px] mx-auto space-y-6">
            <Routes>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/patient" replace />} />

              {/* Patient Service Routes */}
              <Route path="/patient" element={<PatientPage />} />

              {/* Appointment Service Routes */}
              <Route path="/appointments" element={<AppointmentPage view="book" />} />
              <Route path="/my-appointments" element={<AppointmentPage view="list" />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/patient" replace />} />

            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App
