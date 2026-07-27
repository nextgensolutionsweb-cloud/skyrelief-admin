'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, CheckCircle, Clock, Search, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { apiRequest, showToast, formatCurrency } from '@/lib/api';
import * as XLSX from 'xlsx';

const campaignStatusStyle = {
  0: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  1: { bg: '#eff6ff', color: '#1d4ed8', label: 'Completed' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const dueStatusStyle = {
  0: { bg: '#ffedd5', color: '#ea580c', label: 'Pending' },
  1: { bg: '#dcfce7', color: '#16a34a', label: 'Paid' },
};

export default function CampaignDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id: campaignId } = params;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [marriedMembers, setMarriedMembers] = useState([]);
  const [duesList, setDuesList] = useState([]);

  // Dues tabs & filter
  const [duesTab, setDuesTab] = useState('All');
  const [duesSearch, setDuesSearch] = useState('');

  // Mark Paid State
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [markPaidNotes, setMarkPaidNotes] = useState('');
  const [submittingPaid, setSubmittingPaid] = useState(false);

  const openMarkPaidModal = (due) => {
    setSelectedDue(due);
    setMarkPaidAmount(due.amount || '');
    setMarkPaidNotes('');
    setShowMarkPaidModal(true);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    if (!selectedDue || !markPaidAmount) return;
    
    setSubmittingPaid(true);
    try {
      const payload = {
        due_id: selectedDue.due_id || selectedDue.id,
        amount: Number(markPaidAmount),
        notes: markPaidNotes
      };
      
      const res = await apiRequest('/api/payment/mark-cash-paid', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.s === 1) {
        showToast('Payment marked as paid', 'success');
        setShowMarkPaidModal(false);
        loadData(); // refresh
      } else {
        showToast(res.m || 'Failed to mark payment', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error marking payment as paid', 'error');
    } finally {
      setSubmittingPaid(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/payment/get?id=${campaignId}`);
      if (res.s === 1 && res.r) {
        // Handle varying backend shapes safely
        const payload = Array.isArray(res.r) ? res.r[0] : res.r;
        if (payload) {
          setSummary(payload.summary || payload);
          const selectedMarriedMembers = payload?.selected_married_members || payload?.married_members || payload?.selectedMarriedMembers || [];
          setMarriedMembers(selectedMarriedMembers);
          setDuesList(payload.dues_list || payload.dues || []);
        } else {
          showToast('Campaign not found', 'error');
        }
      } else {
        showToast(res.m || 'Failed to load campaign details', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading campaign details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return "-";
    }
  };

  const filteredDues = duesList.filter(due => {
    // Tab Filter
    if (duesTab === 'Pending' && Number(due.status) !== 0) return false;
    if (duesTab === 'Paid' && Number(due.status) !== 1) return false;
    
    // Search Filter
    if (duesSearch.trim()) {
      const q = duesSearch.toLowerCase();
      const code = (due.member_code || '').toLowerCase();
      const name = (due.member_name || due.full_name || '').toLowerCase();
      const phone = (due.phone || '').toLowerCase();
      const agent = (due.agent_name || '').toLowerCase();
      return code.includes(q) || name.includes(q) || phone.includes(q) || agent.includes(q);
    }
    return true;
  });

  // Export functions
  const prepareExportData = () => {
    return filteredDues.map(due => ({
      "Member Code": due.member_code || '-',
      "Member Name": due.member_name || due.full_name || '-',
      "Mobile": due.phone || '-',
      "Agent Name": due.agent_name || '-',
      "Amount": due.amount || 0,
      "Status": due.status === 1 ? 'Paid' : 'Pending',
      "Paid Date": due.status === 1 ? formatDate(due.paid_at) : '-'
    }));
  };

  const handleExportCSV = () => {
    const data = prepareExportData();
    if (data.length === 0) return showToast("No data to export", "error");

    const header = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = [header, ...rows].join('n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Campaign_Dues_${summary?.campaign_no}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const data = prepareExportData();
    if (data.length === 0) return showToast("No data to export", "error");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment Dues");
    XLSX.writeFile(wb, `Campaign_Dues_${summary?.campaign_no}.xlsx`);
  };

  const handleDownloadMemberSlip = async (dueId) => {
    try {
      const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey');
      const token = localStorage.getItem('sky_token') || localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
      
      showToast('Opening slip...', 'success');
      
      const url = `${baseUrl}/api/payment/member-payment-slip/${dueId}?apikey=${apikey}&token=${token}`;
      const printWindow = window.open(url, "_blank");
      
      if (!printWindow) {
        showToast('Please allow popups to view the slip', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to open slip', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading campaign details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px solid #bee3f8', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Campaign Not Found</h2>
        <button onClick={() => router.push('/payments')} className="btn-secondary">
          <ArrowLeft size={16} /> <span>Back to Campaigns</span>
        </button>
      </div>
    );
  }

  const sStatus = campaignStatusStyle[summary.status] || { bg: '#f1f5f9', color: '#475569', label: summary.status || 'Unknown' };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* CSS for print mode */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .premium-card { border: 1px solid #ccc !important; box-shadow: none !important; page-break-inside: avoid; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/payments')} className="btn-secondary no-print" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>{summary.campaign_no || 'Campaign Details'}</h1>
              <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: sStatus.bg, color: sStatus.color }}>
                {sStatus.label}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Plan: {summary.plan_name || '-'}</p>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleExportExcel} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} /> Print Campaign
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Campaign Summary Widget Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          
          <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={14} color="#0ea5e9" /> Financial Overview
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Per Marriage Amount</span>
                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '700' }}>
                  {summary.per_marriage_amount ? formatCurrency(summary.per_marriage_amount) : (summary.age_amount_rules ? 'Age-wise' : '-')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Member Payable Amount</span>
                <span style={{ fontSize: '1rem', color: '#1d4ed8', fontWeight: '800' }}>
                  {summary.member_payable_amount ? formatCurrency(summary.member_payable_amount) : (summary.age_amount_rules ? 'Age-wise' : '-')}
                </span>
              </div>
              <div style={{ height: '1px', background: '#e2e8f0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Total Collectable</span>
                <span style={{ fontSize: '1.2rem', color: '#15803d', fontWeight: '900' }}>
                  {summary.total_collectable_amount !== undefined && summary.total_collectable_amount !== null ? formatCurrency(summary.total_collectable_amount) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} color="#15803d" /> Collections Progress
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: '600' }}>Collected</span>
                <span style={{ fontSize: '1.1rem', color: '#16a34a', fontWeight: '800' }}>
                  {formatCurrency(summary.total_paid_amount ?? summary.paid_amount ?? 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#9a3412', fontWeight: '600' }}>Pending</span>
                <span style={{ fontSize: '1.1rem', color: '#ea580c', fontWeight: '800' }}>
                  {formatCurrency(summary.total_pending_amount ?? summary.pending_amount ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#8b5cf6" /> Campaign Meta
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Total Members</span>
                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '700' }}>{summary.total_members || summary.total_active_members || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Paid Members</span>
                <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: '700' }}>{summary.paid_members || summary.paid_count || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Pending Members</span>
                <span style={{ fontSize: '0.9rem', color: '#ea580c', fontWeight: '700' }}>{summary.pending_members || summary.pending_count || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Period</span>
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>
                  {formatDate(summary.start_date)} to {formatDate(summary.end_date)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Due Date</span>
                <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '700' }}>{formatDate(summary.due_date)}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Selected Married Members Table */}
        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafcff' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Selected Married Members</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Members whose marriages triggered this collection.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Member Code</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Member Name</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Plan Name</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Marriage Date</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Amount Given</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Invitation Card</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Photo Proof</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {marriedMembers.map((m, i) => {
                  const mName = m.member_name || m.full_name || '-';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>{m.member_code || '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {m.profile ? (
                          <img src={m.profile.startsWith('http') ? m.profile : ((process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org') + (m.profile.startsWith('/') ? '' : '/') + m.profile)} alt="profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '700', color: '#64748b' }}>
                            {mName !== '-' ? mName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'U'}
                          </div>
                        )}
                        {mName}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>{m.phone || '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>{m.plan_name || '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>{m.marriage_date ? formatDate(m.marriage_date) : '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', fontWeight: '600', color: '#15803d' }}>{m.amount_given ? formatCurrency(m.amount_given) : '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#3b82f6' }}>
                        {m.invitation_card ? <a href={m.invitation_card.startsWith('http') ? m.invitation_card : ((process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org') + (m.invitation_card.startsWith('/') ? '' : '/') + m.invitation_card)} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View Card</a> : '-'}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#3b82f6' }}>
                        {m.photo_url ? <a href={m.photo_url.startsWith('http') ? m.photo_url : ((process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org') + (m.photo_url.startsWith('/') ? '' : '/') + m.photo_url)} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View Photo</a> : '-'}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem' }}>
                        {m.marriage_status === 1 ? <span style={{ color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700' }}>Upcoming</span> : 
                         m.marriage_status === 2 ? <span style={{ color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700' }}>Settled</span> : '-'}
                      </td>
                    </tr>
                  );
                })}
                {marriedMembers.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No married members recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Dues Table */}
        <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafcff' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Member Payment List</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Track collection statuses from all active members.</p>
          </div>
          
          <div className="no-print" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Pending', 'Paid'].map(t => (
                <button
                  key={t}
                  onClick={() => setDuesTab(t)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    border: duesTab === t ? 'none' : '1px solid #e8edf2',
                    background: duesTab === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff',
                    color: duesTab === t ? 'white' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                value={duesSearch}
                onChange={e => setDuesSearch(e.target.value)}
                placeholder="Search by name, code, phone, agent..."
                style={{ padding: '7px 12px 7px 34px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '100%', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Member Code</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Member Name</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Mobile</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Agent Name</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Paid Date</th>
                  <th className="no-print" style={{ padding: '12px 20px', textAlign: 'right', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((due, i) => {
                  const dStatus = dueStatusStyle[due.status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#64748b' }}>
                        {due.member_code || '-'}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
                        {due.member_name || due.full_name || '-'}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>{due.phone || '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>{due.agent_name || '-'}</td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>{formatCurrency(due.amount || 0)}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: dStatus.bg, color: dStatus.color }}>
                          {dStatus.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: '0.82rem', color: '#334155' }}>
                        {due.status === 1 ? formatDate(due.paid_at) : '-'}
                      </td>
                      <td className="no-print" style={{ padding: '12px 20px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => handleDownloadMemberSlip(due.due_id || due.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }}
                          title="Download Slip"
                        >
                          <Download size={12} /> Slip
                        </button>
                        {due.status === 0 ? (
                          <button
                            onClick={() => openMarkPaidModal(due)}
                            className="btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>Paid</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredDues.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No dues found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mark Cash Paid Modal */}
      {showMarkPaidModal && selectedDue && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden', animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>Mark Cash Paid</h2>
            </div>
            
            <form onSubmit={handleMarkPaid} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', color: '#334155' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Member: {selectedDue.member_name || selectedDue.full_name}</div>
                <div style={{ color: '#64748b' }}>Code: {selectedDue.member_code}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Amount Received (₹) *</label>
                <input 
                  type="number" 
                  required
                  value={markPaidAmount}
                  onChange={e => setMarkPaidAmount(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Notes</label>
                <textarea 
                  value={markPaidNotes}
                  onChange={e => setMarkPaidNotes(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Optional notes about the payment..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowMarkPaidModal(false)}
                  className="btn-secondary" 
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
                  disabled={submittingPaid}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
                  disabled={submittingPaid}
                >
                  {submittingPaid ? 'Saving...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
