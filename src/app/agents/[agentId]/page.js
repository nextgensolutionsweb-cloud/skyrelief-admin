'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Mail, Edit, Info, FileText, ShieldAlert, CreditCard, Calendar, Eye, Pencil, Trash2, EyeOff, Copy, Key, Download, Users, Shield, ShieldCheck, CheckCircle2, User, Heart, Sparkles } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active', class: 'active' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted', class: 'inactive' },
};

const avatarColors = ['#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

const calculateExactAge = (dobString) => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  
  return parts.length > 0 ? parts.join(', ') : '0 days';
};

const formatAadhaar = (aadhaar) => {
  if (!aadhaar) return '—';
  const cleaned = String(aadhaar).replace(/\D/g, '');
  if (cleaned.length === 12) {
    return cleaned.match(/.{1,4}/g).join(' ');
  }
  return aadhaar;
};

export default function AgentDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { agentId } = params;

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

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

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('JOINING_FEE');
  const [exportStatuses, setExportStatuses] = useState(['PENDING']);
  const [exportPlanId, setExportPlanId] = useState('ALL');

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
  const [deposits, setDeposits] = useState([]);
  const [depositsPage, setDepositsPage] = useState(1);
  const [deductCommission, setDeductCommission] = useState(true);
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

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositPaymentMode, setDepositPaymentMode] = useState('Cash');
  const [depositProofImage, setDepositProofImage] = useState(null);
  const [payoutProofImage, setPayoutProofImage] = useState(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const [showEditPayoutModal, setShowEditPayoutModal] = useState(false);
  const [editPayoutForm, setEditPayoutForm] = useState({ payout_id: '', amount_paid: '', reference_note: '', payment_mode: '' });
  const [editingPayout, setEditingPayout] = useState(false);

  const [showEditDepositModal, setShowEditDepositModal] = useState(false);
  const [editDepositForm, setEditDepositForm] = useState({ deposit_id: '', amount: '', reference_note: '', payment_mode: '' });
  const [editingDeposit, setEditingDeposit] = useState(false);

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

  const handleDeletePayout = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payout?')) return;
    try {
      const res = await apiRequest('/api/agent/delete-payout', {
        method: 'POST',
        body: JSON.stringify({ payout_id: id })
      });
      if (res.s === 1) {
        showToast('Payout deleted successfully', 'success');
        fetchPayouts();
        fetchWalletSummary();
      } else {
        showToast(res.m || 'Failed to delete payout', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting payout', 'error');
    }
  };

  const openEditDepositModal = (d) => {
    setEditDepositForm({
      deposit_id: d.id,
      amount: d.amount,
      reference_note: d.reference_note || '',
      payment_mode: d.payment_mode || 'Cash'
    });
    setShowEditDepositModal(true);
  };

  const handleEditDepositSubmit = async (e) => {
    e.preventDefault();
    setEditingDeposit(true);
    try {
      const res = await apiRequest('/api/agent/update-deposit', {
        method: 'POST',
        body: JSON.stringify(editDepositForm)
      });
      if (res.s === 1) {
        showToast('Deposit updated successfully', 'success');
        setShowEditDepositModal(false);
        fetchDeposits();
        fetchWalletSummary();
      } else {
        showToast(res.m || 'Failed to update deposit', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating deposit', 'error');
    } finally {
      setEditingDeposit(false);
    }
  };

  const handleDeleteDeposit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deposit?')) return;
    try {
      const res = await apiRequest('/api/agent/delete-deposit', {
        method: 'POST',
        body: JSON.stringify({ deposit_id: id })
      });
      if (res.s === 1) {
        showToast('Deposit deleted successfully', 'success');
        fetchDeposits();
        fetchWalletSummary();
      } else {
        showToast(res.m || 'Failed to delete deposit', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting deposit', 'error');
    }
  };

  const getBadge = (item) => {
    if (item.insurance_status === 2) return { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' };
    if (item.marriage_status === 2) {
      return { bg: '#dbeafe', color: '#1e3a8a', label: 'Married' };
    }
    if (item.marriage_status === 1) {
      return { bg: '#ffedd5', color: '#c2410c', label: 'Upcoming Marriage' };
    }
    if (item.insurance_status === 1) {
      return { bg: '#dcfce7', color: '#15803d', label: 'Active' };
    }
    if (item.insurance_status === 0) return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
    if (item.account_status === 2) return { bg: '#fee2e2', color: '#ef4444', label: 'Suspended' };
    if (item.insurance_status === 4) return { bg: '#dcfce7', color: '#22c55e', label: 'Settled' };
    if (item.insurance_status === 5) return { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' };
    if (item.insurance_status === 6) return { bg: '#fef9c3', color: '#ca8a04', label: 'Upcoming' };
    if (item.insurance_status === 7) return { bg: '#ede9fe', color: '#6d28d9', label: 'Married' };
    if (item.insurance_status === -1) return { bg: '#f3f4f6', color: '#4b5563', label: 'Removed' };
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
      const [allRes, activeRes, suspendedRes, upcomingRes, marriedRes, rejectedRes] = await Promise.all([
        apiRequest(`/api/member/get-all?agent_id=${agentId}&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&insurance_status=1&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&account_status=2&insurance_status=!2&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&marriage_status=1&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&marriage_status=2&limit=1${planQuery}`),
        apiRequest(`/api/member/get-all?agent_id=${agentId}&insurance_status=2&limit=1${planQuery}`)
      ]);
      setCounts({
        all: allRes?.meta?.total || 0,
        active: activeRes?.meta?.total || 0,
        suspended: suspendedRes?.meta?.total || 0,
        upcoming: upcomingRes?.meta?.total || 0,
        married: marriedRes?.meta?.total || 0,
        rejected: rejectedRes?.meta?.total || 0
      });
    } catch(err) {
      console.error("Error fetching counts:", err);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    let query = `/api/member/get-all?page=${membersPage}&limit=10&agent_id=${agentId}`;
    if (activeTab === 'Active') query += '&insurance_status=1';
    if (activeTab === 'Suspended') query += '&account_status=2&insurance_status=!2';
    if (activeTab === 'Rejected') query += '&insurance_status=2';
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

  const fetchDeposits = async () => {
    try {
      const res = await apiRequest(`/api/agent/deposits?agent_id=${agentId}`);
      if (res.s === 1 && res.r) {
        setDeposits(res.r);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPendingCollections = async () => {
    setLoadingWallet(true);
    try {
      const filterParam = walletTab === 'Pending Slips' ? 'pending_slips' : (walletTab === 'Pending Joining Fees' ? 'pending_joining' : '');
      const res = await apiRequest(`/api/agent/pending-collections?agent_id=${agentId}${filterParam ? `&filter=${filterParam}` : ''}&page=${pendingPage}&limit=10`);
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
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('amount_paid', payoutAmount);
      formData.append('reference_note', payoutNotes);
      if (payoutProofImage) formData.append('proof_image', payoutProofImage);

      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        body: formData
      });
      if (res.s === 1) {
        showToast('Payout recorded successfully', 'success');
        setIsPayoutModalOpen(false);
        setPayoutAmount('');
        setPayoutNotes('');
        setPayoutProofImage(null);
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

  const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return showToast('Enter valid amount', 'error');
    
    setSubmittingDeposit(true);
    try {
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('amount', depositAmount);
      formData.append('reference_note', depositNotes);
      formData.append('payment_mode', depositPaymentMode);
      if (depositProofImage) formData.append('proof_image', depositProofImage);

      const res = await apiRequest('/api/agent/deposit', {
        method: 'POST',
        body: formData
      });
      if (res.s === 1) {
        showToast('Deposit recorded successfully', 'success');
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositNotes('');
        setDepositPaymentMode('Cash');
        setDepositProofImage(null);
        fetchWalletSummary();
        fetchDeposits();
      } else {
        showToast(res.m || 'Failed to record deposit', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error recording deposit', 'error');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const getMemberName = (item) => {
    const details = item.member_details || {};
    const fName = details.first_name || item.first_name || '';
    const mName = details.middle_name || item.middle_name || '';
    const lName = details.last_name || item.last_name || '';
    return `${fName} ${mName} ${lName}`.replace(/\s+/g, ' ').trim() || item.name || 'Member';
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
    if (activeSection === 'Wallet') {
      fetchPayouts();
      fetchDeposits();
      fetchPendingCollections();
    }
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
        <button onClick={() => router.back()} className="btn-secondary">
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
    <div style={{ maxWidth: '1380px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Top Bar: Back Button + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => router.back()} 
          className="btn-secondary"
          style={{ padding: '7px 16px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> 
          <span>Back to Agents Directory</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Directory</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '700' }}>{fullName}</span>
          <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '9999px', fontWeight: '750', marginLeft: '6px' }}>
            ● {displayStatus} Agent
          </span>
        </div>
      </div>

      {/* Main Unified Executive Hero Card */}
      <div className="premium-card" style={{ 
        position: 'relative',
        padding: '28px 32px 24px 32px', 
        marginBottom: '24px', 
        borderRadius: '20px', 
        border: '1px solid #e2e8f0', 
        background: '#ffffff',
        boxShadow: '0 4px 25px -4px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden'
      }}>
        {/* Top Accent Gradient Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #0284c7 0%, #3b82f6 50%, #6366f1 100%)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          {/* Left: Avatar + Identity Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
            {/* Avatar Container with 100% Reliable Fallback & Initials Underlay */}
            <div style={{ 
              position: 'relative', 
              flexShrink: 0, 
              width: '88px', 
              height: '88px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '850',
              letterSpacing: '0.02em',
              border: '3px solid #ffffff',
              boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
              overflow: 'hidden',
              userSelect: 'none'
            }}>
              <span>{initials}</span>

              {profilePhotoUrl && !imgError && (
                <img 
                  src={profilePhotoUrl} 
                  alt=""
                  onError={() => setImgError(true)}
                  onClick={() => { setZoomImage(profilePhotoUrl); setZoomTitle('Profile Photo'); }}
                  style={{ 
                    position: 'absolute',
                    inset: 0,
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    cursor: 'zoom-in'
                  }}
                />
              )}

              <span style={{ 
                position: 'absolute', 
                bottom: '2px', 
                right: '2px', 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                background: agent.status === 1 ? '#10b981' : '#f59e0b', 
                border: '2.5px solid #ffffff', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 2
              }} title={`Status: ${displayStatus}`} />
            </div>

            {/* Name, Code, and Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: '850', color: '#0f172a', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                  {fullName}
                </h1>
                
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  fontSize: '0.74rem', 
                  padding: '4px 11px', 
                  borderRadius: '9999px', 
                  fontWeight: '750',
                  background: agent.status === 1 ? '#ecfdf5' : '#fffbeb',
                  color: agent.status === 1 ? '#047857' : '#b45309',
                  border: agent.status === 1 ? '1px solid #a7f3d0' : '1px solid #fde68a'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agent.status === 1 ? '#10b981' : '#f59e0b' }} />
                  {displayStatus} Agent
                </span>

                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  fontSize: '0.74rem', 
                  color: '#0284c7', 
                  background: '#e0f2fe', 
                  border: '1px solid #bae6fd',
                  padding: '4px 11px', 
                  borderRadius: '9999px', 
                  fontWeight: '750' 
                }}>
                  <ShieldCheck size={14} strokeWidth={2.4} /> Official Agent
                </span>
              </div>

              {/* Info Badges Strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(agent.agent_code || '');
                    showToast('Agent code copied!', 'success');
                  }}
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                    border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', 
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                  title="Click to copy agent code"
                >
                  <CreditCard size={13} color="#0284c7" />
                  <span>Code: <strong style={{ color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{agent.agent_code || 'Pending'}</strong></span>
                  <Copy size={11} style={{ opacity: 0.5, marginLeft: '2px' }} />
                </div>

                {agent.phone && (
                  <a 
                    href={`tel:${agent.phone}`}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', 
                      background: '#f0fdf4', padding: '5px 12px', borderRadius: '8px', 
                      border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#15803d', 
                      fontWeight: '750', textDecoration: 'none' 
                    }}
                  >
                    <Phone size={12} color="#16a34a" />
                    <span>{agent.phone}</span>
                  </a>
                )}

                {agent.email && (
                  <a 
                    href={`mailto:${agent.email}`}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', 
                      background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                      border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', 
                      fontWeight: '600', textDecoration: 'none' 
                    }}
                  >
                    <Mail size={12} color="#0284c7" />
                    <span>{agent.email}</span>
                  </a>
                )}

                {agent.created_at && (
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                    border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b', 
                    fontWeight: '600' 
                  }}>
                    <Calendar size={12} color="#64748b" />
                    <span>Registered: <strong style={{ color: '#334155' }}>{agent.created_at.split('T')[0]}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              onClick={() => router.push(`/agents/form?id=${agentId}`)} 
              style={{ 
                padding: '9px 18px', 
                fontSize: '0.82rem', 
                fontWeight: '750', 
                borderRadius: '10px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '7px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.28)'
              }}
            >
              <Edit size={14} /> <span>Edit Agent Details</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => {
                setActiveSection('Wallet');
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }} 
              style={{ 
                padding: '9px 15px', 
                fontSize: '0.82rem', 
                fontWeight: '700', 
                borderRadius: '10px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '7px',
                background: '#ffffff',
                border: '1px solid #cbd5e1'
              }}
            >
              <CreditCard size={14} color="#0284c7" /> <span>View Wallet</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip at Bottom of Hero Card */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '14px', 
          marginTop: '24px', 
          paddingTop: '20px', 
          borderTop: '1px solid #f1f5f9' 
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Assigned Members</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                {counts.all || 0} Members
              </span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Joining Fee Comm.</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#15803d', display: 'block', marginTop: '2px' }}>
                {agent.joining_fee_commission_percent !== null && agent.joining_fee_commission_percent !== undefined ? `${agent.joining_fee_commission_percent}%` : '0%'}
              </span>
            </div>
          </div>

          <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Installment Comm.</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1d4ed8', display: 'block', marginTop: '2px' }}>
                {agent.installment_commission_percent !== null && agent.installment_commission_percent !== undefined ? `${agent.installment_commission_percent}%` : '0%'}
              </span>
            </div>
          </div>

          <div style={{ background: '#faf5ff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f3e8ff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#6b21a8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Demographics</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#6d28d9', display: 'block', marginTop: '2px' }}>
                {agent.gender || '—'} • {calculateExactAge(agent.dob) || (agent.age ? `${agent.age} Yrs` : '—')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* Card 1: Basic & Personal Information */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Personal Details</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Agent personal identity and operational commission rates</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>First Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.first_name || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Middle Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.middle_name || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.last_name || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gender</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.gender || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date of Birth</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.dob ? agent.dob.split('T')[0] : '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calculated Age</span>
                <span style={{ color: '#0284c7', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>
                  {calculateExactAge(agent.dob) || (agent.age ? `${agent.age} Yrs` : '—')}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primary Phone</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Phone size={13} color="#0284c7" />
                  {agent.phone || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Alternate Mobile</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Phone size={13} color="#64748b" />
                  {agent.alt_mobile || agent.alternate_mobile || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Mail size={13} color="#0284c7" />
                  {agent.email || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Occupation</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{agent.occupation || '—'}</span>
              </div>
              <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                <span style={{ color: '#166534', fontWeight: '700', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Joining Fee Comm.</span>
                <span style={{ color: '#15803d', fontWeight: '800', fontSize: '1rem', marginTop: '2px', display: 'block' }}>
                  {agent.joining_fee_commission_percent !== null && agent.joining_fee_commission_percent !== undefined ? `${agent.joining_fee_commission_percent}%` : '—'}
                </span>
              </div>
              <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                <span style={{ color: '#1e40af', fontWeight: '700', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Installment Comm.</span>
                <span style={{ color: '#1d4ed8', fontWeight: '800', fontSize: '1rem', marginTop: '2px', display: 'block' }}>
                  {agent.installment_commission_percent !== null && agent.installment_commission_percent !== undefined ? `${agent.installment_commission_percent}%` : '—'}
                </span>
              </div>
            </div>

            {/* Government Aadhaar Highlight Box */}
            <div style={{ marginTop: '14px', background: '#eff6ff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ color: '#1e40af', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="#2563eb" /> Government Aadhaar Number
                </span>
                <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.15rem', letterSpacing: '0.12em', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                  {formatAadhaar(agent.aadhaar)}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                Official Identity Verified
              </span>
            </div>

            {/* Notes Section */}
            {agent.notes && (
              <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: '700', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Administrative Notes</span>
                <p style={{ color: '#334155', fontWeight: '600', fontSize: '0.85rem', margin: '4px 0 0 0', lineHeight: 1.4 }}>{agent.notes}</p>
              </div>
            )}
          </div>

          {/* Card 2: Address Details */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Address Details</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Agent operational area and registered headquarters</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street / Operational Address</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.95rem', marginTop: '4px', display: 'block', lineHeight: 1.4 }}>
                  {agent.address || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Village / Landmark</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>{agent.village || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>{agent.city || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>{agent.state || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PIN Code</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>{agent.pin || '—'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Verification Documents */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>KYC Identity Documents</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Government verification scans and authorized signature</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Aadhaar Front */}
              {(() => {
                const imageUrl = agent.aadhaar_front ? getMediaUrl(agent.aadhaar_front) : null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>Aadhaar (Front)</span>
                        <span style={{ fontSize: '0.68rem', color: imageUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imageUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imageUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Aadhaar Card (Front)'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imageUrl} 
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(15,23,42,0.75)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Click to zoom
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', width: '100%', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                          <FileText size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '750', marginTop: '10px', fontFamily: 'monospace' }}>
                      {formatAadhaar(agent.aadhaar)}
                    </div>
                  </div>
                );
              })()}

              {/* Aadhaar Back */}
              {(() => {
                const imageUrl = agent.aadhaar_back ? getMediaUrl(agent.aadhaar_back) : null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>Aadhaar (Back)</span>
                        <span style={{ fontSize: '0.68rem', color: imageUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imageUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imageUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Aadhaar Card (Back)'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imageUrl} 
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(15,23,42,0.75)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Click to zoom
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', width: '100%', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                          <FileText size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '750', marginTop: '10px', fontFamily: 'monospace' }}>
                      {formatAadhaar(agent.aadhaar)}
                    </div>
                  </div>
                );
              })()}

              {/* PAN Card */}
              {(() => {
                const imageUrl = agent.pan_img ? getMediaUrl(agent.pan_img) : null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>PAN Card</span>
                        <span style={{ fontSize: '0.68rem', color: imageUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imageUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imageUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('PAN Card'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imageUrl} 
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(15,23,42,0.75)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Click to zoom
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', width: '100%', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                          <FileText size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '750', marginTop: '10px', fontFamily: 'monospace' }}>
                      PAN: {agent.pan || '—'}
                    </div>
                  </div>
                );
              })()}

              {/* Signature */}
              {(() => {
                const imageUrl = agent.signature ? getMediaUrl(agent.signature) : null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>Signature</span>
                        <span style={{ fontSize: '0.68rem', color: imageUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imageUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imageUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imageUrl); setZoomTitle('Signature'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imageUrl} 
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(15,23,42,0.75)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Click to zoom
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', background: '#f1f5f9', width: '100%', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                          <FileText size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginTop: '10px' }}>
                      Authorized Sign
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Right Column - Status Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KYC Card */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                KYC Verification
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Aadhaar:</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontFamily: 'monospace' }}>{formatAadhaar(agent.aadhaar)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>PAN Number:</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontFamily: 'monospace' }}>{agent.pan || '—'}</span>
              </div>
            </div>
          </div>

          {/* Login Information Card */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={15} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Portal Credentials
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.72rem' }}>Agent Login Password</span>
              {loadingPassword ? (
                <div style={{ color: '#0ea5e9', fontWeight: '600' }}>Loading password...</div>
              ) : !passwordData ? (
                <div style={{ color: '#94a3b8', fontWeight: '600' }}>Password not generated</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    flex: 1, 
                    background: '#f8fafc', 
                    padding: '10px 14px', 
                    borderRadius: '10px', 
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    fontWeight: '750',
                    color: '#0f172a'
                  }}>
                    {showPassword ? passwordData : '••••••••••••'}
                  </div>
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-secondary"
                    style={{ padding: '10px', borderRadius: '10px' }}
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
                    style={{ padding: '10px', borderRadius: '10px' }}
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
          <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#db2777', textTransform: 'uppercase', marginBottom: '8px' }}>Rejected Members</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#be185d' }}>{counts.rejected}</div>
          </div>
        </div>

        {/* Filter Tabs and Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {['All', 'Active', 'Suspended', 'Rejected', 'Upcoming', 'Married'].map(tab => (
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
                  {members.map((item, idx) => {
                    const memberId = item.member_id || item.id;
                    const name = getMemberName(item);
                    const code = item.member_code || memberId || '';
                    const phone = item.member_details?.mobile || item.phone || item.mobile || 'N/A';
                    const plan = getPlanName(item);
                    const badge = getBadge(item);
                    const profileUrl = getMemberProfileImage(item);
                    const rowKey = `m-${memberId}-${item.insurance_id || idx}`;

                    return (
                      <tr key={rowKey} style={{ borderBottom: '1px solid #f8fafc' }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
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
          <button 
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}
            onClick={() => setShowExportModal(true)}
          >
            <Download size={16} /> Export Report
          </button>
        </div>

        {walletTab === 'Overview' && (
        <>
          {/* Member Collections Summary */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'linear-gradient(to right, #f8fafc, #fff)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Member Collections Breakdown</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>Total Amount Collected</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#15803d' }}>
                    ₹{(Number(walletSummary?.total_joining_collected || 0) + Number(walletSummary?.total_installment_collected || 0)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', fontWeight: '500' }}>
                    (Joining: ₹{Number(walletSummary?.total_joining_collected || 0).toFixed(2)} + Slips: ₹{Number(walletSummary?.total_installment_collected || 0).toFixed(2)})
                  </div>
                </div>
                
                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', marginBottom: '8px' }}>Total Amount Pending</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#b45309' }}>
                    ₹{(Number(walletSummary?.pending_joining_fees || 0) + Number(walletSummary?.pending_installment_fees || 0)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '4px', fontWeight: '500' }}>
                    (Joining: ₹{Number(walletSummary?.pending_joining_fees || 0).toFixed(2)} + Slips: ₹{Number(walletSummary?.pending_installment_fees || 0).toFixed(2)})
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Settlements Summary */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'linear-gradient(to right, #f0fdf4, #fff)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Agent Settlements Overview</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  + Receive Payment
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Submitted to Admin</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#3b82f6' }}>₹{Number(walletSummary?.total_deposited || 0).toFixed(2)}</div>
              </div>
              
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '2px solid #ef4444', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.1)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>Balance Due to Admin</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.7rem', color: '#475569', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={deductCommission} 
                      onChange={(e) => setDeductCommission(e.target.checked)} 
                      style={{ cursor: 'pointer', accentColor: '#10b981' }} 
                    />
                    Deduct Commission
                  </label>
                </div>
                
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>
                  ₹{(() => {
                    const totalCollected = Number(walletSummary?.total_joining_collected || 0) + Number(walletSummary?.total_installment_collected || 0);
                    const totalSubmitted = Number(walletSummary?.total_deposited || 0);
                    const commissionEarned = Number(walletSummary?.total_earned || 0);
                    const balance = deductCommission ? (totalCollected - totalSubmitted - commissionEarned) : (totalCollected - totalSubmitted);
                    return balance.toFixed(2);
                  })()}
                </div>
                
                <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '6px', fontWeight: '500', fontStyle: 'italic' }}>
                  {deductCommission ? 'Calculation: (Total Collected) - (Submitted) - (Commission Earned)' : 'Calculation: (Total Collected) - (Submitted)'}
                </div>
              </div>
            </div>
          </div>

          {/* Commission Overview */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'linear-gradient(to right, #f8fafc, #fff)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Commission Overview</h2>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => setIsPayoutModalOpen(true)}
              >
                + Pay Commission
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Commission Earned</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>₹{Number(walletSummary?.total_earned || 0).toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Commission Paid</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#8b5cf6' }}>₹{Number(walletSummary?.total_paid || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {/* Deposits Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', margin: 0 }}>Deposits History (Receipts)</h2>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                    <tr>
                      {['DATE', 'AMOUNT (₹)', 'MODE', 'NOTES', 'PROOF', 'ACTIONS'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No deposits recorded yet.</td></tr>
                    ) : (
                      deposits.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#10b981', fontWeight: '800' }}>+ {Number(d.amount).toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {d.proof_image ? (
                              <button onClick={() => { setZoomTitle('Deposit Proof'); setZoomImage(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${d.proof_image}`); }} style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => openEditDepositModal(d)}
                                title="Edit Deposit"
                                style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', borderColor: '#bae6fd', background: '#f0f9ff', border: '1px solid #bae6fd' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteDeposit(d.id)}
                                title="Delete Deposit"
                                style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2', border: '1px solid #fca5a5' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payouts Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Commission Payouts History</h2>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f1f5f9' }}>
                    <tr>
                      {['DATE', 'AMOUNT (₹)', 'NOTES', 'PROOF', 'ACTIONS'].map(h => (
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
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {p.proof_image ? (
                              <button onClick={() => { setZoomTitle('Commission Proof'); setZoomImage(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${p.proof_image}`); }} style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => openEditPayoutModal(p)}
                                title="Edit Payout"
                                style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', borderColor: '#bae6fd', background: '#f0f9ff', border: '1px solid #bae6fd' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePayout(p.id)}
                                title="Delete Payout"
                                style={{ padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2', border: '1px solid #fca5a5' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                {pendingCollections.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No pending joining fees found.</td></tr>
                ) : (
                  pendingCollections.map((due, idx) => (
                    <tr key={`fee-${due.due_id}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                {pendingCollections.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No pending slips found.</td></tr>
                ) : (
                  pendingCollections.map((due, idx) => (
                    <tr key={`slip-${due.due_id}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                  commissions.filter(c => c.transaction_type === 'JOINING_FEE').map((comm, idx) => (
                    <tr key={`comm-fee-${comm.reference_id || idx}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
                  commissions.filter(c => c.transaction_type === 'INSTALLMENT').map((comm, idx) => (
                    <tr key={`comm-slip-${comm.reference_id || idx}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
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

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Receive Payment from Agent</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Balance Due to Admin</label>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>₹{Number(walletSummary?.balance_due_to_admin || 0).toFixed(2)}</div>
            </div>

            <form onSubmit={handleAddDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Amount Received (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  value={depositAmount} 
                  onChange={e => setDepositAmount(e.target.value)} 
                  className="premium-input" 
                  placeholder="Enter amount" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Payment Mode</label>
                <select 
                  value={depositPaymentMode} 
                  onChange={e => setDepositPaymentMode(e.target.value)} 
                  className="premium-input" 
                  style={{ width: '100%' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={depositNotes} 
                  onChange={e => setDepositNotes(e.target.value)} 
                  className="premium-input" 
                  placeholder="e.g. Received by..." 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Proof Image (Optional, for UPI/Bank)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => setDepositProofImage(e.target.files[0])} 
                  className="premium-input" 
                  style={{ width: '100%', padding: '6px' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsDepositModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={submittingDeposit} className="btn-primary" style={{ flex: 1, padding: '10px', background: '#10b981', borderColor: '#10b981' }}>{submittingDeposit ? 'Saving...' : 'Record Payment'}</button>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Proof Image (Optional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => setPayoutProofImage(e.target.files[0])} 
                  className="premium-input" 
                  style={{ width: '100%', padding: '6px' }} 
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

      {/* Edit Deposit Modal */}
      {showEditDepositModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Edit Agent Deposit</h3>

            <form onSubmit={handleEditDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Deposit Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0.01"
                  step="0.01"
                  value={editDepositForm.amount} 
                  onChange={e => setEditDepositForm({ ...editDepositForm, amount: e.target.value })} 
                  className="premium-input" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Payment Mode</label>
                <select 
                  value={editDepositForm.payment_mode} 
                  onChange={e => setEditDepositForm({ ...editDepositForm, payment_mode: e.target.value })} 
                  className="premium-input" 
                  style={{ width: '100%' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={editDepositForm.reference_note} 
                  onChange={e => setEditDepositForm({ ...editDepositForm, reference_note: e.target.value })} 
                  className="premium-input" 
                  style={{ width: '100%' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowEditDepositModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={editingDeposit} className="btn-primary" style={{ flex: 1, padding: '10px' }}>{editingDeposit ? 'Saving...' : 'Update Deposit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Export Agent Report</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Report Type</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="radio" 
                      name="exportType" 
                      value="JOINING_FEE" 
                      checked={exportType === 'JOINING_FEE'} 
                      onChange={e => setExportType(e.target.value)} 
                    />
                    Joining Fees
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="radio" 
                      name="exportType" 
                      value="SLIP" 
                      checked={exportType === 'SLIP'} 
                      onChange={e => {
                        setExportType(e.target.value);
                        if (exportStatuses.length > 1) {
                          setExportStatuses(['COLLECTED']);
                        }
                      }} 
                    />
                    Payment Slips
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Insurance Plan</label>
                <select
                  value={exportPlanId}
                  onChange={e => setExportPlanId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: '600' }}
                >
                  <option value="ALL">All Insurance Plans</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Status (Select One)</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="radio" 
                      name="exportStatusRadio"
                      checked={exportStatuses.includes('PENDING')} 
                      onChange={() => setExportStatuses(['PENDING'])} 
                    />
                    Pending
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="radio" 
                      name="exportStatusRadio"
                      checked={exportStatuses.includes('COLLECTED')} 
                      onChange={() => setExportStatuses(['COLLECTED'])} 
                    />
                    Collected (Paid)
                  </label>
                </div>
                {exportStatuses.length === 0 && <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', display: 'block', fontWeight: '500' }}>Please select a status.</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowExportModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: exportStatuses.length === 0 ? '#cbd5e1' : '#0ea5e9', 
                  cursor: exportStatuses.length === 0 ? 'not-allowed' : 'pointer', 
                  border: 'none' 
                }}
                disabled={exportStatuses.length === 0}
                onClick={() => {
                  const apikey = localStorage.getItem('sky_apikey') || '';
                  const token = localStorage.getItem('sky_token') || '';
                  const statusQuery = exportStatuses.join(',');
                  const planQuery = exportPlanId ? `&plan_id=${exportPlanId}` : '';
                  const statusParam = `&status=${statusQuery}`;
                  window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/agent/generate-agent-report-pdf/${agentId}?type=${exportType}${statusParam}${planQuery}&apikey=${apikey}&token=${token}`, '_blank');
                  setShowExportModal(false);
                }}
              >
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
