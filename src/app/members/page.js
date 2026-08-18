'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Download } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const insuranceStatusStyle = {
  0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#e0e7ff', color: '#4338ca', label: 'Married' },
  3: { bg: '#f3e8ff', color: '#7e22ce', label: 'Invoice Generated' },
  '-1': { bg: '#f1f5f9', color: '#475569', label: 'Removed' },
};

const marriageStatusStyle = {
  1: { bg: '#fef08a', color: '#854d0e', label: 'Upcoming' },
  2: { bg: '#dcfce7', color: '#15803d', label: 'Married' },
  default: { bg: '#f1f5f9', color: '#94a3b8', label: 'N/A' },
};

const deathStatusStyle = {
  1: { bg: '#dbeafe', color: '#1d4ed8', label: 'Reported' },
  2: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  default: { bg: '#f1f5f9', color: '#94a3b8', label: 'N/A' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function MembersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialMainFilter = searchParams.get('filter') || (searchParams.get('account_status') === '2' ? 'suspended' : 'active');
  const initialAgentId = searchParams.get('agent_id') || '';
  const initialPlanId = searchParams.get('plan_id') || '';
  const initialMinAge = searchParams.get('min_age') || '';
  const initialMaxAge = searchParams.get('max_age') || '';
  const initialStartDate = searchParams.get('start_date') || '';
  const initialEndDate = searchParams.get('end_date') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [list, setList] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [ageRules, setAgeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters state
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [mainFilter, setMainFilter] = useState(initialMainFilter);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      if (searchInput.trim() !== search) setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [selectedAgent, setSelectedAgent] = useState(initialAgentId);
  const [selectedPlan, setSelectedPlan] = useState(initialPlanId);
  const [minAge, setMinAge] = useState(initialMinAge);
  const [maxAge, setMaxAge] = useState(initialMaxAge);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState(null);

  // Actions states
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchDependencies = async () => {
    try {
      const [agentsRes, plansRes] = await Promise.all([
        apiRequest('/api/agent/get-all?limit=100').catch(() => ({ s: 0, r: [] })),
        apiRequest('/api/insurance/get-all?limit=100').catch(() => ({ s: 0, r: [] }))
      ]);
      if (agentsRes.s === 1 && Array.isArray(agentsRes.r)) {
        setAgents(agentsRes.r);
      }
      if (plansRes.s === 1 && Array.isArray(plansRes.r)) {
        setPlans(plansRes.r);
      }
    } catch (err) {
      console.error('Error fetching member list dependencies:', err);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      let reqAccountStatus = '';
      let reqMarriageStatus = '';
      let reqInsuranceStatus = '';
      if (mainFilter === 'active') {
        reqAccountStatus = '1';
        reqInsuranceStatus = '1';
      } else if (mainFilter === 'suspended') {
        reqAccountStatus = '2';
      } else if (mainFilter === 'married') {
        reqMarriageStatus = '2';
      } else if (mainFilter === 'upcoming') {
        reqMarriageStatus = '1';
      }

      const actualLimit = limit === 'All' ? 999999 : limit;
      const res = await apiRequest(
        `/api/member/get-all?page=${page}&limit=${actualLimit}&search=${encodeURIComponent(search)}&agent_id=${selectedAgent}&plan_id=${selectedPlan}&insurance_status=${reqInsuranceStatus}&marriage_status=${reqMarriageStatus}&account_status=${reqAccountStatus}&min_age=${minAge}&max_age=${maxAge}&start_date=${startDate}&end_date=${endDate}`
      );
      if (res.s === 1 && Array.isArray(res.r)) {
        setList(res.r);
        setMeta(res.meta || null);
      } else {
        setError(res.m || 'Failed to fetch member list.');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('An error occurred while loading members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      apiRequest(`/api/insurance/age-rules/get-all?plan_id=${selectedPlan}`)
        .then(res => {
          if (res.s === 1 && Array.isArray(res.r)) {
            setAgeRules(res.r);
          } else {
            setAgeRules([]);
          }
        })
        .catch(() => setAgeRules([]));
    } else {
      setAgeRules([]);
    }
  }, [selectedPlan]);

  useEffect(() => {
    // Sync filters to URL
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search); else params.delete('search');
    if (mainFilter) params.set('filter', mainFilter); else params.delete('filter');
    if (selectedAgent) params.set('agent_id', selectedAgent); else params.delete('agent_id');
    if (selectedPlan) params.set('plan_id', selectedPlan); else params.delete('plan_id');
    if (minAge) params.set('min_age', minAge); else params.delete('min_age');
    if (maxAge) params.set('max_age', maxAge); else params.delete('max_age');
    if (startDate) params.set('start_date', startDate); else params.delete('start_date');
    if (endDate) params.set('end_date', endDate); else params.delete('end_date');
    if (page !== 1) params.set('page', page.toString()); else params.delete('page');
    
    // Remove the legacy ones so they don't stick around
    params.delete('account_status');
    
    router.replace(`?${params.toString()}`, { scroll: false });
    
    fetchMembers();
  }, [page, limit, search, selectedAgent, selectedPlan, mainFilter, minAge, maxAge, startDate, endDate]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleAgentFilterChange = (e) => {
    setSelectedAgent(e.target.value);
    setPage(1);
  };

  const handlePlanFilterChange = (e) => {
    setSelectedPlan(e.target.value);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    try {
      const formData = new FormData();
      formData.append('id', deleteId);
      formData.append('status', '-1');
      
      const res = await apiRequest('/api/member/status', {
        method: 'POST',
        body: formData,
      });

      if (res.s === 1) {
        showToast('Member deleted successfully', 'success');
        setDeleteId(null);
        fetchMembers();
      } else {
        // Fallback: try JSON request body if FormData is not handled by legacy delete endpoint
        const resJson = await apiRequest('/api/member/delete', {
          method: 'POST',
          body: JSON.stringify({ id: deleteId, member_id: deleteId }),
        });
        if (resJson.s === 1) {
          showToast('Member deleted successfully', 'success');
          setDeleteId(null);
          fetchMembers();
        } else {
          showToast(resJson.m || 'Failed to delete member', 'error');
        }
      }
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('status', String(nextStatus));
      
      const res = await apiRequest('/api/member/status', {
        method: 'POST',
        body: formData,
      });

      if (res.s === 1) {
        showToast('Member status updated successfully', 'success');
        setMenuOpen(null);
        fetchMembers();
      } else {
        // Fallback to JSON body if FormData status endpoint fails
        const resJson = await apiRequest('/api/member/status', {
          method: 'POST',
          body: JSON.stringify({ id, status: nextStatus }),
        });
        if (resJson.s === 1) {
          showToast('Member status updated successfully', 'success');
          setMenuOpen(null);
          fetchMembers();
        } else {
          showToast(resJson.m || 'Failed to update status', 'error');
        }
      }
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const getAgentName = (item) => {
    const agentId = item.agent_id || item.created_by_agent;
    const matched = agents.find(a => String(a.id) === String(agentId));
    if (matched) return `${matched.first_name} ${matched.last_name}`;
    return 'N/A';
  };

  const getPlanName = (item) => {
    const planId = item.plan_id;
    const matched = plans.find(p => String(p.id) === String(planId));
    if (matched) return matched.name;
    return item.scheme_name || item.scheme || 'N/A';
  };

  const getPlanType = (item) => {
    const planId = item.plan_id;
    const matched = plans.find(p => String(p.id) === String(planId));
    if (matched) return Number(matched.plan_type || 1);
    return 1;
  };

  const getProfileImage = (item) => {
    const details = item.member_details || {};
    const imgPath = details.profile_image || details.profile_photo || item.profile_photo || item.profile;
    if (imgPath) {
      return imgPath.startsWith('http') ? imgPath : `${BASE_API_URL}${imgPath}`;
    }
    return null;
  };

  const getMemberName = (item) => {
    const details = item.member_details || {};
    const fName = details.first_name || item.first_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName} ${lName}`.trim() || item.name || 'Member';
  };

  const getInitials = (item) => {
    const details = item.member_details || {};
    const fName = details.first_name || item.first_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName?.[0] || ''}${lName?.[0] || ''}`.toUpperCase() || 'MB';
  };



  const handleExport = async () => {
    try {
      showToast('Preparing PDF export...', 'success');
      
      let reqAccountStatus = '';
      let reqMarriageStatus = '';
      let reqInsuranceStatus = '';
      if (mainFilter === 'active') {
        reqAccountStatus = '1';
        reqInsuranceStatus = '1';
      } else if (mainFilter === 'suspended') {
        reqAccountStatus = '2';
      } else if (mainFilter === 'married') {
        reqMarriageStatus = '2';
      } else if (mainFilter === 'upcoming') {
        reqMarriageStatus = '1';
      }
      
      const res = await apiRequest(`/api/member/get-all?page=1&limit=999999&search=${encodeURIComponent(search)}&agent_id=${selectedAgent}&plan_id=${selectedPlan}&insurance_status=${reqInsuranceStatus}&marriage_status=${reqMarriageStatus}&account_status=${reqAccountStatus}&min_age=${minAge}&max_age=${maxAge}&start_date=${startDate}&end_date=${endDate}`);
      
      if (res.s === 1 && Array.isArray(res.r)) {
        if (res.r.length === 0) {
          showToast('No data to export', 'error');
          return;
        }
        
        let htmlStr = `
          <html>
            <head>
              <title>Members Export</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #1e293b; }
                h1 { text-align: center; color: #0f172a; font-size: 24px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
                tr:nth-child(even) { background-color: #f8fafc; }
                @media print {
                  @page { margin: 10mm; }
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <h1>Members List</h1>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Gender</th>
                    <th>Plan</th>
                    <th>Agent</th>
                    <th>Insurance</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
        `;
        
        res.r.forEach(m => {
          const details = m.member_details || {};
          const code = m.member_code || m.id || '';
          const name = getMemberName(m);
          const phone = details.mobile || m.phone || m.mobile || '';
          const gender = details.gender || m.gender || '';
          const plan = getPlanName(m);
          const agent = getAgentName(m);
          const insStatus = insuranceStatusStyle[m.insurance_status]?.label || 'Unknown';
          const date = m.created_at ? m.created_at.split('T')[0] : '';
          
          htmlStr += `
            <tr>
              <td>${code}</td>
              <td>${name}</td>
              <td>${phone}</td>
              <td>${gender}</td>
              <td>${plan}</td>
              <td>${agent}</td>
              <td>${insStatus}</td>
              <td>${date}</td>
            </tr>
          `;
        });
        
        htmlStr += `
                </tbody>
              </table>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }
              </script>
            </body>
          </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlStr);
        printWindow.document.close();
      } else {
        showToast('Failed to fetch data for export', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error exporting data', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Member Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>{meta?.total || 0} members found</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/members/form')}>
          <Plus size={15} strokeWidth={2.5} /> Add Member
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'visible' }}>
        {/* Filters and search panel */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <input 
              type="text" 
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name, ID, mobile, aadhaar..."
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '310px', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a' }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e8edf2' }}>
                {[
                  { label: 'All', val: 'all' },
                  { label: 'Active', val: 'active' },
                  { label: 'Married', val: 'married' },
                  { label: 'Upcoming', val: 'upcoming' },
                  { label: 'Suspended', val: 'suspended' }
                ].map(t => (
                  <button
                    key={t.val}
                    onClick={() => { setMainFilter(t.val); setPage(1); }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: 'none',
                      background: mainFilter === t.val ? '#6366f1' : 'transparent',
                      color: mainFilter === t.val ? 'white' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExport}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '9px', border: '1.5px solid #e8edf2', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', background: '#fff', cursor: 'pointer' }}
              >
                <Download size={13} /> Export
              </button>
            </div>
          </div>

          {/* Plan and Agent Dropdowns */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Plan:</span>
              <select
                value={selectedPlan}
                onChange={handlePlanFilterChange}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Agent:</span>
              <select
                value={selectedAgent}
                onChange={handleAgentFilterChange}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Age Range:</span>
              {ageRules.length > 0 ? (
                <select
                  value={minAge !== '' && maxAge !== '' ? `${minAge}-${maxAge}` : ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val) {
                      const [min, max] = val.split('-');
                      setMinAge(min);
                      setMaxAge(max);
                    } else {
                      setMinAge('');
                      setMaxAge('');
                    }
                    setPage(1);
                  }}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none' }}
                >
                  <option value="">Any Age</option>
                  {ageRules.map(rule => (
                    <option key={rule.id} value={`${rule.min_age}-${rule.max_age}`}>
                      {rule.min_age} to {rule.max_age} years
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAge}
                    onChange={e => { setMinAge(e.target.value); setPage(1); }}
                    style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={e => { setMaxAge(e.target.value); setPage(1); }}
                    style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', outline: 'none' }}
                  />
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.8rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>
            <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            <span>Loading members...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{error}</div>
            <button onClick={fetchMembers} className="btn-secondary" style={{ marginTop: '12px', fontSize: '0.75rem', padding: '6px 12px' }}>Try Again</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['MEMBER', 'MOBILE', 'INSURANCE PLAN', 'REGISTERED BY', 'INSURANCE', 'JOINING DATE', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>👥</div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>No Members Found</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Try adjusting your search or filters.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((item, idx) => {
                  const memberId = item.member_id || item.id;
                  const name = getMemberName(item);
                  const memberCode = item.member_code || memberId || '';
                  const mobile = item.member_details?.mobile || item.phone || item.mobile || 'N/A';
                  const gender = item.member_details?.gender || item.gender || 'N/A';
                  const plan = getPlanName(item);
                  const planType = getPlanType(item);
                  const agent = getAgentName(item);
                  let insStatusInfo = insuranceStatusStyle[item.insurance_status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                  
                  if (planType === 2 && (String(item.insurance_status) === '3' || String(item.insurance_status) === '2')) {
                    insStatusInfo = { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' };
                  }
                  
                  const marStatusInfo = planType === 2 
                    ? (deathStatusStyle[item.death_status] || deathStatusStyle.default) 
                    : (marriageStatusStyle[item.marriage_status] || marriageStatusStyle.default);
                  
                  const joiningDateRaw = item.insurance_joining_date || item.joining_date || item.created_at;
                  const joiningDate = joiningDateRaw ? new Date(joiningDateRaw).toLocaleDateString() : 'N/A';
                  
                  const timeAgo = (dateStr) => {
                    if (!dateStr) return 'N/A';
                    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
                    let interval = seconds / 31536000;
                    if (interval >= 1) return Math.floor(interval) + " y";
                    interval = seconds / 2592000;
                    if (interval >= 1) return Math.floor(interval) + " m";
                    interval = seconds / 86400;
                    if (interval >= 1) return Math.floor(interval) + " d";
                    interval = seconds / 3600;
                    if (interval >= 1) return Math.floor(interval) + " h";
                    interval = seconds / 60;
                    if (interval >= 1) return Math.floor(interval) + " min";
                    return Math.floor(seconds) + " s";
                  };
                  
                  const profileUrl = getProfileImage(item);

                  return (
                    <tr key={`${item.id || memberId}-${item.plan_id || idx}`} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Profile & Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                          onClick={() => router.push(`/members/${memberId}`)}
                          title="View Profile"
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                            {profileUrl ? (
                              <img src={profileUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              getInitials(item)
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {name}
                              {item.account_status === 2 && insStatusInfo.label !== 'Deceased' && (
                                <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', fontSize: '0.65rem' }}>Suspended</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Code: {memberCode}</div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>{mobile}</td>

                      {/* Removed Gender */}

                      {/* Plan */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                          {plan}
                        </span>
                      </td>

                      {/* Agent */}
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#0ea5e9', fontWeight: '600' }}>{agent}</td>

                      {/* Insurance Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', textAlign: 'center', minWidth: '70px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: insStatusInfo.bg, color: insStatusInfo.color }}>
                          {insStatusInfo.label}
                        </span>
                      </td>

                      {/* Removed Event Status */}

                      {/* Joining Date */}
                      <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>{joiningDate}</td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              title="View Profile"
                              onClick={() => router.push(`/members/${memberId}`)}
                              style={{ color: '#0ea5e9', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <Eye size={15} />
                            </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        )}



        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                Showing <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.total}</span> members
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Show:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value === 'All' ? 'All' : Number(e.target.value)); setPage(1); }} 
                  className="premium-input" 
                  style={{ padding: '4px 8px', fontSize: '0.78rem', height: 'auto', minHeight: 'unset' }}
                >
                  {[10, 25, 50, 100, 200, 500, 'All'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
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

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteId(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Delete Member</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', lineHeight: '1.4' }}>
              <p style={{ marginBottom: '8px', textAlign: 'center' }}>Are you sure you want to delete this member?</p>
              <p style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>This action will:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Soft delete member</li>
                <li>Disable login access</li>
                <li>Preserve insurance history</li>
                <li>Preserve payment records</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >Delete Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
