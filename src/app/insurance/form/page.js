'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const emptyForm = {
  name: '',
  description: '',
  term_condition: '',
  start_date: '',
  example_html: '',
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
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('term_condition', form.term_condition.trim());
    
    // Process and format rules
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
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading insurance details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => router.push(isEditMode ? `/insurance/${insuranceId}` : '/insurance')}
          className="btn-secondary"
          style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid #e8edf2' }}
        >
          <ArrowLeft size={16} /> <span>Back</span>
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
            {isEditMode ? 'Edit Insurance Plan' : 'Create Insurance Plan'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
            {isEditMode ? `Update fields for ${form.name}` : 'Fill in fields to configure a new scheme'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cover Image & Plan Title card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            🛡️ Insurance Basics
          </h2>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Image Preview Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e8edf2', width: '220px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>Plan Cover Image</span>
              
              <div style={{ width: '100%', height: '130px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <Upload size={24} style={{ margin: '0 auto 6px' }} />
                    <span style={{ fontSize: '0.68rem' }}>No cover selected</span>
                  </div>
                )}
              </div>
              
              <input type="file" id="cover-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="cover-upload" className="btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}>
                Upload Image
              </label>
            </div>

            {/* Inputs Block */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '280px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Insurance Name *</label>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Start Date (Laagu date)</label>
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

        {/* Description & Terms Conditions card */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            📄 Detailed Content
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Description *</label>
              <textarea
                required
                value={form.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="premium-input"
                placeholder="Describe key benefits, coverage limits, etc."
                rows={4}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Example Content (HTML/Text for Bond Certificate)</label>
              <textarea
                value={form.example_html}
                onChange={e => handleInputChange('example_html', e.target.value)}
                className="premium-input"
                placeholder="Enter HTML table or text content that shows the example rules on the certificate..."
                rows={6}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Terms & Conditions *</label>
              <textarea
                required
                value={form.term_condition}
                onChange={e => handleInputChange('term_condition', e.target.value)}
                className="premium-input"
                placeholder="Enter eligibility rules, exclusions, claim terms..."
                rows={4}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Age-wise Payment Rules */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Age-wise Payment Rules
            </h2>
            <button 
              type="button"
              onClick={handleAddRule}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              ➕ Add Age Rule
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#64748b', width: '110px' }}>Min Age</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#64748b', width: '110px' }}>Max Age</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Installment Fee (₹) *</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Joining Fee (₹) *</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#64748b', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {ageRules.map((rule, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={rule.min_age} 
                        onChange={e => handleRuleChange(idx, 'min_age', e.target.value)}
                        className="premium-input" 
                        style={{ width: '80px', padding: '6px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={rule.max_age} 
                        onChange={e => handleRuleChange(idx, 'max_age', e.target.value)}
                        className="premium-input" 
                        style={{ width: '80px', padding: '6px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input 
                        type="number" 
                        required 
                        min="1"
                        placeholder="e.g. 50"
                        value={rule.amount} 
                        onChange={e => handleRuleChange(idx, 'amount', e.target.value)}
                        className="premium-input" 
                        style={{ width: '100%', minWidth: '100px', padding: '6px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        placeholder="e.g. 500"
                        value={rule.joining_fee} 
                        onChange={e => handleRuleChange(idx, 'joining_fee', e.target.value)}
                        className="premium-input" 
                        style={{ width: '100%', minWidth: '100px', padding: '6px' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteRule(idx)}
                        disabled={ageRules.length <= 1}
                        style={{ background: 'none', border: 'none', color: ageRules.length <= 1 ? '#cbd5e1' : '#ef4444', fontWeight: '600', cursor: ageRules.length <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => router.push(isEditMode ? `/insurance/${insuranceId}` : '/insurance')}
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
                <span>Saving Plan...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Insurance Plan' : 'Create Insurance Plan'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
