import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../../components/DoctorSidebar';

export default function DoctorLayout() {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <DoctorSidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
