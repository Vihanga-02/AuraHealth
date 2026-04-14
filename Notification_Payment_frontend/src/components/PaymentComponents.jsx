import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import axios from 'axios';

export const PaymentLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading Payment Gateway...</p>
        <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
      </div>
    </div>
  );
};

export const PaymentSuccess = ({ appointmentId, amount }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
      <p className="text-gray-600 mb-4">
        Your payment has been completed successfully.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount Paid</span>
          <span className="font-semibold text-gray-900">LKR {amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Appointment ID</span>
          <span className="font-mono text-gray-900">APT-{appointmentId}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => window.location.href = "/history"}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          View History
        </button>
        <button
          onClick={() => window.location.href = "/"}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Home
        </button>
      </div>
    </div>
  );
};

export const PaymentError = ({ errorMessage, onRetry }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
      <p className="text-gray-600 mb-4">
        We couldn't process your payment.
      </p>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-700 text-sm">{errorMessage}</p>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = "/"}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const CheckoutForm = ({ clientSecret, amount, appointmentId, currency }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setErrorMessage('Please enter a valid phone number for the SMS receipt.');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setPaymentStatus('error');
      setLoading(false);
    } else if (paymentIntent.status === 'succeeded') {
      try {
        await axios.post('http://localhost:5005/api/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          appointmentId: appointmentId,
          amount: amount,
          customerPhone: phoneNumber
        });
        // Only show success after DB is updated
        setPaymentStatus('success');
      } catch (err) {
        console.error('Error confirming payment:', err);
        // Even if DB sync fails, payment went through Stripe. 
        // We show success but log the error or handle it via a webhook later.
        setPaymentStatus('success');
      } finally {
        setLoading(false);
      }
    }
  };

  if (paymentStatus === 'success') {
    return <PaymentSuccess appointmentId={appointmentId} amount={amount} />;
  }

  if (paymentStatus === 'error') {
    return <PaymentError errorMessage={errorMessage} onRetry={() => setPaymentStatus('idle')} />;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Secure Payment</h3>
        <p className="text-blue-100 text-sm mt-1">SSL Encrypted Transaction</p>
      </div>

      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Consultation Fee</span>
          <span className="text-2xl font-bold text-gray-900">
            {currency} {amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
          <span>Appointment ID</span>
          <span className="font-mono">APT-{appointmentId}</span>
        </div>
      </div>

      <div className="px-6 py-6 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-gray-400 font-normal">(for SMS receipt)</span>
        </label>
        <input 
          type="tel"
          placeholder="07XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
          required
        />
      </div>

      <div className="px-6 py-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                  iconColor: '#3b82f6',
                },
                invalid: {
                  color: '#dc2626',
                  iconColor: '#dc2626',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your payment is secured with SSL encryption
        </p>
      </div>

      <div className="px-6 pb-6">
        <button
          type="submit"
          disabled={!stripe || loading}
          className={`
            w-full py-3 rounded-lg font-semibold text-white transition-all duration-200
            ${!stripe || loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ${currency} ${amount.toLocaleString()}`
          )}
        </button>
      </div>
    </form>
  );
};
