'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/admin/auth/requests?page=${page}&limit=${limit}`);
      if (res.s === 1) {
        if (res.r?.requests) {
          setHistory(res.r.requests);
          setTotal(res.r.total_count || 0);
        } else if (Array.isArray(res.r)) {
          setHistory(res.r);
          setTotal(res.meta?.total || res.r.length);
        } else {
          setHistory([]);
          setTotal(0);
        }
      }
    } catch (err) {
      showToast('Failed to fetch login history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this login record?")) return;
    setDeletingId(id);
    try {
      const res = await apiRequest('/api/admin/auth/requests/delete', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      if (res.s === 1) {
        showToast('Login record deleted successfully', 'success');
        fetchHistory();
      } else {
        showToast(res.m || 'Failed to delete record', 'error');
      }
    } catch (err) {
      showToast('Error deleting login record', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Login History
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Audit log of admin login requests and access sessions
          </p>
        </div>
        <button
          onClick={fetchHistory}
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
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Requested At</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Loading login history...</div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No login history records found.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '750', color: '#0f172a', fontSize: '0.88rem' }}>{record.full_name || 'Admin'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{record.email || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#334155' }}>
                      {record.ip_address || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }} title={record.device_info}>
                      {record.device_info || 'Unknown device'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: record.status === 1 ? '#dcfce7' : record.status === 2 ? '#fee2e2' : '#fef9c3',
                        color: record.status === 1 ? '#15803d' : record.status === 2 ? '#991b1b' : '#854d0e',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: '750'
                      }}>
                        {record.status === 1 ? 'Approved' : record.status === 2 ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                      {record.created_at ? new Date(record.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        title="Delete Record"
                        style={{
                          background: '#fff1f2',
                          color: '#e11d48',
                          border: '1px solid #fecdd3',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
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
              Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> records
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
