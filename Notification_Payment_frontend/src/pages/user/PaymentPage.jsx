// frontend/src/pages/PaymentPage.jsx
import { useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { CheckoutForm, PaymentLoader } from '../../components/PaymentComponents';

const stripePromise = loadStripe('pk_test_51TFw5BIj7N2a7qjcDXNT5rkyvXIlGaLEtfw508WTO0QoDiXHAwPXv63ncBI5q8mIKUED8KZa5Q4djnbtrKYE292h00yXVs3Oiq');

function PaymentPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialized = useRef(false);
  
  const amount = 2500;
  const appointmentId = 5;
  const currency = 'LKR';

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await axios.post('http://localhost:5005/api/payments/checkout', {
          amount: amount,
          appointmentId: appointmentId,
          currency: currency
        });
        setClientSecret(response.data.clientSecret);
        setError('');
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to initialize payment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, []);

  if (loading) {
    return <PaymentLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MediConnect</h1>
          <p className="text-gray-500 mt-1">Secure Medical Payment Gateway</p>
        </div>

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              clientSecret={clientSecret} 
              amount={amount} 
              appointmentId={appointmentId}
              currency={currency}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

export default PaymentPage;