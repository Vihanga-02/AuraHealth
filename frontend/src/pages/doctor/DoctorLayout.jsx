import { Outlet } from 'react-router-dom';
import DoctorSidebar from '../../components/DoctorSidebar';

const DoctorLayout = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      <DoctorSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DoctorLayout;
