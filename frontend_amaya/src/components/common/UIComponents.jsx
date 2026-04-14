import React from "react";

export function InfoAlert({ type = "success", children }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700"
  };

  return (
    <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${styles[type] || styles.info}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, tone = "blue", icon: Icon }) {
  const tones = {
    blue: "from-blue-50 to-indigo-50 text-blue-700",
    emerald: "from-emerald-50 to-teal-50 text-emerald-700",
    amber: "from-amber-50 to-orange-50 text-amber-700",
    violet: "from-violet-50 to-fuchsia-50 text-violet-700"
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br p-6 ${tones[tone] || tones.blue}`}>
      <div className="relative z-10">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="mt-2 text-4xl font-black tracking-tight text-slate-800">{value}</h3>
      </div>
      {Icon && (
        <Icon className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
      )}
    </div>
  );
}
