'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Mail, Edit, Info, FileText, CreditCard, Calendar, Users, Ban, Trash2, Eye, EyeOff, Copy, Key, Heart } from 'lucide-react';
import { apiRequest, formatCurrency, showToast } from '@/lib/api';

const statusStyle = {
  0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending', class: 'pending' },
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active', class: 'active' },
  2: { bg: '#fee2e2', color: '#991b1b', label: 'Suspended/Rejected', class: 'inactive' },
  '-1': { bg: '#f1f5f9', color: '#475569', label: 'Deleted', class: 'inactive' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function MemberProfilePage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { memberId } = params;

  const [member, setMember] = useState(null);
  const [plans, setPlans] = useState([]);
  const [agents, setAgents] = useState([]);
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

  // Delete & Suspend confirmation states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  // Assign Insurance states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ plan_id: '', agent_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: new Date().toISOString().split('T')[0] });
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
      const res = await apiRequest('/api/member/assign-insurance-access', {
        method: 'POST',
        body: JSON.stringify({
          member_code: member.member_code,
          plan_id: assignForm.plan_id,
          agent_id: assignForm.agent_id,
          joining_amount: assignForm.joining_amount || 0,
          collected_amount: assignForm.collected_amount || 0,
          remaining_amount: assignForm.remaining_amount || 0,
          joining_date: assignForm.joining_date,
        })
      });
      if (res.s === 1) {
        showToast('Insurance assigned successfully', 'success');
        setShowAssignModal(false);
        setAssignForm({ plan_id: '', agent_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: new Date().toISOString().split('T')[0] });
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
  const [editJoiningForm, setEditJoiningForm] = useState({ member_insurance_id: '', joining_amount: '', collected_amount: '', remaining_amount: '', joining_date: '' });
  const [editingJoining, setEditingJoining] = useState(false);

  const openEditJoiningModal = (ins) => {
    setEditJoiningForm({
      member_insurance_id: ins.insurance_id || ins.id,
      joining_amount: ins.joining_amount || 0,
      collected_amount: ins.collected_amount || 0,
      remaining_amount: ins.remaining_amount || 0,
      joining_date: ins.joining_date ? ins.joining_date.split('T')[0] : ''
    });
    setShowEditJoiningModal(true);
  };

  const handleEditJoiningFee = async (e) => {
    e.preventDefault();
    setEditingJoining(true);
    try {
      const res = await apiRequest('/api/member/update-joining-fee', {
        method: 'POST',
        body: JSON.stringify(editJoiningForm)
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
        apiRequest('/api/insurance/get-all?limit=100').catch(() => ({ s: 0, r: [] })),
        apiRequest('/api/agent/get-all?limit=100').catch(() => ({ s: 0, r: [] }))
      ]);
      
      if (plansRes.s === 1 && Array.isArray(plansRes.r)) {
        setPlans(plansRes.r);
      }
      if (agentsRes.s === 1 && Array.isArray(agentsRes.r)) {
        setAgents(agentsRes.r);
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
      
      const url = `${BASE_API_URL}/api/member/generate-membership-bond?id=${insuranceId}&apikey=${apikey}&token=${token}${autoPrint ? '&print=true' : ''}`;
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
        <button onClick={() => router.push('/members')} className="btn-secondary">
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
  
  const isSuspended = member.account_status === 2;
  const displayStatus = isSuspended ? 'Suspended' : (member.insurance_status_text || 'Pending');
  const statusClass = 
    isSuspended ? 'inactive' :
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
      return d.toISOString().split('T')[0];
    } catch {
      return '—';
    }
  };

  const formatAmount = (amt) => {
    if (!amt) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={() => router.push('/members')} 
        className="btn-secondary"
        style={{ marginBottom: '20px', padding: '6px 14px', borderRadius: '9999px' }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> 
        <span>Back to Member List</span>
      </button>

      {/* Header Profile Box */}
      <div className="premium-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '48px', background: 'var(--primary-gradient)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
          {profilePhotoUrl ? (
            <img 
              src={profilePhotoUrl} 
              alt={fullName}
              onClick={() => { setZoomImage(profilePhotoUrl); setZoomTitle('Profile Photo'); }}
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
              background: '#0ea5e9', color: 'white', 
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
                ● {displayStatus} Member
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14} /> Code: {member.member_code || member.member_id || '—'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> Agent: {agentName} ({agentCode})</span>
            </p>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setShowAssignModal(true)} style={{ color: 'var(--primary)', padding: '6px 12px', fontSize: '0.75rem' }}>
              <Heart size={14} /> <span>Assign Insurance</span>
            </button>
            <button className="btn-secondary" onClick={() => router.push(`/members/form?id=${memberId}`)} style={{ color: 'var(--primary)', padding: '6px 12px', fontSize: '0.75rem' }}>
              <Edit size={14} /> <span>Edit Member</span>
            </button>
            <button className="btn-secondary" onClick={() => setConfirmSuspend(true)} style={{ color: member.account_status === 1 ? 'var(--warning)' : 'var(--success)', padding: '6px 12px', fontSize: '0.75rem' }}>
              <Ban size={14} />
              <span>{member.account_status === 1 ? 'Suspend' : 'Reactivate'}</span>
            </button>
            <button className="btn-secondary" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--danger)', padding: '6px 12px', fontSize: '0.75rem' }}>
              <Trash2 size={14} /> <span>Delete Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-r-split-2-1" style={{ alignItems: 'start' }}>
        
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Profile Information */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <Info size={16} color="var(--primary)" />
              <span>Profile Information</span>
            </h2>
            
            <div className="grid-r-2" style={{ gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>First Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{firstName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Middle Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{middleName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Last Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{lastName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Gender:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{member.gender || details.gender || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Date of Birth:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{formatDate(member.dob || details.dob)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Age:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{member.age || details.age || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Mobile:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}><Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />{member.phone || member.mobile || details.mobile || details.phone || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Alternate Mobile:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}><Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />{member.alt_mobile || details.alternate_mobile || details.alt_mobile || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Email Address:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}><Mail size={11} style={{ display: 'inline', marginRight: '4px' }} />{member.email || details.email || '—'}</span>
              </div>
               <div style={{  }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Aadhaar No:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{member.aadhaar || member.aadhaar_number || details.aadhaar_number || details.aadhaar || '—'}</span>
              </div>
              
               <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Administrative Notes:</span>
                <p style={{ color: 'var(--text-dark)', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.78rem', lineHeight: 1.4 }}>{member.notes || 'No notes available.'}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Family Information */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <Users size={16} color="var(--primary)" />
              <span>Family Information</span>
            </h2>
            <div className="grid-r-2" style={{ gap: '12px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Guardian Name:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{member.guardian || member.guardian_name || details.guardian_name || details.guardian || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Guardian Relation:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{member.relation || member.guardian_relation || details.guardian_relation || details.relation || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Guardian Aadhaar No:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>{member.guardian_aadhaar_number || details.guardian_aadhaar_number || '—'}</span>
              </div>

            </div>
          </div>

          {/* Card 3: Address Details */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <MapPin size={16} color="var(--primary)" />
              <span>Address Details</span>
            </h2>
            <div className="grid-r-2" style={{ gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Address:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>
                  {typeof member.address === 'object' ? (member.address?.address_line_1 || member.address?.address || '—') : (member.address || '—')}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Village / Landmark:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>
                  {member.village || (typeof member.address === 'object' && member.address?.village) || '—'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>City:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>
                  {member.city || (typeof member.address === 'object' && member.address?.city) || '—'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>State:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>
                  {member.state || (typeof member.address === 'object' && member.address?.state) || '—'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>PIN Code:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', marginLeft: '6px' }}>
                  {member.pin || (typeof member.address === 'object' && (member.address?.pincode || member.address?.pin_code)) || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: identity Documents */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <FileText size={16} color="var(--primary)" />
              <span>KYC Identity Documents</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Aadhaar Front */}
              {(() => {
                const imgUrl = aaFrontUrl || null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '190px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Aadhaar Card (Front)</span>
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt="Aadhaar Front"
                          style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Aadhaar Card (Front)'); }}
                        />
                      ) : (
                        <div style={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)' }}>
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
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '190px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Aadhaar Card (Back)</span>
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt="Aadhaar Back"
                          style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Aadhaar Card (Back)'); }}
                        />
                      ) : (
                        <div style={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Guardian Aadhaar Image */}
              {(() => {
                const imgUrl = guardianAaUrl || null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '190px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Guardian Aadhaar</span>
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt="Guardian Aadhaar"
                          style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Guardian Aadhaar'); }}
                        />
                      ) : (
                        <div style={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* PAN Card */}
              {(() => {
                const imgUrl = panDocUrl || null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '190px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>PAN Card</span>
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt="PAN Image"
                          style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('PAN Card Image'); }}
                        />
                      ) : (
                        <div style={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                          <span>No Document Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Signature */}
              {(() => {
                const imgUrl = signatureUrl || null;
                return (
                  <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', minHeight: '190px' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Signature</span>
                      {imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt="Member Signature"
                          style={{ width: '100%', height: '110px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'zoom-in' }}
                          onClick={() => { setZoomImage(imgUrl); setZoomTitle('Member Signature'); }}
                        />
                      ) : (
                        <div style={{ height: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', background: '#f1f5f9', width: '100%', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                          <span>No Signature Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>

        {/* Right Column - Status/Insurance Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 5: Insurance Info */}
          {/* Card 5: Insurance Info Map */}
          {memberInsurances.length > 0 ? memberInsurances.map((ins, idx) => (
            <div key={idx} className="premium-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Insurance Details</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => openEditJoiningModal(ins)}
                    className="btn-secondary"
                    style={{ color: '#0ea5e9', padding: '4px 8px', fontSize: '0.7rem', border: '1px solid #bae6fd', background: '#f0f9ff' }}
                    title="Edit Joining Fee"
                  >
                    <Edit size={12} style={{ marginRight: '4px' }}/> Edit
                  </button>
                  <button 
                    onClick={() => setConfirmRevoke(ins.plan_id)}
                    className="btn-secondary"
                    style={{ color: '#ef4444', padding: '4px 8px', fontSize: '0.7rem', border: '1px solid #fecaca', background: '#fef2f2' }}
                    title="Revoke Access"
                  >
                    <Ban size={12} style={{ marginRight: '4px' }}/> Revoke
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Insurance Plan</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '750', color: '#0f172a' }}>{ins.plan_name || '—'}</span>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Joining Fees Paid</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d' }}>{formatCurrency(ins.collected_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Agent Name:</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{ins.agent_name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Agent Code:</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{ins.agent_code || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Enrollment Date:</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{formatDate(ins.joining_date)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Insurance Status:</span>
                  <span style={{ color: ins.insurance_status_text === 'Active' ? '#15803d' : ins.insurance_status_text === 'Removed' ? '#991b1b' : '#92400e', fontWeight: '700' }}>{ins.insurance_status_text || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Joining Fees:</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>₹{ins.joining_amount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Collected:</span>
                  <span style={{ color: '#10b981', fontWeight: '700' }}>₹{ins.collected_amount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Remaining:</span>
                  <span style={{ color: '#ef4444', fontWeight: '700' }}>₹{ins.remaining_amount || 0}</span>
                </div>

                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '8px' }}>DOCUMENTS & ACTIONS</span>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      onClick={() => handleDownloadCertificate(ins.insurance_id, false)}
                      className="btn-primary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> Cert
                    </button>
                    <button 
                      onClick={() => handleDownloadCertificate(ins.insurance_id, true)}
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <FileText size={14} /> Print Cert
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleDownloadBond(ins.insurance_id, false)}
                      className="btn-primary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#4f46e5' }}
                    >
                      <Eye size={14} /> Bond
                    </button>
                    <button 
                      onClick={() => handleDownloadBond(ins.insurance_id, true)}
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <FileText size={14} /> Print Bond
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="premium-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>No Active Insurance Plans</span>
            </div>
          )}

          {/* Card 6: Marriage Information */}
          {/* <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={14} color="#e11d48" />
              Marriage Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              {!member.is_married && member.marriage_status_text !== 'Upcoming' ? (
                <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>
                  No Marriage Record
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Marriage Status:</span>
                    <span style={{ color: member.marriage_status_text === 'Married' ? '#e11d48' : '#c2410c', fontWeight: '700' }}>
                      {member.marriage_status_text || '—'}
                    </span>
                  </div>
                  {member.marriage_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Marriage Date:</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{formatDate(member.marriage_date)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div> */}

          {/* Card 6: Additional Information */}
          {/* <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Additional Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Occupation:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{member.occupation || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Administrative Notes:</span>
                <p style={{ color: 'var(--text-dark)', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.78rem', lineHeight: 1.4 }}>{member.notes || 'No notes available.'}</p>
              </div>
            </div>
          </div> */}

          {/* Card 7: KYC Meta */}
          {/* <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>KYC Metadata</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Aadhaar No:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{member.aadhaar || member.aadhaar_number || details.aadhaar_number || details.aadhaar || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>PAN Number:</span>
                <span style={{ color: 'var(--text-dark)', fontWeight: '700', textTransform: 'uppercase' }}>{member.pan || member.pan_number || details.pan_number || details.pan || '—'}</span>
              </div>
            </div>
          </div> */}

          {/* Card 8: Login Information */}
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

      {/* Removed Full Width Grid - Documents as per user request */}

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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setConfirmDelete(false)} />
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setConfirmSuspend(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>
              {member.status === 1 ? 'Suspend Member' : 'Reactivate Member'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', textAlign: 'center' }}>
              Are you sure you want to {member.status === 1 ? 'suspend' : 'reactivate'} this member's access?
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmSuspend(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleToggleSuspend} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Insurance Confirmation Modal */}
      {confirmRevoke && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setConfirmRevoke(null)} />
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAssignModal(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
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

              <div className="grid-r-2" style={{ gap: '16px' }}>
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
                  <input type="number" min="0" value={assignForm.remaining_amount} onChange={e => setAssignForm({ ...assignForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%', backgroundColor: '#f8fafc' }} />
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
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={18} color="var(--primary)" /> Edit Joining Fee
            </h3>
            
            <form onSubmit={handleEditJoiningFee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-r-2" style={{ gap: '16px' }}>
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
              <div className="grid-r-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Remaining (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.remaining_amount} onChange={e => setEditJoiningForm({ ...editJoiningForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%', backgroundColor: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Date</label>
                  <input type="date" required value={editJoiningForm.joining_date} onChange={e => setEditJoiningForm({ ...editJoiningForm, joining_date: e.target.value })} className="premium-input" style={{ width: '100%' }} />
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
