import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { patientApi, getStoredUser, clearAuth } from "../api";
import { sidebarEvents } from "./Sidebar";
import { 
  Calendar, FileUp, ShieldCheck, Files, FileText, UserRound, 
  ArrowRight, FilePlus2, Receipt, Trash2
} from "lucide-react";
import { InfoAlert, StatCard } from "./common/UIComponents";

const emptyProfile = {
  phone: "",
  dateOfBirth: "",
  gender: "Other",
  address: "",
  bloodGroup: "",
  allergies: "",
  chronicConditions: "",
  emergencyContactName: "",
  emergencyContactPhone: ""
};

export default function PatientPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser() || { name: "Patient", email: "patient@example.com" });
  const [patient, setPatient] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("General");
  const [reportFile, setReportFile] = useState(null);
  const [history, setHistory] = useState({ reports: [], prescriptions: [] });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const hasProfile = useMemo(() => Boolean(patient?._id), [patient]);

  // Listen for tab changes from Sidebar clicks
  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    sidebarEvents.addEventListener("tabchange", handler);
    return () => sidebarEvents.removeEventListener("tabchange", handler);
  }, []);

  const setMessage = (msg, isError = false) => {
    setError(isError ? msg : "");
    setStatus(isError ? "" : msg);
  };

  useEffect(() => {
    if (status || error) {
      const timer = setTimeout(() => { setStatus(""); setError(""); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, error]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await patientApi.getMyProfile();
      setPatient(profile);
      setProfileForm({
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
        gender: profile.gender || "Other",
        address: profile.address || "",
        bloodGroup: profile.bloodGroup || "",
        allergies: (profile.allergies || []).join(", "),
        chronicConditions: (profile.chronicConditions || []).join(", "),
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || ""
      });
      try {
        const historyData = await patientApi.getHistory(profile._id);
        setHistory(historyData);
      } catch { setHistory({ reports: [], prescriptions: [] }); }
    } catch {
      setPatient(null);
      setHistory({ reports: [], prescriptions: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateOrUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!hasProfile) {
        await patientApi.createProfile(profileForm);
        setMessage("Patient profile created successfully.");
      } else {
        await patientApi.updateProfile(patient._id, profileForm);
        setMessage("Patient profile updated successfully.");
      }
      await loadData();
      setActiveTab("overview");
    } catch (err) {
      setMessage(err.message || "Profile save failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!patient?._id) { setMessage("Create the patient profile first.", true); return; }
    if (!reportFile) { setMessage("Please choose a file first.", true); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("reportTitle", reportTitle);
      formData.append("reportType", reportType);
      formData.append("reportFile", reportFile);
      await patientApi.uploadReport(patient._id, formData);
      setReportTitle(""); setReportType("General"); setReportFile(null);
      const fileInput = document.getElementById("reportFileInput");
      if (fileInput) fileInput.value = "";
      setMessage("Report uploaded successfully.");
      await loadData();
      setActiveTab("reports");
    } catch (err) {
      setMessage(err.message || "Report upload failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId, reportTitle) => {
    if (!window.confirm(`"${reportTitle}" delete කරන්නද? මේ action undo කරන්න බෑ.`)) return;
    try {
      setLoading(true);
      await patientApi.deleteReport(patient._id, reportId);
      setMessage("Report deleted successfully.");
      await loadData();
    } catch (err) {
      setMessage(err.message || "Report delete failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const totalReports = history.reports?.length || 0;
  const totalPrescriptions = history.prescriptions?.length || 0;
  const patientName = patient?.fullName || user?.name || "Patient";
  const profileStatus = hasProfile ? "Active" : "Pending";
  const latestReport = history.reports?.[0];
  const latestPrescription = history.prescriptions?.[0];
  const inputClass = "input-base";

  return (
    <>
      {status && <InfoAlert type="success">{status}</InfoAlert>}
      {error && <InfoAlert type="error">{error}</InfoAlert>}

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <>
          <section className="surface overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-100">Patient Dashboard</p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl">Welcome back, {patientName}</h1>
                <p className="mt-3 max-w-2xl text-blue-100">
                  Keep your patient records updated, upload reports, and manage consultations from one place.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => navigate("/appointments")} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:-translate-y-0.5">
                    <Calendar className="h-4 w-4" /> Book Appointment
                  </button>
                  <button type="button" onClick={() => setActiveTab("upload")} className="flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20">
                    <FileUp className="h-4 w-4" /> Upload Report
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-blue-100">Reports</p>
                  <h3 className="mt-2 text-3xl font-bold">{totalReports}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-blue-100">Prescriptions</p>
                  <h3 className="mt-2 text-3xl font-bold">{totalPrescriptions}</h3>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Profile Status" value={profileStatus} tone="blue" icon={ShieldCheck} />
              <StatCard label="Medical Reports" value={totalReports} tone="emerald" icon={Files} />
              <StatCard label="Prescriptions" value={totalPrescriptions} tone="amber" icon={FileText} />
              <StatCard label="Account Role" value={user?.role || "PATIENT"} tone="violet" icon={UserRound} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="section-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Patient Summary</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">Health Overview</h3>
                  </div>
                  <span className={`pill ${hasProfile ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {hasProfile ? "Profile Complete" : "Profile Missing"}
                  </span>
                </div>
                {patient ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[["Phone", patient.phone], ["Blood Group", patient.bloodGroup], ["Emergency Contact", patient.emergencyContactName], ["Address", patient.address]].map(([label, val]) => (
                      <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">{label}</p>
                        <h4 className="mt-1 font-semibold text-slate-900">{val || "-"}</h4>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-700">
                    Create your patient profile to unlock the full dashboard.
                  </div>
                )}
              </div>

              <div className="section-card">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Recent Activity</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">Latest Updates</h3>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Latest Report</p>
                    {latestReport ? (
                      <><h4 className="mt-2 font-semibold text-slate-900">{latestReport.reportTitle}</h4>
                        <p className="mt-1 text-sm text-slate-500">{latestReport.reportType}</p></>
                    ) : <p className="mt-2 text-sm text-slate-500">No report uploaded yet.</p>}
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Latest Prescription</p>
                    {latestPrescription ? (
                      <><h4 className="mt-2 font-semibold text-slate-900">{latestPrescription.doctorName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{latestPrescription.diagnosis || "No diagnosis"}</p></>
                    ) : <p className="mt-2 text-sm text-slate-500">No prescriptions found yet.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Quick Actions</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Patient Services</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["appointments-page", "Book Doctor Appointment", "Search doctors and reserve your consultation slot", Calendar, () => navigate("/appointments")],
                  ["profile", "Manage Patient Profile", "Update personal and emergency details", UserRound, null],
                  ["upload", "Upload Medical Record", "Add new lab report, scan, or document", FilePlus2, null],
                  ["prescriptions", "Check Prescriptions", "See diagnosis and medication history", Receipt, null]
                ].map(([key, title, text, Icon, customAction]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => customAction ? customAction() : setActiveTab(key)}
                    className="group flex flex-col items-start gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon strokeWidth={2} className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="block text-lg font-bold text-slate-900">{title}</span>
                      <p className="mt-2 block leading-6 text-slate-500">{text}</p>
                    </div>
                    <div className="mt-auto pt-4 w-full flex justify-end">
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── PROFILE ── */}
      {activeTab === "profile" && (
        <section className="section-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Patient Information</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {hasProfile ? "Manage Patient Profile" : "Create Patient Profile"}
          </h3>
          <form onSubmit={handleCreateOrUpdateProfile} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="label-text">Phone Number</label>
              <input className={inputClass} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" required />
            </div>
            <div>
              <label className="label-text">Date of Birth</label>
              <input className={inputClass} type="date" value={profileForm.dateOfBirth} onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Gender</label>
              <select className={inputClass} value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label-text">Blood Group</label>
              <input className={inputClass} value={profileForm.bloodGroup} onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })} placeholder="Blood Group" />
            </div>
            <div className="md:col-span-2">
              <label className="label-text">Address</label>
              <textarea className={`${inputClass} min-h-28`} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Address" />
            </div>
            <div>
              <label className="label-text">Allergies</label>
              <input className={inputClass} value={profileForm.allergies} onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })} placeholder="Allergies (comma separated)" />
            </div>
            <div>
              <label className="label-text">Chronic Conditions</label>
              <input className={inputClass} value={profileForm.chronicConditions} onChange={(e) => setProfileForm({ ...profileForm, chronicConditions: e.target.value })} placeholder="Chronic conditions (comma separated)" />
            </div>
            <div>
              <label className="label-text">Emergency Contact Name</label>
              <input className={inputClass} value={profileForm.emergencyContactName} onChange={(e) => setProfileForm({ ...profileForm, emergencyContactName: e.target.value })} placeholder="Emergency contact name" />
            </div>
            <div>
              <label className="label-text">Emergency Contact Phone</label>
              <input className={inputClass} value={profileForm.emergencyContactPhone} onChange={(e) => setProfileForm({ ...profileForm, emergencyContactPhone: e.target.value })} placeholder="Emergency contact phone" />
            </div>
            <button type="submit" className="primary-btn md:col-span-2" disabled={loading}>
              {hasProfile ? "Save Profile Changes" : "Create Patient Profile"}
            </button>
          </form>
        </section>
      )}

      {/* ── UPLOAD REPORT ── */}
      {activeTab === "upload" && (
        <section className="section-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Document Center</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Upload Medical Report</h3>
          <form onSubmit={handleUploadReport} className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="label-text">Report Title</label>
              <input className={inputClass} value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Report title" required />
            </div>
            <div>
              <label className="label-text">Report Type</label>
              <input className={inputClass} value={reportType} onChange={(e) => setReportType(e.target.value)} placeholder="Report type" />
            </div>
            <div className="md:col-span-2">
              <label className="label-text">Choose File</label>
              <input className={inputClass} id="reportFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setReportFile(e.target.files?.[0] || null)} required />
            </div>
            <button type="submit" className="primary-btn md:col-span-2" disabled={loading || !hasProfile}>
              Upload Report
            </button>
          </form>
        </section>
      )}

      {/* ── REPORTS ── */}
      {activeTab === "reports" && (
        <section className="section-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Medical Archive</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Uploaded Reports</h3>
          <div className="mt-6 space-y-4">
            {history.reports?.length ? (
              history.reports.map((report) => (
                <div key={report._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="text-lg text-slate-900">{report.reportTitle}</strong>
                    <p className="mt-1 text-slate-600">{report.reportType}</p>
                    <small className="mt-1 block text-slate-500">{new Date(report.createdAt).toLocaleString()}</small>
                  </div>
                  <div className="flex items-center gap-3">
                    <a className="primary-btn" href={report.fileUrl} target="_blank" rel="noreferrer">Open File</a>
                    <button
                      type="button"
                      onClick={() => handleDeleteReport(report._id, report.reportTitle)}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                      title="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">No reports found.</p>
            )}
          </div>
        </section>
      )}

      {/* ── PRESCRIPTIONS ── */}
      {activeTab === "prescriptions" && (
        <section className="section-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Doctor Records</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Prescriptions</h3>
          <div className="mt-6 space-y-4">
            {history.prescriptions?.length ? (
              history.prescriptions.map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <strong className="text-lg text-slate-900">{item.doctorName}</strong>
                  <p className="mt-3 text-slate-600"><b>Diagnosis:</b> {item.diagnosis || "N/A"}</p>
                  <p className="mt-2 text-slate-600"><b>Medications:</b> {item.medications?.join(", ") || "N/A"}</p>
                  <p className="mt-2 text-slate-600"><b>Notes:</b> {item.notes || "N/A"}</p>
                  <small className="mt-3 block text-slate-500">
                    {item.issuedDate ? new Date(item.issuedDate).toLocaleString() : "No date"}
                  </small>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500">No prescriptions found yet.</p>
            )}
          </div>
        </section>
      )}

      {/* ── HISTORY ── */}
      {activeTab === "history" && (
        <section className="section-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Patient Summary</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Full Medical History Overview</h3>
          {patient ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Patient ID", patient._id],
                ["Blood Group", patient.bloodGroup || "-"],
                ["Total Reports", totalReports],
                ["Total Prescriptions", totalPrescriptions],
                ["Address", patient.address || "No address added"],
                ["Allergies", (patient.allergies || []).join(", ") || "None mentioned"],
                ["Chronic Conditions", (patient.chronicConditions || []).join(", ") || "None mentioned"],
                ["Emergency Contact", `${patient.emergencyContactName} (${patient.emergencyContactPhone})`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 font-semibold text-slate-900">
                  <p className="text-sm text-slate-500">{label}</p>
                  <h4 className="mt-2 truncate">{value}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-700">
              Create your patient profile to see full history details.
            </div>
          )}
        </section>
      )}
    </>
  );
}
