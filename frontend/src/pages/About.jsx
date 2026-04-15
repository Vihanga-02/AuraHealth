import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-linear-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Healthcare, made <span className="text-blue-200">simple</span> and <span className="text-blue-200">human</span>
          </h1>
          <p className="mt-5 text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            AuraHealth is a digital health platform designed to connect patients with qualified doctors — anytime, anywhere.
            We believe quality healthcare should be accessible to everyone, without the barriers of distance or complicated processes.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">Our Mission</p>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Bringing care closer to you</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Our mission is to make healthcare accessible, efficient, and personal. We empower patients to take control of
            their health journey — from finding the right doctor to attending secure video consultations — all from the
            comfort of their homes.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            For doctors, we provide a modern digital workspace to manage their practice, connect with patients, and deliver
            care without administrative overhead getting in the way.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🏥', label: 'Trusted Doctors',   value: '50+',   sub: 'Verified specialists' },
            { icon: '👩‍⚕️', label: 'Happy Patients',   value: '1,200+', sub: 'Across the country' },
            { icon: '📅', label: 'Appointments',      value: '3,000+', sub: 'Successfully booked' },
            { icon: '📹', label: 'Video Sessions',    value: '800+',  sub: 'Completed consultations' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-extrabold text-blue-600">{s.value}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">{s.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">What We Stand For</p>
            <h2 className="text-3xl font-bold text-slate-900">Our core values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '❤️',  title: 'Patient-First',     desc: 'Every decision we make starts with one question: is this better for the patient? Your wellbeing is our priority.' },
              { icon: '🔒',  title: 'Privacy & Security', desc: 'Your health records and personal data are protected with industry-standard encryption and strict access controls.' },
              { icon: '🤝',  title: 'Trust',              desc: 'We verify every doctor on our platform so you can book with confidence, knowing you are in safe hands.' },
              { icon: '⚡',  title: 'Simplicity',         desc: 'Healthcare should not be complicated. We strip away unnecessary complexity so you can focus on getting well.' },
              { icon: '🌍',  title: 'Accessibility',      desc: 'Whether you are in a city or a remote area, our telemedicine features bring qualified doctors to your screen.' },
              { icon: '📈',  title: 'Continuous Care',    desc: 'Health is a journey, not a single visit. We help you track your history, prescriptions, and appointments over time.' },
            ].map((v) => (
              <div key={v.title} className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-slate-800 text-base mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">Our Story</p>
        <h2 className="text-3xl font-bold text-slate-900 mb-5">Built with purpose</h2>
        <p className="text-slate-600 leading-relaxed text-lg">
          AuraHealth was created by a team of students and developers who wanted to solve a real problem — the frustrating
          gap between patients who need care and doctors who can provide it. Inspired by real experiences with long waiting
          times, confusing processes, and a lack of digital health tools, we set out to build a platform that makes
          healthcare feel human again.
        </p>
        <p className="text-slate-600 leading-relaxed text-lg mt-4">
          We are committed to continuous improvement, listening to both patients and healthcare professionals, and building
          a product that truly serves the community.
        </p>
      </section>

      {/* Team commitment */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">Our Commitment</p>
            <h2 className="text-3xl font-bold text-slate-900">How we serve you</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '✅', title: 'Verified Healthcare Providers',  desc: 'All doctors on AuraHealth are verified by our team before they can appear on the platform.' },
              { icon: '🎧', title: 'Dedicated Support',              desc: 'Our support team is available to help patients and doctors with any questions or issues.' },
              { icon: '📱', title: 'Accessible on Any Device',       desc: 'Use AuraHealth from your computer, tablet, or smartphone — wherever you are.' },
              { icon: '🔄', title: 'Continuous Improvement',         desc: 'We regularly update our platform based on user feedback to deliver a better experience.' },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 items-start bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="text-2xl shrink-0">{c.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to experience better healthcare?</h2>
        <p className="text-slate-500 mb-8 text-lg">Join thousands of patients and doctors who trust AuraHealth every day.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-7 py-3 text-base font-bold text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Get Started Free
          </Link>
          <Link
            to="/doctors"
            className="rounded-xl border border-slate-300 px-7 py-3 text-base font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Find a Doctor
          </Link>
        </div>
        <p className="mt-8 text-sm text-slate-400">
          Questions? Contact us at{' '}
          <a href="mailto:support@aurahealth.lk" className="text-blue-600 hover:underline">
            support@aurahealth.lk
          </a>
        </p>
      </section>
    </div>
  );
}
