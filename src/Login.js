import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, TrophyIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import TradeLogo from './assets/tradelogo.png';
import ForgotPassword from './forgotPassword';



const StockTradeLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
     confirmPassword: '',
  firstName: '',
  lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const navigate = useNavigate();

 const validateForm = () => {
  const newErrors = {};
  
  if (!formData.email) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email is invalid';
  }
  
  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }
  
  // Add validation for signup fields if not in login mode
  if (!isLogin) {
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (validateForm()) {
      setIsSubmitting(true);

      const endpoint = 'http://localhost:8000/api/login/';
      const payload = {
        email: formData.email,
        password: formData.password,
        ...(isLogin ? {} : {
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName
      })
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }
        // if(formData.rememberMe){
        //   localStorage.setItem("authToken",data.token);
        //   sessionStorage.removeItem("authToken");
        // } else{
        localStorage.setItem("authToken", data.token);
        setMessage({ type: 'success', text: 'Login successful!' });
        
        localStorage.setItem('firstName', data.first_name);
        // localStorage.setItem("authToken",data.token);
        // sessionStorage.removeItem("authToken");
        // }
        navigate('/portfolio');
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
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
        
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        
        @keyframes blink {
          0%, 50% { border-color: transparent; }
          51%, 100% { border-color: #bae6fd; }
        }
        
        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .slide-in-right { animation: slideInFromRight 0.8s ease-out; }
        .slide-in-left { animation: slideInFromLeft 0.8s ease-out; }
        .bounce-in { animation: bounceIn 0.6s ease-out; }
        
        .gradient-text {
          background: linear-gradient(45deg, #3b82f6, #06b6d4, #10b981, #f59e0b);
          background-size: 400% 400%;
          animation: gradientShift 3s ease infinite;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .typewriter {
          overflow: hidden;
          border-right: 2px solid #bae6fd;
          white-space: nowrap;
          animation: typewriter 2s steps(40, end);
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
        
        .welcome-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 767px) {
          .left-panel { display: none !important; }
          .right-panel { width: 100% !important; }
        }
        
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
          .right-panel { width: ${showForgotPassword ? '100%' : '50%'} !important; }
        }
      `}</style>

      {/* Enhanced animated background */}
      <div style={{
        position: 'absolute',
        inset: '0',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {/* Floating geometric shapes */}
        <div className="float-animation" style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
          borderRadius: '16px',
          opacity: 0.1,
          transform: 'rotate(45deg)'
        }}></div>
        <div className="pulse-slow" style={{
          position: 'absolute',
          top: '70%',
          right: '15%',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(45deg, #10b981, #f59e0b)',
          borderRadius: '50%',
          opacity: 0.08,
          animationDelay: '1s'
        }}></div>
        <div className="float-animation" style={{
          position: 'absolute',
          top: '40%',
          left: '70%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          opacity: 0.12,
          animationDelay: '2s'
        }}></div>
      </div>

      {/* Left Side - Enhanced Welcome Panel - Only show when NOT in forgot password mode */}
      {!showForgotPassword && (
        <div className="slide-in-left left-panel" style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a1826 0%, #163b56 50%, #2e6ca2 100%)',
          position: 'relative',
          width: '50%'
        }}>
          
          <div style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '10px',
            position: 'relative',
            zIndex: 10,
            padding: '0 0px'
          }}>
            <div style={{ marginBottom: '1px', width: '100%' }}>
              {/* Welcome back section */}
              <div className="welcome-card" style={{ 
                textAlign: 'center',
                marginBottom: '12px',
                padding: '10px',
                borderRadius: '20px'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '0px'
                }}>👋</div>
                
                <h1 className="bounce-in" style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1px',
                  textAlign: 'center',
                  color: '#bae6fd'
                }}>Welcome Back!</h1>
                
                <p className="typewriter slide-in-left" style={{
                  color: '#e0f2fe',
                  fontSize: '1.2rem',
                  marginBottom: '5px',
                  fontWeight: '500',
                  animationDelay: '0.5s'
                }}>
                  Continue your trading journey with us
                </p>
                
                {/* Platform stats */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '12px',
                  padding: '3px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '0.875rem',
                    color: '#bae6fd'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#4ade80' }}>Real-Time</div>
                      <div>Market Data</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#06b6d4' }}>Practice</div>
                      <div>Mode</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>Zero</div>
                      <div>Risk Trading</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced feature cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '11px',
                marginBottom: '10px'
              }}>
                {[
                  { icon: ChartBarIcon, title: "Live Markets", desc: "Real-time UK data", color: "#10b981" },
                  { icon: ShieldCheckIcon, title: "Secure Login", desc: "Protected access", color: "#3b82f6" },
                  { icon: UserIcon, title: "Your Portfolio", desc: "Track progress", color: "#8b5cf6" },
                  { icon: TrophyIcon, title: "Leaderboards", desc: "Compete & win", color: "#f59e0b" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="card-hover slide-in-left"
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

      {/* Right Side - Enhanced Login Form */}
      <div className="slide-in-right right-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        position: 'relative',
        width: showForgotPassword ? '100%' : '100%'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '29px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {!showForgotPassword ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '3px'
                  }}>
                    {/* Logo instead of animated icon */}
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
                  
                  <div style={{ animationDelay: '0.3s' }}>
                    <p style={{ 
                      color: '#6b7280',
                      fontSize: '1rem',
                      padding: '5px'
                    }}>
                      Sign in to continue your trading journey
                    </p>
                  </div>
                </div>

                {message && (
                  <div style={{
                    marginBottom: '50px',
                    padding: '10px',
                    borderRadius: '5px',
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Email field */}
                  <div style={{ animationDelay: '0.4s' }}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '2px',
                      marginTop: '-25px'
                    }}>
                      Email Address
                    </label>
                    <input
                      
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.email ? '#ef4444' : formData.email && /\S+@\S+\.\S+/.test(formData.email) ? '#10b981' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '14px 16px',
                        // color: '#374151',
                        fontSize: '1rem',
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
                    {/* Email validation icon
                    {formData.email && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}>
                        {/\S+@\S+\.\S+/.test(formData.email) ? (
                          <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                        ) : (
                          <XCircleIcon style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                        )}
                      </div> */}
                    {/* )} */}
                    {errors.email && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div style={{ position: 'relative', animationDelay: '0.5s' }}>
                    <label style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '2px'
                    }}>
                      Password
                    </label>
                    <input
                      
                      style={{
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        appearance: 'none',
                        border: `2px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        width: '100%',
                        padding: '14px 50px 14px 16px',
                        color: '#374151',
                        fontSize: '1rem',
                        lineHeight: '1.25',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '31px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseOver={(e) => e.target.closest('div').style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.closest('div').style.transform = 'scale(1)'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      ) : (
                        <EyeIcon style={{ width: '20px', height: '35px', color: '#0284c7' }} />
                      )}
                    </div>
                    {errors.password && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <XCircleIcon style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    animationDelay: '0.6s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        style={{
                          height: '18px',
                          width: '18px',
                          color: '#0284c7',
                          borderColor: '#d1d5db',
                          borderRadius: '4px',
                          marginRight: '8px',
                          cursor: 'pointer'
                        }}
                      />
                      <label style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      // onClick={() => navigate('/forgot-password')} 
                      style={{
                        fontSize: '0.875rem',
                        color: '#0284c7',
                        fontWeight: '500',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.textDecoration = 'underline';
                        e.target.style.color = '#0369a1';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.textDecoration = 'none';
                        e.target.style.color = '#0284c7';
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Enhanced Submit Button */}
                  <div style={{ animationDelay: '0.7s' }}>
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
                        fontSize: '1.1rem',
                        padding: '10px 10px',
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
                            height: '10px',
                            width: '10px',
                            marginRight: '12px',
                            color: 'white'
                          }} viewBox="0 0 24 24">
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing you in...
                        </>
                      ) : (
                        <>Sign In</>
                      )}
                    </button>
                  </div>

                  {/* Enhanced Sign Up Link */}
                  <div style={{ 
                    textAlign: 'center', 
                    animationDelay: '0.8s',
                    padding: '5px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '8px' }}>
                      New to our platform?
                    </div>
                    <Link to="/register" style={{
                      color: '#0284c7',
                      fontWeight: '600',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      padding: '5px 16px',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#e0f2fe';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }}>
                      Create your account →
                    </Link>
                  </div>
                </form>
              </>
            ) : 
              (
                <ForgotPassword onBack={() => setShowForgotPassword(false)} />
              )
            }
          </div>
          
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem',
            animationDelay: '1s',
            padding: '10px',
            marginTop: '-25px'
          }}>
            &copy; 2025 EducateTrade Simulator. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTradeLogin;