import { Link } from 'react-router-dom';

const SERVICES = [
  {
    icon: '🔍',
    title: 'Doctor Discovery',
    badge: 'Public',
    color: 'blue',
    desc: 'Browse our network of verified medical professionals. Filter by specialty, hospital, or name. View ratings and experience before you book.',
    features: ['Search by specialty or name', 'View doctor profiles & availability', 'Star ratings from real patients'],
    link: '/doctors',
    cta: 'Find Doctors',
  },
  {
    icon: '📅',
    title: 'Appointment Booking',
    badge: 'Patient',
    color: 'indigo',
    desc: "Book telemedicine or in-person consultations with a doctor. The system shows only the doctor's available days and time slots.",
    features: ['Real-time availability slots', 'Telemedicine or in-person', 'Instant video link for online visits'],
    link: '/patient/appointments/book',
    cta: 'Book Now',
  },
  {
    icon: '📹',
    title: 'Video Consultations',
    badge: 'Telemedicine',
    color: 'purple',
    desc: 'Attend secure video consultations from anywhere using Jitsi Meet. Join directly from your appointments page — no downloads required.',
    features: ['Browser-based video calls', 'Shareable patient join link', 'Session managed by doctor'],
    link: '/patient/appointments',
    cta: 'My Appointments',
  },
  {
    icon: '📄',
    title: 'Medical Reports',
    badge: 'Patient',
    color: 'emerald',
    desc: 'Upload and store your medical documents securely — lab reports, X-rays, scans and more. Doctors can view your reports during consultations.',
    features: ['PDF, JPG, PNG supported', 'Up to 5 MB per file', 'Accessible to your doctor'],
    link: '/patient/reports',
    cta: 'Upload Reports',
  },
  {
    icon: '💊',
    title: 'Prescriptions',
    badge: 'Patient',
    color: 'amber',
    desc: 'View digital prescriptions issued by your doctors. You can also upload photos or PDFs of physical prescriptions for your personal records.',
    features: ['Digital prescriptions from doctors', 'Upload physical prescription photos', 'Organised prescription history'],
    link: '/patient/prescriptions',
    cta: 'View Prescriptions',
  },
  {
    icon: '💳',
    title: 'Secure Payments',
    badge: 'Stripe',
    color: 'rose',
    desc: 'Pay consultation fees via Stripe (sandbox). Payments automatically confirm your appointment and a receipt is saved to your history.',
    features: ['Stripe checkout integration', 'Webhook-confirmed appointments', 'Full payment history'],
    link: '/patient/payments/history',
    cta: 'Payment History',
  },
  {
    icon: '🔔',
    title: 'Notifications',
    badge: 'Automated',
    color: 'cyan',
    desc: 'Receive SMS and email notifications upon appointment confirmation, cancellation, and consultation completion via third-party services.',
    features: ['SMS & email alerts', 'Appointment confirmations', 'Consultation completion notices'],
    link: null,
    cta: null,
  },
  {
    icon: '👨‍⚕️',
    title: 'Doctor Portal',
    badge: 'Doctor',
    color: 'teal',
    desc: 'Doctors manage their profile, weekly availability, and appointment requests. Accept or decline bookings, view patient reports, and issue prescriptions.',
    features: ['Weekly availability management', 'Accept / decline bookings', 'Issue digital prescriptions'],
    link: '/doctor/dashboard',
    cta: 'Doctor Dashboard',
  },
  {
    icon: '🛡️',
    title: 'Admin Panel',
    badge: 'Admin',
    color: 'slate',
    desc: 'Administrators verify doctor registrations, manage all users and appointments, and monitor financial transactions across the platform.',
    features: ['Doctor verification', 'User & appointment oversight', 'Platform-wide payment monitor'],
    link: '/admin/dashboard',
    cta: 'Admin Dashboard',
  },
];

const BADGE_COLORS = {
  Public:      'bg-blue-100 text-blue-700',
  Patient:     'bg-indigo-100 text-indigo-700',
  Telemedicine:'bg-purple-100 text-purple-700',
  Stripe:      'bg-rose-100 text-rose-700',
  Automated:   'bg-cyan-100 text-cyan-700',
  Doctor:      'bg-teal-100 text-teal-700',
  Admin:       'bg-slate-200 text-slate-700',
};

const ICON_BG = {
  blue:   'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  purple: 'bg-purple-100 text-purple-600',
  emerald:'bg-emerald-100 text-emerald-600',
  amber:  'bg-amber-100 text-amber-600',
  rose:   'bg-rose-100 text-rose-600',
  cyan:   'bg-cyan-100 text-cyan-600',
  teal:   'bg-teal-100 text-teal-600',
  slate:  'bg-slate-100 text-slate-600',
};

export default function Services() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-16 px-4 text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">Our Services</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Everything You Need,<br className="hidden md:block" /> In One Platform</h1>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
          AuraHealth brings together doctor discovery, appointment booking, digital records,
          telemedicine, payments and notifications in a single connected platform.
        </p>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">How It Works</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Get Care in 4 Simple Steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', icon: '📝', title: 'Create Account', desc: 'Register as a Patient and complete your health profile.' },
            { step: '2', icon: '🔍', title: 'Find a Doctor',   desc: 'Browse specialties, check ratings, and pick the right doctor.' },
            { step: '3', icon: '📅', title: 'Book & Pay',      desc: 'Choose an available slot, pay securely through Stripe.' },
            { step: '4', icon: '📹', title: 'Consult Online',  desc: 'Join your video consultation right from your dashboard.' },
          ].map((s) => (
            <div key={s.step} className="relative rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {s.step}
              </div>
              <div className="text-3xl mt-2 mb-3">{s.icon}</div>
              <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Platform Services</p>
          <h2 className="text-3xl font-extrabold text-slate-900">All Services at a Glance</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${ICON_BG[s.color]}`}>
                  {s.icon}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${BADGE_COLORS[s.badge]}`}>
                  {s.badge}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{s.desc}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-green-500 font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {s.link && (
                <Link
                  to={s.link}
                  className="mt-auto block text-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                >
                  {s.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-14 px-4 text-center">
        <h2 className="text-2xl font-extrabold mb-3">Start Your Health Journey Today</h2>
        <p className="text-blue-100 text-sm max-w-lg mx-auto mb-6">
          Create your free AuraHealth account and access all services in minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register" className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">
            Register Free
          </Link>
          <Link to="/about" className="rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20">
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
