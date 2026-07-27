'use client';
import { useState, useEffect } from 'react';
import { apiRequest, showToast } from '@/lib/api';

export default function PendingJoiningFeesPage() {
  const [pendingCollections, setPendingCollections] = useState([]);
  const [pendingMeta, setPendingMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [submittingPaid, setSubmittingPaid] = useState(false);

  const fetchPendingCollections = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/payment/pending-joining-fees?page=${page}&limit=10`;
      if (search.trim()) {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await apiRequest(endpoint);
      if (res.s === 1 && res.r) {
        setPendingCollections(res.r);
        setPendingMeta(res.meta);
      } else {
        setPendingCollections([]);
        setPendingMeta(null);
      }
    } catch (e) {
      console.error(e);
      setPendingCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCollections();
  }, [page, search]);

  const openMarkPaidModal = (due) => {
    setSelectedDue(due);
    setMarkPaidAmount(due.amount || '');
    setShowMarkPaidModal(true);
  };

  const handleMarkJoiningPaid = async (e) => {
    e.preventDefault();
    if (!selectedDue || !markPaidAmount) return;
    
    setSubmittingPaid(true);
    try {
      const payload = {
        due_id: selectedDue.due_id,
        amount: Number(markPaidAmount)
      };
      
      const res = await apiRequest('/api/agent/mark-joining-fee-paid', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.s === 1) {
        showToast('Joining Fee collected', 'success');
        setShowMarkPaidModal(false);
        fetchPendingCollections();
      } else {
        showToast(res.m || 'Failed to collect joining fee', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error collecting joining fee', 'error');
    } finally {
      setSubmittingPaid(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Global Pending Joining Fees</h1>
        <div>
          <input
            type="text"
            placeholder="Search member name, code, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fffaf0' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#b45309', margin: 0 }}>Pending Joining Fees</h2>
        </div>
        
        {loading ? (
           <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['MEMBER', 'PHONE', 'PLAN', 'DUE DATE', 'PENDING AMT', 'ACTION'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingCollections.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No pending joining fees found.</td></tr>
                  ) : (
                    pendingCollections.map(due => (
                      <tr key={due.due_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{due.member_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{due.member_code}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569' }}>{due.phone || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>{due.plan_name || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{new Date(due.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#f59e0b', fontWeight: '800' }}>₹{Number(due.amount).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button 
                            onClick={() => openMarkPaidModal(due)}
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981', color: '#fff', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pendingMeta && pendingMeta.total > 0 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                  Showing <span style={{ fontWeight: '700' }}>{pendingMeta.skip + 1}</span> to <span style={{ fontWeight: '700' }}>{Math.min(pendingMeta.skip + pendingMeta.limit, pendingMeta.total)}</span> of <span style={{ fontWeight: '700' }}>{pendingMeta.total}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={!pendingMeta.hasPrev} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: pendingMeta.hasPrev ? 'pointer' : 'not-allowed', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>Prev</button>
                  <button disabled={!pendingMeta.hasNext} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: pendingMeta.hasNext ? 'pointer' : 'not-allowed', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showMarkPaidModal && selectedDue && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Collect Joining Fee</h3>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Confirm collection of up to <strong>₹{selectedDue.amount}</strong> from <strong>{selectedDue.member_name}</strong>.
            </div>
            <form onSubmit={handleMarkJoiningPaid} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Amount Collected (₹) *</label>
                <input type="number" max={selectedDue.amount} required value={markPaidAmount} onChange={e => setMarkPaidAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowMarkPaidModal(false)} style={{ flex: 1, padding: '10px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submittingPaid} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: submittingPaid ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                  {submittingPaid ? 'Saving...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
