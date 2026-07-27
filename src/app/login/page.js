'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { apiRequest, setAuth, getAuth, showToast } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpState, setOtpState] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const { token } = getAuth();
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          platform: 'admin',
        }),
      });

        if (response.s === 1 && response.r?.auth) {
        setAuth({
          apikey: response.r.auth.apikey,
          token: response.r.auth.token,
          user: response.r.user,
        });
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else if (response.s === 1 && response.r?.status === 'otp_required') {
        showToast(response.m || 'OTP sent to foundation email', 'success');
        setLoginToken(response.r.loginToken);
        setOtpState(true);
        setResendCooldown(60);
      } else {
        showToast(response.m || 'Login failed', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      showToast('Please enter a valid OTP.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/verify-login-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          loginToken,
        }),
      });

      if (response.s === 1 && response.r?.apikey) {
        setAuth({
          apikey: response.r.apikey,
          token: response.r.token,
          user: response.r.user,
        });
        showToast('OTP verified! Redirecting...', 'success');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        showToast(response.m || 'Invalid OTP', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
      const response = await apiRequest('/api/auth/resend-login-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.s === 1 && response.r?.loginToken) {
        setLoginToken(response.r.loginToken);
        showToast('A new OTP has been sent to the foundation email.', 'success');
        setResendCooldown(60);
      } else {
        showToast(response.m || 'Failed to resend OTP', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #e0f2fe 0%, #c0e8fc 50%, #bae6fd 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 50px rgba(14, 165, 233, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
        border: '1.5px solid #bee3f8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <img src="/skyrelief-logo.jpeg" alt="SkyRelief Logo" style={{ maxWidth: '180px', height: 'auto', objectFit: 'contain', borderRadius: '12px' }} />
        </div>

        {otpState ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#0ea5e9'
            }}>
              <Shield size={32} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
              OTP Verification
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              An OTP has been sent to the foundation email. Please enter it below to access your account.
            </p>
            
            <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1.5px solid #bee3f8',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '0.2em',
                    fontWeight: '700',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0ea5e9';
                    e.target.style.background = '#fff';
                    e.target.style.boxShadow = '0 0 0 4px rgba(14,165,233,0.15)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#bee3f8';
                    e.target.style.background = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || resendCooldown > 0}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: (resending || resendCooldown > 0) ? '#94a3b8' : '#0ea5e9',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: (resending || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                    textDecoration: (resending || resendCooldown > 0) ? 'none' : 'underline',
                    marginBottom: '16px',
                    display: 'block',
                    width: '100%',
                    textAlign: 'right'
                  }}
                >
                  {resending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  transition: 'all 0.2s ease',
                  marginBottom: '16px'
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <button
              onClick={() => {
                setOtpState(false);
                setOtp('');
                setPassword('');
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
              textAlign: 'center',
            }}>
              Welcome Back
            </h1>
            <p style={{
              fontSize: '0.82rem',
              color: '#64748b',
              marginBottom: '32px',
              textAlign: 'center',
              fontWeight: '500',
            }}>
              Sign in to secure access your ERP workspace.
            </p>

            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              {/* Email input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }} />
                  <input
                    type="email"
                    placeholder="admin@skyrelief.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #bee3f8',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#0ea5e9';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 4px rgba(14,165,233,0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#bee3f8';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password input */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }} />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '12px',
                      border: '1.5px solid #bee3f8',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#0ea5e9';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 4px rgba(14,165,233,0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#bee3f8';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(14,165,233,0.45)';
                  }
                }}
                onMouseLeave={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.3)';
                  }
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
