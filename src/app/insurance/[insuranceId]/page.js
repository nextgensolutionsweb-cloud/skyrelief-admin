'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Calendar, Info, FileText } from 'lucide-react';
import { formatCurrency, apiRequest, showToast } from '@/lib/api';

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Inactive' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function InsuranceDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { insuranceId } = params;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Age rules state
  const [ageRules, setAgeRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ min_age: '', max_age: '', amount: '', joining_fee: '' });
  const [savingRule, setSavingRule] = useState(false);

  const loadAgeRules = async () => {
    setLoadingRules(true);
    try {
      const res = await apiRequest(`/api/insurance/age-rules/get-all?plan_id=${insuranceId}`);
      if (res.s === 1 && Array.isArray(res.r)) {
        if (res.r.length === 0) {
          setAgeRules([
            { id: 'def-1', min_age: 0, max_age: 10, amount: 50, joining_fee: 100, status: 1, isDefault: true },
            { id: 'def-2', min_age: 11, max_age: 15, amount: 100, joining_fee: 300, status: 1, isDefault: true },
            { id: 'def-3', min_age: 16, max_age: 30, amount: 200, joining_fee: 500, status: 1, isDefault: true }
          ]);
        } else {
          setAgeRules(res.r);
        }
      }
    } catch (err) {
      console.error('Error loading age rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveDefaultRules = async () => {
    setSavingRule(true);
    try {
      const drafts = ageRules.filter(r => r.isDefault);
      for (const draft of drafts) {
        await apiRequest('/api/insurance/age-rules/create', {
          method: 'POST',
          body: JSON.stringify({
            plan_id: insuranceId,
            min_age: draft.min_age,
            max_age: draft.max_age,
            amount: draft.amount,
            joining_fee: draft.joining_fee || 0
          })
        });
      }
      showToast('Default rules saved successfully.', 'success');
      loadAgeRules();
    } catch (err) {
      console.error(err);
      showToast('Failed to save default rules.', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const min_age = parseInt(ruleForm.min_age, 10);
    const max_age = parseInt(ruleForm.max_age, 10);
    const amount = parseFloat(ruleForm.amount);
    const joining_fee = parseFloat(ruleForm.joining_fee);

    if (isNaN(min_age) || isNaN(max_age) || isNaN(amount) || isNaN(joining_fee)) {
      showToast('Please fill all fields with valid numbers.', 'error');
      return;
    }

    if (min_age < 0 || max_age < min_age || amount <= 0 || joining_fee < 0) {
      showToast('Invalid rule: Min Age >= 0, Max Age >= Min Age, Amount > 0, Joining Fee >= 0.', 'error');
      return;
    }

    const checkId = editingRule?.id;
    const isOverlapping = ageRules.some(rule => {
      if (rule.id === checkId) return false;
      if (rule.status === -1) return false;
      return rule.min_age <= max_age && rule.max_age >= min_age;
    });

    if (isOverlapping) {
      showToast('Age range overlaps with another rule.', 'error');
      return;
    }

    setSavingRule(true);
    try {
      let res;
      if (editingRule) {
        res = await apiRequest('/api/insurance/age-rules/update', {
          method: 'POST',
          body: JSON.stringify({
            id: editingRule.id,
            min_age,
            max_age,
            amount,
            joining_fee,
            status: editingRule.status
          })
        });
      } else {
        res = await apiRequest('/api/insurance/age-rules/create', {
          method: 'POST',
          body: JSON.stringify({
            plan_id: insuranceId,
            min_age,
            max_age,
            amount,
            joining_fee
          })
        });
      }

      if (res.s === 1) {
        showToast(editingRule ? 'Rule updated successfully.' : 'Rule created successfully.', 'success');
        setRuleModalOpen(false);
        loadAgeRules();
      } else {
        showToast(res.m || 'Failed to save rule.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save age rule.', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (String(ruleId).startsWith('def-')) {
      setAgeRules(prev => prev.filter(r => r.id !== ruleId));
      showToast('Draft rule removed from preview.', 'success');
      return;
    }

    if (!confirm('Are you sure you want to delete this age rule?')) return;

    try {
      const res = await apiRequest('/api/insurance/age-rules/delete', {
        method: 'POST',
        body: JSON.stringify({ id: ruleId })
      });
      if (res.s === 1) {
        showToast('Rule deleted successfully.', 'success');
        loadAgeRules();
      } else {
        showToast(res.m || 'Failed to delete rule.', 'error');
      }
    } catch (err) {
      showToast('Error deleting rule.', 'error');
    }
  };

  // Visible Member Count State
  const [visibleCountData, setVisibleCountData] = useState(null);
  const [editingVisibleCount, setEditingVisibleCount] = useState(false);
  const [newVisibleCount, setNewVisibleCount] = useState('');
  const [savingVisibleCount, setSavingVisibleCount] = useState(false);

  const loadVisibleCount = async () => {
    try {
      const res = await apiRequest(`/api/insurance/get-visible-count?plan_id=${insuranceId}`);
      if (res.s === 1 && res.r) {
        setVisibleCountData(res.r);
        setNewVisibleCount(res.r.visible_member_count !== null ? res.r.visible_member_count : '');
      }
    } catch (err) {
      console.error('Error loading visible count:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/insurance/get?id=${insuranceId}`);
      if (res.s === 1 && res.r) {
        setPlan(res.r);
      } else {
        showToast(res.m || 'Failed to fetch insurance details.', 'error');
      }
    } catch (err) {
      console.error('Error loading insurance details:', err);
      showToast('Error loading insurance details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadVisibleCount();
    loadAgeRules();
  }, [insuranceId]);

  const handleSaveVisibleCount = async () => {
    setSavingVisibleCount(true);
    try {
      const val = newVisibleCount === '' ? null : Number(newVisibleCount);
      const res = await apiRequest('/api/insurance/update-visible-count', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: insuranceId,
          visible_member_count: val
        })
      });
      if (res.s === 1) {
        showToast(res.m || 'Visible member count updated.', 'success');
        setEditingVisibleCount(false);
        loadVisibleCount(); // reload data
      } else {
        showToast(res.m || 'Failed to update visible count.', 'error');
      }
    } catch (err) {
      showToast('Error updating visible count.', 'error');
    } finally {
      setSavingVisibleCount(false);
    }
  };

  const handleResetVisibleCount = async () => {
    setSavingVisibleCount(true);
    try {
      const res = await apiRequest('/api/insurance/update-visible-count', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: insuranceId,
          visible_member_count: null
        })
      });
      if (res.s === 1) {
        showToast('Reset to actual count successfully.', 'success');
        setEditingVisibleCount(false);
        loadVisibleCount(); 
      } else {
        showToast(res.m || 'Failed to reset visible count.', 'error');
      }
    } catch (err) {
      showToast('Error resetting visible count.', 'error');
    } finally {
      setSavingVisibleCount(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading insurance details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1.5px solid #bee3f8', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Insurance Plan Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '20px' }}>The plan you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.push('/insurance')} className="btn-secondary">
          <ArrowLeft size={16} /> <span>Back to Insurance List</span>
        </button>
      </div>
    );
  }

  const displayStatus = statusStyle[plan.status]?.label || 'Pending';
  const statusInfo = statusStyle[plan.status] || { bg: '#f1f5f9', color: '#475569' };
  const imageUrl = plan.image ? (plan.image.startsWith('http') ? plan.image : `${BASE_API_URL}${plan.image}`) : null;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Back Button */}
      <button 
        onClick={() => router.push('/insurance')} 
        className="btn-secondary"
        style={{ marginBottom: '20px', padding: '6px 14px', borderRadius: '9999px' }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> 
        <span>Back to Insurance List</span>
      </button>

      {/* Header Profile Box */}
      <div className="premium-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '48px', background: 'var(--primary-gradient)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: 'var(--shadow-md)' }}>
            {imageUrl ? (
              <img src={imageUrl} alt={plan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem' }}>🛡️</span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', zIndex: 1, marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{plan.name}</h1>
              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: '700', background: statusInfo.bg, color: statusInfo.color }}>
                ● {displayStatus} Plan
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Created: {plan.created_at ? plan.created_at.split('T')[0] : 'N/A'}</span>
              {plan.updated_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Updated: {plan.updated_at.split('T')[0]}</span>
              )}
            </p>
          </div>
          
          {/* Action Button */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => {
                const apikey = localStorage.getItem('sky_apikey') || localStorage.getItem('apikey');
                const token = localStorage.getItem('sky_token') || localStorage.getItem('token');
                window.open(`${BASE_API_URL}/api/member/download-blank-bond?plan_id=${insuranceId}&apikey=${apikey}&token=${token}`, '_blank');
              }} 
              style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', border: 'none' }}
            >
              <span>📥 Download Sample Bond</span>
            </button>
            <button className="btn-primary" onClick={() => router.push(`/insurance/form?id=${insuranceId}`)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <Edit size={14} /> <span>Edit Plan Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-r-split-2-1" style={{ alignItems: 'start' }}>
        
        {/* Left Column - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Scheme Description */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <Info size={16} color="var(--primary)" />
              <span>Description & Benefits</span>
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {plan.description || 'No description provided for this scheme.'}
            </div>
          </div>

          {/* Card 2: Example Content Preview */}
          {plan.example_html && (
            <div className="premium-card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <FileText size={16} color="var(--primary)" />
                <span>Example Content (Preview)</span>
              </h2>
              <div 
                style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', overflowX: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}
                dangerouslySetInnerHTML={{ __html: plan.example_html }}
              />
            </div>
          )}

          {/* Card 3: Terms & Conditions */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <FileText size={16} color="var(--primary)" />
              <span>Terms & Conditions</span>
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {plan.term_condition || 'No terms & conditions defined.'}
            </div>
          </div>

          {/* Card 3: Age-wise Payment Rules */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>📊 Age-wise Payment Rules</span>
              </h2>
              {ageRules.some(r => r.isDefault) ? (
                <button 
                  onClick={handleSaveDefaultRules}
                  disabled={savingRule}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', background: '#10b981', border: 'none' }}
                >
                  {savingRule ? 'Saving Default...' : '💾 Save Default Rules'}
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setEditingRule(null);
                    setRuleForm({ min_age: '', max_age: '', amount: '', joining_fee: '' });
                    setRuleModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  ➕ Add Rule
                </button>
              )}
            </div>

            {loadingRules ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>Loading age rules...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Age Range</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Installment Fee</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Joining Fee</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>Members</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageRules.map((rule) => {
                      const isDefault = rule.isDefault;
                      return (
                        <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>
                            {rule.min_age} to {rule.max_age} years
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            ₹{rule.amount}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                            ₹{rule.joining_fee || 0}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#0ea5e9' }}>
                            {rule.member_count !== undefined && parseInt(rule.member_count) > 0 ? (
                              <a href={`/members?plan_id=${insuranceId}&min_age=${rule.min_age}&max_age=${rule.max_age}`} style={{ textDecoration: 'underline', color: '#0ea5e9', cursor: 'pointer' }}>
                                {rule.member_count}
                              </a>
                            ) : (
                              rule.member_count !== undefined ? '0' : (isDefault ? '-' : '0')
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {isDefault ? (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', background: '#fee2e2', color: '#991b1b' }}>Draft (Unsaved)</span>
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', background: rule.status === 1 ? '#dcfce7' : '#fef3c7', color: rule.status === 1 ? '#15803d' : '#92400e' }}>
                                {rule.status === 1 ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {!isDefault && (
                                <button 
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setRuleForm({ 
                                      min_age: String(rule.min_age), 
                                      max_age: String(rule.max_age), 
                                      amount: String(rule.amount),
                                      joining_fee: String(rule.joining_fee || '')
                                    });
                                    setRuleModalOpen(true);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Edit
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteRule(rule.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Pricing Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Pricing Info Card */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pricing & Fees</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Fees for this scheme are computed dynamically based on the member's age at registration. Please refer to the <strong>Age-wise Payment Rules</strong> table.
            </p>
          </div>

          {/* Visible Member Count Card */}
          <div className="premium-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Member Count Settings</h2>
              {!editingVisibleCount ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {visibleCountData?.visible_member_count !== null && (
                    <button onClick={handleResetVisibleCount} disabled={savingVisibleCount} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Reset
                    </button>
                  )}
                  <button onClick={() => setEditingVisibleCount(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit size={12} /> Edit
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditingVisibleCount(false); setNewVisibleCount(visibleCountData?.visible_member_count !== null ? visibleCountData?.visible_member_count : ''); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveVisibleCount} disabled={savingVisibleCount} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: savingVisibleCount ? 'not-allowed' : 'pointer' }}>
                    {savingVisibleCount ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {visibleCountData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Actual Active:</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{visibleCountData.actual_active_member_count}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Visible Count:</span>
                  {editingVisibleCount ? (
                    <input 
                      type="number" 
                      value={newVisibleCount} 
                      onChange={(e) => setNewVisibleCount(e.target.value)} 
                      placeholder="Actual" 
                      style={{ width: '80px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', textAlign: 'right' }} 
                      min="0"
                    />
                  ) : (
                    <span style={{ color: 'var(--text-dark)', fontWeight: '700' }}>{visibleCountData.visible_member_count !== null ? visibleCountData.visible_member_count : 'Not Set'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#166534', fontWeight: '700' }}>Member App Shows:</span>
                  <span style={{ color: '#15803d', fontWeight: '800' }}>{visibleCountData.display_member_count}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</div>
            )}
          </div>


        </div>

      </div>

      {/* Rule Add/Edit Modal */}
      {ruleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginTop: 0 }}>
              {editingRule ? '✏️ Edit Age Rule' : '➕ Add Age Rule'}
            </h3>
            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Min Age</label>
                <input 
                  type="number" 
                  required 
                  value={ruleForm.min_age} 
                  onChange={e => setRuleForm(prev => ({ ...prev, min_age: e.target.value }))} 
                  className="premium-input" 
                  placeholder="e.g. 0" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  min="0" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Max Age</label>
                <input 
                  type="number" 
                  required 
                  value={ruleForm.max_age} 
                  onChange={e => setRuleForm(prev => ({ ...prev, max_age: e.target.value }))} 
                  className="premium-input" 
                  placeholder="e.g. 10" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  min="0" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={ruleForm.amount} 
                  onChange={e => setRuleForm(prev => ({ ...prev, amount: e.target.value }))} 
                  className="premium-input" 
                  placeholder="e.g. 50" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  min="1" 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Joining Fee (₹)</label>
                <input 
                  type="number" 
                  required 
                  value={ruleForm.joining_fee} 
                  onChange={e => setRuleForm(prev => ({ ...prev, joining_fee: e.target.value }))} 
                  className="premium-input" 
                  placeholder="e.g. 500" 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                  min="0" 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setRuleModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingRule} className="btn-primary" style={{ flex: 1, padding: '8px' }}>
                  {savingRule ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
