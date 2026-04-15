import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-xl font-bold text-blue-600">AuraHealth</div>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Book appointments, manage your medical records, and attend secure video consultations — all in one place.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link className="hover:text-slate-900" to="/doctors">
                  Find a doctor
                </Link>
              </li>
              <li>
                <Link className="hover:text-slate-900" to="/services">
                  Services
                </Link>
              </li>
              <li>
                <Link className="hover:text-slate-900" to="/about">
                  About us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Support</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a className="hover:text-slate-900" href="mailto:support@aurahealth.lk">
                  support@aurahealth.lk
                </a>
              </li>
              <li className="text-xs text-slate-500">Campus project • Demo environment</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} AuraHealth. All rights reserved.</div>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

