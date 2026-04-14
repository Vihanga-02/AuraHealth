import { useState, useEffect } from 'react';
import { doctorApi } from '../api/doctorApi';

const SPECIALTIES = [
  'All Specialties', 'Cardiologist', 'Dermatologist', 'General Physician',
  'Neurologist', 'Orthopedic', 'Pediatrician', 'Psychiatrist', 'Radiologist',
];

const DoctorsList = () => {
  const [doctors, setDoctors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [specialty, setSpecialty]   = useState('');
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (search)   params.search    = search;
        if (specialty) params.specialty = specialty;
        const { data } = await doctorApi.list(params);
        setDoctors(data.doctors || []);
      } catch (err) {
        setError('Failed to load doctors. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, specialty]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 py-14 px-4 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Find a Doctor</h1>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Browse verified medical professionals and book your consultation online.
        </p>
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <input
            id="doctor-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty, hospital…"
            className="flex-1 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow"
          />
          <select
            id="doctor-specialty-filter"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value === 'All Specialties' ? '' : e.target.value)}
            className="rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow bg-white"
          >
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 text-red-600 font-medium">{error}</div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium">No doctors found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your search or specialty filter.</p>
          </div>
        )}

        {!loading && !error && doctors.length > 0 && (
          <>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col gap-3"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                      {doctor.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{doctor.full_name}</h3>
                      <p className="text-blue-600 text-sm font-medium">{doctor.specialty}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-sm text-slate-600 space-y-1">
                    {doctor.hospital_affiliation && (
                      <p>🏥 <span className="font-medium">{doctor.hospital_affiliation}</span></p>
                    )}
                    {doctor.experience_years > 0 && (
                      <p>🎓 {doctor.experience_years} year{doctor.experience_years !== 1 ? 's' : ''} experience</p>
                    )}
                    {doctor.consultation_fee > 0 && (
                      <p>💰 ₹{doctor.consultation_fee} / consultation</p>
                    )}
                    {doctor.languages && (
                      <p>🌐 {doctor.languages}</p>
                    )}
                  </div>

                  {/* Rating */}
                  {doctor.rating && Number(doctor.rating) > 0 && (
                    <div className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                      {'★'.repeat(Math.round(Number(doctor.rating)))}{'☆'.repeat(5 - Math.round(Number(doctor.rating)))}
                      <span className="text-slate-500 ml-1">({Number(doctor.rating).toFixed(1)})</span>
                    </div>
                  )}

                  {/* Bio */}
                  {doctor.bio && (
                    <p className="text-sm text-slate-500 line-clamp-2">{doctor.bio}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      doctor.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doctor.verified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                    <button
                      id={`book-${doctor.doctor_id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Book Appointment →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
