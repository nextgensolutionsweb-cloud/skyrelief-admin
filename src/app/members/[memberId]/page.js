'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Mail, Edit, Info, FileText, CreditCard, Calendar, Users, Ban, Trash2, Eye, EyeOff, Copy, Key, Heart, ShieldCheck, CheckCircle2, Award, Printer, Shield, User, Download, FileCheck, Check, Droplet, Sparkles } from 'lucide-react';
import { apiRequest, formatCurrency, showToast } from '@/lib/api';

const statusStyle = {
  0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending', class: 'pending' },
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active', class: 'active' },
  2: { bg: '#fee2e2', color: '#991b1b', label: 'Suspended/Rejected', class: 'inactive' },
  '-1': { bg: '#f1f5f9', color: '#475569', label: 'Deleted', class: 'inactive' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

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

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return '—';
  }
};

export default function MemberProfilePage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { memberId } = params;

  const [member, setMember] = useState(null);
  const [plans, setPlans] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Dues state
  const [memberDues, setMemberDues] = useState([]);
  const [duesFilter, setDuesFilter] = useState('All');

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
      const res = await apiRequest(`/api/user/get-password?user_id=${userId}`, { skipToast: true });
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

  // Delete & Suspend confirmation states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  // Assign Insurance states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ plan_id: '', agent_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: new Date().toISOString().split('T')[0], guardian_name: '', guardian_relation: '', guardian_aadhar_no: '', guardian_aadhar_photo: null });
  const [assigning, setAssigning] = useState(false);
  const [activePlans, setActivePlans] = useState([]);
  const [memberInsurances, setMemberInsurances] = useState([]);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  const handleRevokeInsurance = async () => {
    if (!confirmRevoke) return;
    try {
      const res = await apiRequest('/api/member/revoke-insurance-access', {
        method: 'POST',
        body: JSON.stringify({
          member_id: memberId,
          plan_id: confirmRevoke,
        })
      });
      if (res.s === 1) {
        showToast('Insurance revoked successfully', 'success');
        setConfirmRevoke(null);
        loadData();
      } else {
        showToast(res.m || 'Failed to revoke insurance', 'error');
      }
    } catch (err) {
      console.error('Error revoking:', err);
      showToast('Error revoking insurance', 'error');
    }
  };

  const handleAssignInsurance = async (e) => {
    e.preventDefault();
    if (!assignForm.plan_id || !assignForm.agent_id) {
      showToast('Plan and Agent are required', 'error');
      return;
    }
    setAssigning(true);
    try {
      const formData = new FormData();
      formData.append('member_code', member.member_code);
      formData.append('plan_id', assignForm.plan_id);
      formData.append('agent_id', assignForm.agent_id);
      formData.append('joining_amount', assignForm.joining_amount || 0);
      formData.append('collected_amount', assignForm.collected_amount || 0);
      formData.append('remaining_amount', assignForm.remaining_amount || 0);
      formData.append('joining_date', assignForm.joining_date);
      if (assignForm.guardian_name) formData.append('guardian_name', assignForm.guardian_name);
      if (assignForm.guardian_relation) formData.append('guardian_relation', assignForm.guardian_relation);
      if (assignForm.guardian_aadhar_no) formData.append('guardian_aadhar_no', assignForm.guardian_aadhar_no);
      if (assignForm.guardian_aadhar_photo) formData.append('guardian_aadhar_photo', assignForm.guardian_aadhar_photo);

      const res = await apiRequest('/api/member/assign-insurance-access', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      if (res.s === 1) {
        showToast('Insurance assigned successfully', 'success');
        setShowAssignModal(false);
        setAssignForm({ plan_id: '', agent_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: new Date().toISOString().split('T')[0], guardian_name: '', guardian_relation: '', guardian_aadhar_no: '', guardian_aadhar_photo: null });
        loadData();
      } else {
        showToast(res.m || 'Failed to assign insurance', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error assigning insurance', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const [showEditJoiningModal, setShowEditJoiningModal] = useState(false);
  const [editJoiningForm, setEditJoiningForm] = useState({ member_insurance_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: '', agent_id: '', guardian_name: '', guardian_relation: '', guardian_aadhar_no: '', guardian_aadhar_photo: null });
  const [editingJoining, setEditingJoining] = useState(false);

  const openEditJoiningModal = (ins) => {
    let localDateStr = '';
    if (ins.joining_date) {
      try {
        const d = new Date(ins.joining_date);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          localDateStr = `${year}-${month}-${day}`;
        }
      } catch (e) {}
    }

    setEditJoiningForm({
      member_insurance_id: ins.insurance_id || ins.id,
      joining_amount: ins.joining_amount || 0,
      collected_amount: ins.collected_amount || 0,
      remaining_amount: ins.remaining_amount || 0,
      joining_date: localDateStr,
      agent_id: ins.agent_id || '',
      guardian_name: ins.guardian || ins.guardian_name || '',
      guardian_relation: ins.relation || ins.guardian_relation || '',
      guardian_aadhar_no: ins.guardian_aadhaar_number || ins.guardian_aadhar_no || '',
      guardian_aadhar_photo: null
    });
    setShowEditJoiningModal(true);
  };

  const handleEditJoiningFee = async (e) => {
    e.preventDefault();
    setEditingJoining(true);
    try {
      const formData = new FormData();
      Object.keys(editJoiningForm).forEach(key => {
        if (editJoiningForm[key] !== null && editJoiningForm[key] !== undefined && editJoiningForm[key] !== '') {
          formData.append(key, editJoiningForm[key]);
        }
      });
      const res = await apiRequest('/api/member/update-joining-fee', {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      if (res.s === 1) {
        showToast('Joining fee updated successfully', 'success');
        setShowEditJoiningModal(false);
        loadData();
      } else {
        showToast(res.m || 'Failed to update joining fee', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating joining fee', 'error');
    } finally {
      setEditingJoining(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch dropdown dependencies
      const [plansRes, agentsRes] = await Promise.all([
        apiRequest('/api/insurance/get-all?limit=100', { skipToast: true }).catch(() => ({ s: 0, r: [] })),
        apiRequest('/api/agent/get-all?limit=100', { skipToast: true }).catch(() => ({ s: 0, r: [] }))
      ]);
      
      if (plansRes.s === 1 && Array.isArray(plansRes.r)) {
        setPlans(plansRes.r);
      }
      if (agentsRes.s === 1 && Array.isArray(agentsRes.r)) {
        setAgents(agentsRes.r);
      }

      // Fetch member dues
      const duesRes = await apiRequest(`/api/payment/my-dues?member_id=${memberId}`, { skipToast: true }).catch(() => ({ s: 0, r: [] }));
      if (duesRes.s === 1 && Array.isArray(duesRes.r)) {
        setMemberDues(duesRes.r);
      }

      // Fetch member profile
      const res = await apiRequest(`/api/member/get?id=${memberId}`);
      if (res.s === 1 && res.r) {
        const dataArr = Array.isArray(res.r) ? res.r : [res.r];
        const memberData = dataArr[0];
        
        if (memberData) {
          setMember(memberData);
          
          const insurances = dataArr.filter(d => d.plan_id);
          setMemberInsurances(insurances);

          const activePlanIds = insurances.map(d => String(d.plan_id));
          setActivePlans(activePlanIds);

          const userId = memberData.user_id;
          if (userId) {
            fetchPassword(userId);
          }
        } else {
          showToast('Member not found.', 'error');
        }
      } else {
        showToast(res.m || 'Failed to fetch member details.', 'error');
      }
    } catch (err) {
      console.error('Error loading member profile:', err);
      showToast('Error loading member profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = (dueId) => {
    if (!dueId) return;
    const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey') || '';
    const token = localStorage.getItem('sky_token') || localStorage.getItem('token') || '';
    const url = `${BASE_API_URL}/api/payment/member-payment-slip/${dueId}?apikey=${apikey}&token=${token}`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    loadData();
  }, [memberId]);

  const handleToggleSuspend = async () => {
    const nextStatus = member.account_status === 1 ? 2 : 1; // Toggle between active 1 and suspended 2
    try {
      const formData = new FormData();
      formData.append('id', memberId);
      formData.append('status', String(nextStatus));

      const res = await apiRequest('/api/member/status', {
        method: 'POST',
        body: formData,
      });

      if (res.s === 1) {
        showToast('Member status updated successfully', 'success');
        setConfirmSuspend(false);
        loadData();
      } else {
        const resJson = await apiRequest('/api/member/status', {
          method: 'POST',
          body: JSON.stringify({ id: memberId, status: nextStatus }),
        });
        if (resJson.s === 1) {
          showToast('Member status updated successfully', 'success');
          setConfirmSuspend(false);
          loadData();
        } else {
          showToast(resJson.m || 'Failed to update status', 'error');
        }
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteMember = async () => {
    try {
      const res = await apiRequest(`/api/member/delete/${memberId}`, {
        method: 'DELETE'
      });
      if (res.s === 1) {
        showToast('Member deleted successfully', 'success');
        router.push('/members');
      } else {
        showToast(res.m || 'Failed to delete member', 'error');
      }
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  const handleDeleteInsurance = async (insuranceId) => {
    if (!confirm("Are you sure you want to completely remove this insurance from the member?")) return;
    
    try {
      // Find the plan_id from the insurance_id
      const insuranceItem = memberInsurances.find(ins => ins.insurance_id === insuranceId);
      if (!insuranceItem) return;
      
      const res = await apiRequest('/api/member/revoke-insurance-access', {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, plan_id: insuranceItem.plan_id })
      });
      
      if (res.s === 1) {
        showToast('Insurance removed successfully', 'success');
        loadData();
      } else {
        showToast(res.m || 'Failed to remove insurance', 'error');
      }
    } catch (err) {
      console.error('Error removing insurance:', err);
      showToast('Error removing insurance', 'error');
    }
  };

  const handleDownloadCertificate = async (insuranceId, autoPrint = false) => {
    try {
      if (!insuranceId) {
        showToast('Member insurance id not found', 'error');
        return;
      }
      
      const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey');
      const token = localStorage.getItem('sky_token') || localStorage.getItem('token');
      
      showToast('Opening certificate...', 'success');
      
      const url = `${BASE_API_URL}/api/member/generate-membership-certificate?id=${insuranceId}&apikey=${apikey}&token=${token}${autoPrint ? '&print=true' : ''}`;
      const printWindow = window.open(url, "_blank");
      
      if (!printWindow) {
        showToast('Please allow popups to view the certificate', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to open certificate', 'error');
    }
  };
  const handleDownloadBond = async (insuranceId, autoPrint = false) => {
    try {
      if (!insuranceId) {
        showToast('Member insurance id not found', 'error');
        return;
      }
      
      const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey');
      const token = localStorage.getItem('sky_token') || localStorage.getItem('token');
      
      showToast('Opening bond...', 'success');
      
      const url = `${BASE_API_URL}/api/member/generate-membership-bond?id=${insuranceId}&apikey=${apikey}&token=${token}&admin=true${autoPrint ? '&print=true' : ''}`;
      const printWindow = window.open(url, "_blank");
      
      if (!printWindow) {
        showToast('Please allow popups to view the bond', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to open bond', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading member profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px solid #bee3f8', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Member Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '20px' }}>The member you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.back()} className="btn-secondary">
          <ArrowLeft size={16} /> <span>Back to Members</span>
        </button>
      </div>
    );
  }

  const details = member.member_details || {};
  const firstName = member.first_name || details.first_name || '—';
  const middleName = member.middle_name || details.middle_name || '—';
  const lastName = member.last_name || details.last_name || '—';
  const fullName = member.full_name || (firstName !== '—' ? `${firstName} ${lastName !== '—' ? lastName : ''}` : '') || 'Member';
  const initials = `${firstName !== '—' && firstName ? firstName[0] : ''}${lastName !== '—' && lastName ? lastName[0] : ''}`.toUpperCase() || 'MB';
  
  const isRejected = String(member.insurance_status) === '2';
  const isSuspended = member.account_status === 2 && !isRejected;
  const displayStatus = isRejected ? 'Rejected' : isSuspended ? 'Suspended' : (member.insurance_status_text || 'Pending');
  const statusClass = 
    (isSuspended || isRejected) ? 'inactive' :
    displayStatus === 'Active' ? 'active' : 
    displayStatus === 'Married' ? 'active' : 
    displayStatus === 'Removed' ? 'inactive' : 'pending';

  const getImageUrl = (path) => {
    if (!path || path === "null" || path === "undefined") return "";
    let clean = String(path).trim();
    if (!clean) return "";
    if (clean.startsWith("http")) return clean;
    clean = clean.replace(/^\/uploads\/uploads\//, "/uploads/");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return `${BASE_API_URL}${clean}`;
  };

  const profilePhotoUrl = getImageUrl(member.profile || member.profile_photo || details.profile_image || details.profile_photo || '');
  const panDocUrl = getImageUrl(member.pan_img || details.pan_img || member.documents?.find(d => d.document_type?.toUpperCase() === 'PAN')?.file_url || '');
  const aaFrontUrl = getImageUrl(member.aadhaar_front || details.aadhaar_front || member.documents?.find(d => d.document_type?.toUpperCase() === 'AADHAR_FRONT')?.file_url || '');
  const aaBackUrl = getImageUrl(member.aadhaar_back || details.aadhaar_back || member.documents?.find(d => d.document_type?.toUpperCase() === 'AADHAR_BACK')?.file_url || '');
  const guardianAaUrl = getImageUrl(member.guardian_aadhaar_img || details.guardian_aadhaar_img || '');
  const signatureUrl = getImageUrl(member.signature || '');

  const planName = member.plan_name || '—';
  const agentName = member.agent_name || '—';
  const agentCode = member.agent_code || '—';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      // Format as YYYY-MM-DD in local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '—';
    }
  };

  const formatAmount = (amt) => {
    if (!amt) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

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
          <span>Back to Member Directory</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>Directory</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '700' }}>{fullName}</span>
          <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '9999px', fontWeight: '750', marginLeft: '6px' }}>
            ● {displayStatus}
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
                background: member.account_status === 1 ? '#10b981' : '#f59e0b', 
                border: '2.5px solid #ffffff', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 2
              }} title={`Account Status: ${displayStatus}`} />
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
                  background: member.account_status === 1 ? '#ecfdf5' : '#fffbeb',
                  color: member.account_status === 1 ? '#047857' : '#b45309',
                  border: member.account_status === 1 ? '1px solid #a7f3d0' : '1px solid #fde68a'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.account_status === 1 ? '#10b981' : '#f59e0b' }} />
                  {displayStatus}
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
                  <ShieldCheck size={14} strokeWidth={2.4} /> KYC Verified
                </span>

                {(member.blood_group || details.blood_group) && (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontSize: '0.74rem', 
                    color: '#be123c', 
                    background: '#ffe4e6', 
                    border: '1px solid #fecdd3', 
                    padding: '4px 10px', 
                    borderRadius: '9999px', 
                    fontWeight: '750' 
                  }}>
                    <Droplet size={12} fill="#be123c" /> {member.blood_group || details.blood_group}
                  </span>
                )}
              </div>

              {/* Info Badges Strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(member.member_code || member.member_id);
                    showToast('Member code copied!', 'success');
                  }}
                  style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                    border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', 
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                  title="Click to copy member code"
                >
                  <CreditCard size={13} color="#0284c7" />
                  <span>Code: <strong style={{ color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{member.member_code || member.member_id || '—'}</strong></span>
                  <Copy size={11} style={{ opacity: 0.5, marginLeft: '2px' }} />
                </div>

                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px', 
                  background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                  border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', 
                  fontWeight: '600' 
                }}>
                  <Users size={13} color="#0284c7" />
                  <span>Agent: <strong style={{ color: '#0f172a' }}>{agentName}</strong> {agentCode !== '—' && <span style={{ color: '#64748b' }}>({agentCode})</span>}</span>
                </div>

                {(member.phone || member.mobile) && (
                  <a 
                    href={`tel:${member.phone || member.mobile}`}
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', 
                      background: '#f0fdf4', padding: '5px 12px', borderRadius: '8px', 
                      border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#15803d', 
                      fontWeight: '750', textDecoration: 'none' 
                    }}
                  >
                    <Phone size={12} color="#16a34a" />
                    <span>{member.phone || member.mobile}</span>
                  </a>
                )}

                {(member.created_at || member.joining_date) && (
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    background: '#f8fafc', padding: '5px 12px', borderRadius: '8px', 
                    border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b', 
                    fontWeight: '600' 
                  }}>
                    <Calendar size={12} color="#64748b" />
                    <span>Joined: <strong style={{ color: '#334155' }}>{formatDate(member.created_at || member.joining_date)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Buttons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowAssignModal(true)} 
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
              <Heart size={14} fill="#ffffff" /> <span>Assign Insurance</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => router.push(`/members/form?id=${memberId}`)} 
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
              <Edit size={14} color="#0284c7" /> <span>Edit</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => setConfirmSuspend(true)} 
              style={{ 
                color: member.account_status === 1 ? '#b45309' : '#15803d', 
                padding: '9px 15px', 
                fontSize: '0.82rem', 
                fontWeight: '700', 
                borderRadius: '10px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '7px',
                borderColor: member.account_status === 1 ? '#fde68a' : '#bbf7d0',
                background: member.account_status === 1 ? '#fffbeb' : '#f0fdf4'
              }}
            >
              <Ban size={14} />
              <span>{member.account_status === 1 ? 'Suspend' : (member.account_status === 0 ? 'Approve' : 'Reactivate')}</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => setConfirmDelete(true)} 
              style={{ 
                color: '#dc2626', 
                padding: '9px 15px', 
                fontSize: '0.82rem', 
                fontWeight: '700', 
                borderRadius: '10px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '7px', 
                borderColor: '#fecaca', 
                background: '#fef2f2' 
              }}
            >
              <Trash2 size={14} /> <span>Delete</span>
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
              <Shield size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Insurance Policy</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {memberInsurances[0]?.plan_name || 'No Active Plan'}
              </span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Joining Fee Paid</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#15803d', display: 'block', marginTop: '2px' }}>
                {formatCurrency(memberInsurances[0]?.collected_amount || 0)}
              </span>
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Remaining Balance</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#dc2626', display: 'block', marginTop: '2px' }}>
                ₹{Number(memberInsurances[0]?.remaining_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Demographics</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1d4ed8', display: 'block', marginTop: '2px' }}>
                {member.gender || '—'} • {member.age ? `${member.age} Yrs` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive 2-Column Grid */}
      <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Personal Info, Address & KYC Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* Card 1: Profile Information */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Profile Information</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Personal credentials and demographic data</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>First Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{firstName}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Middle Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{middleName}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Name</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{lastName}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gender</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{member.gender || details.gender || '—'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date of Birth</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>{formatDate(member.dob || details.dob)}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Calculated Age</span>
                <span style={{ color: '#0284c7', fontWeight: '750', fontSize: '0.92rem', marginTop: '2px', display: 'block' }}>
                  {calculateExactAge(member.dob || details.dob) || member.age || details.age || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primary Mobile</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Phone size={13} color="#0284c7" />
                  {member.phone || member.mobile || details.mobile || details.phone || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Alternate Mobile</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Phone size={13} color="#64748b" />
                  {member.alt_mobile || details.alternate_mobile || details.alt_mobile || '—'}
                </span>
              </div>
            </div>

            {/* Aadhaar Number Highlight Box */}
            <div style={{ marginTop: '14px', background: '#eff6ff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ color: '#1e40af', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={14} color="#2563eb" /> Government Aadhaar Number
                </span>
                <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.15rem', letterSpacing: '0.12em', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>
                  {formatAadhaar(member.aadhaar || member.aadhaar_number || details.aadhaar_number || details.aadhaar)}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1d4ed8', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                Official Identity Verified
              </span>
            </div>
          </div>

          {/* Card 2: Address Details */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Address Details</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Residential location and postal dispatch info</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Street / Residential Address</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.95rem', marginTop: '4px', display: 'block', lineHeight: 1.4 }}>
                  {typeof member.address === 'object' ? (member.address?.address_line_1 || member.address?.address || '—') : (member.address || '—')}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Village / Landmark</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>
                  {member.village || (typeof member.address === 'object' && member.address?.village) || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City / Taluka</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>
                  {member.city || (typeof member.address === 'object' && member.address?.city) || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>
                  {member.state || (typeof member.address === 'object' && member.address?.state) || '—'}
                </span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: '600', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PIN Code</span>
                <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.9rem', marginTop: '2px', display: 'block' }}>
                  {member.pin || (typeof member.address === 'object' && (member.address?.pincode || member.address?.pin_code)) || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Identity Documents Showcase */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>KYC Identity Documents</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified document scans and biometric proofs</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Aadhaar Front */}
              {(() => {
                const imgUrl = aaFrontUrl || null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>Aadhaar Card (Front)</span>
                        <span style={{ fontSize: '0.68rem', color: imgUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imgUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imgUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Aadhaar Card (Front)'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imgUrl} 
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
                  </div>
                );
              })()}

              {/* Aadhaar Back */}
              {(() => {
                const imgUrl = aaBackUrl || null;
                return (
                  <div style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '750', color: '#0f172a' }}>Aadhaar Card (Back)</span>
                        <span style={{ fontSize: '0.68rem', color: imgUrl ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                          {imgUrl ? '● Uploaded' : '○ Not Uploaded'}
                        </span>
                      </div>
                      {imgUrl ? (
                        <div 
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Aadhaar Card (Back)'); }}
                          style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', height: '130px', border: '1px solid #cbd5e1', background: '#fff' }}
                        >
                          <img 
                            src={imgUrl} 
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
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Insurance Policy, Guardian, Credentials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* Card: Active Insurance Policy Card */}
          {memberInsurances.length > 0 ? memberInsurances.map((ins, idx) => {
            const joiningAmount = Number(ins.joining_amount || 0);
            const collectedAmount = Number(ins.collected_amount || 0);
            const remainingAmount = Number(ins.remaining_amount || (joiningAmount - collectedAmount));
            const percentPaid = joiningAmount > 0 ? Math.min(100, Math.round((collectedAmount / joiningAmount) * 100)) : 100;

            return (
              <div key={idx} className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={15} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                      Insurance Plan
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => openEditJoiningModal(ins)}
                      className="btn-secondary"
                      style={{ color: '#0284c7', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: '6px' }}
                      title="Edit Joining Fee"
                    >
                      <Edit size={12} style={{ marginRight: '4px' }}/> Edit
                    </button>
                    <button 
                      onClick={() => setConfirmRevoke(ins.plan_id)}
                      className="btn-secondary"
                      style={{ color: '#ef4444', padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px' }}
                      title="Revoke Access"
                    >
                      <Ban size={12} style={{ marginRight: '4px' }}/> Revoke
                    </button>
                  </div>
                </div>

                {/* Plan Title Highlight Box */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Plan Title</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1.3 }}>{ins.plan_name || '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: ins.insurance_status_text === 'Active' ? '#15803d' : '#991b1b', fontWeight: '750' }}>
                      ● {ins.insurance_status_text || 'Active'}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                      Enrolled: {formatDate(ins.joining_date)}
                    </span>
                  </div>
                </div>

                {/* Financial Ledger Progress Widget */}
                <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '750', textTransform: 'uppercase' }}>Joining Fee Ledger</span>
                    <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '800' }}>{percentPaid}% Paid</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#dcfce7', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${percentPaid}%`, height: '100%', background: '#16a34a', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600', display: 'block' }}>Total</span>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>₹{joiningAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <span style={{ fontSize: '0.68rem', color: '#166534', fontWeight: '600', display: 'block' }}>Collected</span>
                      <strong style={{ fontSize: '0.85rem', color: '#16a34a' }}>₹{collectedAmount.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: '600', display: 'block' }}>Remaining</span>
                      <strong style={{ fontSize: '0.85rem', color: '#dc2626' }}>₹{remainingAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Key Meta Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Agent Name</span>
                    <span style={{ color: '#0f172a', fontWeight: '750' }}>{ins.agent_name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Agent Code</span>
                    <span style={{ color: '#0f172a', fontWeight: '750' }}>{ins.agent_code || '—'}</span>
                  </div>
                </div>

                {/* Guardian Details Panel */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', display: 'block', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Guardian & Nominee Details
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.7rem', display: 'block' }}>Guardian Name</span>
                      <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.82rem' }}>{ins.guardian || ins.guardian_name || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.7rem', display: 'block' }}>Relationship</span>
                      <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.82rem' }}>{ins.relation || ins.guardian_relation || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.7rem', display: 'block' }}>Aadhaar No</span>
                      <span style={{ color: '#0f172a', fontWeight: '750', fontSize: '0.82rem' }}>{formatAadhaar(ins.guardian_aadhaar_number || ins.guardian_aadhar_no)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.7rem', display: 'block' }}>Document</span>
                      {ins.guardian_aadhaar_img || ins.guardian_aadhar_photo ? (
                        <button 
                          onClick={() => { setZoomImage(getImageUrl(ins.guardian_aadhaar_img || ins.guardian_aadhar_photo)); setZoomTitle('Guardian Aadhaar'); }}
                          style={{ background: 'none', border: 'none', padding: 0, color: '#0284c7', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', textAlign: 'left', fontSize: '0.78rem' }}
                        >
                          View Photo Scan
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.78rem' }}>No Photo</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate & Bond Actions */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', display: 'block', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Official Downloads & Prints
                  </span>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      onClick={() => handleDownloadCertificate(ins.insurance_id, false)}
                      className="btn-primary" 
                      style={{ flex: 1, padding: '9px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                    >
                      <Eye size={14} /> View Cert
                    </button>
                    <button 
                      onClick={() => handleDownloadCertificate(ins.insurance_id, true)}
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '9px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                    >
                      <Printer size={14} /> Print Cert
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleDownloadBond(ins.insurance_id, false)}
                      className="btn-primary" 
                      style={{ flex: 1, padding: '9px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#4f46e5', borderColor: '#4338ca', fontWeight: '700' }}
                    >
                      <Eye size={14} /> View Bond
                    </button>
                    <button 
                      onClick={() => handleDownloadBond(ins.insurance_id, true)}
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '9px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}
                    >
                      <Printer size={14} /> Print Bond
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="premium-card" style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <Heart size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '750', color: '#0f172a' }}>No Active Insurance Plan</div>
              <p style={{ fontSize: '0.78rem', margin: '4px 0 16px 0', color: '#64748b' }}>This member does not have any active insurance coverage assigned yet.</p>
              <button 
                onClick={() => setShowAssignModal(true)}
                className="btn-primary" 
                style={{ padding: '8px 18px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                Assign Insurance Now
              </button>
            </div>
          )}

          {/* Card: Account Security & Credentials */}
          <div className="premium-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={15} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Account Security & Login
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.72rem', display: 'block', marginBottom: '4px' }}>Portal Password</span>
                {loadingPassword ? (
                  <div style={{ color: '#0ea5e9', fontWeight: '600', fontSize: '0.85rem' }}>Loading password...</div>
                ) : !passwordData ? (
                  <div style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem' }}>Password not generated</div>
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

      </div>

      {/* Payment Collections & Dues Ledger Section */}
      <div className="premium-card" style={{ padding: '28px', marginTop: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Payment Collections & Dues
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 40px' }}>
              Real-time ledger of member contributions, campaign dues, and payment slips
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
            {['All', 'Pending', 'Paid', 'Pending Request'].map((tab) => (
              <button
                key={tab}
                onClick={() => setDuesFilter(tab)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '750',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: duesFilter === tab ? '#ffffff' : 'transparent',
                  color: duesFilter === tab ? '#0284c7' : '#64748b',
                  boxShadow: duesFilter === tab ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Financial Stat KPI Cards */}
        {(() => {
          const totalPaid = memberDues.filter(d => Number(d.status) === 1);
          const totalPending = memberDues.filter(d => Number(d.status) === 0);
          const totalApprovalPending = memberDues.filter(d => Number(d.status) === 2);

          const paidSum = totalPaid.reduce((acc, curr) => acc + Number(curr.amount || curr.total_amount || 0), 0);
          const pendingSum = totalPending.reduce((acc, curr) => acc + Number(curr.amount || curr.total_amount || 0), 0);
          const approvalSum = totalApprovalPending.reduce((acc, curr) => acc + Number(curr.amount || curr.total_amount || 0), 0);
          const totalSum = memberDues.reduce((acc, curr) => acc + Number(curr.amount || curr.total_amount || 0), 0);

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '750', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Billed Dues</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '850', color: '#0f172a', marginTop: '4px' }}>₹{totalSum.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>{memberDues.length} Total Invoices</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '750', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Amount Paid</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '850', color: '#15803d', marginTop: '4px' }}>₹{paidSum.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px', fontWeight: '600' }}>{totalPaid.length} Cleared Payments</div>
              </div>
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '750', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unpaid / Pending</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '850', color: '#ca8a04', marginTop: '4px' }}>₹{pendingSum.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '2px', fontWeight: '600' }}>{totalPending.length} Unpaid Dues</div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '16px 18px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '750', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Awaiting Approval</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '850', color: '#2563eb', marginTop: '4px' }}>₹{approvalSum.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: '2px', fontWeight: '600' }}>{totalApprovalPending.length} Pending Review</div>
              </div>
            </div>
          );
        })()}

        {/* Dues List Table */}
        {(() => {
          const filteredDues = memberDues.filter(d => {
            if (duesFilter === 'Pending') return Number(d.status) === 0;
            if (duesFilter === 'Paid') return Number(d.status) === 1;
            if (duesFilter === 'Pending Request') return Number(d.status) === 2;
            return true;
          });

          if (filteredDues.length === 0) {
            return (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', color: '#94a3b8', fontWeight: '600', fontSize: '0.85rem', border: '1px dashed #e2e8f0' }}>
                <CreditCard size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <div>No {duesFilter !== 'All' ? duesFilter.toLowerCase() : ''} dues records found for this member.</div>
              </div>
            );
          }

          return (
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Campaign / Event</th>
                    <th>Associated Plan</th>
                    <th>Due Amount</th>
                    <th>Due Date</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Slip / Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDues.map((item, idx) => {
                    const st = Number(item.status);
                    let badgeBg = '#fef9c3';
                    let badgeColor = '#854d0e';
                    let badgeText = 'Pending';

                    if (st === 1) {
                      badgeBg = '#dcfce7';
                      badgeColor = '#15803d';
                      badgeText = 'Paid';
                    } else if (st === 2) {
                      badgeBg = '#dbeafe';
                      badgeColor = '#1e40af';
                      badgeText = 'Pending Request';
                    }

                    const dueAmt = Number(item.amount || item.total_amount || 0);

                    return (
                      <tr key={item.due_id || item.id || idx}>
                        <td style={{ fontWeight: '750', color: '#0f172a' }}>
                          {item.campaign_title || item.campaign_name || item.title || `Campaign #${item.campaign_id || item.due_id}`}
                        </td>
                        <td style={{ color: '#475569', fontWeight: '600' }}>
                          {item.plan_name || item.insurance_name || '—'}
                        </td>
                        <td style={{ fontWeight: '800', color: '#0f172a' }}>
                          ₹{dueAmt.toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {formatDate(item.due_date || item.created_at)}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: badgeBg,
                            color: badgeColor,
                            fontWeight: '700',
                            fontSize: '0.75rem'
                          }}>
                            ● {badgeText}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {st === 1 ? (
                            <button
                              onClick={() => handleViewSlip(item.due_id || item.id)}
                              className="btn-secondary"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe'
                              }}
                            >
                              <FileText size={14} />
                              View Slip
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setZoomImage(null)}
        >
          <div 
            style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>{zoomTitle || 'Image Preview'}</span>
              <button 
                onClick={() => setZoomImage(null)}
                style={{ cursor: 'pointer', padding: '4px 8px', fontWeight: '700', color: '#64748b', border: 'none', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.78rem' }}
              >
                Close (X)
              </button>
            </div>
            <img src={zoomImage} alt="Lightbox Zoom" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmDelete(false)} />
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
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleDeleteMember} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >Delete Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {confirmSuspend && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmSuspend(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>
              {member.account_status === 1 ? 'Suspend Member' : (member.account_status === 0 ? 'Approve Member' : 'Reactivate Member')}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', textAlign: 'center', lineHeight: '1.4' }}>
              Are you sure you want to {member.account_status === 1 ? 'suspend' : (member.account_status === 0 ? 'approve' : 'reactivate')} this member?
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmSuspend(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleToggleSuspend} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: member.account_status === 1 ? '#eab308' : '#22c55e', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem' }}
                onMouseEnter={e => e.currentTarget.style.background = member.account_status === 1 ? '#ca8a04' : '#16a34a'}
                onMouseLeave={e => e.currentTarget.style.background = member.account_status === 1 ? '#eab308' : '#22c55e'}
              >{member.account_status === 1 ? 'Suspend Member' : (member.account_status === 0 ? 'Approve Member' : 'Reactivate Member')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Insurance Confirmation Modal */}
      {confirmRevoke && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmRevoke(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Revoke Insurance Access</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', textAlign: 'center' }}>
              Are you sure you want to revoke this insurance plan from the member? This will remove their access to this plan's benefits.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmRevoke(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleRevokeInsurance} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >Revoke</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Insurance Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setShowAssignModal(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={20} color="var(--primary)" />
              Assign New Insurance
            </div>
            
            <form onSubmit={handleAssignInsurance} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Member</label>
                <input type="text" readOnly value={`${fullName} (${member.member_code})`} className="premium-input" style={{ width: '100%', backgroundColor: '#f1f5f9' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Select Plan *</label>
                <select required value={assignForm.plan_id} onChange={e => {
                  const pid = e.target.value;
                  const selected = plans.find(p => String(p.id) === String(pid));
                  
                  let feesToSet = String(selected?.joining_fee || '');
                  if (selected && member) {
                    const ageVal = parseInt(member.age, 10);
                    if (!isNaN(ageVal) && selected.age_rules && Array.isArray(selected.age_rules)) {
                      const matchedRule = selected.age_rules.find(r => ageVal >= r.min_age && ageVal <= r.max_age && r.status === 1);
                      if (matchedRule && matchedRule.joining_fee !== undefined && matchedRule.joining_fee !== null) {
                        feesToSet = String(matchedRule.joining_fee);
                      }
                    }
                  }
                  
                  let remToSet = feesToSet;
                  setAssignForm({ 
                    ...assignForm, 
                    plan_id: pid, 
                    joining_amount: feesToSet,
                    remaining_amount: remToSet,
                    collected_amount: '' 
                  });
                }} className="premium-input" style={{ width: '100%' }}>
                  <option value="">-- Choose Plan --</option>
                  {plans.filter(p => !activePlans.includes(String(p.id))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Select Agent *</label>
                <select required value={assignForm.agent_id} onChange={e => setAssignForm({ ...assignForm, agent_id: e.target.value })} className="premium-input" style={{ width: '100%' }}>
                  <option value="">-- Choose Agent --</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Amount (₹)</label>
                  <input type="number" required min="0" value={assignForm.joining_amount} onChange={e => {
                    const total = e.target.value;
                    const coll = assignForm.collected_amount || 0;
                    const rem = parseFloat(total || 0) - parseFloat(coll);
                    setAssignForm({ ...assignForm, joining_amount: total, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Date</label>
                  <input type="date" required value={assignForm.joining_date} onChange={e => setAssignForm({ ...assignForm, joining_date: e.target.value })} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Collected (₹)</label>
                  <input type="number" min="0" value={assignForm.collected_amount} onChange={e => {
                    const coll = e.target.value;
                    const total = assignForm.joining_amount || 0;
                    const rem = parseFloat(total) - parseFloat(coll || 0);
                    setAssignForm({ ...assignForm, collected_amount: coll, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Remaining (₹)</label>
                  <input type="number" min="0" value={assignForm.remaining_amount} onChange={e => setAssignForm({ ...assignForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>Guardian Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Guardian Name</label>
                    <input type="text" value={assignForm.guardian_name} onChange={e => setAssignForm({ ...assignForm, guardian_name: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="Guardian Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Relation</label>
                    <input type="text" value={assignForm.guardian_relation} onChange={e => setAssignForm({ ...assignForm, guardian_relation: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="E.g. Father, Mother" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Aadhaar No</label>
                    <input type="text" value={assignForm.guardian_aadhar_no} onChange={e => setAssignForm({ ...assignForm, guardian_aadhar_no: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="12-digit Aadhaar" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Aadhaar Photo</label>
                    <input type="file" accept="image/*" onChange={e => setAssignForm({ ...assignForm, guardian_aadhar_photo: e.target.files[0] })} className="premium-input" style={{ width: '100%', padding: '6px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={assigning} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.85rem' }}>
                  {assigning ? 'Assigning...' : 'Assign Insurance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Joining Fee Modal */}
      {showEditJoiningModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={18} color="var(--primary)" /> Edit Joining Fee
            </h3>
            
            <form onSubmit={handleEditJoiningFee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Amount (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.joining_amount} onChange={e => {
                    const total = e.target.value;
                    const coll = editJoiningForm.collected_amount || 0;
                    const rem = parseFloat(total || 0) - parseFloat(coll);
                    setEditJoiningForm({ ...editJoiningForm, joining_amount: total, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Collected (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.collected_amount} onChange={e => {
                    const coll = e.target.value;
                    const total = editJoiningForm.joining_amount || 0;
                    const rem = parseFloat(total) - parseFloat(coll || 0);
                    setEditJoiningForm({ ...editJoiningForm, collected_amount: coll, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Remaining (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.remaining_amount} onChange={e => setEditJoiningForm({ ...editJoiningForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%', backgroundColor: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Date</label>
                  <input type="date" required value={editJoiningForm.joining_date} onChange={e => setEditJoiningForm({ ...editJoiningForm, joining_date: e.target.value })} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Assigned Agent</label>
                <select value={editJoiningForm.agent_id} onChange={e => setEditJoiningForm({ ...editJoiningForm, agent_id: e.target.value })} className="premium-input" style={{ width: '100%' }}>
                  <option value="">-- No Agent (Direct) --</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                </select>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>Guardian Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Guardian Name</label>
                    <input type="text" value={editJoiningForm.guardian_name} onChange={e => setEditJoiningForm({ ...editJoiningForm, guardian_name: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="Guardian Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Relation</label>
                    <input type="text" value={editJoiningForm.guardian_relation} onChange={e => setEditJoiningForm({ ...editJoiningForm, guardian_relation: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="E.g. Father, Mother" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Aadhaar No</label>
                    <input type="text" value={editJoiningForm.guardian_aadhar_no} onChange={e => setEditJoiningForm({ ...editJoiningForm, guardian_aadhar_no: e.target.value })} className="premium-input" style={{ width: '100%' }} placeholder="12-digit Aadhaar" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Aadhaar Photo</label>
                    <input type="file" accept="image/*" onChange={e => setEditJoiningForm({ ...editJoiningForm, guardian_aadhar_photo: e.target.files[0] })} className="premium-input" style={{ width: '100%', padding: '6px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditJoiningModal(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={editingJoining} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.85rem' }}>
                  {editingJoining ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
