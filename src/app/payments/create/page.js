'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Users, Calculator, CheckSquare, Square, Info, Plus, Trash2 } from 'lucide-react';
import { apiRequest, showToast, formatCurrency } from '@/lib/api';

export default function CreateCampaignPage() {
  const router = useRouter();

  // Form State
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [calculationMode, setCalculationMode] = useState('age_wise');
  const [perMarriageAmount, setPerMarriageAmount] = useState('');
  const [ageRules, setAgeRules] = useState([]);
  const [dbRules, setDbRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Data State
  const [marriedMembers, setMarriedMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // Preview State
  const [preview, setPreview] = useState(null);
  const [previewMissingRules, setPreviewMissingRules] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Unused manual age rules action handlers removed since rules load from plan database.

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiRequest('/api/insurance/get-all?limit=100');
        if (res.s === 1 && Array.isArray(res.r)) {
          setPlans(res.r);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Fetch plan age-wise rules on plan selection
  useEffect(() => {
    if (!selectedPlan) {
      setDbRules([]);
      setRulesError('');
      setAgeRules([]);
      return;
    }
    const fetchRules = async () => {
      setLoadingRules(true);
      setRulesError('');
      try {
        const res = await apiRequest(`/api/insurance/age-rules/get-all?plan_id=${selectedPlan}`);
        if (res.s === 1 && Array.isArray(res.r)) {
          setDbRules(res.r);
          setAgeRules(res.r);
          if (res.r.length === 0) {
            setRulesError('No age-wise payment rules configured for this plan. Please configure rules in Insurance Management.');
          }
        } else {
          setRulesError('Failed to fetch plan payment rules.');
        }
      } catch (err) {
        console.error(err);
        setRulesError('Error checking plan age payment rules.');
      } finally {
        setLoadingRules(false);
      }
    };
    fetchRules();
  }, [selectedPlan]);

  // When plan and dates change, fetch eligible married members
  useEffect(() => {
    if (!selectedPlan || !startDate || !endDate) {
      setMarriedMembers([]);
      setSelectedMemberIds([]);
      return;
    }

    const fetchPlanData = async () => {
      setLoadingMembers(true);
      try {
        const url = `/api/payment/available-married-members?plan_id=${selectedPlan}&start_date=${startDate}&end_date=${endDate}`;
        const marriagesRes = await apiRequest(url);
        if (marriagesRes.s === 1 && Array.isArray(marriagesRes.r)) {
          setMarriedMembers(marriagesRes.r);
        } else {
          setMarriedMembers([]);
        }

        // Clear previous selections
        setSelectedMemberIds([]);
      } catch (err) {
        console.error(err);
        showToast('Error loading eligible married members', 'error');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchPlanData();
  }, [selectedPlan, startDate, endDate]);

  const handleSelectAll = () => {
    if (selectedMemberIds.length === marriedMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(marriedMembers.map(m => m.id));
    }
  };

  const toggleMember = (id) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const pAmount = Number(perMarriageAmount) || 0;

  // Preview API calculation
  useEffect(() => {
    const fetchPreview = async () => {
      if (!selectedPlan || selectedMemberIds.length === 0 || !startDate || !endDate || !dueDate || rulesError || dbRules.length === 0) {
        setPreview(null);
        setPreviewMissingRules([]);
        return;
      }

      const payload = {
        plan_id: selectedPlan,
        married_member_ids: selectedMemberIds,
        start_date: startDate,
        end_date: endDate,
        due_date: dueDate
      };
      
      setLoadingPreview(true);
      try {
        const res = await apiRequest('/api/payment/preview', {
          method: 'POST',
          body: JSON.stringify(payload),
          skipToast: true
        });
        if (res.s === 1) {
          setPreview(res.r);
          setPreviewMissingRules([]);
        } else {
          setPreview(null);
          if (res.r && res.r.missing_rules) {
            setPreviewMissingRules(res.r.missing_rules);
          } else {
            setPreviewMissingRules([]);
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('No active payable members')) {
          setPreview({ payable_member_count: 0, newDuesCount: 0 });
        } else {
          setPreview(null);
        }
        if (err.data && err.data.r && err.data.r.missing_rules) {
          setPreviewMissingRules(err.data.r.missing_rules);
        } else {
          setPreviewMissingRules([]);
        }
      } finally {
        setLoadingPreview(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchPreview();
    }, 500); // debounce 500ms
    
    return () => clearTimeout(timeoutId);
  }, [selectedPlan, selectedMemberIds, startDate, endDate, dueDate, rulesError, dbRules]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPlan) return showToast('Please select a plan', 'error');
    if (rulesError || dbRules.length === 0) return showToast('Plan has no active age-wise payment rules. Please configure rules first.', 'error');
    if (selectedMemberIds.length === 0) return showToast('Please select at least one married member', 'error');
    if (!startDate || !endDate) return showToast('Please select a valid date range', 'error');
    if (new Date(endDate) < new Date(startDate)) return showToast('End Date must be after Start Date', 'error');
    if (!dueDate) return showToast('Please select a due date', 'error');

    const payload = {
      plan_id: selectedPlan,
      start_date: startDate,
      end_date: endDate,
      due_date: dueDate,
      married_member_ids: selectedMemberIds
    };

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/payment/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.s === 1) {
        showToast('Payment Campaign created successfully', 'success');
        if (res.r && res.r.id) {
          router.push(`/payments/${res.r.id}`);
        } else {
          router.push('/payments');
        }
      } else {
        showToast(res.m || 'Failed to create campaign', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Getters for Age-wise breakdown table values
  const getAgeRangeStr = (item) => {
    if (item.ageRange) return item.ageRange;
    if (item.age_range) return item.age_range;
    const min = item.min_age !== undefined ? item.min_age : item.minAge;
    const max = item.max_age !== undefined ? item.max_age : item.maxAge;
    if (min !== undefined && max !== undefined) {
      return `${min}-${max}`;
    }
    return '-';
  };

  const getAmountPerMember = (item) => {
    return item.amount !== undefined ? item.amount : 
           item.amountPerMember !== undefined ? item.amountPerMember : 
           item.amount_per_member !== undefined ? item.amount_per_member : 0;
  };

  const getMemberCount = (item) => {
    return item.memberCount !== undefined ? item.memberCount : 
           item.member_count !== undefined ? item.member_count : 
           item.count !== undefined ? item.count : 0;
  };

  const getTotalAmount = (item) => {
    return item.totalAmount !== undefined ? item.totalAmount : 
           item.total_amount !== undefined ? item.total_amount : 
           item.total !== undefined ? item.total : 0;
  };

  const getMemberName = (item) => {
    if (!item) return 'Unknown Member';
    return item.member_name || item.full_name || [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ") || 'Unknown Member';
  };

  const renderAvatar = (item) => {
    const name = getMemberName(item);
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join("")
      .toUpperCase() || "?";
      
    return (
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', flexShrink: 0 }}>
        {initials}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/payments')} className="btn-secondary" style={{ padding: '8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Create Payment Campaign</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Generate pending dues for active members based on specific date periods.</p>
        </div>
      </div>

      <div className="grid-r-split-2-1" style={{ alignItems: 'start' }}>
        {/* Left Column - Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 1: Select Plan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>1. Select Plan *</label>
                <select 
                  value={selectedPlan} 
                  onChange={e => setSelectedPlan(e.target.value)}
                  required
                  className="premium-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Select a Plan</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Married Members */}
              {selectedPlan && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>2. Select Married Members *</label>
                    {marriedMembers.length > 0 && (
                      <button type="button" onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {selectedMemberIds.length === marriedMembers.length ? <CheckSquare size={14} /> : <Square size={14} />}
                        Select All
                      </button>
                    )}
                  </div>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', background: '#f8fafc' }}>
                    {loadingMembers ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>Loading married members...</div>
                    ) : marriedMembers.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>No eligible married members available for selected period.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {marriedMembers.map(item => {
                          const eventId = item.id;
                          return (
                            <label key={eventId} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: selectedMemberIds.includes(eventId) ? '#f0f9ff' : 'transparent', transition: 'background 0.2s' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedMemberIds.includes(eventId)}
                                onChange={() => toggleMember(eventId)}
                                style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }}
                              />
                              {renderAvatar(item)}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{getMemberName(item)}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Code: {item.member_code || '-'} | Phone: {item.phone || '-'} | Date: {item.marriage_date ? item.marriage_date.split('T')[0] : '-'}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>{selectedMemberIds.length} member(s) selected</div>
                </div>
              )}

              {/* Step 3: Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>3. Campaign Start Date *</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="premium-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>4. Campaign End Date *</label>
                  <input 
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="premium-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Step 5: Final Due Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>5. Final Due Date *</label>
                <input 
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="premium-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Age-wise Payment Rules Section */}
              <div className="premium-card" style={{ padding: '20px', background: '#fafcff', border: '1px solid #bee3f8', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>Age-wise Payment Rules</h3>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Age-wise rules are configured and applied automatically from the selected Insurance Plan.
                  </p>
                </div>

                {!selectedPlan ? (
                  <div style={{ padding: '14px', border: '1.5px dashed #bee3f8', borderRadius: '10px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem', background: '#fafcff' }}>
                    Select an insurance plan above to view its configured age rules.
                  </div>
                ) : loadingRules ? (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    Loading plan rules...
                  </div>
                ) : rulesError ? (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '8px' }}>
                    ⚠️ {rulesError}
                  </div>
                ) : dbRules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0', opacity: 0.8 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Age Range</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Amount (₹)</span>
                    </div>
                    {dbRules.map((rule, idx) => (
                      <div key={rule.id || idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center', fontSize: '0.78rem', color: '#0f172a', fontWeight: '600' }}>
                        <span>{rule.min_age} to {rule.max_age} years</span>
                        <span style={{ textAlign: 'right', fontWeight: '700' }}>₹{rule.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '14px', border: '1.5px dashed #fee2e2', borderRadius: '10px', textAlign: 'center', color: '#ef4444', fontSize: '0.78rem', background: '#fef2f2' }}>
                    ⚠️ No rules found.
                  </div>
                )}
              </div>

              {preview && (preview.payable_member_count === 0 || preview.newDuesCount === 0) && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '8px' }}>
                  ⚠️ Warning: No active payable members found for the selected plan. Campaign cannot be created with 0 dues.
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={
                  submitting || 
                  !selectedPlan || 
                  selectedMemberIds.length === 0 || 
                  !startDate || 
                  !endDate || 
                  !dueDate || 
                  loadingPreview ||
                  rulesError ||
                  dbRules.length === 0 ||
                  (preview && preview.payable_member_count === 0) ||
                  (preview && preview.newDuesCount === 0)
                }
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem', justifyContent: 'center', marginTop: '10px' }}
              >
                {submitting ? 'Creating Campaign...' : <><Save size={16} /> Create Campaign</>}
              </button>

            </div>
          </form>
        </div>

        {/* Right Column - Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="premium-card" style={{ padding: '24px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <Calculator size={18} color="#0ea5e9" />
              Calculation Preview
            </h2>

            {loadingPreview ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>Calculating deduplication...</div>
            ) : previewMissingRules.length > 0 ? (
              <div style={{ padding: '20px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
                <h4 style={{ color: '#e11d48', fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={18} /> Age Rule Missing
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {previewMissingRules.map((rule, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', background: '#fff', borderRadius: '6px', border: '1px solid #fecdd3', fontSize: '0.85rem', color: '#881337' }}>
                      <span style={{ fontWeight: '600' }}>{rule.member_name} ({rule.member_code})</span> - Age: {rule.age}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#be123c', marginTop: '12px', fontWeight: '500' }}>
                  Please add rule in Insurance Age Rules before proceeding.
                </p>
              </div>
            ) : preview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Campaign Summary Section */}
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Campaign Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Selected Married Members:</span>
                      <span style={{ fontSize: '1rem', color: '#8b5cf6', fontWeight: '800' }}>{preview.selected_married_count}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total Active Members:</span>
                      <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={15} color="#64748b" /> {preview.totalActiveMembers}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Payable Members:</span>
                      <span style={{ fontSize: '0.95rem', color: '#0ea5e9', fontWeight: '700' }}>{preview.payable_member_count}</span>
                    </div>

                    <div style={{ height: '1.5px', background: '#e2e8f0', margin: '4px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>Total Collectable Amount:</span>
                      <span style={{ fontSize: '1.25rem', color: '#15803d', fontWeight: '900' }}>
                        {formatCurrency(preview.total_collectable_amount || preview.totalCollectableAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Age-wise Breakdown Section */}
                {calculationMode === 'age_wise' && (
                  <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Age-wise Breakdown
                    </h3>
                    
                    {(() => {
                      const rulesList = preview.ageRules || preview.age_rules || preview.rules || preview.breakdown || preview.age_amount_rules || [];
                      if (Array.isArray(rulesList) && rulesList.length > 0) {
                        return (
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: '#475569' }}>Age Range</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Base Amt</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#8b5cf6' }}>× Marriages</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#475569' }}>Members</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#475569' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rulesList.map((item, idx) => (
                                  <tr key={idx} style={{ borderBottom: idx < rulesList.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#0f172a' }}>{getAgeRangeStr(item)}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>{formatCurrency(item.base_amount || getAmountPerMember(item))}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#8b5cf6' }}>{item.married_count || preview.selected_married_count || '-'}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>{getMemberCount(item)}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#1d4ed8' }}>{formatCurrency(getTotalAmount(item))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{ background: '#f0fdf4', padding: '10px 12px', borderTop: '1.5px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#166534' }}>Grand Total:</span>
                              <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#15803d' }}>
                                {formatCurrency(preview.total_collectable_amount || preview.totalCollectableAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div style={{ padding: '16px', border: '1px dashed #bee3f8', borderRadius: '10px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem', background: '#fafcff' }}>
                            No breakdown details returned from backend.
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Fixed Amount calculation preview */}
                {calculationMode === 'fixed' && (
                  <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Per Marriage Amount:</span>
                      <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>{formatCurrency(preview.perMarriageAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Selected Marriages:</span>
                      <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>{preview.marriedCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Member Payable Amount:</span>
                      <span style={{ fontSize: '1rem', color: '#1d4ed8', fontWeight: '800' }}>{formatCurrency(preview.memberPayableAmount)}</span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', color: '#94a3b8' }}>
                <Info size={32} />
                <p style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                  {!selectedPlan ? "Please select a plan." :
                   selectedMemberIds.length === 0 ? "Please select at least one married member." :
                   (!startDate || !endDate) ? "Please select start and end dates." :
                   !dueDate ? "Please select final due date." :
                   "Fill out all required fields to see the deduplication preview."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
