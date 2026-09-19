'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown, LogOut, User, Menu, ChevronLeft, ChevronRight, Clock, Calendar } from 'lucide-react';
import { getAuth, clearAuth, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

export default function Header({ onMenuClick, onDesktopToggle, isDesktopClosed }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState({ full_name: 'System Admin', email: 'admin@skyrelief.com' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Live real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const auth = getAuth();
    if (auth?.user) {
      setUser(auth.user);
    }

    const handleUserUpdate = () => {
      const freshAuth = getAuth();
      if (freshAuth?.user) {
        setUser(freshAuth.user);
      }
    };
    
    const handleNotificationsRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener('sky-user-updated', handleUserUpdate);
    window.addEventListener('sky-notifications-read', handleNotificationsRead);
    
    // Fetch notifications
    const fetchUnread = async () => {
      try {
        const { apiRequest } = await import('@/lib/api');
        const res = await apiRequest('/api/admin/notifications');
        if (res.s === 1 && res.r?.unread_count) {
          setUnreadCount(res.r.unread_count);
        }
      } catch (err) {}
    };
    if (auth?.token) {
      fetchUnread();
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('sky-user-updated', handleUserUpdate);
      window.removeEventListener('sky-notifications-read', handleNotificationsRead);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSafeProfileImage = (profilePath) => {
    if (!profilePath) return null;
    let path = String(profilePath).trim();
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/uploads/')) {
      path = path.replace('/uploads/uploads/', '/uploads/');
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
    return BASE_URL + path;
  };

  const profileImageUrl = getSafeProfileImage(user?.profile);

  // Compute readable page title from current pathname
  const getPageLabel = (path) => {
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/insurance')) return 'Insurance Management';
    if (path.startsWith('/agents')) return 'Agents Directory';
    if (path.startsWith('/members')) return 'Members Directory';
    if (path.startsWith('/marriages')) return 'Marriage Programs';
    if (path.startsWith('/payments')) return 'Payment Campaigns';
    if (path.startsWith('/admin/payment-requests')) return 'Payment Requests & QR';
    if (path.startsWith('/admin/agent-requests')) return 'Agent Requests';
    if (path.startsWith('/admin/requests')) return 'Login History';
    if (path.startsWith('/admin/sessions')) return 'Active Sessions';
    if (path.startsWith('/admin/notifications')) return 'Notifications Center';
    return 'Admin ERP';
  };

  // Formatted date and time strings
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header style={{
      height: 'var(--header-height)',
      position: 'sticky',
      top: 16,
      margin: '0 16px',
      borderRadius: 'var(--radius-xl)',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1.5px solid rgba(226, 232, 240, 0.9)',
      boxShadow: '0 12px 36px -6px rgba(14, 165, 233, 0.1), 0 4px 14px rgba(0, 0, 0, 0.03)',
      gap: '16px',
    }}>

      {/* Left section: Collapse Toggle & Path Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onDesktopToggle}
          className="desktop-toggle-btn"
          title={isDesktopClosed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            color: '#0ea5e9',
            borderRadius: '11px',
            cursor: 'pointer',
            border: '1.5px solid #e0f2fe',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.12)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#0ea5e9';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#0ea5e9';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#0ea5e9';
            e.currentTarget.style.borderColor = '#e0f2fe';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.12)';
          }}
        >
          {isDesktopClosed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        {/* Mobile Logo Toggle */}
        <img
          onClick={onMenuClick}
          src="/skyrelief-logo.jpeg"
          alt="SkyRelief"
          className="mobile-header-logo"
          style={{ cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px' }}
        />

        {/* Dynamic Page Breadcrumb Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} className="header-user-text">
          <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getPageLabel(pathname)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>SkyRelief Foundation</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0ea5e9' }} />
            <span>Ahmedabad, Gujarat</span>
          </div>
        </div>
      </div>

      {/* Right side: Lite Clean Live Time Badge, Notifications & User Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Super Lite Clean Live Clock Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '9999px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
        }} className="header-user-text">
          <Clock size={14} style={{ color: '#0ea5e9' }} strokeWidth={2.5} />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.01em' }}>
            {formattedTime}
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: '300' }}>|</span>
          <span style={{ fontSize: '0.73rem', fontWeight: '600', color: '#64748b' }}>
            {formattedDate}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          className="header-bell-btn"
          title="Notifications"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            border: '1.5px solid rgba(226, 232, 240, 0.9)',
            background: '#ffffff',
            position: 'relative',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
          onClick={() => router.push('/admin/notifications')}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f0f9ff';
            e.currentTarget.style.color = '#0ea5e9';
            e.currentTarget.style.borderColor = '#bae6fd';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
          }}
        >
          <Bell size={17} strokeWidth={2} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #ffffff',
              color: 'white',
              fontSize: '9px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="header-divider" style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 2px' }} />

        {/* User Dropdown Pill */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px 4px 5px',
              borderRadius: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1.5px solid',
              background: dropdownOpen ? '#f0f9ff' : '#ffffff',
              borderColor: dropdownOpen ? '#0ea5e9' : 'rgba(226, 232, 240, 0.9)',
              boxShadow: dropdownOpen ? '0 4px 16px rgba(14, 165, 233, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)'
            }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            onMouseEnter={e => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={e => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
              }
            }}
          >
            {/* Profile Avatar Container */}
            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '11px',
                    objectFit: 'cover',
                    border: '1.5px solid #e0f2fe'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{
                display: profileImageUrl ? 'none' : 'flex',
                width: '100%',
                height: '100%',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                color: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.82rem',
                letterSpacing: '0.02em',
                boxShadow: '0 3px 10px rgba(14,165,233,0.3)',
              }}>
                {getInitials(user.full_name)}
              </div>
              {/* Online Indicator Badge */}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #ffffff'
              }} />
            </div>

            {/* Name & Email Text */}
            <div className="header-user-text" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>
                {user.full_name || 'System Admin'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#0ea5e9', fontWeight: '600', marginTop: '1px' }}>
                {user.email || 'admin@skyrelief.org'}
              </div>
            </div>

            <ChevronDown
              className="header-user-chevron"
              size={14}
              strokeWidth={2.5}
              style={{
                color: '#94a3b8',
                flexShrink: 0,
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '52px',
              background: '#ffffff',
              border: '1.5px solid #e0f2fe',
              borderRadius: '16px',
              boxShadow: '0 16px 36px -6px rgba(14, 165, 233, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05)',
              zIndex: 100,
              width: '210px',
              padding: '6px',
              animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}>
              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed in as</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); router.push('/settings'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.83rem',
                  fontWeight: '600',
                  color: '#334155',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  background: 'transparent'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f0f9ff';
                  e.currentTarget.style.color = '#0ea5e9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <User size={16} strokeWidth={2} />
                <span>Profile Settings</span>
              </button>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

              <button
                onClick={() => { setDropdownOpen(false); setShowLogoutConfirm(true); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.83rem',
                  fontWeight: '700',
                  color: '#ef4444',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  background: 'transparent'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={16} strokeWidth={2.5} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of SkyRelief Admin ERP?"
        danger={true}
      />
    </header>
  );
}
