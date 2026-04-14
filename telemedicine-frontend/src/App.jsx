import { Navigate, Route, Routes } from 'react-router-dom';
import ScheduleHome from './pages/ScheduleHome';
import ScheduleManager from './pages/ScheduleManager';
import TelemedicinePage from './pages/TelemedicinePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ScheduleHome />} />
      <Route path="/manage" element={<ScheduleManager />} />
      <Route path="/telemedicine" element={<TelemedicinePage />} />
      <Route path="/telemedicine/join/:scheduleId" element={<TelemedicinePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
