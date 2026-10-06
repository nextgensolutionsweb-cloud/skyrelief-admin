'use client';
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, Heart, Download, Calendar, User, Phone, Briefcase, FileText, Upload, Clock, File, Shield, Award, Printer, ExternalLink, X, Image as ImageIcon } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const statusStyle = {
  Upcoming: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  Married: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  Settled: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  Completed: { bg: '#f3e8ff', color: '#7e22ce', label: 'Completed' },
  Reported: { bg: '#fef3c7', color: '#b45309', label: 'Reported' },
  Deleted: { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
  'Payment Campaign Generated': { bg: '#ede9fe', color: '#6d28d9', label: 'Payment Campaign Generated' },
  
  // Numeric key fallbacks
  1: { bg: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
  2: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
  3: { bg: '#f3e8ff', color: '#7e22ce', label: 'Completed' },
  0: { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function MarriageDetailPage({ params: paramsPromise }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeathQuery = searchParams.get('type') === 'death';
  const params = use(paramsPromise);
  const { marriageId } = params;

  const [marriage, setMarriage] = useState(null);
  const [isDeathCase, setIsDeathCase] = useState(isDeathQuery);
  const [loading, setLoading] = useState(true);

  // Settlement Modal States
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleAmount, setSettleAmount] = useState('25000');
  const [settleNotes, setSettleNotes] = useState('');
  const [settlePhoto, setSettlePhoto] = useState(null);
  const [settlePhotoPreview, setSettlePhotoPreview] = useState('');
  const [settling, setSettling] = useState(false);

  // Complete Tenure Modal States
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Zoom lightbox
  const [zoomImage, setZoomImage] = useState(null);

  const fetchMarriage = async () => {
    setLoading(true);
    try {
      let res;
      let isDeath = isDeathQuery;
      if (isDeathQuery) {
        res = await apiRequest(`/api/death/get?id=${marriageId}`);
        if (res.s === 1 && res.r) {
          isDeath = true;
          setIsDeathCase(true);
        }
      } else {
        try {
          res = await apiRequest(`/api/marriage/get?id=${marriageId}`, { skipToast: true });
        } catch (e) {
          const deathRes = await apiRequest(`/api/death/get?id=${marriageId}`);
          if (deathRes.s === 1 && deathRes.r) {
            res = deathRes;
            isDeath = true;
            setIsDeathCase(true);
          }
        }
      }

      if (res && res.s === 1 && res.r) {
        setMarriage(res.r);
        setSettleAmount(res.r.amount_given || res.r.amount || (isDeath ? '50000' : '25000'));
      } else {
        showToast(res?.m || 'Failed to fetch details.', 'error');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      showToast('Error loading record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarriage();
  }, [marriageId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettlePhoto(file);
      setSettlePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmSettlement = async (e) => {
    e.preventDefault();
    if (!settleAmount) {
      showToast('Amount Given is required.', 'error');
      return;
    }

    setSettling(true);
    const formData = new FormData();
    formData.append('id', marriageId);
    formData.append('amount_given', settleAmount);
    if (settleNotes) {
      formData.append('notes', settleNotes);
    }
    if (settlePhoto) {
      formData.append('photo', settlePhoto);
    }

    try {
      const endpoint = isDeathCase ? '/api/death/mark-as-settled' : '/api/marriage/mark-as-married';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });

      if (res.s === 1) {
        showToast(res.m || (isDeathCase ? 'Claim marked as settled successfully' : 'Member marked as married successfully'), 'success');
        setSettleOpen(false);
        fetchMarriage();
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

  const handleConfirmComplete = async (e) => {
    e.preventDefault();
    setCompleting(true);
    try {
      const endpoint = isDeathCase ? '/api/death/mark-as-completed' : '/api/marriage/mark-as-completed';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          id: marriageId,
          notes: completeNotes
        })
      });
      if (res.s === 1) {
        showToast(res.m || (isDeathCase ? 'Death case marked as Completed successfully.' : 'Marriage case marked as Completed successfully.'), 'success');
        setCompleteOpen(false);
        fetchMarriage();
      } else {
        showToast(res.m || 'Failed to complete record.', 'error');
      }
    } catch (err) {
      console.error('Error completing case:', err);
      showToast('An error occurred while completing.', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleDirectPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('id', marriageId);
    formData.append('photo', file);

    try {
      const endpoint = isDeathCase ? '/api/death/update' : '/api/marriage/update';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });
      if (res.s === 1) {
        showToast(isDeathCase ? 'Certificate / handover photo updated successfully!' : 'Photo updated successfully!', 'success');
        fetchMarriage();
      } else {
        showToast(res.m || 'Failed to update photo', 'error');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      showToast('Error uploading photo', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Helper getters for robust field reading
  const getMemberName = (item) => {
    if (!item) return 'N/A';
    if (item.member) {
      const details = item.member.member_details || item.member;
      const fName = details.first_name || item.member.first_name || '';
      const mName = details.middle_name || item.member.middle_name || '';
      const lName = details.last_name || item.member.last_name || '';
      const fullName = `${fName} ${mName} ${lName}`.replace(/\s+/g, ' ').trim();
      if (fullName) return fullName;
    }
    const directFullName = `${item.first_name || ''} ${item.middle_name || ''} ${item.last_name || ''}`.replace(/\s+/g, ' ').trim();
    if (directFullName) return directFullName;
    return item.member_name || item.full_name || item.name || 'N/A';
  };

  const getMemberCode = (item) => {
    if (!item) return 'N/A';
    return item.member?.member_code || item.member_code || item.member?.id || item.member_id || 'N/A';
  };

  const getMobileNumber = (item) => {
    if (!item) return 'N/A';
    return item.member?.member_details?.mobile || item.member?.mobile || item.member?.phone || item.mobile_number || item.phone || 'N/A';
  };

  const getPlanName = (item) => {
    if (!item) return 'N/A';
    return item.insurance_plan?.name || item.plan?.name || item.plan_name || item.scheme_name || 'N/A';
  };

  const getMarriageDate = (item) => {
    if (!item) return 'N/A';
    const rawDate = item.death_date || item.marriage_date || item.date;
    return rawDate ? rawDate.split('T')[0] : 'N/A';
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalizedPath = String(path).replace(/\\/g, '/');
    return `${BASE_API_URL}${normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading marriage details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!marriage) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px solid #bee3f8', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Record Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '20px' }}>The marriage case record you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.back()} className="btn-secondary">
          <ArrowLeft size={16} /> <span>Back to Marriages</span>
        </button>
      </div>
    );
  }

  const statusInfo = statusStyle[marriage.status] || { bg: '#f1f5f9', color: '#475569', label: marriage.status || 'Pending' };
  const cardUrl = getImageUrl(marriage.invitation_card || marriage.invitation_card_url || marriage.card || marriage.marriage_card || marriage.invitation_photo);
  const photoUrl = getImageUrl(marriage.marriage_photo || marriage.photo_url || marriage.photo || marriage.marriage_image || marriage.claim_photo || marriage.claim_image || marriage.agent_uploaded_photo || marriage.uploaded_photo);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="btn-secondary"
        style={{ marginBottom: '20px', padding: '6px 14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        <span>{isDeathCase ? 'Back to Death Claims' : 'Back to Marriage List'}</span>
      </button>

      {/* Main Header Card */}
      <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: isDeathCase ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}></div>

        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isDeathCase ? '#fef3c7' : '#ede9fe', color: isDeathCase ? '#d97706' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
          {isDeathCase ? '🛡️' : '💍'}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Case: {marriage.id || marriage.marriage_id}
              </h1> */}
              {/* <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: statusInfo.bg, color: statusInfo.color }}>
                ● {statusInfo.label}
              </span> */}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {isDeathCase ? 'Death Date:' : 'Scheduled:'} {getMarriageDate(marriage)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Member: {getMemberName(marriage)}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => setCertModalOpen(true)}
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                background: 'linear-gradient(135deg,#0b356d,#0284c7)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#fff',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}
            >
              <FileText size={14} /> <span>📜 Generate Certificate / सहायता प्रमाण पत्र</span>
            </button>
            <button className="btn-secondary" onClick={() => router.push(`/marriages/form?id=${marriageId}${isDeathCase ? '&type=death' : ''}`)} style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit size={14} /> <span>Edit Details</span>
            </button>
            {((!isDeathCase && (marriage.status === 'Upcoming' || marriage.status === 1 || marriage.status === '1')) || (isDeathCase && (marriage.status === 1 || marriage.status === '1' || marriage.status === 'Reported'))) && (
              <button
                className="btn-primary"
                onClick={() => setSettleOpen(true)}
                style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Heart size={14} /> <span>{isDeathCase ? 'Mark As Settled' : 'Mark As Married'}</span>
              </button>
            )}
            {(Number(marriage.status) === 2 || marriage.status === 'Married' || marriage.status === 'Settled') && (
              <button
                className="btn-primary"
                onClick={() => setCompleteOpen(true)}
                style={{ padding: '6px 14px', fontSize: '0.78rem', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
              >
                <Award size={14} /> <span>Mark as Completed (Stop Dues)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Marriage / Death Information */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <Calendar size={16} style={{ color: isDeathCase ? '#f59e0b' : '#6366f1' }} />
              <span>{isDeathCase ? 'Death Claim Information' : 'Marriage Information'}</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              {/* <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Case ID:</span>
                <span style={{ color: '#0f172a', fontWeight: '700', fontFamily: 'monospace' }}>{marriage.id || marriage.marriage_id}</span>
              </div> */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>{isDeathCase ? 'Death Date:' : 'Marriage Date:'}</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{getMarriageDate(marriage)}</span>
              </div>
              {/* <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Status:</span>
                <span style={{ color: statusInfo.color, fontWeight: '800' }}>{statusInfo.label}</span>
              </div> */}
              {/* <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Created Date:</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{marriage.created_at ? marriage.created_at.split('T')[0] : 'N/A'}</span>
              </div> */}
              {/* <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Payment Campaign:</span>
                {marriage.campaign_no ? (
                  <span style={{ color: '#059669', fontWeight: '800', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    ✓ Campaign Run ({marriage.campaign_no})
                  </span>
                ) : (
                  <span style={{ color: '#b45309', fontWeight: '700', background: '#fffbeb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                    ⏳ Pending (Not Run)
                  </span>
                )}
              </div> */}
              {marriage.amount_given && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                  <span style={{ color: '#166534', fontWeight: '600' }}>Amount Handed Over:</span>
                  <span style={{ color: '#15803d', fontWeight: '800', fontSize: '0.9rem' }}>₹{Number(marriage.amount_given).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Administrative Notes:</span>
                <p style={{ color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e8edf2', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
                  {marriage.notes || 'No administrative notes recorded.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Member Information */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <User size={16} style={{ color: '#0ea5e9' }} />
              <span>Member Information</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Member Name:</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{getMemberName(marriage)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Member Code:</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{getMemberCode(marriage)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Mobile Number:</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}><Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />{getMobileNumber(marriage)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Insurance Plan Name:</span>
                <span style={{ color: '#0ea5e9', fontWeight: '700' }}><Briefcase size={11} style={{ display: 'inline', marginRight: '4px' }} />{getPlanName(marriage)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Files / Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 3: Documents */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <FileText size={16} style={{ color: '#0ea5e9' }} />
              <span>Documents & Uploads</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isDeathCase ? (
                /* Death Proof / Certificate Photo */
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                    Death Proof / Certificate / Handover Photo
                  </span>
                  {(photoUrl || cardUrl) ? (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={photoUrl || cardUrl}
                        alt="Death Certificate / Proof"
                        style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '6px' }}
                        onClick={() => setZoomImage(photoUrl || cardUrl)}
                        onError={(e) => {
                          if (!e.target.dataset.triedFallback && !e.target.src.startsWith('https://api.skyrelief.org')) {
                            e.target.dataset.triedFallback = 'true';
                            e.target.src = e.target.src.replace(/^http:\/\/localhost:\d+/, 'https://api.skyrelief.org');
                          }
                        }}
                      />
                      
                      {/* Action buttons under photo */}
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setCertModalOpen(true)}
                          className="btn-primary"
                          style={{ width: '100%', padding: '8px', fontSize: '0.78rem', fontWeight: '800', background: 'linear-gradient(135deg,#0b356d,#0284c7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)' }}
                        >
                          <FileText size={14} /> 📜 Generate Certificate / सहायता प्रमाण पत्र
                        </button>

                        <a
                          href={`${BASE_API_URL}/api/${isDeathCase ? 'death' : 'marriage'}/download-certificate?id=${marriageId}`}
                          download
                          className="btn-secondary"
                          style={{ width: '100%', padding: '7px', fontSize: '0.75rem', fontWeight: '750', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                        >
                          <Download size={13} /> 📥 डाउनलोड PDF / Download Certificate PDF
                        </a>
                        
                        <label
                          className="btn-secondary"
                          style={{ width: '100%', padding: '7px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <Upload size={13} /> {uploadingPhoto ? 'Uploading Photo...' : '📷 Change / Replace Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={uploadingPhoto}
                            onChange={handleDirectPhotoUpload}
                          />
                        </label>

                        <a
                          href={photoUrl || cardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="btn-secondary"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Download size={12} /> Download Photo / Document
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b', fontSize: '0.78rem', background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                      <span>No Proof / Handover Photo Uploaded</span>
                      <label
                        className="btn-primary"
                        style={{ padding: '7px 14px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'linear-gradient(135deg,#0b356d,#0284c7)' }}
                      >
                        <Upload size={13} /> {uploadingPhoto ? 'Uploading Photo...' : '📷 Upload Handover Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={uploadingPhoto}
                          onChange={handleDirectPhotoUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setCertModalOpen(true)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileText size={13} /> 📜 Generate Certificate Anyway
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Invitation Card */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>Invitation Card Preview</span>
                    {cardUrl ? (
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={cardUrl}
                          alt="Invitation Card"
                          style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '4px' }}
                          onClick={() => setZoomImage(cardUrl)}
                          onError={(e) => {
                            if (!e.target.dataset.triedFallback && !e.target.src.startsWith('https://api.skyrelief.org')) {
                              e.target.dataset.triedFallback = 'true';
                              e.target.src = e.target.src.replace(/^http:\/\/localhost:\d+/, 'https://api.skyrelief.org');
                            }
                          }}
                        />
                        <a
                          href={cardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="btn-secondary"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '750', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Download size={12} /> Download Document
                        </a>
                      </div>
                    ) : (
                      <div style={{ height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                        <span>No Document Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Marriage Photo (Ceremony / Handover) */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>Marriage Ceremony / Handover Photo</span>
                    {photoUrl ? (
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={photoUrl}
                          alt="Marriage Ceremony"
                          style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', cursor: 'zoom-in', borderRadius: '4px' }}
                          onClick={() => setZoomImage(photoUrl)}
                          onError={(e) => {
                            if (!e.target.dataset.triedFallback && !e.target.src.startsWith('https://api.skyrelief.org')) {
                              e.target.dataset.triedFallback = 'true';
                              e.target.src = e.target.src.replace(/^http:\/\/localhost:\d+/, 'https://api.skyrelief.org');
                            }
                          }}
                        />
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setCertModalOpen(true)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '8px', fontSize: '0.78rem', fontWeight: '800', background: 'linear-gradient(135deg,#0b356d,#0284c7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#fff', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)' }}
                          >
                            <FileText size={14} /> 📜 Generate Marriage Certificate / सहयोग प्रमाण पत्र
                          </button>
                          <a
                            href={`${BASE_API_URL}/api/marriage/download-certificate?id=${marriageId}`}
                            download
                            className="btn-secondary"
                            style={{ width: '100%', padding: '7px', fontSize: '0.75rem', fontWeight: '750', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                          >
                            <Download size={13} /> 📥 डाउनलोड PDF / Download Certificate PDF
                          </a>
                          <label
                            className="btn-secondary"
                            style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <Upload size={13} /> {uploadingPhoto ? 'Uploading Photo...' : '📷 Change / Replace Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={uploadingPhoto}
                              onChange={handleDirectPhotoUpload}
                            />
                          </label>
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="btn-secondary"
                            style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '750', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Download size={12} /> Download Ceremony Photo
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                        <span>No Ceremony Photo Uploaded</span>
                        <label
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                          <Upload size={13} /> {uploadingPhoto ? 'Uploading...' : '📷 Upload Ceremony Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={uploadingPhoto}
                            onChange={handleDirectPhotoUpload}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCertModalOpen(true)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FileText size={13} /> 📜 Generate Certificate Anyway
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* Settle Marriage Modal */}
      {settleOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setSettleOpen(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              💍 Confirm Marriage Settlement
            </h2>
            
            <form onSubmit={handleConfirmSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Info summary */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569' }}>
                <div><strong>Member:</strong> {getMemberName(marriage)} ({getMemberCode(marriage)})</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> {getPlanName(marriage)}</div>
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
                    <input type="file" id="detail-settle-photo" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    <label htmlFor="detail-settle-photo" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-block', border: '1.5px solid #e8edf2', borderRadius: '8px' }}>
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
                <button type="button" onClick={() => setSettleOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
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

      {/* Complete Tenure Modal */}
      {completeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setCompleteOpen(false)} />
          <div className="card" style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              🏆 Mark Marriage Tenure as Completed
            </h2>
            
            <form onSubmit={handleConfirmComplete} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f5f3ff', padding: '14px', borderRadius: '12px', border: '1px solid #ddd6fe', fontSize: '0.82rem', color: '#4c1d95' }}>
                <div><strong>Member:</strong> {getMemberName(marriage)}</div>
                <div style={{ marginTop: '4px' }}><strong>Plan:</strong> {getPlanName(marriage)}</div>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#6d28d9', lineHeight: 1.4 }}>
                  ℹ️ Once marked as <strong>Completed</strong>, this member's marriage service will conclude and they will <strong>no longer receive new campaign installment dues</strong> for this plan.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Completion Notes (Optional)</label>
                <textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%', resize: 'none', fontFamily: 'inherit', borderRadius: '12px' }}
                  placeholder="E.g., All tenure contributions completed, services discharged..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button type="button" onClick={() => setCompleteOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
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
              <span style={{ fontWeight: '800', fontSize: '0.875rem', color: '#0f172a' }}>Document Preview</span>
              <button
                onClick={() => setZoomImage(null)}
                style={{ cursor: 'pointer', padding: '4px', fontWeight: '700', color: '#64748b', border: 'none', background: 'none', fontFamily: 'inherit' }}
              >
                Close (X)
              </button>
            </div>
            <img src={zoomImage} alt="Document Zoomed" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* Certificate Generator & Preview Modal */}
      {certModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setCertModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '950px',
              maxWidth: '96vw',
              height: '92vh',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: '1.5px solid #e2e8f0',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>📜</span>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                    {isDeathCase ? 'सुरक्षा सहायता प्रमाण पत्र' : 'कन्या विवाह सहयोग प्रमाण पत्र'} (Assistance Certificate)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: '600' }}>
                    Member: <strong>{getMemberName(marriage)}</strong> ({getMemberCode(marriage)}) | Amount: <strong>₹{Number(marriage?.amount_given || marriage?.amount || 25000).toLocaleString('en-IN')}/-</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={`${BASE_API_URL}/api/${isDeathCase ? 'death' : 'marriage'}/download-certificate?id=${marriageId}`}
                  download
                  className="btn-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(14, 165, 233, 0.25)'
                  }}
                >
                  <Download size={15} /> <span>डाउनलोड PDF / Download PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('cert-preview-iframe');
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="btn-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg,#0b356d,#0284c7)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <Printer size={15} /> <span>प्रिंट करें / Print Certificate</span>
                </button>

                <a
                  href={`${BASE_API_URL}/api/${isDeathCase ? 'death' : 'marriage'}/certificate?id=${marriageId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    padding: '7px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    color: '#334155'
                  }}
                >
                  <ExternalLink size={14} /> <span>न्यू टैब में खोलें</span>
                </a>

                <button
                  onClick={() => setCertModalOpen(false)}
                  style={{
                    cursor: 'pointer',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe */}
            <div style={{ flex: 1, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
              <iframe
                id="cert-preview-iframe"
                src={`${BASE_API_URL}/api/${isDeathCase ? 'death' : 'marriage'}/certificate?id=${marriageId}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block'
                }}
                title="Assistance Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
