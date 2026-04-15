import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
