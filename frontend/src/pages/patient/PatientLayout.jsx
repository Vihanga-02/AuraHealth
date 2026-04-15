import { Outlet } from 'react-router-dom';
import PatientSidebar from '../../components/PatientSidebar';

export default function PatientLayout() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <PatientSidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
