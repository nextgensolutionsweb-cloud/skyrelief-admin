'use client';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await apiRequest('/api/admin/auth/sessions');
      if (res.s === 1) {
        setSessions(res.r || []);
      }
    } catch (err) {
      showToast('Failed to fetch active sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to force logout this admin session?")) return;
    
    try {
      const res = await apiRequest('/api/admin/auth/revoke', {
        method: 'POST',
        body: JSON.stringify({ session_id: id }),
      });
      if (res.s === 1) {
        showToast('Session revoked successfully', 'success');
        fetchSessions();
      } else {
        showToast(res.m || 'Failed to revoke session', 'error');
      }
    } catch (err) {
      showToast('Error revoking session', 'error');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading active sessions...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Active Admin Sessions</h1>
      
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
            <tr>
              <th style={{ padding: '16px' }}>ADMIN</th>
              <th style={{ padding: '16px' }}>IP ADDRESS</th>
              <th style={{ padding: '16px' }}>DEVICE INFO</th>
              <th style={{ padding: '16px' }}>LOGIN TIME</th>
              <th style={{ padding: '16px' }}>LAST ACTIVITY</th>
              <th style={{ padding: '16px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No active sessions found.</td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.session_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600' }}>{session.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{session.email}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>{session.ip_address || 'Unknown'}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={session.device_info}>{session.device_info || 'Unknown'}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b' }}>{session.login_time ? new Date(session.login_time).toLocaleString() : 'N/A'}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b' }}>{session.last_activity ? new Date(session.last_activity).toLocaleString() : 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => handleRevoke(session.session_id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                      <LogOut size={14} /> Force Logout
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
