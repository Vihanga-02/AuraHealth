import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../api/doctorApi';

function StarRating({ doctorId, currentRating, onRated }) {
  const [hover,      setHover]      = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const submit = useCallback(async (stars) => {
    if (submitting || done) return;
    setSubmitting(true);
    try {
      await doctorApi.rate(doctorId, stars);
      setDone(true);
      onRated(stars);
    } catch {
      // silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  }, [doctorId, submitting, done, onRated]);

  if (done) {
    return (
      <div className="flex items-center gap-1 text-amber-400 text-sm">
        {'★'.repeat(5)
          .split('')
          .map((_, i) => (
            <span key={i} className={i < hover || i < currentRating ? 'text-amber-400' : 'text-slate-200'}>★</span>
          ))}
        <span className="ml-1 text-xs text-emerald-600 font-medium">Thanks!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5" title="Rate this doctor">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={submitting}
          className={`text-xl leading-none transition-colors disabled:cursor-wait ${
            star <= (hover || currentRating) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'
          }`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => submit(star)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
      <span className="ml-1 text-xs text-slate-400">{submitting ? '…' : 'Rate'}</span>
    </div>
  );
}

const DoctorsList = () => {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const isPatient      = user?.role === 'Patient';

  const [doctors,      setDoctors]    = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [search,       setSearch]     = useState('');
  const [specialty,    setSpecialty]  = useState('');
  const [error,        setError]      = useState('');
  const [specialties,  setSpecialties] = useState([]);

  // Load distinct specialties that exist in the database
  useEffect(() => {
    doctorApi.specialties()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.specialties ?? []);
        setSpecialties(list.filter(Boolean).sort());
      })
      .catch(() => { /* silently ignore — filter still works without list */ });
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const params = {};
        if (search)   params.search    = search;
        if (specialty) params.specialty = specialty;
        const { data } = await doctorApi.list(params);
        if (mounted) setDoctors(data.doctors || []);
      } catch {
        if (mounted) setError('Failed to load doctors. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [search, specialty]);

  // Update a single doctor's rating in local state after successful submit
  const handleRated = useCallback((doctorId, newStars) => {
    setDoctors((prev) =>
      prev.map((d) => {
        if (Number(d.doctor_id) !== Number(doctorId)) return d;
        const total = (d.total_consultations || 0) + 1;
        const avg   = ((Number(d.rating || 0) * (total - 1)) + newStars) / total;
        return { ...d, rating: Math.round(avg * 10) / 10, total_consultations: total };
      })
    );
  }, []);

  const renderStars = (rating) => {
    const r = Math.round(Number(rating) || 0);
    return (
      <span className="text-amber-400 text-sm tracking-tighter">
        {'★'.repeat(r)}
        <span className="text-slate-200">{'★'.repeat(5 - r)}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
        <div className="bg-linear-to-br from-blue-900 via-blue-800 to-blue-600 py-14 px-4 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">Find a Doctor</h1>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          Browse verified medical professionals and book your consultation online.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty, hospital…"
            className="flex-1 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow"
          />
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow bg-white"
          >
            <option value="">All Specialties</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
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
              {isPatient && (
                <span className="ml-2 text-blue-600">— Click the stars to rate a doctor</span>
              )}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col gap-3"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
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
                      <p>💰 LKR {doctor.consultation_fee} / consultation</p>
                    )}
                    {doctor.languages && (
                      <p>🌐 {doctor.languages}</p>
                    )}
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-2">
                    {renderStars(doctor.rating)}
                    {Number(doctor.rating) > 0 && (
                      <span className="text-xs text-slate-400">
                        {Number(doctor.rating).toFixed(1)} ({doctor.total_consultations || 0})
                      </span>
                    )}
                  </div>

                  {/* Interactive rating — Patients only */}
                  {isPatient && (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-xs text-slate-400 mb-1">Your rating:</p>
                      <StarRating
                        doctorId={doctor.doctor_id}
                        currentRating={Math.round(Number(doctor.rating) || 0)}
                        onRated={(stars) => handleRated(doctor.doctor_id, stars)}
                      />
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
                    {user ? (
                      <button
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        onClick={() => navigate(`/patient/appointments/book?doctorId=${doctor.doctor_id}`)}
                      >
                        Book Appointment →
                      </button>
                    ) : (
                      <button
                        className="text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                        onClick={() => navigate('/login')}
                      >
                        Login to Book →
                      </button>
                    )}
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
