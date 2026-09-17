'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Search, RefreshCw, ZoomIn, X } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function PaymentRequestsPage() {
  const router = useRouter();
  
  // Bank Settings State
  const [bankSettings, setBankSettings] = useState({
    bank_name: 'State Bank of India',
    bank_upi_id: 'skyrelief@sbi',
    bank_account_no: '',
    bank_ifsc: '',
    default_amount: '1000'
  });
  const [savingBankSettings, setSavingBankSettings] = useState(false);

  // Payment Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'

  // Image Zoom Modal State
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchBankSettings();
    fetchSubmissions();
  }, []);

  const fetchBankSettings = async () => {
    try {
      const res = await apiRequest('/api/admin/agent-requests/bank-settings');
      if (res && res.s === 1 && res.r) {
        setBankSettings({
          bank_name: res.r.bank_name || 'State Bank of India',
          bank_upi_id: res.r.bank_upi_id || 'skyrelief@sbi',
          bank_account_no: res.r.bank_account_no || '',
          bank_ifsc: res.r.bank_ifsc || '',
          default_amount: res.r.default_amount || '1000'
        });
      }
    } catch (e) {
      console.error('Failed to fetch bank settings', e);
    }
  };

  const handleSaveBankSettings = async (e) => {
    e.preventDefault();
    setSavingBankSettings(true);
    try {
      const res = await apiRequest('/api/admin/agent-requests/bank-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankSettings)
      });
      if (res && res.s === 1) {
        showToast('Bank QR & UPI Settings updated successfully!', 'success');
        fetchBankSettings();
      } else {
        showToast(res?.m || 'Failed to update bank settings', 'error');
      }
    } catch (err) {
      showToast('Error saving bank settings', 'error');
    } finally {
      setSavingBankSettings(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/payment-submissions');
      if (res && res.s === 1) {
        setSubmissions(res.r || []);
      } else {
        setSubmissions([]);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load payment requests', 'error');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve and confirm this payment request?')) return;
    try {
      const res = await apiRequest('/api/admin/payment-submissions/approve', {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      if (res && res.s === 1) {
        showToast('Payment request approved successfully!', 'success');
        fetchSubmissions();
      } else {
        showToast(res?.m || 'Failed to approve payment request', 'error');
      }
    } catch (err) {
      showToast('Error approving payment request', 'error');
    }
  };

  const initiateReject = (id) => {
    setRejectId(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Please enter a rejection reason', 'error');
      return;
    }
    setRejecting(true);
    try {
      const res = await apiRequest('/api/admin/payment-submissions/reject', {
        method: 'POST',
        body: JSON.stringify({ id: rejectId, reason: rejectReason })
      });
      if (res && res.s === 1) {
        showToast('Payment request rejected', 'success');
        setShowRejectModal(false);
        fetchSubmissions();
      } else {
        showToast(res?.m || 'Failed to reject payment request', 'error');
      }
    } catch (err) {
      showToast('Error rejecting payment request', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const getProofUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${BASE_API_URL}${path}`;
  };

  const filteredSubmissions = submissions.filter(item => {
    const matchesTab = 
      activeTab === 'pending' ? item.status === 0 :
      activeTab === 'approved' ? item.status === 1 :
      activeTab === 'rejected' ? item.status === 2 : true;
    
    if (!matchesTab) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (item.member_name && item.member_name.toLowerCase().includes(q)) ||
      (item.member_code && item.member_code.toLowerCase().includes(q)) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      (item.agent_name && item.agent_name.toLowerCase().includes(q)) ||
      (item.transaction_id && item.transaction_id.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>Payment Requests & Bank QR Manager</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage official Bank UPI / QR Code & review user/agent submitted payment proof requests.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Bank QR & UPI Configuration Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          
          {/* Form */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                🏦
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Bank UPI & QR Settings</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Update official bank account and UPI ID displayed in Mobile App for collection payments.</p>
              </div>
            </div>

            <form onSubmit={handleSaveBankSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Bank Name</label>
                  <input
                    type="text"
                    value={bankSettings.bank_name}
                    onChange={(e) => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>UPI VPA / Handle</label>
                  <input
                    type="text"
                    value={bankSettings.bank_upi_id}
                    onChange={(e) => setBankSettings({ ...bankSettings, bank_upi_id: e.target.value })}
                    placeholder="e.g. skyrelief@sbi"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontWeight: '600', color: '#4f46e5' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Account Number (Optional)</label>
                  <input
                    type="text"
                    value={bankSettings.bank_account_no}
                    onChange={(e) => setBankSettings({ ...bankSettings, bank_account_no: e.target.value })}
                    placeholder="e.g. 123456789012"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>IFSC Code (Optional)</label>
                  <input
                    type="text"
                    value={bankSettings.bank_ifsc}
                    onChange={(e) => setBankSettings({ ...bankSettings, bank_ifsc: e.target.value })}
                    placeholder="e.g. SBIN0001234"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingBankSettings}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: savingBankSettings ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {savingBankSettings ? 'Updating Settings...' : 'Save Bank QR & UPI Details'}
              </button>
            </form>
          </div>

          {/* QR Code Live Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            textAlign: 'center',
            minWidth: '240px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', marginBottom: '12px' }}>
              Live App QR Preview
            </div>
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: '12px'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${bankSettings.bank_upi_id || 'skyrelief@sbi'}&pn=${bankSettings.bank_name || 'SkyRelief'}`)}`}
                alt="Bank UPI QR Code"
                style={{ width: '150px', height: '150px', display: 'block' }}
              />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8' }}>{bankSettings.bank_upi_id || 'skyrelief@sbi'}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{bankSettings.bank_name || 'State Bank of India'}</div>
          </div>

        </div>
      </div>

      {/* Payment Proof Requests Section */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>App Payment Proof Requests</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>Payment proof uploads submitted from mobile application.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    background: activeTab === tab ? 'white' : 'transparent',
                    color: activeTab === tab ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search member, txn ID, agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 14px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '260px', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading payment requests...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>MEMBER DETAILS</th>
                  <th style={{ padding: '12px 16px' }}>PAYMENT PROOF</th>
                  <th style={{ padding: '12px 16px' }}>AMOUNT (₹)</th>
                  <th style={{ padding: '12px 16px' }}>TRANSACTION ID</th>
                  <th style={{ padding: '12px 16px' }}>AGENT</th>
                  <th style={{ padding: '12px 16px' }}>REQUESTED AT</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💳</div>
                      No {activeTab !== 'all' ? activeTab : ''} payment proof requests found.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((item) => (
                    <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.member_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Code: {item.member_code || '—'} | {item.phone || ''}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {item.payment_proof ? (
                          <div 
                            onClick={() => { setZoomImage(getProofUrl(item.payment_proof)); setZoomTitle(`Payment Proof - ${item.member_name || ''}`); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                          >
                            <img 
                              src={getProofUrl(item.payment_proof)} 
                              alt="Proof"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <ZoomIn size={12} /> View Proof
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No screenshot</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '800', color: '#16a34a', fontSize: '1rem' }}>
                        ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                        {item.transaction_id ? (
                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{item.transaction_id}</code>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#0ea5e9' }}>{item.agent_name || 'Direct / App'}</div>
                        {item.agent_code && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({item.agent_code})</div>}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.8rem', color: '#475569' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {item.status === 0 ? (
                          <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}>Pending</span>
                        ) : item.status === 1 ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}>Approved</span>
                        ) : (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700' }}>Rejected</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {item.status === 0 ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApprove(item.id)}
                              style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => initiateReject(item.id)}
                              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '700' }}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Reject Payment Request</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Please provide a reason for rejecting this payment request.
            </p>

            <form onSubmit={confirmReject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid transaction screenshot / amount mismatch"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: rejecting ? 'not-allowed' : 'pointer' }}
                >
                  {rejecting ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}>
            <button 
              onClick={() => setZoomImage(null)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}
            >
              <X size={20} />
            </button>
            <img 
              src={zoomImage} 
              alt={zoomTitle}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
            />
            {zoomTitle && <div style={{ color: 'white', textAlign: 'center', marginTop: '12px', fontWeight: '600', fontSize: '0.9rem' }}>{zoomTitle}</div>}
          </div>
        </div>
      )}

    </div>
  );
}
