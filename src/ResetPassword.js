import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import logo from './assets/tradelogo.png';
 
const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromNav = location.state?.email || '';
 
  const [form, setForm] = useState({ email: emailFromNav, otp: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 
  useEffect(() => {
    if (emailFromNav) {
      setForm(prev => ({ ...prev, email: emailFromNav }));
    }
  }, [emailFromNav]);
 
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(null);
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Check if passwords match
    if (form.new_password !== form.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
          new_password: form.new_password
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setMessage({ type: 'success', text: data.message });
      setForm({ email: '', otp: '', new_password: '', confirm_password: '' });

      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Password reset successful! Please login with your new password.',
            email: form.email
          }
        });
      }, 1200);

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 relative overflow-hidden">
      {/* CSS Styles */}
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .bounce-in { animation: bounceIn 0.6s ease-out; }
        
        .gradient-text {
          background: linear-gradient(45deg, #3b82f6, #06b6d4, #10b981, #f59e0b);
          background-size: 400% 400%;
          animation: gradientShift 3s ease infinite;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .input-focus-effect:focus {
          transform: scale(1.02);
          transition: all 0.3s ease;
        }
        
        .button-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }
      `}</style>

      <div>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '-20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '5px'
            }}>
              <img
                src={logo}
                alt="EducateTrade Logo"
                style={{ width: '48px', height: '48px', borderRadius: '8px' }}
              />
              <h1 className="gradient-text" style={{
                fontSize: '2.25rem',
                fontWeight: 'bold'
              }}>
                EducateTrade
              </h1>
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '4px'
              }}>Reset Password</h2>
              {/* <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                OTP sent to: <span style={{ fontWeight: '600', color: '#374151' }}>{form.email}</span>
              </p> */}
            </div>
          </div>

          {message && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '1px',
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {message.type === 'success' ? 
                  <CheckCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} /> : 
                  <XCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                }
                {message.text}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Email Address */}
            <div>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginTop: '-15px'
              }}>
                Email Address
              </label>
              <input
                
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  appearance: 'none',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  width: '100%',
                  padding: '8px 10px',
                  color: '#374151',
                  lineHeight: '1.50',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#f9fafb',
                  marginTop: '2px'
                }}
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            
            {/* OTP */}
            <div>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginBottom: '2px'
              }}>
                OTP
              </label>
              <input
                
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  appearance: 'none',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  width: '100%',
                  padding: '8px 10px',
                  color: '#374151',
                  lineHeight: '1.25',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#f9fafb'
                }}
                type="text"
                name="otp"
                placeholder="Enter OTP sent to your email"
                value={form.otp}
                onChange={handleChange}
                required
              />
            </div>
            
            {/* New Password */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginBottom: '2px'
              }}>
                New Password
              </label>
              <input
                
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  appearance: 'none',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  width: '100%',
                  padding: '8px 10px',
                  color: '#374151',
                  lineHeight: '1.25',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#f9fafb'
                }}
                type={showPassword ? "text" : "password"}
                name="new_password"
                placeholder="Enter your new password"
                value={form.new_password}
                onChange={handleChange}
                required
              />
              {/* <div
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '33px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#0284c7' }} />
                ) : (
                  <EyeIcon style={{ width: '20px', height: '20px', color: '#0284c7' }} />
                )}
              </div> */}
            </div>
            
            {/* Confirm Password */}
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginBottom: '2px'
              }}>
                Confirm Password
              </label>
              <input
                
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  appearance: 'none',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  width: '100%',
                  padding: '8px 10px',
                  color: '#374151',
                  lineHeight: '1.25',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#f9fafb'
                }}
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                placeholder="Confirm your password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
              <div
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '33px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon style={{ width: '20px', height: '20px', color: '#0284c7' }} />
                ) : (
                  <EyeIcon style={{ width: '20px', height: '20px', color: '#0284c7' }} />
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              
              style={{
                background: isSubmitting 
                  ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
                  : 'linear-gradient(90deg, #0284c7, #2563eb, #7c3aed)',
                backgroundSize: '200% 100%',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '12px',
                border: 'none',
                outline: 'none',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                // boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg style={{
                    animation: 'spin 1s linear infinite',
                    height: '20px',
                    width: '20px',
                    marginRight: '12px',
                    color: 'white'
                  }} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            {/* Back to Login */}
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
            </div>
          </form>
        </div>
        
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          &copy; 2025 EducateTrade Simulator. All rights reserved.
        </div>
      </div>
    </div>
  );
};
 
export default ResetPassword;