'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Shield, FileText, BarChart3, Plus, Trash2, Check, Image as ImageIcon } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const emptyForm = {
  name: '',
  description: '',
  term_condition: '',
  start_date: '',
  example_html: '',
  plan_type: '1',
};

const defaultAgeRules = [
  { min_age: 0, max_age: 10, amount: '', joining_fee: '' },
  { min_age: 11, max_age: 15, amount: '', joining_fee: '' },
  { min_age: 16, max_age: 30, amount: '', joining_fee: '' }
];

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function InsuranceFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const insuranceId = searchParams.get('id');
  const isEditMode = !!insuranceId;

  const [form, setForm] = useState(emptyForm);
  const [ageRules, setAgeRules] = useState(defaultAgeRules);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const res = await apiRequest(`/api/insurance/get?id=${insuranceId}`);
          if (res.s === 1 && res.r) {
            const data = res.r;
            setForm({
              name: data.name || '',
              description: data.description || '',
              term_condition: data.term_condition || '',
              start_date: data.start_date ? data.start_date.split('T')[0] : '',
              example_html: data.example_html || '',
              plan_type: String(data.plan_type || '1'),
            });
            if (data.image) {
              setImagePreview(data.image.startsWith('http') ? data.image : `${BASE_API_URL}${data.image}`);
            }
            if (data.age_rules && Array.isArray(data.age_rules)) {
              setAgeRules(data.age_rules.map(r => ({
                min_age: String(r.min_age),
                max_age: String(r.max_age),
                amount: String(r.amount),
                joining_fee: String(r.joining_fee || '')
              })));
            } else {
              setAgeRules(defaultAgeRules);
            }
          } else {
            showToast(res.m || 'Failed to fetch insurance details', 'error');
          }
        } catch (err) {
          console.error('Error fetching insurance plan details:', err);
          showToast('Failed to load insurance details.', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setForm(emptyForm);
      setAgeRules(defaultAgeRules);
      setImageFile(null);
      setImagePreview('');
    }
  }, [insuranceId, isEditMode]);

  const handleInputChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddRule = () => {
    setAgeRules(prev => [...prev, { min_age: '', max_age: '', amount: '', joining_fee: '' }]);
  };

  const handleDeleteRule = (index) => {
    setAgeRules(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRuleChange = (index, field, val) => {
    setAgeRules(prev => prev.map((rule, idx) => {
      if (idx === index) {
        return { ...rule, [field]: val };
      }
      return rule;
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showToast('Insurance Name is required.', 'error');
      return false;
    }
    if (!form.description.trim()) {
      showToast('Description is required.', 'error');
      return false;
    }
    if (!form.term_condition.trim()) {
      showToast('Terms & Conditions are required.', 'error');
      return false;
    }
    
    if (ageRules.length === 0) {
      showToast('At least one age rule is required.', 'error');
      return false;
    }

    for (let idx = 0; idx < ageRules.length; idx++) {
      const r = ageRules[idx];
      const min = parseInt(r.min_age, 10);
      const max = parseInt(r.max_age, 10);
      const amt = parseFloat(r.amount);
      const jf = parseFloat(r.joining_fee);

      if (isNaN(min) || min < 0) {
        showToast(`Rule #${idx + 1}: Min Age must be a non-negative integer.`, 'error');
        return false;
      }
      if (isNaN(max) || max < min) {
        showToast(`Rule #${idx + 1}: Max Age must be greater than or equal to Min Age.`, 'error');
        return false;
      }
      if (isNaN(amt) || amt <= 0) {
        showToast(`Rule #${idx + 1}: Installment Fee must be greater than 0.`, 'error');
        return false;
      }
      if (isNaN(jf) || jf < 0) {
        showToast(`Rule #${idx + 1}: Joining Fee must be a non-negative number.`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('term_condition', form.term_condition.trim());
    
    const formattedRules = ageRules.map(r => ({
      min_age: parseInt(r.min_age, 10),
      max_age: parseInt(r.max_age, 10),
      amount: parseFloat(r.amount),
      joining_fee: parseFloat(r.joining_fee)
    }));
    formData.append('age_rules', JSON.stringify(formattedRules));
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    formData.append('plan_type', form.plan_type);
    
    if (form.start_date) {
      formData.append('start_date', form.start_date);
    }
    
    if (form.example_html) {
      formData.append('example_html', form.example_html);
    }

    try {
      let res;
      if (isEditMode) {
        formData.append('id', insuranceId);
        res = await apiRequest('/api/insurance/update', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await apiRequest('/api/insurance/create', {
          method: 'POST',
          body: formData,
        });
      }

      if (res.s === 1) {
        showToast(
          isEditMode
            ? 'Insurance plan updated successfully!'
            : 'Insurance plan created successfully!',
          'success'
        );
        router.push(isEditMode ? `/insurance/${insuranceId}` : '/insurance');
      } else {
        showToast(res.m || 'Failed to save insurance plan.', 'error');
      }
    } catch (err) {
      console.error('Error saving insurance plan:', err);
      showToast('An error occurred while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0ea5e9' }}>Loading insurance details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1350px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Full Width Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '26px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '9999px', fontSize: '0.82rem' }}
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> <span>Back</span>
          </button>

          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
              {isEditMode ? 'Edit Insurance Plan' : 'Create Insurance Plan'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.84rem', marginTop: '3px', fontWeight: '500' }}>
              {isEditMode ? `Update details and configure rules for ${form.name}` : 'Fill in the fields below to configure a new scheme'}
            </p>
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            style={{ padding: '9px 20px', borderRadius: '9999px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '9px 24px', borderRadius: '9999px', minWidth: '150px' }}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} />
                <span>{isEditMode ? 'Update Plan' : 'Save Plan'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spacious 2-Column Full Screen Form Grid */}
      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* LEFT COLUMN: Basic Information & Detailed Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Basic Information */}
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Basic Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Insurance Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="premium-input"
                  placeholder="e.g. Swasthya Raksha Gold"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Plan Type *</label>
                  <select
                    value={form.plan_type}
                    onChange={e => handleInputChange('plan_type', e.target.value)}
                    className="premium-input"
                    style={{ width: '100%' }}
                  >
                    <option value="1">Marriage Assistance (Shaadi Sahyog)</option>
                    <option value="2">Death Assistance (Suraksha Sahyog)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Start Date (Laagu date)</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => handleInputChange('start_date', e.target.value)}
                    className="premium-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Detailed Content & Terms */}
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Detailed Content & Rules
              </h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Description *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className="premium-input"
                  placeholder="Describe key benefits, coverage limits, eligibility details, etc."
                  rows={4}
                  style={{ width: '100%', borderRadius: '16px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Example Content (HTML/Text for Bond Certificate)</label>
                <textarea
                  value={form.example_html}
                  onChange={e => handleInputChange('example_html', e.target.value)}
                  className="premium-input"
                  placeholder="Enter HTML table or text content that shows the example rules on the certificate..."
                  rows={5}
                  style={{ width: '100%', borderRadius: '16px', resize: 'vertical', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Terms & Conditions *</label>
                <textarea
                  required
                  value={form.term_condition}
                  onChange={e => handleInputChange('term_condition', e.target.value)}
                  className="premium-input"
                  placeholder="Enter eligibility rules, exclusions, claim terms..."
                  rows={4}
                  style={{ width: '100%', borderRadius: '16px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Cover Image Dropzone & Age-wise Rules Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 3: Plan Cover Image Dropzone */}
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={18} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Plan Cover Image
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                width: '100%',
                height: '180px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px dashed #cbd5e1',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                    <Upload size={32} style={{ margin: '0 auto 8px', color: '#0ea5e9' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Click to upload plan cover image</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>PNG, JPG or WEBP up to 5MB</div>
                  </div>
                )}
              </div>

              <input type="file" id="cover-upload-full" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="cover-upload-full" className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}>
                {imagePreview ? 'Change Cover Image' : 'Select Cover Image'}
              </label>
            </div>
          </div>

          {/* Card 4: Age-wise Payment Rules */}
          <div className="card" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} strokeWidth={2.5} />
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Age-wise Payment Rules
                </h2>
              </div>

              <button 
                type="button"
                onClick={handleAddRule}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <Plus size={14} strokeWidth={2.5} /> Add Rule
              </button>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Min Age</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Max Age</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Installment (₹) *</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>Joining (₹) *</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', width: '70px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ageRules.map((rule, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < ageRules.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          value={rule.min_age} 
                          onChange={e => handleRuleChange(idx, 'min_age', e.target.value)}
                          className="premium-input" 
                          style={{ width: '80px', padding: '8px 10px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          value={rule.max_age} 
                          onChange={e => handleRuleChange(idx, 'max_age', e.target.value)}
                          className="premium-input" 
                          style={{ width: '80px', padding: '8px 10px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          placeholder="e.g. 50"
                          value={rule.amount} 
                          onChange={e => handleRuleChange(idx, 'amount', e.target.value)}
                          className="premium-input" 
                          style={{ width: '100%', minWidth: '95px', padding: '8px 10px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          placeholder="e.g. 500"
                          value={rule.joining_fee} 
                          onChange={e => handleRuleChange(idx, 'joining_fee', e.target.value)}
                          className="premium-input" 
                          style={{ width: '100%', minWidth: '95px', padding: '8px 10px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteRule(idx)}
                          disabled={ageRules.length <= 1}
                          style={{
                            background: ageRules.length <= 1 ? 'none' : '#fef2f2',
                            border: 'none',
                            color: ageRules.length <= 1 ? '#cbd5e1' : '#ef4444',
                            padding: '6px',
                            borderRadius: '8px',
                            cursor: ageRules.length <= 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
