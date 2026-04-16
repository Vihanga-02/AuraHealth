import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const Home = () => {
  const btnPrimaryLg =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-6 py-3 text-base md:text-lg bg-white text-blue-700 hover:bg-blue-50 shadow-lg w-full sm:w-auto";

  const btnSecondaryLg =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 px-6 py-3 text-base md:text-lg border border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 w-full sm:w-auto";

  const featureCard =
    "group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1";

  const revealBase = "transition-all duration-1000 ease-out";
  const revealHidden = "opacity-0 translate-y-10";
  const revealShow = "opacity-100 translate-y-0";

  const useReveal = () => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.15 }
      );

      observer.observe(el);

      return () => observer.disconnect();
    }, []);

    return [ref, isVisible];
  };

  const [whyRef, whyVisible] = useReveal();
  const [trustRef, trustVisible] = useReveal();

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("/home.jpeg")`,
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-blue-950/75 to-blue-900/55" />


        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-300/10 blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-blue-100 mb-6">
              Trusted Digital Healthcare Platform
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Modern Healthcare,
              <span className="block text-blue-300">Accessible Anywhere.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-8">
              Book appointments, connect with qualified doctors through secure video
              consultations, and manage prescriptions and medical records with ease —
              all in one trusted platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/doctors" className={btnPrimaryLg}>
                Find a Doctor
              </Link>
              <Link to="/register" className={btnSecondaryLg}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section
        ref={whyRef}
        className={`py-20 bg-white ${revealBase} ${
          whyVisible ? revealShow : revealHidden
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold tracking-wide uppercase text-blue-600 mb-3">
              Why Choose AuraHealth
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              A Smarter Way to Manage Your Health
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built to make healthcare simpler, faster, and more secure for every patient.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={featureCard}>
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                🗓️
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 text-center">
                Easy Appointment Booking
              </h3>
              <p className="text-slate-600 text-center leading-relaxed">
                Quickly search for specialists, check availability, and confirm your
                appointment through an intuitive scheduling experience.
              </p>
            </div>

            <div className={featureCard}>
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                📹
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 text-center">
                Secure Video Consultations
              </h3>
              <p className="text-slate-600 text-center leading-relaxed">
                Meet your doctor remotely through reliable online consultations designed
                for convenience, privacy, and continuity of care.
              </p>
            </div>

            <div className={featureCard}>
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                📄
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 text-center">
                Digital Prescriptions
              </h3>
              <p className="text-slate-600 text-center leading-relaxed">
                Access prescriptions and important consultation details digitally, helping
                you manage treatment more efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Optional trust section */}
      <section
        ref={trustRef}
        className={`py-16 bg-slate-100 border-t border-slate-200 ${revealBase} ${
          trustVisible ? revealShow : revealHidden
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-sm font-semibold tracking-wide uppercase text-blue-600 mb-3">
                Patient-Centered Care
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Healthcare Designed Around Convenience and Trust
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                AuraHealth helps patients connect with qualified doctors, attend
                consultations from home, and keep important health information organized
                in one secure place.
              </p>
              <p className="text-slate-600 leading-relaxed">
                From first appointment to follow-up care, the platform supports a smoother
                healthcare journey with modern digital tools.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Verified Specialists
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Connect with trusted medical professionals across multiple specialties.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Secure Platform
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Patient data and consultations are handled with privacy and protection.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Faster Access
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Reduce waiting time with online booking and virtual consultation options.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Better Experience
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Manage appointments, prescriptions, and care updates in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;