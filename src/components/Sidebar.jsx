'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, ShieldCheck, Heart, Wallet,
  FileText, Bell, CheckSquare, X, LogOut, Shield, ChevronRight
} from 'lucide-react';
import { clearAuth, showToast, apiRequest } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const mainNav = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Insurance Management', path: '/insurance', icon: ShieldCheck },
  { name: 'Agents', path: '/agents', icon: UserCircle },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Programs', path: '/marriages', icon: Heart },
  { name: 'Payment Campaigns', path: '/payments', icon: Wallet },
  { name: 'Payment Requests & QR', path: '/admin/payment-requests', icon: CheckSquare, badgeKey: 'payment' },
];

const securityNav = [
  { name: 'Agent Requests', path: '/admin/agent-requests', icon: FileText, badgeKey: 'agent' },
  { name: 'Login History', path: '/admin/requests', icon: FileText },
  { name: 'Active Sessions', path: '/admin/sessions', icon: LayoutDashboard },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell }
];

export default function Sidebar({ isOpen, onClose, isDesktopClosed }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [agentRes, paymentRes] = await Promise.all([
          apiRequest('/api/admin/agent-requests'),
          apiRequest('/api/admin/payment-submissions')
        ]);
        if (agentRes && agentRes.s === 1 && Array.isArray(agentRes.r)) {
          setPendingRequestsCount(agentRes.r.filter(r => r.type !== 'payment').length);
        }
        if (paymentRes && paymentRes.s === 1 && Array.isArray(paymentRes.r)) {
          const pending = paymentRes.r.filter(p => (p.status === 0 || p.is_submission_pending) && p.status !== 1 && p.status !== 2);
          setPendingPaymentCount(pending.length);
        }
      } catch (e) {
        console.error('Failed to fetch sidebar counts', e);
      }
    };
    fetchCounts();
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  const renderNavItem = ({ name, path, icon: Icon, badgeKey }) => {
    const active = pathname === path;
    const badge = badgeKey === 'payment' ? pendingPaymentCount : (badgeKey === 'agent' ? pendingRequestsCount : 0);

    return (
      <li key={name} style={{ margin: '3px 0' }}>
        <Link
          href={path}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontWeight: active ? '700' : '500',
            fontSize: '0.86rem',
            textDecoration: 'none',
            color: active ? '#ffffff' : '#475569',
            background: active ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' : 'transparent',
            boxShadow: active ? '0 8px 20px -4px rgba(14, 165, 233, 0.45)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            if (!active) {
              e.currentTarget.style.background = 'rgba(224, 242, 254, 0.6)';
              e.currentTarget.style.color = '#0284c7';
              e.currentTarget.style.paddingLeft = '18px';
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.paddingLeft = '14px';
            }
          }}
        >
          {/* Active Accent Bar */}
          {active && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: '20%',
              height: '60%',
              width: '4px',
              borderRadius: '0 4px 4px 0',
              background: '#ffffff',
              boxShadow: '0 0 8px #ffffff'
            }} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0, color: active ? '#ffffff' : undefined }} />
            <span style={{ tracking: '-0.01em' }}>{name}</span>
          </div>

          {badge > 0 && (
            <span style={{
              background: active ? '#ffffff' : '#ef4444',
              color: active ? '#ef4444' : '#ffffff',
              fontSize: '0.68rem',
              fontWeight: '800',
              padding: '2px 7px',
              borderRadius: '9999px',
              minWidth: '20px',
              textAlign: 'center',
              boxShadow: active ? '0 2px 6px rgba(0,0,0,0.15)' : '0 2px 6px rgba(239, 68, 68, 0.3)'
            }}>
              {badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className={`sidebar-aside ${isOpen ? 'sidebar-open' : ''} ${isDesktopClosed ? 'desktop-closed' : ''}`}>

      {/* Brand Header */}
      <div style={{
        padding: '20px 20px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.4) 100%)',
        borderTopLeftRadius: 'var(--radius-xl)',
        borderTopRightRadius: 'var(--radius-xl)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            flexShrink: 0,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.18)',
            border: '1.5px solid #e0f2fe',
            overflow: 'hidden'
          }}>
            <img src="/skyrelief-logo.jpeg" alt="SkyRelief Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              SkyRelief
              <span style={{ fontSize: '0.62rem', fontWeight: '800', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', padding: '1px 6px', borderRadius: '6px', textTransform: 'uppercase' }}>ERP</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', letterSpacing: '0.04em', marginTop: '1px' }}>
              Foundation Admin
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="sidebar-close-btn"
          style={{
            display: 'none',
            padding: '6px',
            borderRadius: '10px',
            color: '#64748b',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Body */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {/* Main Section */}
        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '12px' }}>
          Main Navigation
        </div>
        <ul style={{ marginBottom: '20px', listStyle: 'none', padding: 0 }}>
          {mainNav.map(renderNavItem)}
        </ul>

        {/* Security Section */}
        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '12px' }}>
          Security & Audit
        </div>
        <ul style={{ marginBottom: '16px', listStyle: 'none', padding: 0 }}>
          {securityNav.map(renderNavItem)}
        </ul>

      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '14px 16px 16px', borderTop: '1px solid rgba(226, 232, 240, 0.7)', background: 'rgba(248,250,252,0.5)' }}>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '11px 14px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: '700',
            color: '#ef4444',
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = '#fecaca';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.08)';
          }}
        >
          <LogOut size={17} strokeWidth={2.5} />
          <span>Sign Out</span>
        </button>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of SkyRelief Admin ERP?"
        danger={true}
      />
    </aside>
  );
}
