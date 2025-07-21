// ForgotPassword.js
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8000/api/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      // ✅ Set message and redirect after short delay
      setMessage({ type: 'success', text: 'OTP sent to your email. Redirecting...' });

      setTimeout(() => {
        navigate('/reset-password', { state: { email } }); // Pass email to next screen
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4 text-center">Reset Password</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 px-4 rounded font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send OTP'}
          </button>
          {/* Back to Login
            <div style={{ 
              textAlign: 'center',
            
            }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  color: '#0284c7',
                  fontWeight: '600',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  display: 'inline-block',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                ← Back to login
              </button>
            </div> */}
        </form>
      </div>
    // </div>
  );
};

export default ForgotPassword;