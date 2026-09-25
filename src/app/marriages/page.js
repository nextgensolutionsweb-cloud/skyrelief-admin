'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Heart, Search, Calendar, RefreshCw, Upload, Download, CheckCircle, Award } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const statusStyle = {
  1: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  2: { bg: '#dcfce7', color: '#15803d', label: 'Married' },
  3: { bg: '#f3e8ff', color: '#7e22ce', label: 'Completed' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
  // Fallbacks
  Upcoming: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  Married: { bg: '#dcfce7', color: '#15803d', label: 'Married' },
  Settled: { bg: '#dcfce7', color: '#15803d', label: 'Married' },
  Completed: { bg: '#f3e8ff', color: '#7e22ce', label: 'Completed' },
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
  const [deleteEventType, setDeleteEventType] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const [settleItem, setSettleItem] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settlePhoto, setSettlePhoto] = useState(null);
  const [settlePhotoPreview, setSettlePhotoPreview] = useState('');
  const [settling, setSettling] = useState(false);

  // Complete Service Modal States
  const [completeItem, setCompleteItem] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  // Filter helper to determine death plans
  const isDeathPlan = (p) => p && (Number(p.plan_type) === 2 || String(p.name).toLowerCase().includes('सुरक्षा') || String(p.name).toLowerCase().includes('suraksha') || String(p.name).toLowerCase().includes('death'));

  // Active plans grouped
  const activePlans = plans.filter(p => p.status !== -1 && String(p.status) !== '-1');
  const marriagePlans = activePlans.filter(p => !isDeathPlan(p));
  const deathPlans = activePlans.filter(p => isDeathPlan(p));

  const selectedPlanObj = plans.find(p => String(p.id) === String(selectedPlan));
  const isDeathMode = isDeathPlan(selectedPlanObj);

  // Fetch insurance plans for dropdown filter
  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/api/insurance/get-all?limit=100');
      if (res.s === 1 && Array.isArray(res.r)) {
        const active = res.r.filter(p => p.status !== -1 && String(p.status) !== '-1');
        setPlans(active);
        
        // Preserve selected plan across refresh: check URL -> localStorage -> prev -> fallback
        setSelectedPlan(prev => {
          let target = '';
          if (typeof window !== 'undefined') {
            const urlPlan = new URLSearchParams(window.location.search).get('plan_id');
            const savedPlan = localStorage.getItem('sky_selected_program_plan');
            if (urlPlan && active.some(p => String(p.id) === String(urlPlan))) {
              target = String(urlPlan);
            } else if (savedPlan && active.some(p => String(p.id) === String(savedPlan))) {
              target = String(savedPlan);
            }
          }
          if (!target && prev && active.some(p => String(p.id) === String(prev))) {
            target = String(prev);
          }
          if (!target) {
            const firstMarriage = active.find(p => !isDeathPlan(p));
            target = firstMarriage ? String(firstMarriage.id) : (active[0] ? String(active[0].id) : '');
          }
          if (target && typeof window !== 'undefined') {
            localStorage.setItem('sky_selected_program_plan', String(target));
            const url = new URL(window.location.href);
            if (url.searchParams.get('plan_id') !== String(target)) {
              url.searchParams.set('plan_id', String(target));
              window.history.replaceState({}, '', url.toString());
            }
          }
          return String(target);
        });
      }
    } catch (err) {
      console.error('Error fetching plans for filter:', err);
    }
  };

  const fetchDashboard = async () => {
    if (!selectedPlan) return;
    setLoadingDashboard(true);
    try {
      const endpoint = isDeathMode 
        ? `/api/death/dashboard?plan_id=${selectedPlan}` 
        : `/api/marriage/dashboard?plan_id=${selectedPlan}`;
      const res = await apiRequest(endpoint);
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

  // Fetch records from backend API
  const fetchCases = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      let endpoint = isDeathMode ? `/api/death/get-all?page=${page}&limit=10` : `/api/marriage/get-all?page=${page}&limit=10`;
      
      if (search.trim()) {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (selectedPlan && selectedPlan !== 'death_all') {
        endpoint += `&plan_id=${selectedPlan}`;
      }
      if (dateFilter) {
        if (isDeathMode) {
          endpoint += `&from_date=${dateFilter}&to_date=${dateFilter}`;
        } else {
          endpoint += `&date=${dateFilter}`;
        }
      }
      if (statusFilter !== 'All') {
        if (isDeathMode) {
          const sVal = statusFilter === 'Settled' ? 2 : statusFilter === 'Reported' ? 1 : statusFilter === 'Deleted' ? -1 : '';
          if (sVal !== '') endpoint += `&status=${sVal}`;
        } else {
          const sVal = statusFilter === 'Upcoming' ? 1 : (statusFilter === 'Married' || statusFilter === 'Settled') ? 2 : statusFilter === 'Completed' ? 3 : statusFilter === 'Deleted' ? -1 : '';
          if (sVal !== '') endpoint += `&status=${sVal}`;
        }
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
      console.error('Error fetching cases list:', err);
      setList([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedPlan, isDeathMode]);

  useEffect(() => {
    fetchCases();
  }, [page, search, statusFilter, selectedPlan, dateFilter, isDeathMode]);

  // Actions
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePlanChange = (e) => {
    const nextVal = e.target.value;
    const nextPlan = plans.find(p => String(p.id) === String(nextVal));
    const nextIsDeath = isDeathPlan(nextPlan);

    // If changing mode, reset status filter so it does not get stuck on 'Upcoming'
    if (nextIsDeath !== isDeathMode) {
      setStatusFilter('All');
    }
    setSelectedPlan(nextVal);
    setPage(1);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sky_selected_program_plan', String(nextVal));
      const url = new URL(window.location.href);
      url.searchParams.set('plan_id', String(nextVal));
      window.history.replaceState({}, '', url.toString());
    }
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
    setSettleAmount(item.amount_given || item.amount || (isDeathMode ? '50000' : '25000'));
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
      const endpoint = isDeathMode ? '/api/death/mark-as-settled' : '/api/marriage/mark-as-married';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res.s === 1) {
        showToast(res.m || (isDeathMode ? 'Death claim settled successfully' : 'Member marked as married successfully'), 'success');
        setSettleItem(null);
        fetchCases();
        fetchDashboard();
      } else {
        showToast(res.m || 'Failed to settle record.', 'error');
      }
    } catch (err) {
      console.error('Error settling case:', err);
      showToast('An error occurred while settling.', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Complete Service Confirm
  const openCompleteModal = (item) => {
    setCompleteItem(item);
    setCompleteNotes('');
  };

  const handleConfirmComplete = async (e) => {
    e.preventDefault();
    if (!completeItem) return;
    setCompleting(true);
    try {
      const res = await apiRequest('/api/marriage/mark-as-completed', {
        method: 'POST',
        body: JSON.stringify({
          id: completeItem.id,
          notes: completeNotes
        })
      });
      if (res.s === 1) {
        showToast(res.m || 'Member marriage marked as Completed successfully.', 'success');
        setCompleteItem(null);
        fetchCases();
        fetchDashboard();
      } else {
        showToast(res.m || 'Failed to complete record.', 'error');
      }
    } catch (err) {
      console.error('Error completing case:', err);
      showToast('An error occurred while marking completed.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const isDeath = deleteEventType === 'death' || isDeathMode;
    try {
      setDeleting(true);
      const endpoint = isDeath ? '/api/death/delete' : '/api/marriage/delete';
      let res;
      try {
        res = await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify({ id: deleteId })
        });
      } catch (err) {
        console.warn('Delete endpoint failed, trying status endpoint fallback...');
        const formData = new FormData();
        formData.append('id', deleteId);
        formData.append('status', -1);
        res = await apiRequest(isDeath ? '/api/death/update' : '/api/marriage/update', {
          method: 'POST',
          body: formData
        });
      }

      if (res && res.s === 1) {
        showToast(isDeath ? 'Death event deleted successfully' : 'Marriage event deleted successfully', 'success');
        setDeleteId(null);
        setDeleteEventType(null);
        fetchCases();
        fetchDashboard();
      } else {
        showToast(res.m || 'Failed to delete record', 'error');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
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
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = parts[2].padStart(2, '0');
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        if (monthIdx >= 0 && monthIdx < 12) {
          return `${day} ${months[monthIdx]} ${year}`;
        }
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getUTCDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
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
    const statusVal = Number(item.status);
    if (statusFilter === 'All') {
      if (statusVal === -1) return false;
    } else if (statusFilter === 'Upcoming') {
      if (statusVal !== 1) return false;
    } else if (statusFilter === 'Reported') {
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
      const rawDate = item.marriage_date || item.death_date || item.date;
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

  const deathStatusStyle = {
    1: { bg: '#fef3c7', color: '#b45309', label: 'Reported' },
    2: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
    '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
  };

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Bar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'nowrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isDeathMode ? 'Death Assistance Module' : 'Marriage Assistance Module'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px', margin: 0, whiteSpace: 'nowrap' }}>
            {isDeathMode ? 'Program dashboard & claims processing' : 'Program dashboard & application processing'}
          </p>
        </div>

        {/* Top Header Insurance Plan Selector & New Case */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            padding: '0 14px',
            height: '42px',
            borderRadius: '12px',
            border: isDeathMode ? '1.5px solid #f59e0b' : '1.5px solid #3b82f6',
            boxShadow: isDeathMode ? '0 2px 10px rgba(245, 158, 11, 0.12)' : '0 2px 10px rgba(59, 130, 246, 0.12)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDeathMode ? '#b45309' : '#1d4ed8', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              {isDeathMode ? '🛡️ Insurance:' : '💍 Insurance:'}
            </span>
            <select
              value={selectedPlan}
              onChange={handlePlanChange}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.86rem',
                fontWeight: '700',
                color: '#0f172a',
                cursor: 'pointer',
                maxWidth: '260px',
                paddingRight: '6px'
              }}
            >
              <optgroup label="💍 Marriage Assistance">
                {marriagePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
              {deathPlans.length > 0 && (
                <optgroup label="🛡️ Death Assistance">
                  {deathPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <button 
            className="btn-primary" 
            onClick={() => {
              if (isDeathMode) {
                const targetPlan = selectedPlan || (deathPlans[0]?.id || '');
                router.push(targetPlan ? `/marriages/form?plan_id=${targetPlan}&type=death` : '/marriages/form?type=death');
              } else {
                router.push(selectedPlan ? `/marriages/form?plan_id=${selectedPlan}&type=marriage` : '/marriages/form?type=marriage');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 20px',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.88rem',
              boxShadow: isDeathMode ? '0 4px 14px rgba(245, 158, 11, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.25)',
              background: isDeathMode ? '#f59e0b' : undefined,
              borderColor: isDeathMode ? '#f59e0b' : undefined,
              flexShrink: 0
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* Dashboard Analytics */}
      {!loadingDashboard && dashboardData && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Summary Metric Cards */}
          {!isDeathMode ? (
            /* MARRIAGE CARDS */
            <div className="grid-responsive-5col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              {/* Total Cases Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cases</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    💍
                  </div>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.total_cases || 0}</span>
              </div>

              {/* Upcoming Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1d4ed8', background: '#dbeafe', padding: '3px 10px', borderRadius: '9999px' }}>PENDING</span>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.upcoming_cases || 0}</span>
              </div>

              {/* Married Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Married</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '9999px' }}>MARRIED</span>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.settled_cases || 0}</span>
              </div>

              {/* Completed Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#7e22ce', background: '#f3e8ff', padding: '3px 10px', borderRadius: '9999px' }}>COMPLETED</span>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.completed_cases || 0}</span>
              </div>

              {/* Total Paid Amount Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid Amount</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    ₹
                  </div>
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
                  ₹{Number(dashboardData?.summary?.total_amount_given || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* This Month Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    📅
                  </div>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.this_month_cases || 0}</span>
              </div>

            </div>
          ) : (
            /* DEATH MODULE METRIC CARDS - No 'Upcoming' and no 'Married'! */
            <div className="grid-responsive-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              {/* Total Cases Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cases</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    🛡️
                  </div>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.total_cases || 0}</span>
              </div>

              {/* Settled Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settled Cases</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: '9999px' }}>PAID</span>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.settled_cases || 0}</span>
              </div>

              {/* Total Paid Amount Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid Amount</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    ₹
                  </div>
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
                  ₹{Number(dashboardData?.summary?.total_amount_given || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* This Month Card */}
              <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    📅
                  </div>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{dashboardData?.summary?.this_month_cases || 0}</span>
              </div>

            </div>
          )}
          
          {/* Statistics Summary Tables */}
          <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Plan-wise Statistics */}
            <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Plan-wise Statistics
              </h3>
              <div className="premium-table-container">
                <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Plan</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{isDeathMode ? 'Settled' : 'Married'}</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.plan_wise || []).map(p => (
                      <tr key={p.plan_id}>
                        <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>{p.plan_name}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>{p.total_cases}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>{p.settled_cases}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>₹{Number(p.total_amount_given).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(!dashboardData?.plan_wise || dashboardData.plan_wise.length === 0) && (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No plan statistics data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Agent-wise Statistics */}
            <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏆 Agent-wise Statistics (Top 10)
              </h3>
              <div className="premium-table-container">
                <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Agent</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>{isDeathMode ? 'Settled' : 'Married'}</th>
                      <th style={{ padding: '10px 12px', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.agent_wise || []).map((a, i) => (
                      <tr key={i}>
                        <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>{a.agent_name || 'Direct / None'}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>{a.total_cases}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>{a.settled_cases}</td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>₹{Number(a.total_amount_given).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(!dashboardData?.agent_wise || dashboardData.agent_wise.length === 0) && (
                      <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No agent statistics data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Grid Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
        
        {/* Filters Panel */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid #f1f5f9' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by member name, code, plan, phone..."
                className="premium-input"
                style={{ width: '100%', paddingLeft: '40px', borderRadius: '12px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              {(isDeathMode ? ['All', 'Settled', 'Deleted'] : ['All', 'Upcoming', 'Married', 'Completed', 'Deleted']).map(t => (
                <button
                  key={t}
                  onClick={() => handleStatusChange(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    border: 'none',
                    background: statusFilter === t ? (isDeathMode ? '#f59e0b' : '#2563eb') : 'transparent',
                    color: statusFilter === t ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '2px' }}>
            {/* Plan Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Plan:</span>
              <select
                value={selectedPlan}
                onChange={handlePlanChange}
                className="premium-input"
                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem', width: 'auto', minWidth: '180px' }}
              >
                <optgroup label="💍 Marriage Assistance">
                  {marriagePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
                {deathPlans.length > 0 && (
                  <optgroup label="🛡️ Death Assistance">
                    {deathPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Event Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                className="premium-input"
                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

        </div>

        {/* Loading / Table Panel */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: isDeathMode ? '#f59e0b' : '#2563eb' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid #f1f5f9', borderTopColor: isDeathMode ? '#f59e0b' : '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#64748b' }}>
              {isDeathMode ? 'Loading death cases...' : 'Loading marriage cases...'}
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div className="premium-table-container">
            <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Member Details</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Insurance Plan</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agent</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {isDeathMode ? 'Death Date' : 'Marriage Date'}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {isDeathMode ? 'Death Proof / Photo' : 'Documents'}
                  </th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Amount Given</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Campaign / Installment</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.72rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => {
                  const mName = getMemberName(item);
                  const mCode = getMemberCode(item);
                  const plan = getPlanName(item);
                  const agentName = getAgentName(item);
                  const eventDate = formatMarriageDate(isDeathMode ? (item.death_date || item.date) : (item.marriage_date || item.date));
                  const statusInfo = isDeathMode 
                    ? (deathStatusStyle[item.status] || { bg: '#dcfce7', color: '#15803d', label: 'Settled' })
                    : (statusStyle[item.status] || { bg: '#f1f5f9', color: '#475569', label: item.status || 'Pending' });
                  const docUrl = getInvitationCardUrl(item.photo_url || item.photo || item.invitation_card);
                  const amount = item.amount_given ? "₹" + Number(item.amount_given).toLocaleString('en-IN') : "-";

                  return (
                    <tr key={item.id !== undefined && item.id !== null ? `${item.id}-${index}` : index}>
                      {/* Member Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>{mName}</div>
                        {mCode && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>Code: <span style={{ color: '#0f172a' }}>{mCode}</span></div>
                        )}
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', background: isDeathMode ? '#fef3c7' : '#f1f5f9', color: isDeathMode ? '#92400e' : '#334155', display: 'inline-block' }}>
                          {plan}
                        </span>
                      </td>

                      {/* Agent */}
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#2563eb', fontWeight: '700' }}>
                        {agentName}
                      </td>

                      {/* Event Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                        {eventDate}
                      </td>

                      {/* Document Link */}
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                        {docUrl ? (
                          <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <Download size={13} /> {isDeathMode ? 'View Photo' : 'View Card'}
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>

                      {/* Amount Given */}
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                        {amount}
                      </td>

                      {/* Campaign / Installment Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {item.campaign_no ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              fontSize: '0.72rem', 
                              fontWeight: '800', 
                              background: '#ecfdf5', 
                              color: '#059669', 
                              border: '1px solid #a7f3d0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              width: 'fit-content'
                            }}>
                              ✓ Campaign Run
                            </span>
                            <button 
                              type="button"
                              onClick={() => router.push(`/payment-campaigns?search=${item.campaign_no}`)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                padding: 0, 
                                textAlign: 'left', 
                                cursor: 'pointer', 
                                fontSize: '0.72rem', 
                                fontWeight: '700', 
                                color: '#2563eb', 
                                textDecoration: 'underline' 
                              }}
                              title="View Payment Campaign"
                            >
                              {item.campaign_no}
                            </button>
                          </div>
                        ) : (
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.72rem', 
                            fontWeight: '700', 
                            background: '#fffbeb', 
                            color: '#b45309', 
                            border: '1px solid #fde68a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content'
                          }}>
                            ⏳ Pending
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span className="status-badge" style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: statusInfo.bg, color: statusInfo.color, display: 'inline-block' }}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            title="View Case Details"
                            onClick={() => router.push(`/marriages/${item.id}${isDeathMode ? '?type=death' : ''}`)}
                            style={{ color: '#2563eb', cursor: 'pointer', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={16} />
                          </button>

                          {Number(item.status) !== -1 && (
                            <>
                              <button
                                title="Edit Case Details"
                                onClick={() => router.push(`/marriages/form?id=${item.id}${isDeathMode ? '&type=death' : ''}`)}
                                style={{ color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Pencil size={16} />
                              </button>

                              {(Number(item.status) === 1) && (
                                <button
                                  title="Mark as Settled / Paid"
                                  onClick={() => openSettleModal(item)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}

                              {(!isDeathMode && Number(item.status) === 2) && (
                                <button
                                  title="Mark Tenure as Completed (Stop Dues)"
                                  onClick={() => openCompleteModal(item)}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '8px',
                                    background: '#f3e8ff',
                                    color: '#7e22ce',
                                    border: '1px solid #e9d5ff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Award size={16} />
                                </button>
                              )}

                              <button
                                title="Delete Case"
                                onClick={() => { setDeleteId(item.id); setDeleteEventType(isDeathMode ? 'death' : 'marriage'); }}
                                style={{ color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={16} />
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
          <div style={{ textAlign: 'center', padding: '60px 16px', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{isDeathMode ? '🛡️' : '💍'}</div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
              {isDeathMode ? 'No Death Records Found' : 'No Marriage Records Found'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Try clearing filters or changing your search parameters.</div>
          </div>
        )}

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px', background: '#fff' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '800', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
              <span style={{ fontWeight: '800', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
              <span style={{ fontWeight: '800', color: '#0f172a' }}>{meta.total}</span> records
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

      {/* Settlement Modal (Mark As Settled) */}
      {settleItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSettleItem(null)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              {isDeathMode ? '🛡️ Confirm Death Assistance Settlement' : '💍 Confirm Marriage Settlement'}
            </h2>
            
            <form onSubmit={handleConfirmSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e8edf2', fontSize: '0.82rem', color: '#334155' }}>
                <div><strong>Member:</strong> {getMemberName(settleItem)} ({getMemberCode(settleItem)})</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> {getPlanName(settleItem)}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Amount Given (₹) *</label>
                <input
                  type="number"
                  required
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%' }}
                  placeholder={isDeathMode ? "50000" : "25000"}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  {isDeathMode ? 'Death Certificate / Proof Photo' : 'Marriage Event Photo'}
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '85px', height: '85px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {settlePhotoPreview ? (
                      <img src={settlePhotoPreview} alt="Event preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <Upload size={20} style={{ margin: '0 auto 2px' }} />
                        <span style={{ fontSize: '0.65rem' }}>No photo</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" id="settle-photo-upload" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    <label htmlFor="settle-photo-upload" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block', borderRadius: '10px' }}>
                      Choose Photo
                    </label>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>PNG, JPG or WEBP image format</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Settlement Notes</label>
                <textarea
                  value={settleNotes}
                  onChange={e => setSettleNotes(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', resize: 'none', fontFamily: 'inherit', borderRadius: '12px' }}
                  placeholder="Enter details about amount handover, witnesses or venue..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setSettleItem(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" disabled={settling} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {settling ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Processing...</span>
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

      {/* Mark Completed Modal */}
      {completeItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setCompleteItem(null)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              🏆 Mark Marriage Tenure as Completed
            </h2>
            
            <form onSubmit={handleConfirmComplete} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f5f3ff', padding: '14px', borderRadius: '12px', border: '1px solid #ddd6fe', fontSize: '0.82rem', color: '#4c1d95' }}>
                <div><strong>Member:</strong> {getMemberName(completeItem)} ({getMemberCode(completeItem)})</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> {getPlanName(completeItem)}</div>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.4 }}>
                  ℹ️ Once marked as <strong>Completed</strong>, this member's tenure will conclude and they will <strong>no longer receive new campaign installment dues</strong>.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Completion Notes (Optional)</label>
                <textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', resize: 'none', fontFamily: 'inherit', borderRadius: '12px' }}
                  placeholder="E.g., All tenure contributions finished, service discharged..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="button" onClick={() => setCompleteItem(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" disabled={completing} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff' }}>
                  {completing ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <span>Confirm Completed</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteId(null)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>
              {isDeathMode ? 'Delete Death Record' : 'Delete Marriage Event'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '22px', textAlign: 'center' }}>
              Are you sure you want to delete this event record? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleting} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.85rem', fontWeight: '700' }}>
                {deleting ? 'Deleting...' : 'Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

