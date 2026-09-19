'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  ZoomIn, 
  X, 
  Eye, 
  Copy, 
  Check, 
  CreditCard, 
  QrCode, 
  Calendar, 
  User, 
  Phone, 
  ShieldCheck, 
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function PaymentRequestsPage() {
  const router = useRouter();
  
  // Bank Settings State
  const [showBankSettings, setShowBankSettings] = useState(false);
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

  // Selected Detail Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  // Image Zoom Modal State
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchBankSettings();
    fetchSubmissions();
  }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

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
    if (!confirm('Are you sure you want to approve this payment request? The kit due will be marked as Paid.')) return;
    try {
      const res = await apiRequest('/api/admin/payment-submissions/approve', {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      if (res && res.s === 1) {
        showToast('Payment request approved successfully!', 'success');
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(prev => ({ ...prev, status: 1, is_submission_pending: false, paid_at: new Date().toISOString() }));
        }
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
      showToast('Please provide a rejection reason', 'error');
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
        if (selectedItem && selectedItem.id === rejectId) {
          setSelectedItem(prev => ({ ...prev, status: 2, is_submission_pending: false, notes: rejectReason }));
        }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '—';
    }
  };

  // Counts
  const pendingCount = submissions.filter(item => 
    (item.status === 0 || item.is_submission_pending === true) && item.status !== 1 && item.status !== 2
  ).length;
  const approvedCount = submissions.filter(item => item.status === 1).length;
  const rejectedCount = submissions.filter(item => item.status === 2).length;

  const filteredSubmissions = submissions.filter(item => {
    const isPending = (item.status === 0 || item.is_submission_pending === true) && item.status !== 1 && item.status !== 2;
    const isApproved = item.status === 1;
    const isRejected = item.status === 2;

    const matchesTab = 
      activeTab === 'pending' ? isPending :
      activeTab === 'approved' ? isApproved :
      activeTab === 'rejected' ? isRejected : true;
    
    if (!matchesTab) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (item.member_name && item.member_name.toLowerCase().includes(q)) ||
      (item.member_code && item.member_code.toLowerCase().includes(q)) ||
      (item.campaign_no && item.campaign_no.toLowerCase().includes(q)) ||
      (item.plan_name && item.plan_name.toLowerCase().includes(q)) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      (item.agent_name && item.agent_name.toLowerCase().includes(q)) ||
      (item.agent_code && item.agent_code.toLowerCase().includes(q)) ||
      (item.transaction_id && item.transaction_id.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Payment Requests & QR Manager</h1>
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '999px' }}>
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
            Review kit payment requests submitted by members & agents, verify payment screenshots, and configure official Bank QR.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowBankSettings(!showBankSettings)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '9px 16px', 
              borderRadius: '10px', 
              border: '1px solid #c7d2fe', 
              background: showBankSettings ? '#4f46e5' : '#e0e7ff', 
              color: showBankSettings ? 'white' : '#3730a3', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '0.85rem',
              transition: 'all 0.15s'
            }}
          >
            <QrCode size={16} /> {showBankSettings ? 'Hide Bank QR Config' : 'Configure Bank QR & UPI'}
            {showBankSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={fetchSubmissions}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Collapsible Bank QR & UPI Configuration Card */}
      {showBankSettings && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e0e7ff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            {/* Form */}
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                  🏦
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Official Bank UPI & QR Settings</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>These details & QR code are displayed in the Member and Agent mobile apps for kit payments.</p>
                </div>
              </div>

              <form onSubmit={handleSaveBankSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Bank Name</label>
                    <input
                      type="text"
                      value={bankSettings.bank_name}
                      onChange={(e) => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>UPI VPA / Handle</label>
                    <input
                      type="text"
                      value={bankSettings.bank_upi_id}
                      onChange={(e) => setBankSettings({ ...bankSettings, bank_upi_id: e.target.value })}
                      placeholder="e.g. skyrelief@sbi"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #6366f1', fontSize: '0.9rem', outline: 'none', fontWeight: '700', color: '#4f46e5' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Account Number</label>
                    <input
                      type="text"
                      value={bankSettings.bank_account_no}
                      onChange={(e) => setBankSettings({ ...bankSettings, bank_account_no: e.target.value })}
                      placeholder="e.g. 123456789012"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>IFSC Code</label>
                    <input
                      type="text"
                      value={bankSettings.bank_ifsc}
                      onChange={(e) => setBankSettings({ ...bankSettings, bank_ifsc: e.target.value })}
                      placeholder="e.g. SBIN0001234"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingBankSettings}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    color: 'white',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    cursor: savingBankSettings ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {savingBankSettings ? 'Saving Settings...' : 'Save Bank Details'}
                </button>
              </form>
            </div>

            {/* Live QR Preview */}
            <div style={{
              flex: '0 0 240px',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              border: '1px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                Live App QR Preview
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${bankSettings.bank_upi_id}&pn=SkyRelief%20Foundation&cu=INR`)}`}
                  alt="QR Code Preview"
                  style={{ width: '140px', height: '140px', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', marginTop: '10px' }}>
                {bankSettings.bank_upi_id}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #fef3c7', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>Pending Review</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '2px' }}>Requests requiring admin action</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #dcfce7', borderLeft: '4px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>Approved & Settled</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '2px' }}>Marked as paid in kit ledger</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #fee2e2', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>Rejected Requests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>{rejectedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: '2px' }}>Declined proof submissions</div>
        </div>
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid #e0e7ff', borderLeft: '4px solid #6366f1', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#4338ca', textTransform: 'uppercase' }}>Total Submissions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#4f46e5', marginTop: '4px' }}>{submissions.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#3730a3', marginTop: '2px' }}>All recorded payment requests</div>
        </div>
      </div>

      {/* Submissions Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Controls Bar: Tabs & Search */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#fafcff'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'pending', label: 'Pending Requests', count: pendingCount, color: '#f59e0b' },
              { id: 'approved', label: 'Approved', count: approvedCount, color: '#10b981' },
              { id: 'rejected', label: 'Rejected', count: rejectedCount, color: '#ef4444' },
              { id: 'all', label: 'All Requests', count: submissions.length, color: '#64748b' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
                  background: activeTab === tab.id ? '#0f172a' : 'white',
                  color: activeTab === tab.id ? 'white' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: activeTab === tab.id ? 'white' : '#0f172a',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontSize: '0.72rem'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search member, kit, txn ID, agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 34px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', width: '280px', fontSize: '0.85rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div>Loading payment requests...</div>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}>
            <table style={{ width: '100%', minWidth: '1360px', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '180px' }}>KIT / CAMPAIGN</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '250px' }}>MEMBER DETAILS</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '160px' }}>AMOUNT & MODE</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '110px' }}>PROOF SLIP</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '180px' }}>TRANSACTION / UTR</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '180px' }}>COLLECTED BY</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '140px' }}>REQUESTED AT</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', width: '120px' }}>STATUS</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', textAlign: 'right', width: '160px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💳</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#334155' }}>No {activeTab} payment requests found</div>
                      <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '4px' }}>
                        {activeTab === 'pending' ? 'All member and agent payment submissions have been reviewed.' : 'Try changing your search or filter tab.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((item, idx) => (
                    <tr 
                      key={`sub-${item.id}-${idx}`} 
                      onClick={() => setSelectedItem(item)}
                      style={{ 
                        borderTop: '1px solid #f1f5f9', 
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease' 
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Kit / Campaign */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', border: '1px solid #c7d2fe', whiteSpace: 'nowrap' }}>
                          📦 {item.campaign_no || `Kit #${item.id}`}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: '700', marginTop: '6px', lineHeight: 1.35 }}>
                          {item.plan_name || 'Marriage Kit Plan'}
                        </div>
                        {item.campaign_due_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap' }}>
                            <Calendar size={12} /> Due: {new Date(item.campaign_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>

                      {/* Member Details */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
                            color: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            flexShrink: 0,
                            border: '1px solid #c7d2fe',
                            overflow: 'hidden'
                          }}>
                            {item.member_profile ? (
                              <img src={getProofUrl(item.member_profile)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              item.member_name ? item.member_name.charAt(0).toUpperCase() : 'M'
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                              {item.member_name || 'N/A'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', whiteSpace: 'nowrap' }}>
                              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: '700', padding: '1px 7px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                {item.member_code || '—'}
                              </span>
                              {item.member_phone && (
                                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                  {item.member_phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount & Mode */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '900', color: '#166534', fontSize: '1.08rem', letterSpacing: '-0.02em' }}>
                          ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ marginTop: '5px' }}>
                          {item.payment_mode === 'cash' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                              💵 Cash Collection
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px' }}>
                              📱 Online UPI / QR
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Proof Thumbnail */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {item.payment_proof ? (
                          <div 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setZoomImage(getProofUrl(item.payment_proof)); 
                              setZoomTitle(`Payment Screenshot - ${item.member_name || ''}`); 
                            }}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              background: '#ffffff', 
                              padding: '3px', 
                              borderRadius: '10px', 
                              cursor: 'pointer', 
                              border: '1.5px solid #e2e8f0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                              transition: 'transform 0.15s ease, border-color 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                            title="Click to zoom screenshot"
                          >
                            <img 
                              src={getProofUrl(item.payment_proof)} 
                              alt="Proof"
                              style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div style={{ padding: '0 4px', color: '#6366f1' }}>
                              <ZoomIn size={15} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', background: '#f8fafc', color: '#94a3b8', border: '1px dashed #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>
                            No Slip
                          </span>
                        )}
                      </td>

                      {/* UTR / Transaction ID */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {item.transaction_id ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px' }}>
                            <code style={{ fontSize: '0.78rem', fontWeight: '800', color: '#334155', fontFamily: 'monospace' }}>
                              {item.transaction_id}
                            </code>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                copyToClipboard(item.transaction_id, `txn-${item.id}`); 
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b', display: 'flex', alignItems: 'center' }}
                              title="Copy UTR / ID"
                            >
                              {copiedId === `txn-${item.id}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Agent */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                          {item.agent_name || 'Direct (Member App)'}
                        </div>
                        {item.agent_code && (
                          <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', marginTop: '2px' }}>
                            {item.agent_code}
                          </div>
                        )}
                        {item.agent_phone && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            📞 {item.agent_phone}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.82rem' }}>
                          {formatDate(item.created_at).split(',')[0]}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          {formatDate(item.created_at).split(',')[1] || ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {item.status === 1 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                            Approved
                          </span>
                        ) : item.status === 2 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }}></span>
                            Rejected
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* View Detail Button */}
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedItem(item); 
                            }}
                            style={{ 
                              background: '#f8fafc', 
                              color: '#334155', 
                              border: '1px solid #cbd5e1', 
                              padding: '7px 12px', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              fontSize: '0.78rem', 
                              fontWeight: '700',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            title="View Full Details"
                          >
                            <Eye size={14} /> View
                          </button>

                          {/* Quick Approve & Reject for Pending */}
                          {(item.status === 0 || item.is_submission_pending) && item.status !== 1 && item.status !== 2 && (
                            <>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleApprove(item.id); 
                                }}
                                style={{ 
                                  background: '#10b981', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '7px 12px', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px', 
                                  fontSize: '0.78rem', 
                                  fontWeight: '800',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                                title="Approve Payment"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  initiateReject(item.id); 
                                }}
                                style={{ 
                                  background: '#ef4444', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '7px 12px', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '5px', 
                                  fontSize: '0.78rem', 
                                  fontWeight: '800',
                                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                                title="Reject Payment"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proper Detail View Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '740px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafcff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Kit Payment Review
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Request ID: #{selectedItem.id} • {formatDate(selectedItem.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedItem.status === 1 ? (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>✓ Approved</span>
                ) : selectedItem.status === 2 ? (
                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>✕ Rejected</span>
                ) : (
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>⏳ Pending Verification</span>
                )}
                <button 
                  onClick={() => setSelectedItem(null)} 
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Top Banner Amount */}
              <div style={{ 
                background: 'linear-gradient(135deg, #059669, #10b981)', 
                color: 'white', 
                borderRadius: '16px', 
                padding: '18px 24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Amount Submitted</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '2px' }}>
                    ₹{Number(selectedItem.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Payment Mode</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '2px' }}>
                    {selectedItem.payment_mode === 'cash' ? '💵 Cash Received by Agent' : '📱 Online UPI QR / Screenshot'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Kit & Campaign Box */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#4f46e5', fontWeight: '800', fontSize: '0.85rem' }}>
                    <Sparkles size={16} /> KIT & CAMPAIGN INFORMATION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Kit / Campaign No:</span>
                      <span style={{ fontWeight: '800', color: '#0f172a' }}>{selectedItem.campaign_no || `Kit #${selectedItem.id}`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Insurance Plan:</span>
                      <span style={{ fontWeight: '700', color: '#334155' }}>{selectedItem.plan_name || 'Marriage Support Plan'}</span>
                    </div>
                    {selectedItem.married_count && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Campaign Beneficiaries:</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.married_count} Members Married</span>
                      </div>
                    )}
                    {selectedItem.campaign_due_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Kit Due Date:</span>
                        <span style={{ fontWeight: '600', color: '#b45309' }}>{new Date(selectedItem.campaign_due_date).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Details Box */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0284c7', fontWeight: '800', fontSize: '0.85rem' }}>
                    <User size={16} /> MEMBER DETAILS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Member Name:</span>
                      <span style={{ fontWeight: '800', color: '#0f172a' }}>{selectedItem.member_name || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Member Code:</span>
                      <span style={{ fontWeight: '700', color: '#0369a1' }}>{selectedItem.member_code || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Phone Number:</span>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.member_phone || selectedItem.phone || '—'}</span>
                    </div>
                    {selectedItem.member_aadhaar && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Aadhaar Number:</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.member_aadhaar}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Information Box */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#7c3aed', fontWeight: '800', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} /> COLLECTING AGENT
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Agent Name:</span>
                      <span style={{ fontWeight: '800', color: '#0f172a' }}>{selectedItem.agent_name || 'Direct Payment by Member'}</span>
                    </div>
                    {selectedItem.agent_code && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Agent Code:</span>
                        <span style={{ fontWeight: '700', color: '#7c3aed' }}>{selectedItem.agent_code}</span>
                      </div>
                    )}
                    {selectedItem.agent_phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Agent Phone:</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.agent_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction & Proof Verification */}
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#059669', fontWeight: '800', fontSize: '0.85rem' }}>
                    <FileText size={16} /> TRANSACTION DETAILS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>UTR / Txn ID:</span>
                      {selectedItem.transaction_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', color: '#0f172a' }}>
                            {selectedItem.transaction_id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(selectedItem.transaction_id, 'modal-utr')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                            title="Copy UTR"
                          >
                            {copiedId === 'modal-utr' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Remarks / Notes:</span>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{selectedItem.notes || '—'}</span>
                    </div>
                    {selectedItem.paid_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Approved Date:</span>
                        <span style={{ fontWeight: '700', color: '#16a34a' }}>{formatDate(selectedItem.paid_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Proof Preview in Modal */}
              {selectedItem.payment_proof && (
                <div style={{ marginTop: '10px', background: '#f8fafc', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Payment Proof Screenshot</span>
                    <button
                      onClick={() => { setZoomImage(getProofUrl(selectedItem.payment_proof)); setZoomTitle(`Proof - ${selectedItem.member_name}`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <ZoomIn size={14} /> View Fullscreen
                    </button>
                  </div>
                  <div 
                    onClick={() => { setZoomImage(getProofUrl(selectedItem.payment_proof)); setZoomTitle(`Proof - ${selectedItem.member_name}`); }}
                    style={{ textAlign: 'center', background: '#000', borderRadius: '12px', padding: '10px', cursor: 'pointer', maxHeight: '360px', overflow: 'hidden' }}
                  >
                    <img
                      src={getProofUrl(selectedItem.payment_proof)}
                      alt="Proof"
                      style={{ maxHeight: '340px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fafcff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
              >
                Close View
              </button>

              {(selectedItem.status === 0 || selectedItem.is_submission_pending) && selectedItem.status !== 1 && selectedItem.status !== 2 ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => initiateReject(selectedItem.id)}
                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '10px 18px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={16} /> Reject Payment
                  </button>
                  <button
                    onClick={() => handleApprove(selectedItem.id)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                  >
                    <CheckCircle size={16} /> Approve & Settle Kit
                  </button>
                </div>
              ) : selectedItem.status === 1 ? (
                <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '0.85rem' }}>✓ This kit payment has already been approved.</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>✕ This payment request was rejected.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Reject Payment Request</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Please provide a reason for rejecting this payment request.
            </p>

            <form onSubmit={confirmReject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid UTR / amount screenshot mismatch"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: rejecting ? 'not-allowed' : 'pointer' }}
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: '-40px', right: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '700' }}>{zoomTitle}</span>
              <button 
                onClick={() => setZoomImage(null)}
                style={{ background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <img 
              src={zoomImage} 
              alt="Zoomed Proof" 
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', objectFit: 'contain' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
