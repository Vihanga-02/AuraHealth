import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { paymentApi, appointmentApi } from '../../api';
import { doctorApi } from '../../api/doctorApi';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CARD_STYLE = {
  style: {
    base: { fontSize: '15px', color: '#1e293b', fontFamily: 'ui-sans-serif, system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } },
    invalid: { color: '#ef4444' },
  },
  hidePostalCode: true,
};

/* ─── Inner form (needs Stripe context) ─────────────────────────────────── */
function CheckoutForm({ appointmentId, appointment, doctor }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const defaultFee = Number(doctor?.consultation_fee || doctor?.consultationFee || 0) || 2500;

  const [amount,       setAmount]       = useState(defaultFee);
  const [phone,        setPhone]        = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [intentId,     setIntentId]     = useState('');
  const [step,         setStep]         = useState('init'); // init | ready | processing | done | error
  const [errMsg,       setErrMsg]       = useState('');
  const [cardReady,    setCardReady]    = useState(false);

  /* Create payment intent on mount (or when amount changes via user edit) */
  const createIntent = useCallback(async (amt) => {
    setStep('init'); setErrMsg('');
    try {
      const { data } = await paymentApi.checkout({
        amount: Number(amt),
        appointmentId: Number(appointmentId),
        currency: 'lkr',
        customerEmail: appointment?.patientEmail || '',
        customerName:  appointment?.patientName  || '',
      });
      setClientSecret(data.clientSecret);
      setIntentId(data.paymentIntentId);
      setStep('ready');
    } catch (e) {
      setErrMsg(e?.response?.data?.error || e?.response?.data?.message || 'Failed to initialise payment. Please try again.');
      setStep('error');
    }
  }, [appointmentId, appointment]);

  // Sync amount when doctor profile loads after initial render
  useEffect(() => {
    const fee = Number(doctor?.consultation_fee || doctor?.consultationFee || 0);
    if (fee > 0) setAmount(fee);
  }, [doctor]);

  useEffect(() => { createIntent(amount); }, []); // eslint-disable-line

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setStep('processing'); setErrMsg('');

    const card = elements.getElement(CardElement);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (error) {
      setErrMsg(error.message || 'Payment failed.');
      setStep('ready');
      return;
    }

    try {
      await paymentApi.confirm({ paymentIntentId: paymentIntent.id, customerPhone: phone });
      setStep('done');
    } catch {
      // Payment succeeded in Stripe but confirm call failed — still treat as done
      setStep('done');
    }
  };

  /* ── Done state ── */
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">✅</div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Payment Successful!</h3>
          <p className="text-slate-500 text-sm mt-1">Your appointment is now confirmed.</p>
          {phone && <p className="text-slate-400 text-xs mt-1">An SMS receipt has been sent to {phone}.</p>}
        </div>
        <div className="flex gap-3 flex-wrap justify-center pt-2">
          <Link to="/patient/appointments" className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
            View My Appointments
          </Link>
          <Link to="/patient/dashboard" className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-5">
      {/* Amount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Amount (LKR) <span className="text-xs text-slate-400 font-normal">— editable</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">LKR</span>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => { if (step !== 'processing') createIntent(amount); }}
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone <span className="text-xs text-slate-400 font-normal">— for SMS receipt</span>
          </label>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="07X XXX XXXX"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Card element */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Details</label>
        <div className={`rounded-xl border-2 bg-white p-4 transition-colors ${cardReady ? 'border-blue-400' : 'border-slate-200'}`}>
          <CardElement options={CARD_STYLE} onReady={() => setCardReady(true)} onChange={(e) => setCardReady(!e.empty && !e.error)} />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Secured by Stripe. Your card details are never stored on our servers.</p>
      </div>

      {errMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {errMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={step === 'init' || step === 'processing' || !stripe}
        className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-sm flex items-center justify-center gap-2"
      >
        {step === 'init'       && <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing…</>}
        {step === 'ready'      && <>🔒 Pay LKR {Number(amount).toLocaleString()}</>}
        {step === 'processing' && <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>}
        {step === 'error'      && <>⚠️ Retry Payment</>}
      </button>

      <p className="text-center text-xs text-slate-400">
        Test card: <code className="font-mono bg-slate-100 px-1 rounded">4242 4242 4242 4242</code> · any future date · any CVC
      </p>
    </form>
  );
}

/* ─── Page wrapper ───────────────────────────────────────────────────────── */
export default function PatientCheckout() {
  const { appointmentId } = useParams();
  const [appointment,  setAppointment]  = useState(null);
  const [doctor,       setDoctor]       = useState(null);
  const [loadingAppt,  setLoadingAppt]  = useState(true);

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  useEffect(() => {
    appointmentApi.my()
      .then(async ({ data }) => {
        const list  = Array.isArray(data) ? data : [];
        const found = list.find((a) => String(a._id) === String(appointmentId) || String(a.id) === String(appointmentId));
        setAppointment(found || null);

        // Fetch doctor to get the real consultation fee
        if (found?.doctorId) {
          try {
            const { data: doc } = await doctorApi.getOne(found.doctorId);
            // getOneDoctor returns { doctor: {...} }
            setDoctor(doc.doctor || doc);
          } catch { /* fee will stay undefined — user can edit the field */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAppt(false));
  }, [appointmentId]);

  const options = useMemo(() => ({ appearance: { theme: 'stripe' } }), []);

  if (!publishableKey) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center">
        <div className="text-4xl mb-3">⚙️</div>
        <h2 className="text-lg font-bold text-slate-800">Stripe not configured</h2>
        <p className="mt-2 text-sm text-slate-500">
          Add <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">VITE_STRIPE_PUBLISHABLE_KEY</code> to your frontend environment and rebuild.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/patient/appointments" className="text-slate-400 hover:text-slate-600 transition">
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete your payment to confirm the appointment.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Payment form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">💳</span>
            <h2 className="font-bold text-slate-800">Payment Details</h2>
          </div>
          <div className="px-6 py-6">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm appointmentId={appointmentId} appointment={appointment} doctor={doctor} />
            </Elements>
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800">Appointment Summary</div>
            <div className="px-6 py-4 space-y-3 text-sm">
              {loadingAppt ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : appointment ? (
                <>
                  {[
                    ['Appointment ID',  `#${appointmentId}`],
                    ['Date',            appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) : '—'],
                    ['Time',            appointment.appointmentTime?.slice(0, 5) || '—'],
                    ['Type',            appointment.visitType || '—'],
                    ['Status',          appointment.status || '—'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-slate-400">{l}</span>
                      <span className="font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
                  {doctor && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Doctor</span>
                      <span className="font-medium text-slate-800">{doctor.full_name || '—'}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-base">
                    <span className="text-slate-700">Total</span>
                    <span className="text-blue-600">
                      LKR {Number(doctor?.consultation_fee || doctor?.consultationFee || 2500).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <p className="font-medium text-slate-600">Appointment #{appointmentId}</p>
                  <p className="text-xs mt-1">Confirm the amount before paying.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 px-5 py-4 text-sm text-blue-700 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">🔒 Secure Payment</div>
            <p className="text-xs text-blue-600 leading-relaxed">Your payment is processed securely via Stripe. We never store your card details.</p>
            <p className="text-xs text-blue-600">An SMS confirmation will be sent to your phone after successful payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
