import { useEffect, useMemo, useState } from "react";
import { appointmentApi } from "../api";
import doctorssImg from "../assets/doctorss.png";
import {
  Search,
  MapPin,
  Video,
  XCircle,
  Stethoscope,
  Star,
  CheckCircle,
  CreditCard,
  MoreVertical,
  Calendar,
  X,
  BriefcaseMedical,
  Globe,
  Phone
} from "lucide-react";

const emptyBooking = {
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  visitType: "Telemedicine",
  notes: ""
};

function AppointmentPage({ setMessage, view = "book" }) {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const [minRating, setMinRating] = useState("");
  const [availability, setAvailability] = useState("");

  const loadDoctors = async () => {
    try {
      const data = await appointmentApi.getDoctors({
        specialty,
        search,
        location
      });
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message || "Failed to load doctors", true);
    }
  };

  const loadAppointments = async () => {
    try {
      // Fetch all appointments and handle filtering on the frontend for better reliability
      const data = await appointmentApi.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message || "Failed to load appointments", true);
    }
  };


  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, []);


  useEffect(() => {
    const timer = setInterval(() => {
      loadAppointments();
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const handleDoctorSearch = async (e) => {
    if (e) e.preventDefault();
    await loadDoctors();
  };

  const handleBook = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editingId) {
        await appointmentApi.updateAppointment(editingId, bookingForm);
        if (setMessage) setMessage("Appointment updated successfully.");
      } else {
        await appointmentApi.createAppointment(bookingForm);
        setShowSuccessPopup(true);
      }

      closeModal();
      setStatusFilter("");
      await loadAppointments();
    } catch (err) {
      if (setMessage) setMessage(err.message || "Something went wrong", true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setBookingForm({
      doctorId: String(item.doctorId),
      appointmentDate: String(item.appointmentDate).slice(0, 10),
      appointmentTime: item.appointmentTime,
      visitType: item.visitType,
      notes: item.notes || ""
    });
    setIsModalOpen(true);
  };

  const handleCancel = async (id) => {
    try {
      await appointmentApi.cancelAppointment(id);
      setMessage("Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      setMessage(err.message || "Failed to cancel appointment", true);
    }
  };

  const handlePayNow = (item) => {
    setMessage(`Payment service for ${item.doctorName} will be connected soon.`);
  };

  const handleJoinMeeting = (item) => {
    if (item.videoLink) {
      window.open(item.videoLink, "_blank", "noopener,noreferrer");
    } else {
      setMessage("The meeting link will be available here 5 minutes before your scheduled time. Please check back then!", false);
    }
  };


  const openModalForDoctor = (doctor) => {
    setBookingForm({
      ...emptyBooking,
      doctorId: String(doctor.id),
      visitType: doctor.visit_type?.includes("Tele")
        ? "Telemedicine"
        : "Physical Visit",
      appointmentTime:
        doctor.available_time?.split("-")[0]?.trim() || "09:30"
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setBookingForm(emptyBooking);
      setEditingId(null);
      setWeekOffset(0);
    }, 150);
  };

  const getStatusClasses = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "confirmed") return "bg-emerald-50 text-emerald-600";
    if (key === "pending") return "bg-orange-50 text-orange-600";
    if (key === "completed") return "bg-slate-100 text-slate-500";
    if (key === "cancelled") return "bg-rose-50 text-rose-500";
    return "bg-slate-50 text-slate-500";
  };

  const getStatusLabel = (status) => {
    const key = String(status || "").toLowerCase();
    if (key === "confirmed") return "CONFIRMED";
    if (key === "pending") return "PAYMENT PENDING";
    if (key === "completed") return "COMPLETED";
    if (key === "cancelled") return "CANCELLED";
    return String(status || "ACTIVE").toUpperCase();
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const doctorRating = Number(doctor.rating || 4.5);

      const matchesSearch =
        !search ||
        doctor.name?.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        !location ||
        doctor.hospital?.toLowerCase().includes(location.toLowerCase()) ||
        doctor.location?.toLowerCase().includes(location.toLowerCase());

      const matchesSpecialty =
        !specialty ||
        doctor.specialty?.toLowerCase() === specialty.toLowerCase();

      const matchesRating = !minRating || doctorRating >= Number(minRating);

      const matchesAvailability = !availability;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSpecialty &&
        matchesRating &&
        matchesAvailability
      );
    });
  }, [doctors, search, location, specialty, minRating, availability]);

  const filteredAppointments = useMemo(() => {
    if (!statusFilter) return appointments;
    return appointments.filter((app) => {
      const appStatus = String(app.status || "").toLowerCase();
      const filterValue = statusFilter.toLowerCase();
      
      // Handle "confirmed" vs "upcoming" naming variations if any
      if (filterValue === "confirmed" && appStatus === "upcoming") return true;
      
      return appStatus === filterValue;
    });
  }, [appointments, statusFilter]);


  const selectedDoctor =
    doctors.find((d) => String(d.id) === bookingForm.doctorId) ||
    appointments.find((a) => String(a.doctorId) === bookingForm.doctorId) ||
    {};

  const formatMonthDay = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return { month: "N/A", day: "--" };
    }

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: date.toLocaleDateString("en-US", { day: "2-digit" })
    };
  };

  const currentWeekInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i);
      days.push(dateObj);
    }

    const displayMonthYear = days[3].toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    return { days, displayMonthYear, todayMidnight: today };
  }, [weekOffset]);

  return (
    <section className="space-y-10 pb-10">
      {/* GENERIC HERO SECTION - Only for Booking View */}

      {view === "book" && (
        <div className="relative mb-6">
          {/* Subtle background patterns - kept but container made open */}
          <div className="absolute right-0 top-0 h-full w-full opacity-5 hover:opacity-10 transition-opacity duration-700 pointer-events-none">
            <div className="absolute -right-20 top-10 h-72 w-72 rounded-full border-[40px] border-[#0052cc]" />
            <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full border-[30px] border-[#0052cc]" />
          </div>

          <div className="relative z-10 grid items-center gap-10 md:grid-cols-2 lg:gap-20">
            <div className="text-left py-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Appointments</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-[#02316a] md:text-5xl">
                Book Your Doctor Appointment Online.
              </h1>
              <p className="mt-6 text-base font-medium leading-relaxed text-slate-500 max-w-xl">
                A Healthier Tomorrow Starts Today: Schedule Your Appointment! Your Wellness, Our Expertise: Set Up Your Appointment Today.
              </p>
            </div>
            
            <div className="relative hidden md:flex justify-end">
               <div className="absolute -right-5 top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-blue-100 blur-3xl opacity-40" />
               <img
                src={doctorssImg}
                alt="Professional Doctor"
                className="relative z-10 mx-auto max-h-[320px] w-auto drop-shadow-[0_20px_40px_rgba(2,49,106,0.06)] transform transition-all duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      )}


      {/* PROFESSIONAL HEADER - Only for Appointments List View */}
      {view === "list" && (
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Patient Dashboard</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                My Appointments & Consultations
              </h1>
              <p className="mt-2 text-slate-500 font-medium max-w-xl">
                Manage your scheduled visits, join telemedicine calls, and keep track of your clinical history.
              </p>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-indigo-50/50 border border-indigo-100 p-6 transition-all hover:shadow-md">
              <div className="rounded-xl bg-indigo-600 w-10 h-10 flex items-center justify-center text-white mb-4">
                <Video className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Telemedicine Prep</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Ensure a stable internet connection and find a quiet, well-lit environment for your call.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 p-6 transition-all hover:shadow-md">
              <div className="rounded-xl bg-emerald-600 w-10 h-10 flex items-center justify-center text-white mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">5-Minute Rule</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Please join your session or arrive at the clinic <span className="text-emerald-700 font-bold">at least 5 minutes early</span> to avoid delays.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-amber-50/50 border border-amber-100 p-6 transition-all hover:shadow-md">
              <div className="rounded-xl bg-amber-600 w-10 h-10 flex items-center justify-center text-white mb-4">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Report Readiness</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Have your latest medical reports or prescriptions ready for the doctor to review during the visit.
              </p>
            </div>
          </div>
        </div>
      )}

        {view === "book" && (
          <>
          <div className="relative z-[20] -mt-10 px-4 md:px-0">
             {/* OVERLAPPING SEARCH BAR - MT adjusted for better flow */}

             <form
                onSubmit={handleDoctorSearch}
                className="mx-auto flex w-full max-w-5xl flex-col divide-y divide-slate-100 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-2 shadow-2xl md:flex-row md:divide-x md:divide-y-0"
              >
                {/* Removed Select Date & Time as requested */}

                <div className="flex-1 flex items-center px-6 py-4 md:py-0">
                  <input
                    type="text"
                    placeholder="Search doctors, name, specialist"
                    className="h-[72px] w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search className="h-5 w-5 shrink-0 text-slate-500" />
                </div>

                <div className="flex items-center justify-center p-2">
                  <button
                    type="submit"
                    className="w-full min-w-[140px] rounded-[1.25rem] bg-[#0052cc] px-8 py-5 text-base font-black text-white transition-all hover:bg-[#0041a3] hover:shadow-lg active:scale-95"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "All Specialists",
                "Cardiology",
                "Pediatrics",
                "Neurology",
                "Orthopedics",
                "Dermatology"
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSpecialty(cat === "All Specialists" ? "" : cat)}
                  className={`rounded-full border px-6 py-2.5 text-[14px] font-bold transition-all ${
                    specialty === cat || (cat === "All Specialists" && !specialty)
                      ? "border-[#0249a6] bg-[#0249a6] text-white"
                      : "border-[#d9edff] bg-[#d9edff] text-[#4f8be9] hover:bg-blue-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              </div>
            </div>
          </>
        )}

      {view === "book" && (
        <div className="flex flex-col gap-8">
          <div className="w-full min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#0249a6]">
                Available Specialists ({filteredDoctors.length})
              </h3>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                Sort by:{" "}
                <span className="cursor-pointer font-bold text-[#0249a6] hover:underline">
                  Recommended ▾
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {filteredDoctors.length ? (
                filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex flex-col items-stretch gap-6 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row"
                  >
                    <div className="mt-1 h-[140px] w-[140px] shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={
                          doctor.profile_image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            doctor.name
                          )}&background=2563eb&color=fff&size=300`
                        }
                        alt={doctor.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="truncate text-[1.3rem] font-bold text-slate-900">
                              {doctor.name}
                            </h4>
                            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#0249a6]">
                              {doctor.specialty || "Specialist"}
                            </p>
                          </div>
                      </div>


                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-semibold text-slate-500">
                          <div className="flex items-center gap-2">
                            <BriefcaseMedical className="h-4 w-4 text-slate-400" />
                            {doctor.experience || "8"} years exp.
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-400" />
                            {doctor.languages || "English, Spanish"}
                          </div>
                          <div className="flex items-center gap-2 font-bold text-[#0f7a63]">
                            <CheckCircle className="h-4 w-4 text-[#0f7a63]" />
                            Board Certified
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-row items-end justify-between pt-0">
                        <div className="flex flex-col">
                          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Consultation Fee
                          </p>
                          <p className="text-xl font-bold text-[#0249a6]">
                            RS {doctor.fee || "2500.00"}
                          </p>
                        </div>

                        <button
                          onClick={() => openModalForDoctor(doctor)}
                          className="rounded-xl bg-[#0249a6] px-8 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-[#02316a]"
                        >
                          Select & Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center text-lg font-bold text-slate-500 shadow-sm">
                  No specialists found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="section-card border border-slate-100 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800">
                Scheduled Consultations
              </h3>

            </div>
            <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-slate-400">Filter Status:</span>
               <select 
                 className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-[#0249a6] focus:outline-none"
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="">All Status</option>
                 <option value="pending">Pending</option>
                 <option value="confirmed">Confirmed</option>
                 <option value="completed">Completed</option>
                 <option value="cancelled">Cancelled</option>
               </select>
            </div>
          </div>

          <div className="space-y-6">
            {filteredAppointments.length ? (
              filteredAppointments.map((item) => {
              const dateParts = formatMonthDay(item.appointmentDate);
              const normalizedStatus = String(item.status || "").toUpperCase();
              const isPending = normalizedStatus === "PENDING";
              const isCompleted = normalizedStatus === "COMPLETED";
              const isCancelled = normalizedStatus === "CANCELLED";
              
              const isTelemedicine = String(item.visitType || "").toLowerCase().includes("tele");
              const canJoinVideo = isTelemedicine && normalizedStatus === "CONFIRMED" && !isCancelled && !isCompleted;



              return (
                <div
                  key={item._id}
                  className="rounded-[2.5rem] bg-white p-7 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg border border-slate-50"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    {/* Date Block */}
                    <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[2rem] bg-[#f8fafc] text-center border border-slate-100">
                      <span className="text-3xl font-black text-[#1e293b] leading-none">
                        {dateParts.day}
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-widest text-[#64748b] mt-1.5">
                        {dateParts.month}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isTelemedicine 
                            ? "bg-blue-50 text-blue-600" 
                            : "bg-slate-50 text-slate-600"
                        }`}>
                          {isTelemedicine ? (
                            <Video className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          {item.visitType}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusClasses(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <h4 className="truncate text-2xl font-black tracking-tight text-[#0f172a]">
                        {item.doctorName}
                      </h4>
                      
                      <div className="mt-2 text-[14px] font-semibold text-[#64748b] flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                           <Calendar className="h-4 w-4 opacity-70" />
                           {item.appointmentTime || "10:00 AM"}
                        </div>
                        <span className="opacity-30">—</span>
                        <span className="truncate">
                           {item.specialty} {item.hospital ? `at ${item.hospital}` : ""}
                        </span>
                      </div>

                      {/* Small actions for reschedule/cancel moved here to keep right side clean as per reference */}
                      {!isCancelled && !isCompleted && (
                        <div className="mt-4 flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="text-[13px] font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(item._id)}
                            className="text-[13px] font-bold text-rose-500 hover:text-rose-600 hover:underline underline-offset-4"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 lg:justify-end">
                      <div className="flex items-center gap-4">
                        {isPending ? (
                          <>
                            {isTelemedicine && (
                              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm transition-transform hover:scale-105" title="Telemedicine Consultation">
                                <Video className="h-6 w-6" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handlePayNow(item)}
                              className="flex items-center gap-3 rounded-full bg-[#0047ab] px-10 py-4 text-sm font-black text-white shadow-[0_10px_25px_-5px_rgba(0,71,171,0.4)] transition-all hover:bg-[#003580] hover:scale-[1.02] active:scale-95"
                            >
                              <CreditCard className="h-5 w-5" />
                              Pay Now
                            </button>
                          </>
                        ) : canJoinVideo ? (
                          <button
                            type="button"
                            onClick={() => handleJoinMeeting(item)}
                            className="flex items-center gap-3 rounded-full bg-[#0047ab] px-10 py-4 text-sm font-black text-white shadow-[0_10px_25px_-5px_rgba(0,71,171,0.4)] transition-all hover:bg-[#003580] hover:scale-[1.02] active:scale-95"
                          >
                            <Video className="h-5 w-5" />
                            Join Meeting
                          </button>
                        ) : (
                          <div className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest ${getStatusClasses(item.status)}`}>
                             {getStatusLabel(item.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })

          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg font-bold text-slate-500">
                No appointments yet.
              </p>
            </div>
          )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 lg:p-8">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          <div className="relative z-10 w-full max-w-[78rem] overflow-hidden rounded-[2rem] bg-[#f7f9fc] shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <form
              id="booking-form"
              onSubmit={handleBook}
              className="grid max-h-[88vh] grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px]"
            >
              <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={
                      selectedDoctor.profile_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedDoctor.doctorName ||
                          selectedDoctor.name ||
                          "Doctor"
                      )}&background=0D8ABC&color=fff&size=200`
                    }
                    alt="Doctor"
                    className="mb-4 h-20 w-20 rounded-full border-[4px] border-white object-cover shadow-md"
                  />

                  <strong className="text-2xl font-extrabold text-slate-800">
                    {selectedDoctor.name ||
                      selectedDoctor.doctorName ||
                      "Doctor"}
                  </strong>

                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                    {selectedDoctor.specialty || "Cardiology"}
                  </p>
                </div>


                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl bg-white p-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Credentials
                      </p>
                      <p className="mt-1 text-sm font-bold leading-snug text-slate-700">
                        MD, PhD - Johns Hopkins
                      </p>
                    </div>
                  </div>


                </div>

                <div className="mt-8">
                  <h4 className="mb-5 text-xl font-extrabold text-slate-800">
                    Appointment Details
                  </h4>

                  <div className="mb-6">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Consultation Type
                    </label>
                    <select
                      className="block w-full border-b-2 border-slate-200 bg-transparent pb-3 text-base font-medium text-slate-800 outline-none focus:border-blue-500"
                      value={bookingForm.visitType}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          visitType: e.target.value
                        })
                      }
                    >
                      <option value="Telemedicine">Telemedicine</option>
                      <option value="Physical Visit">Physical Visit</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Reason for Visit
                    </label>
                    <textarea
                      className="min-h-[90px] w-full resize-none border-b-2 border-slate-200 bg-transparent pb-3 text-sm font-medium text-slate-700 outline-none placeholder-slate-300 focus:border-blue-500"
                      value={bookingForm.notes}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          notes: e.target.value
                        })
                      }
                      placeholder="Please describe your symptoms..."
                    />
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        Your data is encrypted and only visible to the clinical
                        team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-full shrink-0 flex-col border-l border-slate-200 bg-[#f8fbff] p-6 lg:min-w-[380px] lg:p-10">
                <h4 className="mb-8 text-[1.4rem] font-bold text-[#0249a6]">
                  Quick Scheduler
                </h4>

                <div className="mb-5 flex items-center justify-between text-[15px] font-bold text-slate-800">
                  {currentWeekInfo.displayMonthYear}
                  <div className="flex gap-5 text-[15px] font-extrabold text-[#0249a6]">
                    <span
                      onClick={() =>
                        weekOffset > 0 && setWeekOffset((prev) => prev - 1)
                      }
                      className={`transition-colors ${
                        weekOffset === 0
                          ? "pointer-events-none text-slate-300"
                          : "cursor-pointer hover:text-blue-500"
                      }`}
                    >
                      {"<"}
                    </span>
                    <span
                      onClick={() => setWeekOffset((prev) => prev + 1)}
                      className="cursor-pointer transition-colors hover:text-blue-500"
                    >
                      {">"}
                    </span>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-7 gap-1 text-center text-[12px] font-extrabold tracking-wider text-slate-400">
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                  <div>S</div>
                </div>

                <div className="mb-8 grid grid-cols-7 gap-1 text-center text-[14px] font-bold text-slate-800">
                  {currentWeekInfo.days.map((dateObj, i) => {
                    const isPast = dateObj < currentWeekInfo.todayMidnight;
                    const dayNum = dateObj.getDate();

                    const isoStr = new Date(
                      dateObj.getTime() - dateObj.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .split("T")[0];

                    const isActive = bookingForm.appointmentDate === isoStr;

                    if (isPast) {
                      return (
                        <div key={i} className="py-2 text-slate-300">
                          {dayNum}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        onClick={() =>
                          setBookingForm({
                            ...bookingForm,
                            appointmentDate: isoStr
                          })
                        }
                        className={`flex cursor-pointer items-center justify-center rounded-xl py-2 transition-all ${
                          isActive
                            ? "bg-[#d9edff] text-[#0249a6]"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>

                <h5 className="mb-4 text-[11px] font-extrabold uppercase tracking-widest text-[#0249a6]">
                  Available Slots
                </h5>

                <div className="mb-10 grid grid-cols-2 gap-3">
                  {[
                    "09:00 AM",
                    "10:30 AM",
                    "11:15 AM",
                    "02:00 PM",
                    "03:45 PM",
                    "05:00 PM"
                  ].map((t, i) => {
                    const isActive = bookingForm.appointmentTime === t;
                    return (
                      <label
                        key={i}
                        className={`relative cursor-pointer rounded-xl border-2 py-3.5 text-center text-[13px] font-bold transition-all ${
                          isActive
                            ? "border-transparent bg-[#d9edff] text-[#0249a6] shadow-sm"
                            : "border-[#f0f4fa] bg-white text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="time-slot"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          value={t}
                          checked={isActive}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              appointmentTime: e.target.value
                            })
                          }
                        />
                        {t}
                      </label>
                    );
                  })}
                </div>

                <div className="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-xl bg-[#0249a6] py-4 text-[15px] font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-[#02316a]"
                  >
                    {loading ? "Saving..." : "Confirm Appointment"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 lg:p-8">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowSuccessPopup(false)}
          ></div>

          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-emerald-50 text-emerald-500">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="mb-2 text-2xl font-black text-slate-800">
              Booking Successful!
            </h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500">
              Your appointment has been confirmed. You can view the details in your appointments list.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full rounded-2xl bg-[#0052cc] py-4 text-[15px] font-bold text-white shadow-md transition-all active:scale-[0.98] hover:bg-[#0041a3]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default AppointmentPage;