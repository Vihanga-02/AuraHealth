import { Link } from 'react-router-dom';

const Home = () => {
  const btnPrimaryLg = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-6 py-3 text-lg bg-white text-blue-700 hover:bg-blue-50 w-full sm:w-auto";
  const btnSecondaryLg = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-6 py-3 text-lg border border-blue-400 bg-transparent text-white hover:bg-blue-800 hover:text-white w-full sm:w-auto";

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Your Health, <span className="text-blue-300">Simplified.</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with top-rated medical professionals from the comfort of your home. 
            Book appointments, attend video consultations, and manage your health securely.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/doctors" className={btnPrimaryLg}>Find a Doctor</Link>
            <Link to="/register" className={btnSecondaryLg}>Create Account</Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose AuraHealth?</h2>
            <p className="text-lg text-slate-600">Experience the future of healthcare today.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">🗓️</div>
              <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
              <p className="text-slate-600">Find the right specialist and book an appointment in seconds with our smart scheduling system.</p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📹</div>
              <h3 className="text-xl font-semibold mb-3">Video Consultations</h3>
              <p className="text-slate-600">Connect face-to-face with your doctor securely from anywhere using our HD video platform.</p>
            </div>
            
             <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📱</div>
              <h3 className="text-xl font-semibold mb-3">Digital Prescriptions</h3>
              <p className="text-slate-600">Receive your prescriptions directly to your device immediately after your consultation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
