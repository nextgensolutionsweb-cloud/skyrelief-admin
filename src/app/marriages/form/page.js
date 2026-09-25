'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const emptyForm = {
  amount_given: '',
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
  const paramPlanId = searchParams.get('plan_id');
  const paramType = searchParams.get('type');

  const [form, setForm] = useState(emptyForm);
  const [plans, setPlans] = useState([]);

  // Filter helper to determine death plans
  const isDeathPlanHelper = (p) => p && (Number(p.plan_type) === 2 || String(p.name).toLowerCase().includes('सुरक्षा') || String(p.name).toLowerCase().includes('suraksha') || String(p.name).toLowerCase().includes('death'));

  const selectedPlan = plans.find(p => String(p.id) === String(form.plan_id));
  const isDeathMode = paramType === 'death' || isDeathPlanHelper(selectedPlan);

  // Grouped active plans
  const activePlans = plans.filter(p => p.status !== -1 && String(p.status) !== '-1');
  const marriagePlans = activePlans.filter(p => !isDeathPlanHelper(p));
  const deathPlans = activePlans.filter(p => isDeathPlanHelper(p));
  const selectablePlans = paramType === 'death' ? deathPlans : (paramType === 'marriage' ? marriagePlans : activePlans);

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
          const isDeceased = m.insurance_status === 5 || String(m.insurance_status) === '5' || m.status === 5 || String(m.status) === '5' || m.insurance_status_text === 'Deceased';
          if (isDeceased) return false;

          const isActive = m.insurance_status === 1 || String(m.insurance_status) === '1' ||
            m.account_status === 1 || String(m.account_status) === '1' ||
            m.status === 1 || String(m.status) === '1' ||
            m.status === 'Active' || m.insurance_status_text === 'Active';

          if (!isActive) return false;

          if (selectMemberIdAfterFetch && String(m.member_id || m.id) === String(selectMemberIdAfterFetch)) {
            return true;
          }

          const thisPlan = plans.find(p => String(p.id) === String(planId));
          const isDeath = isDeathPlanHelper(thisPlan);

          if (isDeath) {
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

  // Fetch Marriage / Death Details for Edit
  const fetchMarriageDetails = async () => {
    setLoading(true);
    try {
      let res = await apiRequest(`/api/marriage/get?id=${marriageId}`);
      if (res.s !== 1 || !res.r) {
        res = await apiRequest(`/api/death/get?id=${marriageId}`);
      }
      if (res.s === 1 && res.r) {
        const details = res.r;
        const planId = String(details.plan_id || details.insurance_plan?.id || '');
        const savedMemberId = String(details.member_id || details.member?.id || '');
        const rawDate = details.marriage_date || details.death_date || details.date || '';

        setForm({
          plan_id: planId,
          member_id: savedMemberId,
          marriage_date: rawDate ? rawDate.split('T')[0] : '',
          notes: details.notes || '',
          amount_given: details.amount_given || '',
        });

        const cardPath = details.photo_url || details.photo || details.invitation_card || details.invitation_card_url || details.card || '';
        if (cardPath) {
          setExistingCard(cardPath);
        }

        // Auto load plan members and select saved member
        if (planId) {
          await fetchMembersForPlan(planId, savedMemberId);
        }
      } else {
        showToast(res.m || 'Failed to fetch case details', 'error');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      showToast('Failed to load case details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!isEditMode && plans.length > 0) {
      if (paramPlanId) {
        const found = plans.find(p => String(p.id) === String(paramPlanId));
        if (found) {
          handlePlanChange(String(found.id));
        }
      } else if (paramType === 'death') {
        const deathPlan = plans.find(p => isDeathPlanHelper(p));
        if (deathPlan) {
          handlePlanChange(String(deathPlan.id));
        }
      } else if (paramType === 'marriage') {
        const marriagePlan = plans.find(p => !isDeathPlanHelper(p));
        if (marriagePlan) {
          handlePlanChange(String(marriagePlan.id));
        }
      }
    }
  }, [paramPlanId, paramType, plans.length, isEditMode]);

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
      showToast(isDeathMode ? 'Death Date is required.' : 'Marriage Date is required.', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isDeathMode && !form.amount_given) {
      showToast('Amount Given is required for Death events.', 'error');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('plan_id', form.plan_id);
    formData.append('member_id', form.member_id);
    formData.append('death_date', form.marriage_date);
    formData.append('marriage_date', form.marriage_date);
    formData.append('notes', form.notes);

    if (isDeathMode && form.amount_given) {
      formData.append('amount_given', form.amount_given);
    }

    if (cardFile) {
      formData.append(isDeathMode ? 'photo' : 'invitation_card', cardFile);
    }

    const endpointUpdate = isDeathMode ? '/api/death/update' : '/api/marriage/update';
    const endpointCreate = isDeathMode ? '/api/death/create' : '/api/marriage/create';

    try {
      let res;
      if (isEditMode) {
        formData.append('id', marriageId);
        res = await apiRequest(endpointUpdate, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await apiRequest(endpointCreate, {
          method: 'POST',
          body: formData,
        });
      }

      if (res.s === 1) {
        showToast(
          isEditMode 
            ? (isDeathMode ? 'Death record updated successfully!' : 'Marriage record updated successfully!')
            : (isDeathMode ? 'Death record created successfully!' : 'Marriage record created successfully!'),
          'success'
        );
        if (form.plan_id && typeof window !== 'undefined') {
          localStorage.setItem('sky_selected_program_plan', String(form.plan_id));
        }
        router.push(isEditMode ? `/marriages/${marriageId}${isDeathMode ? '?type=death' : ''}` : `/marriages?plan_id=${form.plan_id || ''}`);
      } else {
        showToast(res.m || (isDeathMode ? 'Failed to save death record.' : 'Failed to save marriage record.'), 'error');
      }
    } catch (err) {
      console.error('Error saving record:', err);
      // Fallback try JSON format if multipart isn't fully supported
      try {
        const payload = {
          plan_id: form.plan_id,
          member_id: form.member_id,
          death_date: form.marriage_date,
          marriage_date: form.marriage_date,
          notes: form.notes
        };
        if (isDeathMode && form.amount_given) {
          payload.amount_given = form.amount_given;
        }
        if (isEditMode) payload.id = marriageId;

        const jsonRes = await apiRequest(isEditMode ? endpointUpdate : endpointCreate, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (jsonRes.s === 1) {
          showToast(isDeathMode ? 'Death record saved successfully!' : 'Saved successfully (Text data only)!', 'success');
          if (form.plan_id && typeof window !== 'undefined') {
            localStorage.setItem('sky_selected_program_plan', String(form.plan_id));
          }
          router.push(isEditMode ? `/marriages/${marriageId}${isDeathMode ? '?type=death' : ''}` : `/marriages?plan_id=${form.plan_id || ''}`);
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
    <div style={{ maxWidth: '1350px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}
          >
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              {isEditMode 
                ? (isDeathMode ? 'Edit Death Event Record' : 'Edit Marriage Record') 
                : (isDeathMode ? 'Register New Death Case' : 'Register New Marriage Case')}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px', margin: 0 }}>
              {isDeathMode 
                ? 'Fill in death claim details, disbursement amount, and death certificate/photo' 
                : 'Fill in the event details and attach optional invitation cards or photos'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px' }}>
          
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Event & Member Info Card */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isDeathMode ? '#fef3c7' : '#e0f2fe', color: isDeathMode ? '#d97706' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem' }}>
                  {isDeathMode ? '🛡️' : '💍'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {isDeathMode ? 'Death Claim & Member Information' : 'Event & Member Information'}
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {isDeathMode ? 'Select death assistance plan and registered member' : 'Select plan and registered active member'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Insurance Plan */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Insurance Plan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={form.plan_id}
                    required
                    onChange={e => handlePlanChange(e.target.value)}
                    className="premium-input"
                    style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: '#fff' }}
                  >
                    <option value="">Select Plan</option>
                    {selectablePlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Member Selection */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Select Member <span style={{ color: '#ef4444' }}>*</span>
                  </label>
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
                        ? "Please select an insurance plan first..."
                        : loadingMembers
                          ? "Loading members..."
                          : "Search member by name or member code..."
                    }
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      cursor: !form.plan_id ? 'not-allowed' : 'text',
                      opacity: !form.plan_id ? 0.6 : 1,
                      background: !form.plan_id ? '#f8fafc' : '#fff'
                    }}
                  />

                  {showMemberDropdown && form.plan_id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '240px',
                      overflowY: 'auto',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      marginTop: '6px'
                    }}>
                      {loadingMembers ? (
                        <div style={{ padding: '16px', fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <span>Fetching active members for this plan...</span>
                        </div>
                      ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(m => (
                          <div
                            key={m.id}
                            onClick={() => selectMember(m)}
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.83rem',
                              color: '#334155',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background 0.1s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {getMemCode(m)} - {getMemName(m)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '16px', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                          {members.length === 0 ? "No eligible members available for this plan." : `No members found matching "${memberSearch}"`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Event Date & Amount (if applicable) */}
                <div style={{ display: 'grid', gridTemplateColumns: isDeathMode ? '1fr 1fr' : '1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      {isDeathMode ? 'Death Date' : 'Marriage Date'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={form.marriage_date}
                      onChange={e => handleInputChange('marriage_date', e.target.value)}
                      className="premium-input"
                      style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  {isDeathMode && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        Amount Given (₹) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={form.amount_given}
                        onChange={e => handleInputChange('amount_given', e.target.value)}
                        className="premium-input"
                        placeholder="e.g. 10000"
                        style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Administrative Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    className="premium-input"
                    placeholder="Add optional notes about event, request context or approvals..."
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Right Column: Documents & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Documents Card */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: isDeathMode ? '#fef3c7' : '#e0f2fe', color: isDeathMode ? '#d97706' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1rem' }}>
                  {isDeathMode ? '🛡️' : '📁'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {isDeathMode ? 'Death Certificate / Photo' : 'Document Attachment'}
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {isDeathMode ? 'Death certificate or proof photo' : 'Invitation card or proof document'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {cardPreview ? (
                    <img src={cardPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : existingCard ? (
                    <img src={getImageUrl(existingCard)} alt="Uploaded Proof" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                      <FileText size={36} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                      <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', margin: 0 }}>No file selected</p>
                      <span style={{ fontSize: '0.73rem' }}>Upload JPG, PNG or PDF</span>
                    </div>
                  )}
                </div>

                <div style={{ width: '100%', textAlign: 'center' }}>
                  <input
                    type="file"
                    id="card-upload"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="card-upload"
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.83rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      background: '#fff',
                      color: '#334155'
                    }}
                  >
                    <Upload size={16} /> {isDeathMode ? 'Choose Proof / Photo' : 'Choose Document File'}
                  </label>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginTop: '8px', lineHeight: '1.4' }}>
                    {cardFile ? `Selected: ${cardFile.name}` : existingCard ? 'File currently uploaded. Click above to replace.' : 'Optional attachment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Summary Card */}
            <div className="card" style={{ padding: '24px', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                Summary & Actions
              </h3>
              
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Plan:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPlan ? selectedPlan.name : 'Not selected'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Member:</span>
                  <strong style={{ color: '#0f172a' }}>{form.member_id ? 'Selected' : 'Not selected'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{isDeathMode ? 'Death Date:' : 'Marriage Date:'}</span>
                  <strong style={{ color: '#0f172a' }}>{form.marriage_date || 'Not set'}</strong>
                </div>
                {isDeathMode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Amount Given:</span>
                    <strong style={{ color: '#0f172a' }}>{form.amount_given ? `₹${Number(form.amount_given).toLocaleString('en-IN')}` : 'Not set'}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: isDeathMode ? '#f59e0b' : '#0284c7',
                    borderColor: isDeathMode ? '#f59e0b' : undefined,
                    color: '#fff',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{isDeathMode ? 'Saving Death Record...' : 'Saving Event...'}</span>
                    </>
                  ) : (
                    <span>
                      {isEditMode 
                        ? (isDeathMode ? 'Update Death Record' : 'Update Marriage Record') 
                        : (isDeathMode ? 'Register Death Case' : 'Register Marriage Case')}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.83rem', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>

        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .grid-responsive-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

