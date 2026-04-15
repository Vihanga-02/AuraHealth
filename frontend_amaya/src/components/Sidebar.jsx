import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  UserRound, Calendar, LayoutDashboard, FileUp, Files, 
  FileText, Activity, Search, ArrowRight, LogOut 
} from "lucide-react";
import { getStoredUser, clearAuth, patientApi } from "../api";

const patientNavItems = [
  { key: "overview",       label: "Overview",        icon: LayoutDashboard, path: "/patient",          subTab: "overview" },
  { key: "profile",        label: "Profile",         icon: UserRound,       path: "/patient",          subTab: "profile" },
  { key: "upload",         label: "Upload Report",   icon: FileUp,          path: "/patient",          subTab: "upload" },
  { key: "reports",        label: "Reports",         icon: Files,           path: "/patient",          subTab: "reports" },
  { key: "prescriptions",  label: "Prescriptions",   icon: FileText,        path: "/patient",          subTab: "prescriptions" },
  { key: "history",        label: "History",         icon: Activity,        path: "/patient",          subTab: "history" },
  { key: "my-appointments",label: "My Appointments", icon: Calendar,        path: "/my-appointments",  subTab: null },
];

const appointmentNavItems = [
  { key: "appointments", label: "Book Appointment", icon: Search, path: "/appointments", subTab: null },
];

// Global event bus to allow PatientPage to know which sub-tab to show
// when a sidebar item is clicked.
export const sidebarEvents = new EventTarget();

export default function Sidebar() {
  const [user] = useState(getStoredUser() || { name: "Patient" });
  const [patientId, setPatientId] = useState(null);
  const [patientName, setPatientName] = useState(user?.name || "Patient");
  const [patientMenuOpen, setPatientMenuOpen] = useState(true);
  const [appointmentMenuOpen, setAppointmentMenuOpen] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    patientApi.getMyProfile()
      .then((profile) => {
        setPatientId(profile._id);
        setPatientName(profile.fullName || user?.name || "Patient");
      })
      .catch(() => {});
  }, []);

  const handleNavClick = (item) => {
    if (item.subTab) {
      setActiveSubTab(item.subTab);
      sidebarEvents.dispatchEvent(new CustomEvent("tabchange", { detail: item.subTab }));
    }
    navigate(item.path);
  };

  const handleMobileChange = (e) => {
    const allItems = [...patientNavItems, ...appointmentNavItems];
    const item = allItems.find((i) => i.key === e.target.value);
    if (item) handleNavClick(item);
  };

  const logout = () => {
    clearAuth();
    window.location.reload();
  };

  const isItemActive = (item) => {
    if (location.pathname !== item.path) return false;
    if (item.subTab === null) return true; // route-only items
    return activeSubTab === item.subTab;
  };

  const NavButton = ({ item }) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={() => handleNavClick(item)}
        className={`group relative flex w-full items-center gap-3 pl-11 pr-4 py-3 text-left text-[13px] font-semibold transition-all rounded-xl ${
          isActive ? "text-blue-700 bg-blue-50/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/30"
        }`}
      >
        <Icon strokeWidth={isActive ? 2.5 : 2} className={`h-4 w-4 transition-colors ${isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"}`} />
        {item.label}
        {isActive && <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
      </button>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-[280px] flex-shrink-0 bg-white border-r border-slate-200 flex-col justify-between h-full">
        <div className="py-8">
          <div className="px-8 pb-6 text-xl font-bold text-blue-900">
            Patient Portal
            <p className="text-xs font-semibold text-blue-400 mt-1">Clinical Serenity</p>
          </div>

          <nav className="flex flex-col mt-2 px-4 space-y-1">
            {/* Patient Service */}
            <div>
              <button
                onClick={() => setPatientMenuOpen(!patientMenuOpen)}
                className={`flex w-full items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  patientMenuOpen ? "text-blue-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${patientMenuOpen ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    <UserRound className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Patient Service</span>
                </div>
                <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${patientMenuOpen ? "rotate-90 text-blue-600" : "text-slate-300"}`} />
              </button>
              <div className={`mt-1 flex flex-col transition-all duration-300 overflow-hidden ${patientMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                {patientNavItems.map((item) => <NavButton key={item.key} item={item} />)}
              </div>
            </div>

            {/* Appointment Service */}
            <div className="pt-2">
              <button
                onClick={() => setAppointmentMenuOpen(!appointmentMenuOpen)}
                className={`flex w-full items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  appointmentMenuOpen ? "text-blue-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${appointmentMenuOpen ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Appointment Service</span>
                </div>
                <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${appointmentMenuOpen ? "rotate-90 text-blue-600" : "text-slate-300"}`} />
              </button>
              <div className={`mt-1 flex flex-col transition-all duration-300 overflow-hidden ${appointmentMenuOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
                {appointmentNavItems.map((item) => <NavButton key={item.key} item={item} />)}
              </div>
            </div>
          </nav>
        </div>

        {/* User card */}
        <div className="p-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-blue-700 text-white font-bold overflow-hidden shadow-md">
                {patientName ? patientName.charAt(0).toUpperCase() : <UserRound className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{patientName}</p>
                <p className="truncate text-[11px] font-medium text-slate-500 uppercase">
                  ID: {patientId ? `CS-${String(patientId).slice(-5)}` : "PENDING"}
                </p>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors p-2" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4">
        <h1 className="text-lg font-bold text-blue-900">Patient Portal</h1>
        <div className="flex items-center gap-2">
          <select
            onChange={handleMobileChange}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <optgroup label="Patient Service">
              {patientNavItems.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
            <optgroup label="Appointment Service">
              {appointmentNavItems.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
          </select>
          <button onClick={logout} className="p-2 text-rose-500 bg-rose-50 rounded-lg">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
