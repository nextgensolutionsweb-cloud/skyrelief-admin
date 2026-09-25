'use client';
import { useState, useEffect } from 'react';
import { LogOut, Trash2, RefreshCw } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/admin/auth/sessions?page=${page}&limit=${limit}`);
      if (res.s === 1) {
        if (res.r?.sessions) {
          setSessions(res.r.sessions);
          setTotal(res.r.total_count || 0);
        } else if (Array.isArray(res.r)) {
          setSessions(res.r);
          setTotal(res.meta?.total || res.r.length);
        } else {
          setSessions([]);
          setTotal(0);
        }
      }
    } catch (err) {
      showToast('Failed to fetch active sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Are you sure you want to force logout this admin session?")) return;
    setActionId(id);
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
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session record?")) return;
    setActionId(id);
    try {
      const res = await apiRequest('/api/admin/auth/sessions/delete', {
        method: 'POST',
        body: JSON.stringify({ session_id: id }),
      });
      if (res.s === 1) {
        showToast('Session record deleted successfully', 'success');
        fetchSessions();
      } else {
        showToast(res.m || 'Failed to delete session', 'error');
      }
    } catch (err) {
      showToast('Error deleting session', 'error');
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Active Admin Sessions
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage active tokens and live login sessions for platform administrators
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div className="premium-table-container">
          <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <tr>
                <th style={{ padding: '14px 16px' }}>Admin</th>
                <th style={{ padding: '14px 16px' }}>IP Address</th>
                <th style={{ padding: '14px 16px' }}>Device Info</th>
                <th style={{ padding: '14px 16px' }}>Login Time</th>
                <th style={{ padding: '14px 16px' }}>Last Activity</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Loading active sessions...</div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.session_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '750', color: '#0f172a', fontSize: '0.88rem' }}>{session.full_name || 'Admin'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{session.email || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#334155' }}>
                      {session.ip_address || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }} title={session.device_info}>
                      {session.device_info || 'Unknown device'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                      {session.login_time ? new Date(session.login_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                      {session.last_activity ? new Date(session.last_activity).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleRevoke(session.session_id)}
                          disabled={actionId === session.session_id}
                          title="Force Logout"
                          style={{
                            background: '#fff1f2',
                            color: '#e11d48',
                            border: '1px solid #fecdd3',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                          }}
                        >
                          <LogOut size={13} /> Force Logout
                        </button>
                        <button
                          onClick={() => handleDelete(session.session_id)}
                          disabled={actionId === session.session_id}
                          title="Delete Session Record"
                          style={{
                            background: '#f8fafc',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > limit && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> sessions
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: page === 1 ? '#f8fafc' : '#ffffff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#94a3b8' : '#0f172a',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.82rem', fontWeight: '700', color: '#334155' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: page * limit >= total ? '#f8fafc' : '#ffffff',
                  cursor: page * limit >= total ? 'not-allowed' : 'pointer',
                  color: page * limit >= total ? '#94a3b8' : '#0f172a',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
