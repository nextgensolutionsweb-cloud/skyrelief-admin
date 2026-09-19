'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Eye, EyeOff, Copy } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  phone: '',
  email: '',
  gender: 'MALE',
  dob: '',
  alt_mobile: '',
  aadhaar: '',
  pan: '',
  plan_id: '',
  fees: '',
  collected_fees: '',
  remaining_fees: '',
  age: '',
  occupation: '',
  guardian: '',
  guardian_aadhaar_number: '',
  relation: '',
  father: '',
  mother: '',
  mother_aadhaar: '',
  father_aadhaar: '',
  notes: '',
  address: '',
  city: '',
  village: '',
  state: '',
  pin: '',
  password: '',
  confirm_password: '',
  agent_id: '',
};

const todayStr = new Date().toISOString().split('T')[0];
const minDateObj = new Date();
minDateObj.setFullYear(minDateObj.getFullYear() - 100);
const minDateStr = minDateObj.toISOString().split('T')[0];

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const calculateAge = (dobString) => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  const d = today.getDate() - dob.getDate();
  if (m > 0 || (m === 0 && d > 0)) {
    age++;
  }
  return age >= 0 ? String(age) : '0';
};

const formatDobForInput = (dobValue) => {
  if (!dobValue) return '';
  if (typeof dobValue === 'string') {
    if (dobValue.includes('T')) {
      return dobValue.split('T')[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dobValue)) {
      return dobValue;
    }
  }
  try {
    const d = new Date(dobValue);
    if (!isNaN(d.getTime())) {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) { }
  return '';
};

export default function MemberFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get('id');
  const isEditMode = !!memberId;

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_API_URL}${cleanPath}`;
  };

  const [form, setForm] = useState(emptyForm);
  const [plans, setPlans] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Files state
  const [profileFile, setProfileFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [motherAadhaarFile, setMotherAadhaarFile] = useState(null);
  const [fatherAadhaarFile, setFatherAadhaarFile] = useState(null);
  const [guardianAadhaarFile, setGuardianAadhaarFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  // Image previews state
  const [previews, setPreviews] = useState({
    profile: '',
    pan_img: '',
    aadhaar_front: '',
    aadhaar_back: '',
    mother_aadhaar: '',
    father_aadhaar: '',
    guardian_aadhaar_img: '',
    signature: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleGeneratePassword = () => {
    let baseName = form.first_name ? form.first_name.trim() : 'User';
    if (baseName.length < 4) baseName += 'Pass';
    const namePart = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();

    let yearPart = '1234';
    if (form.dob) {
      const parts = form.dob.split('-');
      if (parts.length > 0) yearPart = parts[0];
    }

    const randomNum = Math.floor(10 + Math.random() * 90);
    let generated = `${namePart}@${yearPart}${randomNum}`;
    if (generated.length < 8) generated += 'xY';

    handleInputChange('password', generated);
  };

  const copyToClipboard = () => {
    if (form.password) {
      navigator.clipboard.writeText(form.password);
      showToast('Password copied!', 'success');
    }
  };

  // Fetch plans and agents
  const fetchDependencies = async () => {
    try {
      const [plansRes, agentsRes] = await Promise.all([
        apiRequest('/api/insurance/get-all?limit=100').catch(() => ({ s: 0, r: [] })),
        apiRequest('/api/agent/get-all?limit=100').catch(() => ({ s: 0, r: [] }))
      ]);

      if (plansRes.s === 1 && Array.isArray(plansRes.r)) {
        setPlans(plansRes.r);
        // Set default plan if creating
        if (!isEditMode && plansRes.r.length > 0) {
          setForm(prev => {
            const updated = {
              ...prev,
              plan_id: String(plansRes.r[0].id)
            };
            const selected = plansRes.r[0];
            const age = parseInt(prev.age, 10);
            let targetFees = String(selected.joining_fee || 0);
            if (!isNaN(age) && selected.age_rules && Array.isArray(selected.age_rules)) {
              const matchedRule = selected.age_rules.find(r => age >= r.min_age && age <= r.max_age && r.status === 1);
              if (matchedRule && matchedRule.joining_fee !== undefined && matchedRule.joining_fee !== null) {
                targetFees = String(matchedRule.joining_fee);
              }
            }
            updated.fees = targetFees;
            return updated;
          });
        }
      }

      if (agentsRes.s === 1 && Array.isArray(agentsRes.r)) {
        setAgents(agentsRes.r);
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [isEditMode]);

  // Fetch member info if edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchMemberDetails = async () => {
        setLoading(true);
        try {
          const res = await apiRequest(`/api/member/get?id=${memberId}`);
          if (res.s === 1 && res.r) {
            const data = Array.isArray(res.r) ? res.r[0] : res.r;
            const details = data?.member_details || {};
            const address = data.address || {};
            const docs = data.documents || [];

            const profileImg = details.profile_image || details.profile_photo || data.profile_photo || data.profile || '';
            const panDoc = docs.find(d => d.document_type?.toUpperCase() === 'PAN');
            const aaFrontDoc = docs.find(d => d.document_type?.toUpperCase() === 'AADHAR_FRONT');
            const aaBackDoc = docs.find(d => d.document_type?.toUpperCase() === 'AADHAR_BACK');

            const dobFormatted = formatDobForInput(data.dob || details.dob);
            let mappedAge = details.age !== null && details.age !== undefined ? String(details.age) : (data.age !== null && data.age !== undefined ? String(data.age) : '');
            if (!mappedAge && dobFormatted) {
              mappedAge = calculateAge(dobFormatted);
            }

            setForm({
              first_name: details.first_name || data.first_name || '',
              middle_name: details.middle_name || data.middle_name || '',
              last_name: details.last_name || data.last_name || '',
              phone: details.mobile || data.phone || data.mobile || '',
              email: details.email || data.email || '',
              gender: details.gender || data.gender || 'MALE',
              dob: dobFormatted,
              alt_mobile: details.alternate_mobile || data.alt_mobile || data.alternate_mobile || '',
              aadhaar: details.aadhaar_number || data.aadhaar_number || data.aadhaar || '',
              pan: details.pan_number || data.pan_number || data.pan || '',
              plan_id: String(data.plan_id || details.plan_id || ''),
              fees: String(data.joining_amount !== undefined && data.joining_amount !== null ? data.joining_amount : (data.joining_fees || data.fees || '')),
              collected_fees: String(data.collected_amount !== undefined && data.collected_amount !== null ? data.collected_amount : ''),
              remaining_fees: String(data.remaining_amount !== undefined && data.remaining_amount !== null ? data.remaining_amount : ''),
              age: mappedAge,
              occupation: data.occupation || details.occupation || '',
              guardian: details.guardian_name || data.guardian || data.guardian_name || '',
              guardian_aadhaar_number: data.guardian_aadhaar_number || details.guardian_aadhaar_number || '',
              relation: details.relation || details.guardian_relation || data.relation || '',
              father: details.father_name || data.father || data.father_name || '',
              mother: details.mother_name || data.mother || data.mother_name || '',
              mother_aadhaar: data.mother_aadhaar || details.mother_aadhaar || '',
              father_aadhaar: data.father_aadhaar || details.father_aadhaar || '',
              notes: data.notes || details.notes || '',
              address: address.address_line_1 || data.address || '',
              city: address.city || data.city || '',
              village: address.village || data.village || '',
              state: address.state || data.state || '',
              pin: address.pincode || address.pin_code || data.pin || '',
              profile: profileImg || '',
              pan_img: data.pan_img || panDoc?.file_url || '',
              aadhaar_front: data.aadhaar_front || aaFrontDoc?.file_url || '',
              aadhaar_back: data.aadhaar_back || aaBackDoc?.file_url || '',
              guardian_aadhaar_img: data.guardian_aadhaar_img || details.guardian_aadhaar_img || '',
              signature: data.signature || '',
              agent_id: String(data.agent_id || details.agent_id || ''),
            });
          } else {
            showToast(res.m || 'Failed to fetch member details', 'error');
          }
        } catch (err) {
          console.error('Error fetching member details:', err);
          showToast('Failed to load member details.', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchMemberDetails();
    }
  }, [memberId, isEditMode]);

  const handleInputChange = (field, val) => {
    if (field === 'email') {
      val = val.trim().toLowerCase();
    }
    if (field === 'phone' || field === 'alt_mobile') {
      val = val.replace(/\D/g, '').slice(0, 10);
    }

    setForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'dob') {
        updated.age = calculateAge(val);
      }

      // Compute correct joining fee based on matched age-wise rule
      const planIdToUse = field === 'plan_id' ? val : updated.plan_id;
      const ageToUse = field === 'age' ? val : (field === 'dob' ? calculateAge(val) : updated.age);

      const selected = plans.find(p => String(p.id) === String(planIdToUse));
      if (selected) {
        const ageVal = parseInt(ageToUse, 10);
        let feesToSet = String(selected.joining_fee || 0);
        if (!isNaN(ageVal) && selected.age_rules && Array.isArray(selected.age_rules)) {
          const matchedRule = selected.age_rules.find(r => ageVal >= r.min_age && ageVal <= r.max_age && r.status === 1);
          if (matchedRule && matchedRule.joining_fee !== undefined && matchedRule.joining_fee !== null) {
            feesToSet = String(matchedRule.joining_fee);
          }
        }
        updated.fees = feesToSet;
      }

      // Auto-calculate remaining fees
      if (field === 'fees' || field === 'collected_fees' || updated.fees) {
        const total = parseFloat(updated.fees) || 0;
        const collected = parseFloat(updated.collected_fees) || 0;
        updated.remaining_fees = String(Math.max(0, total - collected));
      }

      return updated;
    });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and extension fallback
    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      showToast('Please select a JPG, JPEG, PNG, or WEBP image file.', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [field]: previewUrl }));

    if (field === 'profile') setProfileFile(file);
    if (field === 'pan_img') setPanFile(file);
    if (field === 'aadhaar_front') setAadhaarFrontFile(file);
    if (field === 'aadhaar_back') setAadhaarBackFile(file);
    if (field === 'mother_aadhaar') setMotherAadhaarFile(file);
    if (field === 'father_aadhaar') setFatherAadhaarFile(file);
    if (field === 'guardian_aadhaar_img') setGuardianAadhaarFile(file);
    if (field === 'signature') setSignatureFile(file);
  };

  const validateForm = () => {
    if (!form.first_name.trim()) {
      showToast('First Name is required.', 'error');
      return false;
    }
    if (!form.last_name.trim()) {
      showToast('Last Name is required.', 'error');
      return false;
    }
    if (!form.phone.trim()) {
      showToast('Mobile Number is required.', 'error');
      return false;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      showToast('Mobile Number must be exactly 10 digits.', 'error');
      return false;
    }
    if (form.alt_mobile && form.alt_mobile.trim() && !/^\d{10}$/.test(form.alt_mobile.trim())) {
      showToast('Alternate Mobile must be exactly 10 digits.', 'error');
      return false;
    }
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }
    if (!form.gender) {
      showToast('Gender is required.', 'error');
      return false;
    }
    if (!form.dob) {
      showToast('Date of Birth is required.', 'error');
      return false;
    }
    if (!form.plan_id) {
      showToast('Insurance Plan is required.', 'error');
      return false;
    }
    if (form.aadhaar && form.aadhaar.trim() && !/^\d{12}$/.test(form.aadhaar.trim())) {
      showToast('Aadhaar Number must be exactly 12 digits.', 'error');
      return false;
    }

    if (form.pan && form.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
      showToast('Please enter a valid PAN Number (e.g. ABCDE1234F).', 'error');
      return false;
    }
    if (form.pin && form.pin.trim() && !/^\d{6}$/.test(form.pin.trim())) {
      showToast('Pincode must be exactly 6 digits.', 'error');
      return false;
    }
    if (form.age && isNaN(Number(form.age))) {
      showToast('Age must be a numeric value.', 'error');
      return false;
    }
    // Password validation
    if (!isEditMode) {
      if (!form.password || !form.password.trim()) {
        showToast('Password is required.', 'error');
        return false;
      }
      if (form.password !== form.confirm_password) {
        showToast('Password and Confirm Password do not match.', 'error');
        return false;
      }
    } else {
      if (form.password && form.password.trim()) {
        if (form.password !== form.confirm_password) {
          showToast('Password and Confirm Password do not match.', 'error');
          return false;
        }
      }
    }

    if (agents.length > 0 && !form.agent_id) {
      showToast('Please select an Agent.', 'error');
      return false;
    }

    if (form.plan_id) {
      const selectedPlan = plans.find(p => String(p.id) === String(form.plan_id));
      if (selectedPlan && selectedPlan.age_rules && selectedPlan.age_rules.length > 0) {
        const memAge = parseInt(form.age || 0);
        const isValidAge = selectedPlan.age_rules.some(r => memAge >= r.min_age && memAge <= r.max_age && r.status === 1);
        if (!isValidAge) {
          showToast('Member age does not meet the insurance plan age rules.', 'error');
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const formData = new FormData();

    // Define exact flat fields to append
    const fieldsToSubmit = {
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
      gender: form.gender,
      dob: form.dob,
      alt_mobile: form.alt_mobile,
      aadhaar: form.aadhaar,
      pan: form.pan,
      plan_id: form.plan_id,
      fees: form.fees,
      joining_amount: form.fees,
      joining_fees: form.fees,
      collected_fees: form.collected_fees,
      remaining_fees: form.remaining_fees,
      age: form.age,
      occupation: form.occupation,
      guardian: form.guardian,
      guardian_aadhaar_number: form.guardian_aadhaar_number,
      relation: form.relation,
      father: form.father,
      mother: form.mother,
      notes: form.notes,
      address: form.address,
      city: form.city,
      village: form.village,
      state: form.state,
      pin: form.pin,
      agent_id: form.agent_id,
    };

    if (!isEditMode) {
      fieldsToSubmit.password = form.password;
    } else if (form.password && form.password.trim()) {
      fieldsToSubmit.password = form.password; // send if filled on edit
    }

    Object.keys(fieldsToSubmit).forEach(key => {
      const val = fieldsToSubmit[key];
      if (val !== undefined && val !== null) {
        formData.append(key, val);
      }
    });

    // Add files if selected
    if (profileFile) formData.append('profile', profileFile);
    if (panFile) formData.append('pan_img', panFile);
    if (aadhaarFrontFile) formData.append('aadhaar_front', aadhaarFrontFile);
    if (aadhaarBackFile) formData.append('aadhaar_back', aadhaarBackFile);
    if (motherAadhaarFile) formData.append('mother_aadhaar', motherAadhaarFile);
    if (fatherAadhaarFile) formData.append('father_aadhaar', fatherAadhaarFile);
    if (guardianAadhaarFile) formData.append('guardian_aadhaar_img', guardianAadhaarFile);
    if (signatureFile) formData.append('signature', signatureFile);

    try {
      let res;
      if (isEditMode) {
        formData.append('id', memberId);
        res = await apiRequest('/api/member/update', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await apiRequest('/api/member/add', {
          method: 'POST',
          body: formData,
        });
      }

      if (res.s === 1) {
        showToast(
          isEditMode ? 'Member profile updated successfully!' : 'Member profile created successfully!',
          'success'
        );

        if (!isEditMode && res.r?.temp_password_info) {
          showToast(`Member password is: ${res.r.temp_password_info}`, 'info');
        }

        router.push(isEditMode ? `/members/${memberId}` : '/members');
      } else {
        showToast(res.m || 'Failed to save member profile.', 'error');
      }
    } catch (err) {
      console.error('Error saving member:', err);
      showToast('An error occurred while saving the member profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading member details...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Bar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="button"
            onClick={() => router.back()} 
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569' }}
          >
            <ArrowLeft size={18} /> <span>Back</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              {isEditMode ? 'Edit Member Profile' : 'Add New Member'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '3px', margin: 0 }}>
              {isEditMode ? `Update details and plan records for ${form.first_name || ''} ${form.last_name || ''}` : 'Fill in registration fields to onboard a new foundation member'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="btn-secondary" 
            style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={saving} 
            className="btn-primary" 
            style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
          >
            {saving ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Saving Member...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Member Profile' : 'Create Member'}</span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Main Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: Profile & Personal */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: '700', fontSize: '1.1rem' }}>
                  👤
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Personal & Profile Information</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Full legal name, contact numbers, gender, DOB, and login password</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.first_name} onChange={e => handleInputChange('first_name', e.target.value)} className="premium-input" placeholder="e.g. Sanjaybhai" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Middle Name</label>
                    <input type="text" value={form.middle_name} onChange={e => handleInputChange('middle_name', e.target.value)} className="premium-input" placeholder="Father's / Husband's Name" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.last_name} onChange={e => handleInputChange('last_name', e.target.value)} className="premium-input" placeholder="e.g. Mali" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.phone} onChange={e => handleInputChange('phone', e.target.value)} className="premium-input" placeholder="10-digit mobile" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={form.gender} onChange={e => handleInputChange('gender', e.target.value)} className="premium-input" style={{ width: '100%', background: '#fff' }}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" required value={form.dob} max={todayStr} min={minDateStr} onChange={e => handleInputChange('dob', e.target.value)} className="premium-input" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Age (Years)</label>
                    <input type="text" value={form.age} readOnly className="premium-input" placeholder="Auto calculated" style={{ width: '100%', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Alternate Mobile</label>
                    <input type="text" value={form.alt_mobile} onChange={e => handleInputChange('alt_mobile', e.target.value)} className="premium-input" placeholder="Alternate phone" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Email Address</label>
                    <input type="email" value={form.email} onChange={e => handleInputChange('email', e.target.value)} className="premium-input" placeholder="member@domain.com" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-2" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Password {isEditMode ? '(Optional to update)' : <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          required={!isEditMode}
                          value={form.password || ''}
                          onChange={e => handleInputChange('password', e.target.value)}
                          className="premium-input"
                          name="password"
                          placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"}
                          style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0', display: 'flex', alignItems: 'center' }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {!isEditMode && (
                        <>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="btn-secondary"
                            style={{ padding: '0 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}
                          >
                            Generate
                          </button>
                          {form.password && (
                            <button
                              type="button"
                              onClick={copyToClipboard}
                              className="btn-secondary"
                              style={{ padding: '0 12px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}
                              title="Copy Password"
                            >
                              <Copy size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Confirm Password {(!isEditMode || (isEditMode && form.password)) ? <span style={{ color: '#ef4444' }}>*</span> : ''}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!isEditMode || (isEditMode && !!form.password)}
                      value={form.confirm_password || ''}
                      onChange={e => handleInputChange('confirm_password', e.target.value)}
                      className="premium-input"
                      name="confirm_password"
                      placeholder="Re-enter password"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Insurance Plan Information */}
            {!isEditMode && (
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                    💳
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Insurance Plan Details</h2>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Select foundation scheme, joining fees, and registering agent</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="grid-r-2" style={{ gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Insurance Plan <span style={{ color: '#ef4444' }}>*</span></label>
                      <select value={form.plan_id} onChange={e => handleInputChange('plan_id', e.target.value)} className="premium-input" style={{ width: '100%', background: '#fff' }}>
                        <option value="">Select Plan</option>
                        {plans.map((p, idx) => <option key={p.id || idx} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    {agents.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Assign to Agent <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={form.agent_id} onChange={e => handleInputChange('agent_id', e.target.value)} className="premium-input" style={{ width: '100%', background: '#fff' }}>
                          <option value="">Select Agent</option>
                          {agents.map((a, idx) => <option key={a.id || idx} value={a.id}>{a.first_name} {a.last_name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid-r-3" style={{ gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Joining Fees (₹)</label>
                      <input type="number" min="0" value={form.fees} onChange={e => handleInputChange('fees', e.target.value)} className="premium-input" placeholder="500" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Collected Fees (₹)</label>
                      <input type="number" min="0" value={form.collected_fees} onChange={e => handleInputChange('collected_fees', e.target.value)} className="premium-input" placeholder="200" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Remaining Fees (₹)</label>
                      <input type="number" min="0" value={form.remaining_fees} readOnly className="premium-input" placeholder="300" style={{ width: '100%', background: '#f8fafc', color: '#64748b' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Address Details */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontWeight: '700', fontSize: '1.1rem' }}>
                  📍
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Residential Address Details</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Complete street address, village landmark, city and pincode</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="grid-r-2" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Street Address</label>
                    <input type="text" value={form.address} onChange={e => handleInputChange('address', e.target.value)} className="premium-input" placeholder="House/Flat No., Building, Street" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Village / Landmark</label>
                    <input type="text" value={form.village} onChange={e => handleInputChange('village', e.target.value)} className="premium-input" placeholder="Near Temple / Area" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>City</label>
                    <input type="text" value={form.city} onChange={e => handleInputChange('city', e.target.value)} className="premium-input" placeholder="e.g. Ahmedabad" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>State</label>
                    <input type="text" value={form.state} onChange={e => handleInputChange('state', e.target.value)} className="premium-input" placeholder="e.g. Gujarat" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Pincode</label>
                    <input type="text" value={form.pin} onChange={e => handleInputChange('pin', e.target.value)} className="premium-input" placeholder="6-digit pincode" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Family & Guardian Information */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontWeight: '700', fontSize: '1.1rem' }}>
                  👪
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Family & Guardian Information</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Guardian details, relation, and guardian Aadhaar number</span>
                </div>
              </div>

              <div className="grid-r-3" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Guardian Name</label>
                  <input type="text" value={form.guardian} onChange={e => handleInputChange('guardian', e.target.value)} className="premium-input" placeholder="Guardian's name" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Guardian Relation</label>
                  <input type="text" value={form.relation} onChange={e => handleInputChange('relation', e.target.value)} className="premium-input" placeholder="e.g. Uncle / Father" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Guardian Aadhaar No.</label>
                  <input type="text" value={form.guardian_aadhaar_number} onChange={e => handleInputChange('guardian_aadhaar_number', e.target.value)} className="premium-input" placeholder="12-digit Aadhaar" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* Card 5: Administrative Notes */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', fontWeight: '700', fontSize: '1.1rem' }}>
                  📝
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Administrative Notes</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Internal comments or special remarks</span>
                </div>
              </div>
              <textarea 
                value={form.notes} 
                onChange={e => handleInputChange('notes', e.target.value)} 
                className="premium-input" 
                placeholder="Add optional administrative notes or remarks about this member..." 
                rows={3} 
                style={{ width: '100%', resize: 'none', fontFamily: 'inherit', borderRadius: '12px' }} 
              />
            </div>

          </div>

          {/* RIGHT COLUMN: Profile Photo & KYC Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card A: Profile Photo Card */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📸 Profile Photo
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(previews.profile || form.profile) ? (
                    <img src={previews.profile || getImageUrl(form.profile)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '12px' }}>
                      <Upload size={28} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                      <span style={{ fontSize: '0.72rem', display: 'block', fontWeight: '600' }}>Upload Photo</span>
                    </div>
                  )}
                </div>
                
                <input type="file" id="profile-upload" accept="image/*" onChange={e => handleFileChange(e, 'profile')} style={{ display: 'none' }} />
                <label htmlFor="profile-upload" className="btn-secondary" style={{ width: '100%', padding: '9px 16px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '10px', boxSizing: 'border-box' }}>
                  {(previews.profile || form.profile) ? 'Change Photo' : 'Select Photo'}
                </label>
              </div>
            </div>

            {/* Card B: Verification & KYC Documents */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🪪 Verification & KYC Documents
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Aadhaar Number</label>
                  <input type="text" value={form.aadhaar} onChange={e => handleInputChange('aadhaar', e.target.value)} className="premium-input" placeholder="12-digit Aadhaar" style={{ width: '100%' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>PAN Number</label>
                  <input type="text" value={form.pan} onChange={e => handleInputChange('pan', e.target.value)} className="premium-input" placeholder="e.g. ABCDE1234F" style={{ width: '100%', textTransform: 'uppercase' }} />
                </div>

                {/* File Upload Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                  {/* Aadhaar Front */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Aadhaar Front</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(previews.aadhaar_front || form.aadhaar_front) ? (
                        <img src={previews.aadhaar_front || getImageUrl(form.aadhaar_front)} alt="Aadhaar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" id="aadhaar-front-upload" accept="image/*" onChange={e => handleFileChange(e, 'aadhaar_front')} style={{ display: 'none' }} />
                    <label htmlFor="aadhaar-front-upload" className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Upload Front
                    </label>
                  </div>

                  {/* Aadhaar Back */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Aadhaar Back</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(previews.aadhaar_back || form.aadhaar_back) ? (
                        <img src={previews.aadhaar_back || getImageUrl(form.aadhaar_back)} alt="Aadhaar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" id="aadhaar-back-upload" accept="image/*" onChange={e => handleFileChange(e, 'aadhaar_back')} style={{ display: 'none' }} />
                    <label htmlFor="aadhaar-back-upload" className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Upload Back
                    </label>
                  </div>

                  {/* PAN Card Image */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>PAN Image</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(previews.pan_img || form.pan_img) ? (
                        <img src={previews.pan_img || getImageUrl(form.pan_img)} alt="PAN Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" id="pan-image-upload" accept="image/*" onChange={e => handleFileChange(e, 'pan_img')} style={{ display: 'none' }} />
                    <label htmlFor="pan-image-upload" className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Upload PAN
                    </label>
                  </div>

                  {/* Guardian Aadhaar */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Guardian Aadhaar</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(previews.guardian_aadhaar_img || form.guardian_aadhaar_img) ? (
                        <img src={previews.guardian_aadhaar_img || getImageUrl(form.guardian_aadhaar_img)} alt="Guardian Aadhaar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" id="guardian-aadhaar-upload" accept="image/*" onChange={e => handleFileChange(e, 'guardian_aadhaar_img')} style={{ display: 'none' }} />
                    <label htmlFor="guardian-aadhaar-upload" className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Upload Aadhaar
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Card C: Quick Submit Actions */}
            <div className="card" style={{ padding: '20px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <button 
                type="submit" 
                disabled={saving} 
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
              >
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Saving Member...</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Member Profile' : 'Submit & Register Member'}</span>
                )}
              </button>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
