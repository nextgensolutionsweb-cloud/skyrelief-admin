'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Trash2, Search, Wallet, Ban, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiRequest, showToast, formatCurrency } from '@/lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const campaignStatusStyle = {
  0: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },     // Pending (Orange)
  1: { bg: '#eff6ff', color: '#1d4ed8', label: 'Completed' },   // Completed (Blue)
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' }, // Cancelled (Red)
};

export default function PaymentCampaignsListPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dashboard Data State
  const [dash, setDash] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal States
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Agent Collection Dashboard State
  const [agentDash, setAgentDash] = useState(null);
  const [loadingAgentDash, setLoadingAgentDash] = useState(true);
  const [agentSearch, setAgentSearch] = useState('');
  const [agentPlan, setAgentPlan] = useState('');
  
  // Details Modal State
  const [selectedAgentDetails, setSelectedAgentDetails] = useState(null);
  const [loadingAgentDetails, setLoadingAgentDetails] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);

  // Fetch Dashboard
  const fetchDashboard = async () => {
    try {
      const res = await apiRequest('/api/payment/dashboard/admin');
      if (res.s === 1 && res.r) {
        setDash(res.r);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoadingDash(false);
    }
  };

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

  // Fetch campaigns from backend API
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/payment/get-all?page=${page}&limit=10`;
      
      if (search.trim()) {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (selectedPlan) {
        endpoint += `&plan_id=${selectedPlan}`;
      }
      if (statusFilter !== 'All') {
        const sVal = statusFilter === 'Pending' ? 0 : statusFilter === 'Completed' ? 1 : statusFilter === 'Cancelled' ? -1 : '';
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
      console.error('Error fetching campaigns list:', err);
      setList([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentDashboard = async (showLoading = true) => {
    if (showLoading) setLoadingAgentDash(true);
    try {
      let endpoint = `/api/payment/agent-collection-summary?limit=50`;
      if (agentSearch.trim()) endpoint += `&search=${encodeURIComponent(agentSearch.trim())}`;
      if (agentPlan) endpoint += `&plan_id=${agentPlan}`;
      
      const res = await apiRequest(endpoint);
      if (res.s === 1 && res.r) {
        setAgentDash(res.r);
      }
    } catch (err) {
      console.error('Error fetching agent collection:', err);
    } finally {
      if (showLoading) setLoadingAgentDash(false);
    }
  };

  const fetchAgentDetails = async (agentId) => {
    setLoadingAgentDetails(true);
    setAgentModalOpen(true);
    try {
      // Use null check or empty string for unassigned agents
      const param = agentId || '';
      const res = await apiRequest(`/api/payment/agent-collection-summary?agent_id=${param}`);
      if (res.s === 1 && res.r) {
        setSelectedAgentDetails(res.r);
      }
    } catch (err) {
      console.error('Error fetching agent details:', err);
      showToast('Error loading agent details', 'error');
    } finally {
      setLoadingAgentDetails(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchPlans();
    fetchAgentDashboard(true);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [page, search, statusFilter, selectedPlan]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Do not show full loading spinner to prevent input from losing focus
      fetchAgentDashboard(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [agentSearch, agentPlan]);

  // Actions
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePlanChange = (e) => {
    setSelectedPlan(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  // Cancel Confirm
  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      const res = await apiRequest('/api/payment/cancel', {
        method: 'POST',
        body: JSON.stringify({ campaign_id: cancelId })
      });

      if (res.s === 1) {
        showToast('Campaign cancelled successfully', 'success');
        setCancelId(null);
        fetchCampaigns();
        fetchDashboard();
      } else {
        showToast(res.m || 'Failed to cancel campaign', 'error');
      }
    } catch (err) {
      console.error('Error cancelling campaign:', err);
      showToast('Error occurred while cancelling the campaign.', 'error');
    } finally {
      setCancelling(false);
    }
  };

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

  // Chart Data Preparation
  const overviewData = dash ? [
    { name: 'Paid', value: dash.total_paid_amount || 0, fill: '#16a34a' },     // Green
    { name: 'Pending', value: dash.total_pending_amount || 0, fill: '#f59e0b' } // Orange
  ] : [];

  const planWiseData = (dash?.plan_wise_collection || []).map(p => ({
    name: p.plan_name,
    Collected: p.collected_amount
  }));

  const campaignWiseData = (dash?.recent_campaigns || []).map(c => ({
    name: c.campaign_no,
    Collectable: c.total_collectable_amount
  }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Payment Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Monitor collections and manage campaigns</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/payments/create')}>
          <Plus size={15} strokeWidth={2.5} /> Create Campaign
        </button>
      </div>

      {/* DASHBOARD SECTION */}
      {loadingDash ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
           <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : dash ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            <div className="premium-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Campaigns</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>{dash.total_campaigns}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Campaigns</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#b45309', marginTop: '8px' }}>{dash.active_campaigns}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Completed Campaigns</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1d4ed8', marginTop: '8px' }}>{dash.completed_campaigns}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Total Collectable Amount</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#15803d', marginTop: '8px' }}>{formatCurrency(dash.total_collectable_amount)}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Paid Amount</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '8px' }}>{formatCurrency(dash.total_paid_amount)}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Pending Amount</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ea580c', marginTop: '8px' }}>{formatCurrency(dash.total_pending_amount)}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Paid Members</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '8px' }}>{dash.total_paid_count}</div>
            </div>

            <div className="premium-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Pending Members</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ea580c', marginTop: '8px' }}>{dash.total_pending_count}</div>
            </div>
            
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            {/* Overview Pie Chart */}
            <div className="premium-card" style={{ padding: '20px', minHeight: '300px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Collection Overview</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={overviewData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {overviewData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Wise Bar Chart */}
            <div className="premium-card" style={{ padding: '20px', minHeight: '300px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Plan Wise Collection</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={planWiseData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign Wise Bar Chart */}
            <div className="premium-card" style={{ padding: '20px', minHeight: '300px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Recent Campaign Targets</h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={campaignWiseData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Collectable" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      ) : null}

      {/* AGENT COLLECTION PERFORMANCE SECTION */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.02em', marginTop: '16px' }}>Agent Collection Performance</h2>
      
      {loadingAgentDash ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
           <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : agentDash ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="premium-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Collection</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#6d28d9', marginTop: '8px' }}>{formatCurrency(agentDash.summary?.total_collectable_amount || 0)}</div>
            </div>
            <div className="premium-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Collected</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#047857', marginTop: '8px' }}>{formatCurrency(agentDash.summary?.total_collected_amount || 0)}</div>
            </div>
            <div className="premium-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Pending</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b45309', marginTop: '8px' }}>{formatCurrency(agentDash.summary?.total_pending_amount || 0)}</div>
            </div>
            <div className="premium-card" style={{ padding: '20px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>Total Commission Payable</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1d4ed8', marginTop: '8px' }}>{formatCurrency(agentDash.summary?.total_commission_payable || 0)}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'visible', marginBottom: '32px' }}>
            <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  placeholder="Search agent name, phone..."
                  style={{ padding: '7px 12px 7px 34px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '100%', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Plan:</span>
                <select
                  value={agentPlan}
                  onChange={(e) => setAgentPlan(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
                >
                  <option value="">All Plans</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Agent Info</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Members / Dues</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Collection Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Commission Payable</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(agentDash.agents || []).map(a => (
                    <tr key={a.agent_id || 'unassigned'} style={{ borderBottom: '1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.background = '#fafcff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{a.agent_name || 'Unassigned Agent'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{a.agent_code || '-'} {a.phone ? `| ${a.phone}` : ''}</div>
                        <div style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: '600', marginTop: '4px' }}>Commission: {Number(a.commission_percentage || 0)}%</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        <div>Total Members: <span style={{ fontWeight: '600' }}>{a.total_members}</span></div>
                        <div style={{ marginTop: '2px' }}>Total Dues: <span style={{ fontWeight: '600' }}>{a.total_dues}</span></div>
                        <div style={{ marginTop: '2px', color: '#16a34a', fontWeight: '500' }}>Paid: {a.paid_dues}</div>
                        <div style={{ marginTop: '2px', color: '#ea580c', fontWeight: '500' }}>Pending: {a.pending_dues}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        <div>Target: <span style={{ fontWeight: '600' }}>{formatCurrency(a.total_collectable_amount)}</span></div>
                        <div style={{ marginTop: '2px', color: '#16a34a', fontWeight: '600' }}>Collected: {formatCurrency(a.collected_amount)}</div>
                        <div style={{ marginTop: '2px', color: '#ea580c', fontWeight: '600' }}>Pending: {formatCurrency(a.pending_amount)}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: a.commission_amount > 0 ? '#1d4ed8' : '#94a3b8' }}>
                          {formatCurrency(a.commission_amount)}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: '600', color: a.commission_amount > 0 ? '#3b82f6' : '#64748b', padding: '2px 8px', background: a.commission_amount > 0 ? '#eff6ff' : '#f1f5f9', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                          {a.commission_status}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => fetchAgentDetails(a.agent_id)}
                          style={{ color: '#0ea5e9', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e0f2fe', background: '#f0f9ff', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!agentDash.agents || agentDash.agents.length === 0) && (
                    <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No agent collection data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* CAMPAIGNS LIST SECTION */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.02em' }}>Campaign List</h2>
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
                placeholder="Search campaigns..."
                style={{ padding: '7px 12px 7px 34px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '100%', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Completed', 'Cancelled'].map(t => (
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
          </div>
        </div>

        {/* Loading / Table Panel */}
        {loading ? (
          <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b' }}>Loading campaigns...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['CAMPAIGN', 'COLLECTION INFO', 'PROGRESS', 'PERIOD', 'DUE DATE', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((item) => {
                  const statusInfo = campaignStatusStyle[item.status] || { bg: '#f1f5f9', color: '#475569', label: item.status || 'Unknown' };

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Campaign column */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{item.campaign_no || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{item.plan_name || '-'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{item.married_count || 0} Marriages @ {item.per_marriage_amount ? formatCurrency(item.per_marriage_amount) : (item.age_amount_rules ? 'Age-wise' : '-')}</div>
                      </td>

                      {/* Collection Info */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        <div>Total Members: <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.total_active_members || 0}</span></div>
                        <div style={{ marginTop: '2px' }}>New Dues: <span style={{ fontWeight: '600', color: '#0ea5e9' }}>{(Number(item.paid_count) || 0) + (Number(item.pending_count) || 0)}</span></div>
                        <div style={{ marginTop: '2px' }}>Goal: <span style={{ fontWeight: '600', color: '#15803d' }}>{item.total_collectable_amount !== undefined && item.total_collectable_amount !== null ? formatCurrency(item.total_collectable_amount) : '-'}</span></div>
                        <div style={{ marginTop: '2px' }}>Per Member: <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.member_payable_amount ? formatCurrency(item.member_payable_amount) : (item.age_amount_rules ? 'Age-wise' : '-')}</span></div>
                      </td>

                      {/* Progress */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        <div style={{ color: '#16a34a', fontWeight: '600' }}>Paid: {formatCurrency(item.paid_amount || 0)} ({item.paid_count || 0})</div>
                        <div style={{ color: '#ea580c', fontWeight: '600', marginTop: '2px' }}>Pending: {formatCurrency(item.pending_amount || 0)} ({item.pending_count || 0})</div>
                      </td>

                      {/* Period */}
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#334155' }}>
                        {formatDate(item.start_date)}<br/>
                        <span style={{color: '#94a3b8', fontSize: '0.7rem'}}>to</span><br/>
                        {formatDate(item.end_date)}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>
                        {formatDate(item.due_date)}
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
                            title="View Campaign"
                            onClick={() => router.push(`/payments/${item.id}`)}
                            style={{ color: '#0ea5e9', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Eye size={15} />
                          </button>

                          {(Number(item.status) === 0) && (
                            <button
                              title="Cancel Campaign"
                              onClick={() => setCancelId(item.id)}
                              style={{ color: '#ef4444', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <Ban size={15} />
                            </button>
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

        {!loading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '0.875rem' }}>
            No payment campaigns found.
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

      {/* Cancel Confirmation Modal */}
      {cancelId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setCancelId(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Cancel Campaign</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', lineHeight: '1.4' }}>
              <p style={{ marginBottom: '8px', textAlign: 'center' }}>Are you sure you want to cancel this campaign?</p>
              <p style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>This action will:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Set campaign status to cancelled</li>
                <li>Remove pending dues for members</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Close</button>
              <button onClick={handleCancelConfirm} disabled={cancelling} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal */}
      {agentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setAgentModalOpen(false)} />
          <div style={{ position: 'relative', background: '#f8fafc', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Agent Details</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Collection summary and dues</p>
              </div>
              <button onClick={() => setAgentModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', fontWeight: '300' }}>×</button>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto' }}>
              {loadingAgentDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : selectedAgentDetails ? (
                <>
                  {/* Summary Header */}
                  {selectedAgentDetails.summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Agent Info</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{selectedAgentDetails.summary.agent_name || 'Unassigned Agent'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{selectedAgentDetails.summary.agent_code || '-'}</div>
                      </div>
                      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Collection</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>{formatCurrency(selectedAgentDetails.summary.collected_amount)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#ea580c', marginTop: '2px' }}>Pending: {formatCurrency(selectedAgentDetails.summary.pending_amount)}</div>
                      </div>
                      <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>Commission ({Number(selectedAgentDetails.summary.commission_percentage || 0)}%)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e40af', marginTop: '4px' }}>{formatCurrency(selectedAgentDetails.summary.commission_amount)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: '2px', fontWeight: '600' }}>{selectedAgentDetails.summary.commission_status}</div>
                      </div>
                    </div>
                  )}

                  {/* Dues List */}
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Payment Dues ({selectedAgentDetails.dues?.length || 0})</h4>
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Member</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Campaign</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Paid Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedAgentDetails.dues || []).map(d => (
                          <tr key={d.due_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>{d.member_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.member_code}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>{d.campaign_no || '-'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.plan_name}</div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                              {formatCurrency(d.amount)}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {d.status === 1 ? (
                                <span style={{ padding: '4px 10px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>Paid</span>
                              ) : (
                                <span style={{ padding: '4px 10px', borderRadius: '4px', background: '#fffbeb', color: '#d97706', fontSize: '0.75rem', fontWeight: '600' }}>Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                              {formatDate(d.paid_at)}
                              {d.payment_mode && <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize', marginTop: '2px' }}>{d.payment_mode}</div>}
                            </td>
                          </tr>
                        ))}
                        {(!selectedAgentDetails.dues || selectedAgentDetails.dues.length === 0) && (
                          <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No dues found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Agent details not available.</div>
              )}
            </div>
            
            <div style={{ padding: '16px 32px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAgentModalOpen(false)} className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', background: '#f1f5f9', border: 'none', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>Close</button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
