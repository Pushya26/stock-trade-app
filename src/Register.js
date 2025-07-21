import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, ArrowTrendingUpIcon , ShieldCheckIcon, AcademicCapIcon, TrophyIcon } from '@heroicons/react/24/outline';
import TradeLogo from './assets/tradelogo.png';


const Register = () => {
  const [showPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
    otp: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = 'OTP must contain only numbers';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = name === 'email' ? value.toLowerCase() : value;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : finalValue
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setFormData({
        ...formData,
        otp: value
      });
      if (errors.otp) {
        setErrors({
          ...errors,
          otp: null
        });
      }
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (validateForm()) {
      setIsSubmitting(true);
      const endpoint = 'http://localhost:8000/api/register/';
      const payload = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Log the response for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.log('Non-JSON response:', text);
          throw new Error('Server returned non-JSON response. Check if API server is running.');
        }
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Something went wrong');
        }
        localStorage.setItem("authToken", data.token);
        localStorage.setItem('firstName', data.first_name);
        setMessage({ type: 'success', text: 'OTP sent to your email address' });
        setShowOtpStep(true);
        setOtpTimer(10);
        setFormData({ ...formData, otp: '' });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (validateOtp()) {
      setIsSubmitting(true);
      const endpoint = 'http://localhost:8000/api/verify-register-otp/';
      const payload = {
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        // Log the response for debugging
        console.log('OTP Response status:', response.status);
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.log('Non-JSON response:', text);
          throw new Error('Server returned non-JSON response. Check if API server is running.');
        }
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Invalid OTP or OTP expired');
        }
        setMessage({ type: 'success', text: data.message || 'Registration successful!' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setIsSubmitting(true);
    setMessage(null);
    const endpoint = 'http://localhost:8000/api/resend-register-otp/';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      // Log the response for debugging
      console.log('Resend OTP Response status:', response.status);
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Check if API server is running.');
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }
      setMessage({ type: 'success', text: 'OTP resent successfully' });
      setOtpTimer(10);
      setFormData({ ...formData, otp: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setShowOtpStep(false);
    setFormData({ ...formData, otp: '' });
    setMessage(null);
    setOtpTimer(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-50">
      {/* CSS Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slideInFromRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInFromLeft {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .slide-in-right { animation: slideInFromRight 0.8s ease-out; }
        .slide-in-left { animation: slideInFromLeft 0.8s ease-out; }
        // .bounce-in { animation: bounceIn 0.6s ease-out; }
        
        .gradient-text {
          background: linear-gradient(45deg, #3b82f6, #06b6d4, #10b981, #f59e0b);
          background-size: 400% 400%;
          animation: gradientShift 3s ease infinite;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
        
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        @media (max-width: 767px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
        
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
          .right-panel { width: ${showOtpStep ? '100%' : '50%'} !important; }
        }

        .gradient-logo {
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

      `}</style>

      {/* Left Side - Enhanced Features Panel - Only show when NOT in OTP step */}
      {!showOtpStep && (
        <div className="slide-in-left left-panel" style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a1826 0%, #163b56 50%, #2e6ca2 100%)',
          position: 'relative',
          width: '50%'
        }}>
          
          <div style={{
            position: 'absolute',
            top: '32px',
            left: '40px'
          }}>
          </div>
          
          <div style={{
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '-60px',
            position: 'relative',
            zIndex: 10,
            padding: '0 25px'
          }}>
            <div style={{ marginBottom: '32px', width: '100%' }}>
              {/* Dynamic welcome section */}
              <div style={{ 
                textAlign: 'center',
                marginBottom: '12px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📈</div>

              <h1 className="bounce-in" style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '12px',
                textAlign: 'center',
                color: '#bae6fd'
              }}>Start Trading Today</h1>
              
              <p className="slide-in-left" style={{
                color: '#e0f2fe',
                fontSize: '1.2rem',
                marginBottom: '20px',
                fontWeight: '500'
              }}>
                Join 10,000+ students mastering UK markets
              </p>
              
         {/* Highlighted educational value section */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            marginTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '0.875rem',
              color: '#bae6fd'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#4ade80' }}>1,200+</div>
                <div>UK Stocks Simulated</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#06b6d4' }}>Beginner to Pro</div>
                <div>Learning Paths</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>Practice Trading</div>
                <div>Zero Risk, All Reward</div>
              </div>
            </div>
          </div>

              </div>
              
              {/* Feature cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                {[
                  { icon: ArrowTrendingUpIcon , title: "Real-Time Data", desc: "Live UK market feeds", color: "#10b981" },
                  { icon: ShieldCheckIcon, title: "Risk-Free", desc: "Virtual portfolio", color: "#3b82f6" },
                  { icon: AcademicCapIcon, title: "Learn & Grow", desc: "Expert tutorials", color: "#8b5cf6" },
                  { icon: TrophyIcon, title: "Compete", desc: "Weekly challenges", color: "#f59e0b" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="card-hover "
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      animationDelay: `${0.7 + index * 0.1}s`
                    }}
                  >
                    <feature.icon style={{ 
                      width: '32px', 
                      height: '32px', 
                      color: feature.color,
                      margin: '0 auto 8px'
                    }} />
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 'bold', 
                      color: '#e0f2fe',
                      marginBottom: '4px'
                    }}>{feature.title}</div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#bae6fd'
                    }}>{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Side - Registration Form */}
      <div className="slide-in-right right-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        position: 'relative',
        width: showOtpStep ? '100%' : '100%'
      }}>
        <div style={{ width: '100%', maxWidth: '384px' }}>
          <div className="bounce-in" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '10px'
              }}>
               <img
                  src={TradeLogo}
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
              {!showOtpStep && (
                // <div className="slide-in-right" style={{ animationDelay: '0.2s' }}>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>Create Your Account</h2>
                  {/* <p style={{ color: '#6b7280', marginBottom: '16px' }}>Start your trading journey today</p> */}
                </div>
              )}
            </div>

            {!showOtpStep ? (
              <div>
                {message && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
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

                <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Email field */}
                <div style={{ animationDelay: '0.2s' }}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginTop: '-10px'
                    }}>
                      Email Address
                    </label>
                    <input
                      className="input-focus-effect"
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '12px 16px',
                        color: '#374151',
                        lineHeight: '1.25',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div style={{ position: 'relative', animationDelay: '0.4s' }}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginTop: '-8px'
                    }}>
                      Create Password
                    </label>
                    <input
                      className="input-focus-effect"
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        color: '#374151',
                        lineHeight: '1.25',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {/* <div
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      ) : (
                        <EyeIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      )}
                    </div> */}
                    {errors.password && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div style={{ position: 'relative', animationDelay: '0.5s' }}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginTop: '-8px'
                    }}>
                      Confirm Password
                    </label>
                    <input
                      className="input-focus-effect"
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        color: '#374151',
                        lineHeight: '1.25',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      ) : (
                        <EyeIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      )}
                    </div>
                    {errors.confirmPassword && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Name fields */}
                  <div style={{ display: 'flex', gap: '16px', animationDelay: '0.6s' }}>
                    <div style={{ width: '50%' }}>
                      <label style={{
                        display: 'block',
                        color: '#374151',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginTop: '-8px'
                      }}>
                        First Name
                      </label>
                      <input
                        className="input-focus-effect"
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          appearance: 'none',
                          border: `2px solid ${errors.firstName ? '#ef4444' : '#d1d5db'}`,
                          borderRadius: '12px',
                          width: '100%',
                          padding: '12px 16px',
                          color: '#374151',
                          lineHeight: '1.25',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        type="text"
                        name="firstName"
                        placeholder="Your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                      {errors.firstName && (
                        <p style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div style={{ width: '50%' }}>
                      <label style={{
                        display: 'block',
                        color: '#374151',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginTop: '-8px'
                      }}>
                        Last Name
                      </label>
                      <input
                        className="input-focus-effect"
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          appearance: 'none',
                          border: `2px solid ${errors.lastName ? '#ef4444' : '#d1d5db'}`,
                          borderRadius: '12px',
                          width: '100%',
                          padding: '12px 16px',
                          color: '#374151',
                          lineHeight: '1.25',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        type="text"
                        name="lastName"
                        placeholder="Your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      {errors.lastName && (
                        <p style={{
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div style={{ animationDelay: '0.7s' }}> 
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '11px',
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: `2px solid ${errors.agreeToTerms ? '#ef4444' : formData.agreeToTerms ? '#10b981' : '#e2e8f0'}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        style={{
                          height: '18px',
                          width: '20px',
                          marginTop: '2px',
                          marginRight: '12px',
                          color: '#0284c7',
                          borderColor: '#d1d5db',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          color: '#374151',
                          lineHeight: '1.5',
                          cursor: 'pointer'
                        }}>
                          I agree to the{' '}
                          <span style={{
                            color: '#0284c7',
                            fontWeight: '600',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}>Terms & Conditions</span>
                          {' '}and{' '}
                          <span style={{
                            color: '#0284c7',
                            fontWeight: '600',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}>Privacy Policy</span>
                        </label>
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <div style={{ animationDelay: '0.8s' }}>
                    <button
                      type="submit"
                      // className="button-hover-effect"
                      style={{
                        background: isSubmitting 
                          ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
                          : 'linear-gradient(90deg, #0284c7, #2563eb, #7c3aed)',
                        backgroundSize: '200% 100%',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        padding: '14px 24px',
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
                        overflow: 'hidden'
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
                          Creating your account...
                        </>
                      ) : (
                        <>Create My Trading Account</>
                      )}
                    </button>
                  </div>

                  {/* Sign-in link */}
                  <div style={{ 
                    textAlign: 'center', 
                    animationDelay: '0.9s',
                    padding: '2px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1px' }}>
                      Already part of our community?
                    </div>
                    <Link to="/login" style={{
                      color: '#0284c7',
                      fontWeight: '600',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}>
                      Sign in to your account →
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              // OTP Verification Step
              <div className="bounce-in">
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    padding: '24px',
                    borderRadius: '16px',
                    marginBottom: '16px',
                    border: '1px solid #93c5fd'
                  }}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <div className="pulse-slow" style={{
                        position: 'absolute',
                        inset: '0',
                        backgroundColor: 'rgba(56, 189, 248, 0.3)',
                        borderRadius: '50%',
                        filter: 'blur(16px)'
                      }}></div>
                      <svg style={{
                        width: '64px',
                        height: '64px',
                        color: '#0284c7',
                        margin: '0 auto',
                        position: 'relative',
                        zIndex: 10,
                        display: 'block'
                      }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#1e40af',
                      marginBottom: '8px'
                    }}>Check Your Email</h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#1e3a8a',
                      marginBottom: '4px'
                    }}>
                      We've sent a 6-digit verification code to
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#1e3a8a',
                      backgroundColor: 'white',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}>{formData.email}</p>
                  </div>
                </div>

                {message && (
                  <div className="bounce-in" style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
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

                <form onSubmit={handleOtpSubmit}>
                  <div style={{ marginBottom: '24px', animationDelay: '0.2s' }}>
                    <label style={{
                      display: 'block',
                      color: '#1e40af',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      Enter Verification Code
                    </label>
                    <input
                      className="input-focus-effect"
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.otp ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '16px',
                        color: '#374151',
                        textAlign: 'center',
                        fontSize: '1.875rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.2em',
                        lineHeight: '1.25',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      type="text"
                      name="otp"
                      placeholder="000000"
                      value={formData.otp}
                      onChange={handleOtpChange}
                      maxLength="6"
                    />
                    {errors.otp && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '4px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '16px', animationDelay: '0.3s' }}>
                    <button
                      type="submit"
                      // className="button-hover-effect"
                      style={{
                        background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        // boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer'
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
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
                      )}
                      Verify & Complete Registration
                    </button>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animationDelay: '0.4s'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                      {otpTimer > 0 ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <svg style={{
                            width: '16px',
                            height: '16px',
                            animation: 'spin 1s linear infinite',
                            color: '#0284c7'
                          }} fill="none" viewBox="0 0 24 24">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Resend code in {formatTime(otpTimer)}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          style={{
                            color: '#0284c7',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                          disabled={isSubmitting}
                        >
                          🔄 Resend verification code
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      style={{
                        fontSize: '0.875rem',
                        color: '#0284c7',
                        transition: 'all 0.2s ease',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to form
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
            animationDelay: '1s'
          }}>
            &copy; 2025 EducateTrade Simulator. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;