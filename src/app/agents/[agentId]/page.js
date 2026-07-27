'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { ArrowLeft, Phone, MapPin, Mail, Edit, Info, FileText, ShieldAlert, CreditCard, Calendar, Eye, Pencil, EyeOff, Copy, Key } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active', class: 'active' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted', class: 'inactive' },
};

const avatarColors = ['#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function AgentDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { agentId } = params;

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zoom lightbox state
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchPassword = async (userId) => {
    if (!userId) return;
    setLoadingPassword(true);
    try {
      const res = await apiRequest(`/api/user/get-password?user_id=${userId}`);
      if (res.s === 1 && res.r) {
        setPasswordData(res.r?.password || (typeof res.r === 'string' ? res.r : res.r?.password_text || null));
      } else {
        setPasswordData(null);
      }
    } catch (err) {
      console.error('Error fetching password:', err);
      setPasswordData(null);
    } finally {
      setLoadingPassword(false);
    }
  };

  // Members state
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [membersMeta, setMembersMeta] = useState(null);
  const [membersPage, setMembersPage] = useState(1);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Tabs & Summary
  const [activeSection, setActiveSection] = useState('Members'); // 'Members' or 'Wallet'
  const [activeTab, setActiveTab] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [counts, setCounts] = useState({ all: 0, active: 0, suspended: 0, upcoming: 0, married: 0 });

  // Wallet State
  const [walletSummary, setWalletSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionsMeta, setCommissionsMeta] = useState(null);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payouts, setPayouts] = useState([]);
  const [payoutsMeta, setPayoutsMeta] = useState(null);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // New Wallet Tabs & Pending Collections State
  const [walletTab, setWalletTab] = useState('Overview');
  const [pendingCollections, setPendingCollections] = useState([]);
  const [pendingMeta, setPendingMeta] = useState(null);
  const [pendingPage, setPendingPage] = useState(1);

  // Mark Paid State
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [markPaidNotes, setMarkPaidNotes] = useState('');
  const [submittingPaid, setSubmittingPaid] = useState(false);

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const [showEditPayoutModal, setShowEditPayoutModal] = useState(false);
  const [editPayoutForm, setEditPayoutForm] = useState({ payout_id: '', amount_paid: '', reference_note: '', payment_mode: '' });
  const [editingPayout, setEditingPayout] = useState(false);

  const openEditPayoutModal = (p) => {
    setEditPayoutForm({
      payout_id: p.id,
      amount_paid: p.amount_paid,
      reference_note: p.reference_note || '',
      payment_mode: p.payment_mode || ''
    });
    setShowEditPayoutModal(true);
  };

  const handleEditPayoutSubmit = async (e) => {
    e.preventDefault();
    setEditingPayout(true);
    try {
      const res = await apiRequest('/api/agent/update-payout', {
        method: 'POST',
        body: JSON.stringify(editPayoutForm)
      });
      if (res.s === 1) {
        showToast('Payout updated successfully', 'success');
        setShowEditPayoutModal(false);
        fetchPayouts();
        fetchWalletSummary();
      } else {
        showToast(res.m || 'Failed to update payout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating payout', 'error');
    } finally {
      setEditingPayout(false);
    }
  };
  const getBadge = (item) => {
    if (item.marriage_status === 2 || item.insurance_status === 2) {
      return { bg: '#dbeafe', color: '#1e3a8a', label: 'Married' };
    }
    if (item.marriage_status === 1) {
      return { bg: '#ffedd5', color: '#c2410c', label: 'Upcoming Marriage' };
    }
    if (item.insurance_status === 1) {
      return { bg: '#dcfce7', color: '#15803d', label: 'Active' };
    }
    if (item.insurance_status === 3) return { bg: '#f3e8ff', color: '#7e22ce', label: 'Invoice Generated' };
    if (item.insurance_status === 0) return { bg: '#fef3c7', color: '#92400e', label: 'Pending/Suspended' };
    if (item.insurance_status === -1) return { bg: '#fee2e2', color: '#991b1b', label: 'Removed' };
    return { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
  };

  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/api/insurance/get-all?limit=100');
      if (res.s === 1 && Array.isArray(res.r)) {
        setPlans(res.r);
      }
    } catch (e) {
      console.error('Error fetching plans:', e);
    }
  };

  const fetchCounts = async () => {
    try {
      const planQuery = selectedPlan ? `&plan_id=${selectedPlan}` : '';
      const [allRes, activeRes, suspendedRes, upcomingRes, marriedRes] = await Promise.all([
        apiRequest(`/api/member/get-all?agent_id=${agentId}&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&insurance_status=1&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&insurance_status=0&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&marriage_status=1&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&marriage_status=2&limit=1${planQuery}`)
      ]);
      setCounts({
        all: allRes?.meta?.total || 0,
        active: activeRes?.meta?.total || 0,
        suspended: suspendedRes?.meta?.total || 0,
        upcoming: upcomingRes?.meta?.total || 0,
        married: marriedRes?.meta?.total || 0
      });
    } catch(err) {
      console.error("Error fetching counts:", err);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    let query = `/api/member/get-all?page=${membersPage}&limit=10&agent_id=${agentId}`;
    if (activeTab === 'Active') query += '&insurance_status=1';
    if (activeTab === 'Suspended') query += '&insurance_status=0';
    if (activeTab === 'Upcoming') query += '&marriage_status=1';
    if (activeTab === 'Married') query += '&marriage_status=2';
    if (selectedPlan) query += `&plan_id=${selectedPlan}`;

    try {
      const res = await apiRequest(query);
      if (res.s === 1 && Array.isArray(res.r)) {
        setMembers(res.r);
        setMembersMeta(res.meta || null);
      } else {
        setMembers([]);
        setMembersMeta(null);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
      setMembersMeta(null);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchWalletSummary = async () => {
    try {
      const res = await apiRequest(`/api/agent/wallet-summary?agent_id=${agentId}`);
      if (res.s === 1 && res.r) setWalletSummary(res.r);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommissions = async () => {
    setLoadingWallet(true);
    try {
      const res = await apiRequest(`/api/agent/commission-history?agent_id=${agentId}&page=${commissionsPage}&limit=10`);
      if (res.s === 1 && res.r) {
        setCommissions(res.r);
        setCommissionsMeta(res.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchPayouts = async () => {
    setLoadingWallet(true);
    try {
      const res = await apiRequest(`/api/agent/payout-history?agent_id=${agentId}&page=${payoutsPage}&limit=10`);
      if (res.s === 1 && res.r) {
        setPayouts(res.r);
        setPayoutsMeta(res.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchPendingCollections = async () => {
    setLoadingWallet(true);
    try {
      const res = await apiRequest(`/api/agent/pending-collections?agent_id=${agentId}&page=${pendingPage}&limit=10`);
      if (res.s === 1 && res.r) {
        setPendingCollections(res.r);
        setPendingMeta(res.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWallet(false);
    }
  };

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
        due_id: selectedDue.due_id,
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
        fetchWalletSummary();
        fetchPendingCollections();
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
        fetchWalletSummary();
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

  const handleAddPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return showToast('Enter valid amount', 'error');
    if (Number(payoutAmount) > Number(walletSummary?.pending_balance || 0)) return showToast('Amount exceeds pending balance', 'error');
    
    setSubmittingPayout(true);
    try {
      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, amount_paid: payoutAmount, reference_note: payoutNotes })
      });
      if (res.s === 1) {
        showToast('Payout recorded successfully', 'success');
        setIsPayoutModalOpen(false);
        setPayoutAmount('');
        setPayoutNotes('');
        fetchWalletSummary();
        fetchPayouts();
      } else {
        showToast(res.m || 'Failed to record payout', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error recording payout', 'error');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const getMemberName = (item) => {
    const details = item.member_details || {};
    const fName = details.first_name || item.first_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName} ${lName}`.replace(/\s+/g, ' ').trim() || item.name || 'Member';
  };

  const getMemberInitials = (item) => {
    const details = item.member_details || {};
    const fName = details.first_name || item.first_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName?.[0] || ''}${lName?.[0] || ''}`.toUpperCase() || 'MB';
  };

  const getMemberProfileImage = (item) => {
    const details = item.member_details || {};
    const imgPath = details.profile_image || details.profile_photo || item.profile_photo || item.profile;
    return imgPath ? getMediaUrl(imgPath) : null;
  };

  const getPlanName = (item) => {
    const planId = item.plan_id;
    const matched = plans.find(p => String(p.id) === String(planId));
    if (matched) return matched.name;
    return item.scheme_name || item.scheme || 'N/A';
  };

  const getMarriageMemberName = (item) => {
    return [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ') || item.name || 'Member';
  };

  const formatMarriageDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      const day = String(d.getDate()).padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return "N/A";
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/agent/get?id=${agentId}`);
      if (res.s === 1 && res.r) {
        setAgent(res.r);
        const userId = res.r.user_id || (res.r.agent_details && res.r.agent_details.user_id);
        if (userId) {
          fetchPassword(userId);
        }
      } else {
        showToast(res.m || 'Failed to fetch agent details.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading agent details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchPlans();
  }, [agentId]);

  useEffect(() => {
    fetchWalletSummary();
  }, [agentId]);

  useEffect(() => {
    if (activeSection === 'Wallet') {
      if (walletTab === 'Overview') fetchPayouts();
      if (walletTab === 'Pending Joining Fees' || walletTab === 'Pending Slips') fetchPendingCollections();
      if (walletTab === 'Collected Joining Fees' || walletTab === 'Paid Slips') fetchCommissions();
    }
  }, [activeSection, walletTab, commissionsPage, payoutsPage, pendingPage]);

  useEffect(() => {
    if (activeSection === 'Members') {
      fetchMembers();
      fetchCounts();
    }
  }, [agentId, membersPage, activeTab, agent, activeSection, selectedPlan]);

  useEffect(() => {
  }, [agentId, payoutsPage, agent, activeSection]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading agent details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px solid #bee3f8', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Agent Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '20px' }}>The agent you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.push('/agents')} className="btn-secondary">
          <ArrowLeft size={16} /> <span>Back to Agents</span>
        </button>
      </div>
    );
  }

  const firstName = agent.first_name || '';
  const middleName = agent.middle_name || '';
  const lastName = agent.last_name || '';
  const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim() || 'Agent';
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'AG';
  const displayStatus = statusStyle[agent.status]?.label || 'Pending';
  const statusClass = statusStyle[agent.status]?.class || 'pending';

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http:') || path.startsWith('https:')) return path;
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const profilePhotoUrl = getMediaUrl(agent.profile || agent.profile_photo);
  const matchedColor = avatarColors[Math.abs(fullName.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={() => router.push('/agents')} 
        className="btn-secondary"
        style={{ marginBottom: '20px', padding: '6px 14px', borderRadius: '9999px' }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> 
        <span>Back to Agent List</span>
      </button>

      {/* Header Profile Box */}
      <div className="premium-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '48px', background: 'var(--primary-gradient)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
          {profilePhotoUrl ? (
            <img 
              src={profilePhotoUrl} 
              alt={fullName}
              onClick={() => setZoomImage(profilePhotoUrl)}
              style={{ 
                width: '72px', height: '72px', 
                borderRadius: '50%', 
                border: '3px solid white',
                boxShadow: 'var(--shadow-md)',
                objectFit: 'cover',
                cursor: 'zoom-in'
              }}
            />
          ) : (
            <div style={{ 
              width: '72px', height: '72px', 
              borderRadius: '50%', 
              background: matchedColor, color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: '800', border: '3px solid white',
              boxShadow: 'var(--shadow-md)'
            }}>
              {initials}
            </div>
          )}
        </div>

        <div style={{ flex: 1, position: 'relative', zIndex: 1, marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fullName}</h1>
              <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.65rem' }}>
                ● {displayStatus} Agent
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> Code: {agent.agent_code || 'Pending'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Registered: {agent.created_at ? agent.created_at.split('T')[0] : 'N/A'}</span>
            </p>
          </div>
          
          {/* Action Button */}
          <div>
            <button className="btn-primary" onClick={() => router.push(`/agents/form?id=${agentId}`)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <Edit size={14} /> <span>Edit Agent Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-r-split-2-1" style={{ alignItems: 'start' }}>
        
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Basic & Personal Information */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <Info size={16} color="var(--primary)" />
              <span>Personal Details</span>
            </h2>
            
            <div className="grid-r-2" style={{ gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Agent Code:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.agent_code || 'Pending'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>First Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.first_name || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Middle Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.middle_name || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Last Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.last_name || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Gender:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.gender || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Date of Birth:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.dob ? agent.dob.split('T')[0] : '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Age:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.age || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Occupation:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.occupation || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Phone:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}><Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />{agent.phone || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Alternate Mobile:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.alt_mobile || agent.alternate_mobile || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Email Address:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}><Mail size={11} style={{ display: 'inline', marginRight: '4px' }} />{agent.email || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Joining Fee Comm.:</span>
                <span style={{ color: 'var(--primary)', fontWeight: '800', marginLeft: '6px' }}>{agent.joining_fee_commission_percent !== null && agent.joining_fee_commission_percent !== undefined ? `${agent.joining_fee_commission_percent}%` : '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Installment Comm.:</span>
                <span style={{ color: 'var(--primary)', fontWeight: '800', marginLeft: '6px' }}>{agent.installment_commission_percent !== null && agent.installment_commission_percent !== undefined ? `${agent.installment_commission_percent}%` : '—'}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Administrative Notes:</span>
                <p style={{ color: 'var(--text-dark)', fontWeight: '600', marginTop: '4px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>{agent.notes || 'No administrative notes recorded.'}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Address Details */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <MapPin size={16} color="var(--primary)" />
              <span>Address Details</span>
            </h2>
            <div className="grid-r-2" style={{ gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Street Address:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.address || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Village / Landmark:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.village || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>City:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.city || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>State:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.state || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Pincode:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{agent.pin || '—'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Verification Documents */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <FileText size={16} color="var(--primary)" />
              <span>KYC Verification Documents</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Aadhaar Front */}
              {(() => {
                const imageUrl = agent.aadhaar_front ? getMediaUrl(agent.aadhaar_front) : null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '200px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Aadhaar Card (Front)</span>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Aadhaar Front"
                          style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Aadhaar Card (Front)'); }}
                        />
                      ) : (
                        <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)', gap: '4px' }}>
                          <ShieldAlert size={20} style={{ opacity: 0.5 }} />
                          <span>Not Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: '700', marginTop: '10px' }}>No: {agent.aadhaar || '—'}</div>
                  </div>
                );
              })()}

              {/* Aadhaar Back */}
              {(() => {
                const imageUrl = agent.aadhaar_back ? getMediaUrl(agent.aadhaar_back) : null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '200px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Aadhaar Card (Back)</span>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Aadhaar Back"
                          style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Aadhaar Card (Back)'); }}
                        />
                      ) : (
                        <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)', gap: '4px' }}>
                          <ShieldAlert size={20} style={{ opacity: 0.5 }} />
                          <span>Not Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: '700', marginTop: '10px' }}>No: {agent.aadhaar || '—'}</div>
                  </div>
                );
              })()}

              {/* PAN Card */}
              {(() => {
                const imageUrl = agent.pan_img ? getMediaUrl(agent.pan_img) : null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '200px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>PAN Card</span>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="PAN Card"
                          style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('PAN Card'); }}
                        />
                      ) : (
                        <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)', gap: '4px' }}>
                          <ShieldAlert size={20} style={{ opacity: 0.5 }} />
                          <span>Not Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: '700', marginTop: '10px' }}>No: {agent.pan || '—'}</div>
                  </div>
                );
              })()}

              {/* Signature */}
              {(() => {
                const imageUrl = agent.signature ? getMediaUrl(agent.signature) : null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '200px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Signature</span>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Signature"
                          style={{ width: '100%', height: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Signature'); }}
                        />
                      ) : (
                        <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)', gap: '4px' }}>
                          <ShieldAlert size={20} style={{ opacity: 0.5 }} />
                          <span>Not Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: '700', marginTop: '10px' }}>—</div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Right Column - Status Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KYC Card */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>KYC Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Aadhaar:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{agent.aadhaar || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>PAN Number:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{agent.pan || '—'}</span>
              </div>
            </div>
          </div>

          {/* Login Information Card */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} color="var(--primary)" />
              Login Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Password:</span>
              {loadingPassword ? (
                <div style={{ color: '#0ea5e9', fontWeight: '600' }}>Loading password...</div>
              ) : !passwordData ? (
                <div style={{ color: '#94a3b8', fontWeight: '600' }}>Password not available</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    flex: 1, 
                    background: '#f8fafc', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border)',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'var(--text-dark)'
                  }}>
                    {showPassword ? passwordData : '••••••••'}
                  </div>
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-secondary"
                    style={{ padding: '8px', borderRadius: '8px' }}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(passwordData);
                      showToast('Password copied!', 'success');
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px', borderRadius: '8px' }}
                    title="Copy Password"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Section Toggle */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <button 
          onClick={() => setActiveSection('Members')} 
          className={activeSection === 'Members' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700' }}
        >
          Members List
        </button>
        <button 
          onClick={() => setActiveSection('Wallet')} 
          className={activeSection === 'Wallet' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', background: activeSection === 'Wallet' ? '#10b981' : '' }}
        >
          Wallet & Commissions
        </button>
      </div>

      {activeSection === 'Members' && (
      <div className="card" style={{ marginTop: '16px', padding: '0', overflow: 'visible' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Members
          </h2>
        </div>
        
        {/* Summary Cards */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e8edf2' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{counts.all}</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '8px' }}>Active Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803d' }}>{counts.active}</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '8px' }}>Suspended Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#92400e' }}>{counts.suspended}</div>
          </div>
          <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', marginBottom: '8px' }}>Upcoming Marriages</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#c2410c' }}>{counts.upcoming}</div>
          </div>
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginBottom: '8px' }}>Married Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1d4ed8' }}>{counts.married}</div>
          </div>
        </div>

        {/* Filter Tabs and Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {['All', 'Active', 'Suspended', 'Upcoming', 'Married'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMembersPage(1); }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: activeTab === tab ? '#0ea5e9' : '#64748b',
                  borderBottom: activeTab === tab ? '2px solid #0ea5e9' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div>
            <select
              value={selectedPlan}
              onChange={(e) => { setSelectedPlan(e.target.value); setMembersPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
            >
              <option value="">All Plans</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingMembers ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No members found for this tab.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['PROFILE', 'MEMBER CODE', 'FULL NAME', 'PHONE', 'PLAN NAME', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(item => {
                    const memberId = item.member_id || item.id;
                    const name = getMemberName(item);
                    const code = item.member_code || memberId || '';
                    const phone = item.member_details?.mobile || item.phone || item.mobile || 'N/A';
                    const plan = getPlanName(item);
                    const badge = getBadge(item);
                    const profileUrl = getMemberProfileImage(item);

                    return (
                      <tr key={memberId} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', overflow: 'hidden' }}>
                            {profileUrl ? (
                              <img src={profileUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              getMemberInitials(item)
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', fontWeight: '700', color: '#475569' }}>{code}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>{phone}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                            {plan}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: badge.bg, color: badge.color }}>
                            ● {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {membersMeta && membersMeta.total > 0 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                  Showing <span style={{ fontWeight: '700', color: '#0f172a' }}>{membersMeta.skip + 1}</span> to{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{Math.min(membersMeta.skip + membersMeta.limit, membersMeta.total)}</span> of{' '}
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{membersMeta.total}</span> members
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    disabled={!membersMeta.hasPrev}
                    onClick={() => setMembersPage(p => Math.max(1, p - 1))}
                    style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid #e8edf2', background: membersMeta.hasPrev ? '#fff' : '#f8fafc', color: membersMeta.hasPrev ? '#475569' : '#94a3b8', cursor: membersMeta.hasPrev ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', minWidth: '30px', textAlign: 'center' }}>
                    {membersPage}
                  </span>
                  <button
                    disabled={!membersMeta.hasNext}
                    onClick={() => setMembersPage(p => p + 1)}
                    style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid #e8edf2', background: membersMeta.hasNext ? '#fff' : '#f8fafc', color: membersMeta.hasNext ? '#475569' : '#94a3b8', cursor: membersMeta.hasNext ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Wallet Section */}
      {activeSection === 'Wallet' && (
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Wallet Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['Overview', 'Pending Joining Fees', 'Collected Joining Fees', 'Pending Slips', 'Paid Slips'].map(tab => (
            <button
              key={tab}
              onClick={() => { setWalletTab(tab); setPendingPage(1); setCommissionsPage(1); }}
              style={{
                padding: '8px 16px',
                background: walletTab === tab ? '#0f172a' : 'transparent',
                color: walletTab === tab ? '#fff' : '#64748b',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {walletTab === 'Overview' && (
        <>
          {/* Wallet Summary */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'linear-gradient(to right, #f8fafc, #fff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Collections & Commissions Overview</h2>
              <button 
                className="btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => setIsPayoutModalOpen(true)}
              >
                + Record Payout
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Joining Collected</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>₹{Number(walletSummary?.total_joining_collected || 0).toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '600', marginTop: '4px' }}>Pending: ₹{Number(walletSummary?.pending_joining_fees || 0).toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Slips Collected</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>₹{Number(walletSummary?.total_installment_collected || 0).toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '600', marginTop: '4px' }}>Pending: ₹{Number(walletSummary?.pending_installment_fees || 0).toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Commission Earned</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>₹{Number(walletSummary?.total_earned || 0).toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Total Paid Out</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6' }}>₹{Number(walletSummary?.total_paid || 0).toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '2px solid #f59e0b', boxShadow: '0 4px 6px -1px rgba(245,158,11,0.1)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Balance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>₹{Number(walletSummary?.pending_balance || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Payouts History</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {['DATE', 'AMOUNT (₹)', 'NOTES', 'PROCESSED BY', 'ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No payouts recorded yet.</td></tr>
                  ) : (
                    payouts.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '800' }}>- {Number(p.amount_paid).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{p.reference_note || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>{p.processed_by_name || 'Admin'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => openEditPayoutModal(p)}
                            title="Edit Payout"
                            style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', borderColor: '#bae6fd', background: '#f0f9ff' }}
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Payouts Pagination */}
            {payoutsMeta && payoutsMeta.total > 0 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                  Showing <span style={{ fontWeight: '700' }}>{payoutsMeta.skip + 1}</span> to <span style={{ fontWeight: '700' }}>{Math.min(payoutsMeta.skip + payoutsMeta.limit, payoutsMeta.total)}</span> of <span style={{ fontWeight: '700' }}>{payoutsMeta.total}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={!payoutsMeta.hasPrev} onClick={() => setPayoutsPage(p => p - 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Prev</button>
                  <button disabled={!payoutsMeta.hasNext} onClick={() => setPayoutsPage(p => p + 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Next</button>
                </div>
              </div>
            )}
          </div>
        </>
        )}

        {walletTab === 'Pending Joining Fees' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fffaf0' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#b45309', margin: 0 }}>Pending Joining Fees</h2>
          </div>
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
                {pendingCollections.filter(d => d.type === 'JOINING_FEE').length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No pending joining fees found.</td></tr>
                ) : (
                  pendingCollections.filter(d => d.type === 'JOINING_FEE').map(due => (
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
                          style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
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
        </div>
        )}

        {walletTab === 'Pending Slips' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fffaf0' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#b45309', margin: 0 }}>Pending Payment Slips</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['MEMBER', 'PHONE', 'CAMPAIGN / PLAN', 'DUE DATE', 'AMOUNT (₹)', 'ACTION'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingCollections.filter(d => d.type === 'INSTALLMENT').length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No pending slips found.</td></tr>
                ) : (
                  pendingCollections.filter(d => d.type === 'INSTALLMENT').map(due => (
                    <tr key={due.due_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{due.member_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{due.member_code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569' }}>{due.phone || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>{due.campaign_no || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{due.plan_name || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{new Date(due.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#f59e0b', fontWeight: '800' }}>₹{Number(due.amount).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button 
                          onClick={() => openMarkPaidModal(due)}
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
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
        </div>
        )}

        {(walletTab === 'Pending Joining Fees' || walletTab === 'Pending Slips') && pendingMeta && pendingMeta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '0 0 12px 12px', borderTop: '1px solid #f1f5f9', border: '1px solid #e2e8f0', marginTop: '-24px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '700' }}>{pendingMeta.skip + 1}</span> to <span style={{ fontWeight: '700' }}>{Math.min(pendingMeta.skip + pendingMeta.limit, pendingMeta.total)}</span> of <span style={{ fontWeight: '700' }}>{pendingMeta.total}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={!pendingMeta.hasPrev} onClick={() => setPendingPage(p => p - 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Prev</button>
              <button disabled={!pendingMeta.hasNext} onClick={() => setPendingPage(p => p + 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Next</button>
            </div>
          </div>
        )}

        {walletTab === 'Collected Joining Fees' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Collected Joining Fees</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['MEMBER', 'DATE', 'FEE COLLECTED', 'COMMISSION EARNED'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.filter(c => c.transaction_type === 'JOINING_FEE').length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No collected joining fees found.</td></tr>
                ) : (
                  commissions.filter(c => c.transaction_type === 'JOINING_FEE').map(comm => (
                    <tr key={comm.reference_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{comm.member_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{comm.member_code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{new Date(comm.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#10b981', fontWeight: '800' }}>₹{Number(comm.collected_amount).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '800' }}>₹{Number(comm.commission_amount || comm.commission_earned).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {walletTab === 'Paid Slips' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Paid Payment Slips</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['MEMBER', 'DATE', 'AMOUNT COLLECTED', 'COMMISSION EARNED'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.filter(c => c.transaction_type === 'INSTALLMENT').length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No paid slips found.</td></tr>
                ) : (
                  commissions.filter(c => c.transaction_type === 'INSTALLMENT').map(comm => (
                    <tr key={comm.reference_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{comm.member_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{comm.member_code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>{new Date(comm.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#10b981', fontWeight: '800' }}>₹{Number(comm.collected_amount).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '800' }}>₹{Number(comm.commission_earned).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {(walletTab === 'Collected Joining Fees' || walletTab === 'Paid Slips') && commissionsMeta && commissionsMeta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '0 0 12px 12px', borderTop: '1px solid #f1f5f9', border: '1px solid #e2e8f0', marginTop: '-24px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '700' }}>{commissionsMeta.skip + 1}</span> to <span style={{ fontWeight: '700' }}>{Math.min(commissionsMeta.skip + commissionsMeta.limit, commissionsMeta.total)}</span> of <span style={{ fontWeight: '700' }}>{commissionsMeta.total}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button disabled={!commissionsMeta.hasPrev} onClick={() => setCommissionsPage(p => p - 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Prev</button>
              <button disabled={!commissionsMeta.hasNext} onClick={() => setCommissionsPage(p => p + 1)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Next</button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Mark Paid Modal */}
      {showMarkPaidModal && selectedDue && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Collect {selectedDue.type === 'JOINING_FEE' ? 'Joining Fee' : 'Payment Slip'}</h3>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Confirm collection of up to <strong>₹{selectedDue.amount}</strong> from <strong>{selectedDue.member_name}</strong>.
            </div>
            <form onSubmit={selectedDue.type === 'JOINING_FEE' ? handleMarkJoiningPaid : handleMarkPaid} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Amount Collected (₹) *</label>
                <input type="number" max={selectedDue.amount} required value={markPaidAmount} onChange={e => setMarkPaidAmount(e.target.value)} className="premium-input" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowMarkPaidModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={submittingPaid} className="btn-primary" style={{ flex: 1, padding: '10px', background: '#10b981', borderColor: '#10b981' }}>
                  {submittingPaid ? 'Saving...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Record Agent Payout</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Pending Balance</label>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f59e0b' }}>₹{Number(walletSummary?.pending_balance || 0).toFixed(2)}</div>
            </div>

            <form onSubmit={handleAddPayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Payout Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  max={walletSummary?.pending_balance || 0} 
                  value={payoutAmount} 
                  onChange={e => setPayoutAmount(e.target.value)} 
                  className="premium-input" 
                  placeholder="Enter amount" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={payoutNotes} 
                  onChange={e => setPayoutNotes(e.target.value)} 
                  className="premium-input" 
                  placeholder="e.g. Bank transfer ref #..." 
                  style={{ width: '100%' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={submittingPayout} className="btn-primary" style={{ flex: 1, padding: '10px' }}>{submittingPayout ? 'Saving...' : 'Record Payout'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payout Modal */}
      {showEditPayoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Edit Agent Payout</h3>

            <form onSubmit={handleEditPayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Payout Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  value={editPayoutForm.amount_paid} 
                  onChange={e => setEditPayoutForm({...editPayoutForm, amount_paid: e.target.value})} 
                  className="premium-input" 
                  placeholder="Enter amount" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={editPayoutForm.reference_note} 
                  onChange={e => setEditPayoutForm({...editPayoutForm, reference_note: e.target.value})} 
                  className="premium-input" 
                  placeholder="e.g. Bank transfer ref #..." 
                  style={{ width: '100%' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowEditPayoutModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={editingPayout} className="btn-primary" style={{ flex: 1, padding: '10px' }}>{editingPayout ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setZoomImage(null)}
        >
          <div 
            style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh', background: 'white', borderRadius: '16px', padding: '10px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.875rem', color: '#0f172a' }}>{zoomTitle || 'Image Preview'}</span>
              <button 
                onClick={() => setZoomImage(null)}
                style={{ cursor: 'pointer', padding: '4px', fontWeight: '700', color: '#64748b', border: 'none', background: 'none', fontFamily: 'inherit' }}
              >
                Close (X)
              </button>
            </div>
            <img src={zoomImage} alt="Lightbox Zoom" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

    </div>
  );
}
