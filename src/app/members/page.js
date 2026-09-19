'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Download, FileText, CheckSquare, Square } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const insuranceStatusStyle = {
  0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
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

  // Multi-select & Bulk Generate state
  const [selectedIds, setSelectedIds] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [docType, setDocType] = useState('bond'); // 'bond' or 'certificate'

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
        reqInsuranceStatus = '!2';
      } else if (mainFilter === 'rejected') {
        reqInsuranceStatus = '2';
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
    const mName = details.middle_name || item.middle_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName} ${mName} ${lName}`.replace(/\s+/g, ' ').trim() || item.name || 'Member';
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
        reqInsuranceStatus = '!2';
      } else if (mainFilter === 'rejected') {
        reqInsuranceStatus = '2';
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allInsuranceIds = list.map(item => item.insurance_id).filter(Boolean);
      setSelectedIds(allInsuranceIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (insuranceId) => {
    if (!insuranceId) return;
    setSelectedIds(prev => 
      prev.includes(insuranceId) ? prev.filter(id => id !== insuranceId) : [...prev, insuranceId]
    );
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one member', 'error');
      return;
    }
    const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey') || '';
    const token = localStorage.getItem('sky_token') || localStorage.getItem('token') || '';
    const endpoint = docType === 'bond' ? 'generate-membership-bond' : 'generate-membership-certificate';

    showToast(`Generating ${docType === 'bond' ? 'Bonds' : 'Certificates'} for ${selectedIds.length} member(s)...`, 'info');

    const idsParam = selectedIds.join(',');
    const url = `${BASE_API_URL}/api/member/${endpoint}?id=${idsParam}&apikey=${apikey}&token=${token}&admin=true&print=true`;
    window.open(url, '_blank');

    setShowGenerateModal(false);
  };

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>Member Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '3px', margin: 0 }}>
            {meta?.total || list.length || 0} registered members across all foundation plans
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => setShowGenerateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <FileText size={18} />
            <span>Generate Certificate / Bond</span>
            {selectedIds.length > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: '9999px', background: '#0284c7', color: '#fff', fontSize: '0.75rem', fontWeight: '800' }}>
                {selectedIds.length}
              </span>
            )}
          </button>
          
          <button 
            type="button"
            className="btn-primary" 
            onClick={() => router.push('/members/form')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.88rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Main Table & Filter Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
        
        {/* Filter Controls Panel */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
          
          {/* Row 1: Search & Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '420px' }}>
              <input 
                type="text" 
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by member name, ID, mobile, aadhaar..."
                className="premium-input"
                style={{ width: '100%', paddingLeft: '16px', borderRadius: '12px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Filter Tabs & Export */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {[
                  { label: 'All', val: 'all' },
                  { label: 'Active', val: 'active' },
                  { label: 'Married', val: 'married' },
                  { label: 'Upcoming', val: 'upcoming' },
                  { label: 'Suspended', val: 'suspended' },
                  { label: 'Rejected', val: 'rejected' }
                ].map(t => (
                  <button
                    key={t.val}
                    onClick={() => { setMainFilter(t.val); setPage(1); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      border: 'none',
                      background: mainFilter === t.val ? '#2563eb' : 'transparent',
                      color: mainFilter === t.val ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExport}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}
              >
                <Download size={15} /> Export
              </button>
            </div>

          </div>

          {/* Row 2: Secondary Dropdown Filters */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '4px' }}>
            
            {/* Plan Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Plan:</span>
              <select
                value={selectedPlan}
                onChange={handlePlanFilterChange}
                className="premium-input"
                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem', width: 'auto', minWidth: '150px' }}
              >
                <option value="">All Plans</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Agent Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Agent:</span>
              <select
                value={selectedAgent}
                onChange={handleAgentFilterChange}
                className="premium-input"
                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem', width: 'auto', minWidth: '150px' }}
              >
                <option value="">All Agents</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
              </select>
            </div>

            {/* Age Range Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Age Range:</span>
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
                  className="premium-input"
                  style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem' }}
                >
                  <option value="">Any Age</option>
                  {ageRules.map(rule => (
                    <option key={rule.id} value={`${rule.min_age}-${rule.max_age}`}>
                      {rule.min_age} to {rule.max_age} years
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAge}
                    onChange={e => { setMinAge(e.target.value); setPage(1); }}
                    className="premium-input"
                    style={{ width: '65px', padding: '6px 8px', borderRadius: '8px', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={e => { setMaxAge(e.target.value); setPage(1); }}
                    className="premium-input"
                    style={{ width: '65px', padding: '6px 8px', borderRadius: '8px', fontSize: '0.82rem' }}
                  />
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPage(1); }}
                className="premium-input"
                style={{ padding: '6px 10px', borderRadius: '10px', fontSize: '0.82rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPage(1); }}
                className="premium-input"
                style={{ padding: '6px 10px', borderRadius: '10px', fontSize: '0.82rem' }}
              />
            </div>

          </div>

        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#2563eb' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#64748b' }}>Loading member records...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{error}</div>
            <button onClick={fetchMembers} className="btn-secondary" style={{ marginTop: '14px', fontSize: '0.8rem', padding: '8px 16px', borderRadius: '10px' }}>Try Again</button>
          </div>
        ) : (
          <div className="premium-table-container">
            <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'center', width: '44px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={list.length > 0 && selectedIds.length === list.map(item => item.insurance_id).filter(Boolean).length}
                      style={{ cursor: 'pointer', width: '17px', height: '17px', accentColor: '#2563eb' }}
                    />
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Member Details</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mobile</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Insurance Plan</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Registered By</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Insurance Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Joining Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>No Members Found</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Try clearing filters or changing your search term.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((item, idx) => {
                    const memberId = item.member_id || item.id;
                    const insuranceId = item.insurance_id;
                    const name = getMemberName(item);
                    const memberCode = item.member_code || memberId || '';
                    const mobile = item.member_details?.mobile || item.phone || item.mobile || 'N/A';
                    const plan = getPlanName(item);
                    const planType = getPlanType(item);
                    const agent = getAgentName(item);
                    let insStatusInfo = insuranceStatusStyle[item.insurance_status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                    
                    if (planType === 2 && (String(item.insurance_status) === '3' || String(item.insurance_status) === '2')) {
                      insStatusInfo = { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' };
                    }
                    
                    const joiningDateRaw = item.insurance_joining_date || item.joining_date || item.created_at;
                    const joiningDate = joiningDateRaw ? new Date(joiningDateRaw).toLocaleDateString('en-GB') : 'N/A';
                    
                    const isSelected = selectedIds.includes(insuranceId);
                    const profileUrl = getProfileImage(item);

                    return (
                      <tr key={`${item.id || memberId}-${item.plan_id || idx}`} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.04)' : 'transparent', transition: 'background 0.15s' }}>
                        {/* Checkbox */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            disabled={!insuranceId}
                            onChange={() => handleSelectOne(insuranceId)}
                            style={{ cursor: insuranceId ? 'pointer' : 'not-allowed', width: '17px', height: '17px', accentColor: '#2563eb' }}
                          />
                        </td>

                        {/* Profile & Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            onClick={() => router.push(`/members/${memberId}`)}
                            title="View Profile"
                          >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)' }}>
                              {profileUrl ? (
                                <img src={profileUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                getInitials(item)
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {name}
                                {item.account_status === 2 && item.insurance_status !== 2 && insStatusInfo.label !== 'Deceased' && (
                                  <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>Suspended</span>
                                )}
                                {String(item.insurance_status) === '2' && insStatusInfo.label !== 'Deceased' && (
                                  <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>Rejected</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>Code: <span style={{ color: '#0f172a' }}>{memberCode}</span></div>
                            </div>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>{mobile}</td>

                        {/* Plan */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', background: '#f1f5f9', color: '#334155', display: 'inline-block' }}>
                            {plan}
                          </span>
                        </td>

                        {/* Agent */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#2563eb', fontWeight: '700' }}>{agent}</td>

                        {/* Insurance Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span className="status-badge" style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: insStatusInfo.bg, color: insStatusInfo.color, display: 'inline-block' }}>
                            {insStatusInfo.label}
                          </span>
                        </td>

                        {/* Joining Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>{joiningDate}</td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              title="View Member Profile"
                              onClick={() => router.push(`/members/${memberId}`)}
                              style={{ color: '#2563eb', cursor: 'pointer', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Eye size={16} />
                            </button>
                            {insuranceId && (
                              <button
                                title="Generate Membership Bond"
                                onClick={() => {
                                  const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey') || '';
                                  const token = localStorage.getItem('sky_token') || localStorage.getItem('token') || '';
                                  window.open(`${BASE_API_URL}/api/member/generate-membership-bond?id=${insuranceId}&apikey=${apikey}&token=${token}&admin=true&print=true`, '_blank');
                                }}
                                style={{ color: '#0284c7', cursor: 'pointer', padding: '6px', borderRadius: '8px', border: '1px solid #bae6fd', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <FileText size={16} />
                              </button>
                            )}
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
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                Showing <span style={{ fontWeight: '800', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
                <span style={{ fontWeight: '800', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
                <span style={{ fontWeight: '800', color: '#0f172a' }}>{meta.total}</span> members
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>Rows per page:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(e.target.value === 'All' ? 'All' : Number(e.target.value)); setPage(1); }} 
                  className="premium-input" 
                  style={{ padding: '4px 10px', fontSize: '0.82rem', borderRadius: '8px' }}
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
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  opacity: meta.hasPrev ? 1 : 0.5,
                  cursor: meta.hasPrev ? 'pointer' : 'not-allowed',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '800', padding: '0 8px' }}>
                Page {page}
              </span>
              <button
                disabled={!meta.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  opacity: meta.hasNext ? 1 : 0.5,
                  cursor: meta.hasNext ? 'pointer' : 'not-allowed',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteId(null)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Delete Member Account</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '22px', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '8px', textAlign: 'center' }}>Are you sure you want to delete this member?</p>
              <p style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>This action will:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Soft delete member profile</li>
                <li>Disable active portal access</li>
                <li>Preserve insurance history & receipts</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.85rem', fontWeight: '700' }}>Delete Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Certificate / Bond Modal */}
      {showGenerateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowGenerateModal(false)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Generate Bond / Certificate</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Select document format for selected members</div>
              </div>
            </div>

            {/* Document Type Option */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                1. Select Document Format:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div 
                  onClick={() => setDocType('bond')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: docType === 'bond' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                    background: docType === 'bond' ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: docType === 'bond' ? '#2563eb' : '#334155' }}>📄 Membership Bond</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Full Legal Bond Paper</div>
                </div>

                <div 
                  onClick={() => setDocType('certificate')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: docType === 'certificate' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                    background: docType === 'certificate' ? 'rgba(37, 99, 235, 0.05)' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: docType === 'certificate' ? '#2563eb' : '#334155' }}>📜 Certificate</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>Official Certificate</div>
                </div>
              </div>
            </div>

            {/* Selection Info */}
            <div style={{ marginBottom: '22px', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                2. Selected Target: <span style={{ color: '#2563eb', fontWeight: '800' }}>{selectedIds.length}</span> member(s)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                {selectedIds.length === 0 ? (
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>⚠️ No members selected. Tick checkboxes in the table to select.</span>
                ) : (
                  `Batch generate and print ${docType === 'bond' ? 'Membership Bonds' : 'Certificates'} for all ${selectedIds.length} selected member(s).`
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowGenerateModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkPrint}
                disabled={selectedIds.length === 0}
                className="btn-primary" 
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '12px', 
                  background: selectedIds.length === 0 ? '#cbd5e1' : '#2563eb', 
                  color: 'white', 
                  boxShadow: 'none', 
                  border: 'none', 
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Generate ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
