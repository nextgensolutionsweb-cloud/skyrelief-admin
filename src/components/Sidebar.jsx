'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCircle, ShieldCheck, Heart, Wallet,
  FileText, BarChart3, Bell, Settings, Shield, Speaker, CheckSquare, X, LogOut
} from 'lucide-react';
import { clearAuth, showToast, apiRequest } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';
const mainNav = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Insurance Management', path: '/insurance', icon: ShieldCheck },
  { name: 'Agents', path: '/agents', icon: UserCircle },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Marriage Programs', path: '/marriages', icon: Heart },
  { name: 'Payment Campaigns', path: '/payments', icon: Wallet },
];

export default function Sidebar({ isOpen, onClose, isDesktopClosed }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await apiRequest('/api/admin/agent-requests');
        if (res && res.s === 1 && Array.isArray(res.r)) {
          setPendingRequestsCount(res.r.length);
        }
      } catch (e) {
        console.error('Failed to fetch pending requests count', e);
      }
    };
    fetchCount();
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    showToast('Logged out successfully', 'success');
    router.push('/login');
  };

  return (
    <aside className={`sidebar-aside ${isOpen ? 'sidebar-open' : ''} ${isDesktopClosed ? 'desktop-closed' : ''}`}>

      {/* Logo */}
      <div style={{
        padding: '20px 20px 18px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid var(--border)',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <img src="/skyrelief-logo.jpeg" alt="SkyRelief Icon" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent' }} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>SkyRelief</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '1px' }}>Admin ERP</div>
          </div>
        </div>
        <button onClick={onClose} className="sidebar-close-btn" style={{
          display: 'none',
          padding: '4px',
          borderRadius: '8px',
          color: '#64748b',
        }}>
          <X size={20} />
        </button>
      </div>


      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>



        <ul style={{ marginBottom: '24px' }}>
          {mainNav.map(({ name, path, icon: Icon }) => {
            const active = pathname === path;
            return (
              <li key={name}>
                <Link href={path} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  marginBottom: '2px',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  color: active ? 'white' : '#475569',
                  background: active ? 'var(--primary-gradient)' : 'transparent',
                  boxShadow: active ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                  transition: 'all 0.18s ease',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '12px' }}>
          Security
        </div>
        <ul style={{ marginBottom: '24px' }}>
          {[
            { name: 'Agent Requests', path: '/admin/agent-requests', icon: FileText, badge: pendingRequestsCount },
            { name: 'Login History', path: '/admin/requests', icon: FileText },
            { name: 'Active Sessions', path: '/admin/sessions', icon: LayoutDashboard },
            { name: 'Notifications', path: '/admin/notifications', icon: Bell }
          ].map(({ name, path, icon: Icon, badge }) => {
            const active = pathname === path;
            return (
              <li key={name}>
                <Link href={path} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  marginBottom: '2px',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  color: active ? 'white' : '#475569',
                  background: active ? 'var(--primary-gradient)' : 'transparent',
                  boxShadow: active ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                  transition: 'all 0.18s ease',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                    {name}
                  </div>
                  {badge > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '99px',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>


      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: '700', color: '#ef4444',
            background: 'transparent', border: '1px solid #fee2e2',
            cursor: 'pointer', transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} strokeWidth={2.5} />
          Sign Out
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
