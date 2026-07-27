'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Heart, Search, Calendar, RefreshCw, Upload, Download, CheckCircle } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const statusStyle = {
  1: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  2: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
  // Fallbacks
  Upcoming: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  Married: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  Deleted: { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function MarriagesListPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal States
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [settleItem, setSettleItem] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settlePhoto, setSettlePhoto] = useState(null);
  const [settlePhotoPreview, setSettlePhotoPreview] = useState('');
  const [settling, setSettling] = useState(false);

  // Fetch insurance plans for dropdown filter
  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/api/insurance/get-all?limit=100');
      if (res.s === 1 && Array.isArray(res.r)) {
        setPlans(res.r);
      }
    } catch (err) {
      console.error('Error fetching plans for filter:', err);
    }
  };

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await apiRequest('/api/marriage/dashboard');
      if (res.s === 1 && res.r) {
        setDashboardData(res.r);
      } else {
        setDashboardData({
          summary: { total_cases: 0, upcoming_cases: 0, settled_cases: 0, total_amount_given: 0, this_month_cases: 0, pending_settlement_amount: 0 },
          plan_wise: [],
          agent_wise: [],
          recent_marriages: []
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setDashboardData({
        summary: { total_cases: 0, upcoming_cases: 0, settled_cases: 0, total_amount_given: 0, this_month_cases: 0, pending_settlement_amount: 0 },
        plan_wise: [],
        agent_wise: [],
        recent_marriages: []
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch marriages from backend API
  const fetchMarriages = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/marriage/get-all?page=${page}&limit=10`;
      
      if (search.trim()) {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (selectedPlan) {
        endpoint += `&plan_id=${selectedPlan}`;
      }
      if (dateFilter) {
        endpoint += `&date=${dateFilter}`;
      }
      if (statusFilter !== 'All') {
        const sVal = statusFilter === 'Upcoming' ? 1 : statusFilter === 'Settled' ? 2 : statusFilter === 'Deleted' ? -1 : '';
        if (sVal !== '') endpoint += `&status=${sVal}`;
      }

      const res = await apiRequest(endpoint);
      if (res.s === 1 && Array.isArray(res.r)) {
        setList(res.r);
        setMeta(res.meta || {
          total: res.r.length,
          skip: (page - 1) * 10,
          limit: 10,
          hasPrev: page > 1,
          hasNext: res.r.length === 10
        });
      } else {
        setList([]);
        setMeta(null);
      }
    } catch (err) {
      console.error('Error fetching marriages list:', err);
      setList([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchMarriages();
  }, [page, search, statusFilter, selectedPlan, dateFilter]);

  // Actions
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePlanChange = (e) => {
    setSelectedPlan(e.target.value);
    setPage(1);
  };

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const openSettleModal = (item) => {
    setSettleItem(item);
    setSettleAmount(item.amount_given || item.amount || '25000');
    setSettleNotes('');
    setSettlePhoto(null);
    setSettlePhotoPreview('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettlePhoto(file);
      setSettlePhotoPreview(URL.createObjectURL(file));
    }
  };

  // Settlement Confirm
  const handleConfirmSettlement = async (e) => {
    e.preventDefault();
    if (!settleAmount) {
      showToast('Amount Given is required.', 'error');
      return;
    }

    setSettling(true);
    const formData = new FormData();
    formData.append('id', settleItem.id);
    formData.append('amount_given', settleAmount);
    if (settleNotes) {
      formData.append('notes', settleNotes);
    }
    if (settlePhoto) {
      formData.append('photo', settlePhoto);
    }

    try {
      const res = await apiRequest('/api/marriage/mark-as-married', {
        method: 'POST',
        body: formData
      });

      if (res.s === 1) {
        showToast(res.m || 'Member marked as married successfully', 'success');
        setSettleItem(null);
        fetchMarriages();
      } else {
        showToast(res.m || 'Failed to settle marriage.', 'error');
      }
    } catch (err) {
      console.error('Error settling marriage:', err);
      showToast('An error occurred while settling the marriage.', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      let res;
      try {
        res = await apiRequest('/api/marriage/delete', {
          method: 'POST',
          body: JSON.stringify({ id: deleteId })
        });
      } catch (err) {
        console.warn('Delete endpoint failed, trying status endpoint fallback...');
        const formData = new FormData();
        formData.append('id', deleteId);
        formData.append('status', -1); // Status -1 is Deleted
        res = await apiRequest('/api/marriage/status', {
          method: 'POST',
          body: formData
        });
      }

      if (res.s === 1) {
        showToast('Marriage record deleted successfully', 'success');
        setDeleteId(null);
        fetchMarriages();
      } else {
        showToast(res.m || 'Failed to delete marriage record', 'error');
      }
    } catch (err) {
      console.error('Error deleting marriage:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Helper getters for robust field reading matching specifications
  const getMemberName = (item) => {
    if (!item) return '-';
    return [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ") || '-';
  };

  const getMemberCode = (item) => {
    if (!item) return '';
    return item.member_code || '';
  };

  const getPlanName = (item) => {
    if (!item) return '-';
    return item.plan_name || '-';
  };

  const getAgentName = (item) => {
    if (!item) return '-';
    return [item.agent_first_name, item.agent_last_name].filter(Boolean).join(" ") || '-';
  };

  const formatMarriageDate = (dateStr) => {
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

  const getInvitationCardUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return BASE_API_URL + path;
    return BASE_API_URL + '/' + path;
  };

  // Client side filtered list to refresh result immediately after data loads
  const filteredList = list.filter(item => {
    // Status Filter Fix
    const statusVal = Number(item.status);
    if (statusFilter === 'All') {
      if (statusVal === -1) return false;
    } else if (statusFilter === 'Upcoming') {
      if (statusVal !== 1) return false;
    } else if (statusFilter === 'Settled') {
      if (statusVal !== 2) return false;
    } else if (statusFilter === 'Deleted') {
      if (statusVal !== -1) return false;
    }

    // Plan Filter Fix
    if (selectedPlan && String(item.plan_id) !== String(selectedPlan)) {
      return false;
    }

    // Date Filter Fix
    if (dateFilter) {
      const rawDate = item.marriage_date || item.date;
      if (!rawDate || !rawDate.includes(dateFilter)) return false;
    }

    // Search Filter Fix (Member Name, Code, Phone, Email, Plan Name, Agent Name)
    if (search.trim()) {
      const q = search.toLowerCase();
      const mName = getMemberName(item).toLowerCase();
      const mCode = getMemberCode(item).toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const pName = getPlanName(item).toLowerCase();
      const aName = getAgentName(item).toLowerCase();

      return mName.includes(q) || mCode.includes(q) || phone.includes(q) || email.includes(q) || pName.includes(q) || aName.includes(q);
    }

    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Marriage Assistance Module</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Program dashboard & application processing</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/marriages/form')}>
          <Plus size={15} strokeWidth={2.5} /> New Marriage Case
        </button>
      </div>

      {/* Dashboard Analytics */}
      {!loadingDashboard && dashboardData && (
        <div style={{ marginBottom: '24px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cases</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{dashboardData.summary.total_cases}</span>
            </div>
            
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #0ea5e9' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData.summary.upcoming_cases}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1d4ed8', background: '#dbeafe', padding: '2px 8px', borderRadius: '12px' }}>PENDING</span>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settled</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData.summary.settled_cases}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>PAID</span>
              </div>
            </div>
            
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #8b5cf6' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid Amount</span>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                ₹{Number(dashboardData.summary.total_amount_given).toLocaleString('en-IN')}
              </span>
            </div>
            
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{dashboardData.summary.this_month_cases}</span>
            </div>
          </div>
          
          {/* Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Plan-wise Statistics
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Plan</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Total</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Settled</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.plan_wise.map(p => (
                      <tr key={p.plan_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{p.plan_name}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#475569' }}>{p.total_cases}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#475569' }}>{p.settled_cases}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>₹{Number(p.total_amount_given).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {dashboardData.plan_wise.length === 0 && <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No plan data found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Agent-wise Statistics (Top 10)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Agent</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Total</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Settled</th>
                      <th style={{ padding: '10px', fontSize: '0.75rem', color: '#64748b' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.agent_wise.map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{a.agent_name || 'Direct / None'}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#475569' }}>{a.total_cases}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#475569' }}>{a.settled_cases}</td>
                        <td style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>₹{Number(a.total_amount_given).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {dashboardData.agent_wise.length === 0 && <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No agent data found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="card" style={{ padding: '0', overflow: 'visible', marginBottom: '24px' }}>
        {/* Filters Panel */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by member name, code, plan, phone..."
                style={{ padding: '7px 12px 7px 34px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '100%', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Upcoming', 'Settled', 'Deleted'].map(t => (
                <button
                  key={t}
                  onClick={() => handleStatusChange(t)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    border: statusFilter === t ? 'none' : '1px solid #e8edf2',
                    background: statusFilter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff',
                    color: statusFilter === t ? 'white' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Plan Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Plan:</span>
              <select
                value={selectedPlan}
                onChange={handlePlanChange}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Marriage Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                style={{ padding: '5px 10px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Loading / Table Panel */}
        {loading ? (
          <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Loading marriage records...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['MEMBER', 'PLAN', 'AGENT', 'MARRIAGE DATE', 'INVITATION CARD', 'AMOUNT GIVEN', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const mName = getMemberName(item);
                  const mCode = getMemberCode(item);
                  const plan = getPlanName(item);
                  const agentName = getAgentName(item);
                  const mDate = formatMarriageDate(item.marriage_date || item.date);
                  const statusInfo = statusStyle[item.status] || { bg: '#f1f5f9', color: '#475569', label: item.status || 'Pending' };
                  const cardUrl = getInvitationCardUrl(item.invitation_card);
                  const amount = item.amount_given ? "₹" + Number(item.amount_given).toLocaleString() : "-";

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Member column (Name + Code) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{mName}</div>
                        {mCode && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{mCode}</div>
                        )}
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        {plan}
                      </td>

                      {/* Agent */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        {agentName}
                      </td>

                      {/* Marriage Date */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        {mDate}
                      </td>

                      {/* Invitation Card */}
                      <td style={{ padding: '12px 16px', fontSize: '0.78rem' }}>
                        {cardUrl ? (
                          <a href={cardUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Download size={12} /> View Card
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>

                      {/* Amount Given */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>
                        {amount}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: statusInfo.bg, color: statusInfo.color, display: 'inline-block' }}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            title="View Case"
                            onClick={() => router.push(`/marriages/${item.id}`)}
                            style={{ color: '#0ea5e9', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Eye size={15} />
                          </button>

                          {Number(item.status) !== -1 && (
                            <>
                              <button
                                title="Edit Details"
                                onClick={() => router.push(`/marriages/form?id=${item.id}`)}
                                style={{ color: '#64748b', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <Pencil size={15} />
                              </button>

                              {(Number(item.status) === 1) && (
                                <button
                                  title="Settle Marriage"
                                  onClick={() => openSettleModal(item)}
                                  style={{
                                    padding: '5px',
                                    borderRadius: '6px',
                                    background: 'none',
                                    color: '#16a34a',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}

                              <button
                                title="Delete Case"
                                onClick={() => setDeleteId(item.id)}
                                style={{ color: '#ef4444', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '0.875rem' }}>
            No marriage records found.
          </div>
        )}

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.total}</span> records
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={!meta.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: '1px solid #e8edf2',
                  background: meta.hasPrev ? '#fff' : '#f8fafc',
                  color: meta.hasPrev ? '#475569' : '#94a3b8',
                  cursor: meta.hasPrev ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>
                {page}
              </span>
              <button
                disabled={!meta.hasNext}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: '1px solid #e8edf2',
                  background: meta.hasNext ? '#fff' : '#f8fafc',
                  color: meta.hasNext ? '#475569' : '#94a3b8',
                  cursor: meta.hasNext ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Modal (Mark As Married) */}
      {settleItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setSettleItem(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              💍 Confirm Marriage Settlement
            </h2>
            
            <form onSubmit={handleConfirmSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Info summary */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
                <div><strong>Member:</strong> {getMemberName(settleItem)} ({getMemberCode(settleItem)})</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> {getPlanName(settleItem)}</div>
              </div>

              {/* Amount Given */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Amount Given (₹) *</label>
                <input
                  type="number"
                  required
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%' }}
                  placeholder="25000"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Marriage Photo</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {settlePhotoPreview ? (
                      <img src={settlePhotoPreview} alt="Marriage preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <Upload size={18} style={{ margin: '0 auto 2px' }} />
                        <span style={{ fontSize: '0.6rem' }}>No photo</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" id="settle-photo-upload" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    <label htmlFor="settle-photo-upload" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block', border: '1.5px solid #e8edf2', borderRadius: '8px' }}>
                      Choose Photo
                    </label>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>PNG, JPG or JPEG format</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Settlement Notes</label>
                <textarea
                  value={settleNotes}
                  onChange={e => setSettleNotes(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Enter details about amount handover, witnesses or venue..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSettleItem(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={settling} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.82rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {settling ? (
                    <>
                      <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Marking...</span>
                    </>
                  ) : (
                    <span>Confirm Settlement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setDeleteId(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Delete Marriage Record</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', lineHeight: '1.4' }}>
              <p style={{ marginBottom: '8px', textAlign: 'center' }}>Are you sure you want to delete this marriage record?</p>
              <p style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>This action will:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Soft delete marriage record</li>
                <li>Preserve payment history</li>
                <li>Preserve member history</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                {deleting ? 'Deleting...' : 'Delete Marriage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
