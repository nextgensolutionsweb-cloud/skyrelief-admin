'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const emptyForm = {
  plan_id: '',
  member_id: '',
  marriage_date: '',
  notes: '',
};

export default function MarriageFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marriageId = searchParams.get('id');
  const isEditMode = !!marriageId;

  const [form, setForm] = useState(emptyForm);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Members searching
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // File Upload State
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState('');
  const [existingCard, setExistingCard] = useState('');

  // Fetch Insurance Plans
  const fetchPlans = async () => {
    try {
      const res = await apiRequest('/api/insurance/get-all?limit=100');
      if (res.s === 1 && Array.isArray(res.r)) {
        setPlans(res.r);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  // Fetch Members belonging to selected plan
  const fetchMembersForPlan = async (planId, selectMemberIdAfterFetch = null) => {
    if (!planId) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    try {
      const res = await apiRequest(`/api/member/get-all?limit=1000&plan_id=${planId}`);
      if (res.s === 1 && Array.isArray(res.r)) {
        // Filter only Active members using insurance_status or account_status
        const activeMembers = res.r.filter(m => {
          const isActive = m.insurance_status === 1 || String(m.insurance_status) === '1' || 
            m.account_status === 1 || String(m.account_status) === '1' ||
            m.status === 1 || String(m.status) === '1' || 
            m.status === 'Active' || m.insurance_status_text === 'Active';
          
          if (!isActive) return false;

          if (selectMemberIdAfterFetch && String(m.member_id || m.id) === String(selectMemberIdAfterFetch)) {
            return true;
          }

          const hasMarriage = m.marriage_status === 1 || String(m.marriage_status) === '1' ||
                              m.marriage_status === 2 || String(m.marriage_status) === '2' ||
                              m.is_married === true || String(m.is_married) === 'true' ||
                              (m.marriage_event_id !== null && m.marriage_event_id !== undefined && String(m.marriage_event_id).trim() !== '');

          return !hasMarriage;
        });
        setMembers(activeMembers);

        if (selectMemberIdAfterFetch) {
          const matched = activeMembers.find(m => String(m.member_id || m.id) === String(selectMemberIdAfterFetch));
          if (matched) {
            setMemberSearch(`${getMemCode(matched)} - ${getMemName(matched)}`);
            setForm(prev => ({ ...prev, member_id: String(matched.member_id || matched.id) }));
          } else {
            // Check all in case the saved member is inactive/suspended
            const matchedAny = res.r.find(m => String(m.member_id || m.id) === String(selectMemberIdAfterFetch));
            if (matchedAny) {
              setMemberSearch(`${getMemCode(matchedAny)} - ${getMemName(matchedAny)}`);
              setForm(prev => ({ ...prev, member_id: String(matchedAny.member_id || matchedAny.id) }));
            }
          }
        }
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch Marriage Details for Edit
  const fetchMarriageDetails = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/marriage/get?id=${marriageId}`);
      if (res.s === 1 && res.r) {
        const details = res.r;
        const planId = String(details.plan_id || details.insurance_plan?.id || '');
        const savedMemberId = String(details.member_id || details.member?.id || '');

        setForm({
          plan_id: planId,
          member_id: savedMemberId,
          marriage_date: details.marriage_date ? details.marriage_date.split('T')[0] : (details.date ? details.date.split('T')[0] : ''),
          notes: details.notes || '',
        });

        const cardPath = details.invitation_card || details.invitation_card_url || details.card || '';
        if (cardPath) {
          setExistingCard(cardPath);
        }

        // Auto load plan members and select saved member
        if (planId) {
          await fetchMembersForPlan(planId, savedMemberId);
        }
      } else {
        showToast(res.m || 'Failed to fetch marriage details', 'error');
      }
    } catch (err) {
      console.error('Error fetching marriage details:', err);
      showToast('Failed to load marriage details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      fetchMarriageDetails();
    }
  }, [marriageId, isEditMode]);

  // Click outside member search dropdown to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlanChange = async (planId) => {
    // Clear previous member selection when plan changes
    setForm(prev => ({ ...prev, plan_id: planId, member_id: '' }));
    setMemberSearch('');
    setMembers([]);
    
    // Auto load plan members
    if (planId) {
      await fetchMembersForPlan(planId);
    }
  };

  const handleInputChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardFile(file);
    setCardPreview(URL.createObjectURL(file));
  };

  // Helper getters for member display in search
  const getMemName = (m) => {
    return m.full_name || m.member_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member';
  };

  const getMemCode = (m) => {
    return m.member_code || m.member_id || m.id || '';
  };

  // Filter members based on search query
  const filteredMembers = members.filter(m => {
    const name = getMemName(m).toLowerCase();
    const code = getMemCode(m).toLowerCase();
    const query = memberSearch.toLowerCase();
    
    // If the input matches exactly formatted version "Code - Name", don't filter out unless edited
    const matchedFullStr = `${getMemCode(m)} - ${getMemName(m)}`.toLowerCase();
    if (matchedFullStr === query) return true;

    return name.includes(query) || code.includes(query);
  });

  const selectMember = (m) => {
    setForm(prev => ({ ...prev, member_id: String(m.member_id || m.id) }));
    setMemberSearch(`${getMemCode(m)} - ${getMemName(m)}`);
    setShowMemberDropdown(false);
  };

  const validateForm = () => {
    if (!form.plan_id) {
      showToast('Insurance Plan is required.', 'error');
      return false;
    }
    if (!form.member_id) {
      showToast('Member is required.', 'error');
      return false;
    }
    if (!form.marriage_date) {
      showToast('Marriage Date is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('plan_id', form.plan_id);
    formData.append('member_id', form.member_id);
    formData.append('marriage_date', form.marriage_date);
    formData.append('notes', form.notes);

    if (cardFile) {
      formData.append('invitation_card', cardFile);
    }

    try {
      let res;
      if (isEditMode) {
        formData.append('id', marriageId);
        res = await apiRequest('/api/marriage/update', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await apiRequest('/api/marriage/create', {
          method: 'POST',
          body: formData,
        });
      }

      if (res.s === 1) {
        showToast(
          isEditMode ? 'Marriage record updated successfully!' : 'Marriage record created successfully!',
          'success'
        );
        router.push(isEditMode ? `/marriages/${marriageId}` : '/marriages');
      } else {
        showToast(res.m || 'Failed to save marriage record.', 'error');
      }
    } catch (err) {
      console.error('Error saving marriage:', err);
      // Fallback try JSON format if multipart isn't fully supported
      try {
        const payload = {
          plan_id: form.plan_id,
          member_id: form.member_id,
          marriage_date: form.marriage_date,
          notes: form.notes
        };
        if (isEditMode) payload.id = marriageId;
        
        const jsonRes = await apiRequest(isEditMode ? '/api/marriage/update' : '/api/marriage/create', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        if (jsonRes.s === 1) {
          showToast('Saved successfully (Text data only)!', 'success');
          router.push(isEditMode ? `/marriages/${marriageId}` : '/marriages');
        } else {
          showToast(jsonRes.m || 'An error occurred while saving.', 'error');
        }
      } catch (err2) {
        console.error('JSON Fallback failed:', err2);
      }
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_API_URL}${path.startsWith('/') ? path : '/' + path}`;
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => router.push(isEditMode ? `/marriages/${marriageId}` : '/marriages')}
          className="btn-secondary"
          style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid #e8edf2' }}
        >
          <ArrowLeft size={16} /> <span>Back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
            {isEditMode ? 'Edit Marriage Record' : 'Register New Marriage'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
            {isEditMode ? 'Update schedules and replace documents' : 'Fill details to add a new marriage event'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Marriage & Member Information Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            💍 Marriage & Member Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Insurance Plan Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Insurance Plan *</label>
              <select
                value={form.plan_id}
                required
                onChange={e => handlePlanChange(e.target.value)}
                className="premium-input"
                style={{ width: '100%' }}
              >
                <option value="">Select Plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Searchable Member Selection */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Select Member *</label>
              <input
                type="text"
                disabled={!form.plan_id}
                value={memberSearch}
                onChange={e => {
                  setMemberSearch(e.target.value);
                  setShowMemberDropdown(true);
                  if (!e.target.value) {
                    setForm(prev => ({ ...prev, member_id: '' }));
                  }
                }}
                onFocus={() => {
                  if (form.plan_id) {
                    setShowMemberDropdown(true);
                  }
                }}
                className="premium-input"
                placeholder={
                  !form.plan_id 
                    ? "Please select a plan first..." 
                    : loadingMembers 
                      ? "Loading members..." 
                      : "Search member by name or code..."
                }
                style={{ 
                  width: '100%', 
                  cursor: !form.plan_id ? 'not-allowed' : 'text',
                  opacity: !form.plan_id ? 0.6 : 1,
                  background: !form.plan_id ? '#f1f5f9' : '#fff'
                }}
              />
              
              {showMemberDropdown && form.plan_id && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'white',
                  border: '1px solid #e8edf2',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 100,
                  marginTop: '4px'
                }}>
                  {loadingMembers ? (
                    <div style={{ padding: '16px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Loading plan members...</span>
                    </div>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map(m => (
                      <div
                        key={m.id}
                        onClick={() => selectMember(m)}
                        style={{
                          padding: '10px 14px',
                          fontSize: '0.82rem',
                          color: '#334155',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{ fontWeight: '700' }}>
                          {getMemCode(m)} - {getMemName(m)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                      {members.length === 0 ? "No eligible members available for this plan." : `No members found matching "${memberSearch}"`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Marriage Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Marriage Date *</label>
              <input
                type="date"
                required
                value={form.marriage_date}
                onChange={e => handleInputChange('marriage_date', e.target.value)}
                className="premium-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Administrative Notes</label>
              <textarea
                value={form.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                className="premium-input"
                placeholder="Add notes about marriage ceremony, request context or approvals..."
                rows={4}
                style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

          </div>
        </div>

        {/* Document Upload Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            📁 Documents & Invitation Card
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Image Previews */}
              <div style={{ width: '160px', height: '160px', borderRadius: '12px', overflow: 'hidden', border: '1.5px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {cardPreview ? (
                  <img src={cardPreview} alt="Invitation Card Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : existingCard ? (
                  <img src={getImageUrl(existingCard)} alt="Invitation Card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '10px' }}>
                    <FileText size={32} style={{ margin: '0 auto 8px' }} />
                    <span style={{ fontSize: '0.72rem' }}>No invitation card uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Input */}
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="file"
                  id="card-upload"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="card-upload" className="btn-secondary" style={{ padding: '10px 18px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid #e8edf2', borderRadius: '8px', background: 'white' }}>
                  <Upload size={14} /> Upload Invitation Card
                </label>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px', lineHeight: '1.4' }}>
                  {cardFile ? `Selected: ${cardFile.name}` : existingCard ? 'Currently has an uploaded invitation card. Choose file to replace it.' : 'Supports JPG, PNG or JPEG image formats.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => router.push(isEditMode ? `/marriages/${marriageId}` : '/marriages')}
            className="btn-secondary"
            style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ flex: 2, padding: '12px', borderRadius: '9999px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Saving Record...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Marriage Record' : 'Register Marriage'}</span>
            )}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
