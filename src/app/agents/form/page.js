'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Eye, EyeOff, Copy } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: 'Male',
  dob: '',
  age: '',
  occupation: '',
  phone: '',
  alt_mobile: '',
  email: '',
  aadhaar: '',
  pan: '',
  address: '',
  city: '',
  village: '',
  state: '',
  pin: '',
  joining_fee_commission_percent: '',
  installment_commission_percent: '',
  notes: '',
  password: '',
  confirm_password: ''
};

export default function AgentFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  const isEditMode = !!agentId;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Files state
  const [profileFile, setProfileFile] = useState(null);
  const [panImgFile, setPanImgFile] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  // Previews state
  const [previews, setPreviews] = useState({
    profile: '',
    pan_img: '',
    aadhaar_front: '',
    aadhaar_back: '',
    signature: ''
  });

  // Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSrcImage, setCropSrcImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const signatureFileInputRef = useRef(null);
  const canvasRef = useRef(null);

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

  const cleanEmail = (emailStr) => {
    if (!emailStr) return '';
    if (emailStr.includes('[')) {
      const match = emailStr.match(/\[(.*?)\]/);
      return match ? match[1] : emailStr;
    }
    return emailStr;
  };

  const formatDOB = (dobStr) => {
    if (!dobStr) return '';
    return dobStr.split('T')[0];
  };

  useEffect(() => {
    if (isEditMode) {
      const fetchAgentDetails = async () => {
        setLoading(true);
        try {
          const res = await apiRequest(`/api/agent/get?id=${agentId}`);
          if (res.s === 1 && res.r) {
            const details = res.r || {};
            
            setForm({
              first_name: details.first_name || '',
              middle_name: details.middle_name || '',
              last_name: details.last_name || '',
              gender: details.gender || 'Male',
              dob: formatDOB(details.dob),
              age: details.age !== null && details.age !== undefined ? String(details.age) : '',
              occupation: details.occupation || '',
              phone: details.phone || '',
              alt_mobile: details.alt_mobile || details.alternate_mobile || '',
              email: cleanEmail(details.email),
              aadhaar: details.aadhaar || details.aadhaar_number || '',
              pan: details.pan || details.pan_number || '',
              address: details.address || '',
              city: details.city || '',
              village: details.village || '',
              state: details.state || '',
              pin: details.pin || details.pin_code || '',
              joining_fee_commission_percent: details.joining_fee_commission_percent !== null && details.joining_fee_commission_percent !== undefined ? String(details.joining_fee_commission_percent) : '',
              installment_commission_percent: details.installment_commission_percent !== null && details.installment_commission_percent !== undefined ? String(details.installment_commission_percent) : '',
              notes: details.notes || '',
              password: '',
              confirm_password: ''
            });

            setPreviews({
              profile: details.profile || '',
              pan_img: details.pan_img || '',
              aadhaar_front: details.aadhaar_front || '',
              aadhaar_back: details.aadhaar_back || '',
              signature: details.signature || ''
            });
          } else {
            showToast(res.m || 'Failed to fetch agent details', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to load agent details.', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchAgentDetails();
    } else {
      setForm(emptyForm);
      setPreviews({
        profile: '',
        pan_img: '',
        aadhaar_front: '',
        aadhaar_back: '',
        signature: ''
      });
      setProfileFile(null);
      setPanImgFile(null);
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setSignatureFile(null);
    }
  }, [agentId, isEditMode]);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let computedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    const d = today.getDate() - dob.getDate();
    if (m > 0 || (m === 0 && d > 0)) {
      computedAge++;
    }
    return computedAge >= 0 ? String(computedAge) : '0';
  };

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
      return updated;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const minDateObj = new Date();
  minDateObj.setFullYear(minDateObj.getFullYear() - 100);
  const minDateStr = minDateObj.toISOString().split('T')[0];


  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setPreviews(prev => ({ ...prev, [field]: previewUrl }));

    if (field === 'profile') setProfileFile(file);
    if (field === 'pan_img') setPanImgFile(file);
    if (field === 'aadhaar_front') setAadhaarFrontFile(file);
    if (field === 'aadhaar_back') setAadhaarBackFile(file);
  };

  // Canvas drawing effect inside the modal for signature
  useEffect(() => {
    if (!isCropModalOpen || !cropSrcImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 200);

    ctx.save();
    ctx.translate(300, 100);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Initial scale-to-fit
    const dw = cropSrcImage.width;
    const dh = cropSrcImage.height;
    const scaleX = 600 / dw;
    const scaleY = 200 / dh;
    const baseScale = Math.min(scaleX, scaleY);
    const drawWidth = dw * baseScale;
    const drawHeight = dh * baseScale;

    ctx.drawImage(
      cropSrcImage,
      -drawWidth / 2 + panOffset.x,
      -drawHeight / 2 + panOffset.y,
      drawWidth,
      drawHeight
    );
    ctx.restore();
  }, [isCropModalOpen, cropSrcImage, zoom, rotation, panOffset]);

  const handleCanvasMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Account for rotation when panning
    let moveX = dx;
    let moveY = dy;
    
    if (rotation === 90) {
      moveX = dy;
      moveY = -dx;
    } else if (rotation === 180) {
      moveX = -dx;
      moveY = -dy;
    } else if (rotation === 270) {
      moveX = -dy;
      moveY = dx;
    }

    setPanOffset(prev => ({
      x: prev.x + moveX / zoom,
      y: prev.y + moveY / zoom
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type and extension fallback
    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      showToast('Please select a JPG, JPEG, PNG, or WEBP signature image.', 'error');
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCropSrcImage(img);
        setZoom(1);
        setRotation(0);
        setPanOffset({ x: 0, y: 0 });
        setIsCropModalOpen(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Pixel cleanup transparency filter
    const imgData = ctx.getImageData(0, 0, 600, 200);
    const data = imgData.data;

    // Sample corners to detect background color
    const corners = [
      { r: data[0], g: data[1], b: data[2] }, // Top-Left
      { r: data[(600 - 1) * 4], g: data[(600 - 1) * 4 + 1], b: data[(600 - 1) * 4 + 2] }, // Top-Right
      { r: data[(200 - 1) * 600 * 4], g: data[(200 - 1) * 600 * 4 + 1], b: data[(200 - 1) * 600 * 4 + 2] }, // Bottom-Left
      { r: data[((200 * 600) - 1) * 4], g: data[((200 * 600) - 1) * 4 + 1], b: data[((200 * 600) - 1) * 4 + 2] } // Bottom-Right
    ];
    
    const bgR = (corners[0].r + corners[1].r + corners[2].r + corners[3].r) / 4;
    const bgG = (corners[0].g + corners[1].g + corners[2].g + corners[3].g) / 4;
    const bgB = (corners[0].b + corners[1].b + corners[2].b + corners[3].b) / 4;
    const bgBrightness = (bgR + bgG + bgB) / 3;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const pixelBrightness = (r + g + b) / 3;

      if (bgBrightness > 127) {
        // Light background -> Make background transparent, keep dark ink as dark blue
        const alpha = 255 - Math.round(pixelBrightness);
        data[i] = 11;      // R (dark blue brand color)
        data[i+1] = 27;    // G
        data[i+2] = 77;    // B
        data[i+3] = alpha; // A
      } else {
        // Dark background -> Make dark background transparent, convert white ink to dark blue
        const alpha = Math.round(pixelBrightness);
        data[i] = 11;      // R
        data[i+1] = 27;    // G
        data[i+2] = 77;    // B
        data[i+3] = alpha; // A
      }
    }
    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) {
        showToast('Failed to crop signature.', 'error');
        return;
      }
      const croppedFile = new File([blob], 'signature.png', { type: 'image/png' });
      setSignatureFile(croppedFile);
      setPreviews(prev => ({ ...prev, signature: URL.createObjectURL(blob) }));
      setIsCropModalOpen(false);
    }, 'image/png');
  };

  const validateForm = () => {
    if (!form.first_name.trim()) {
      showToast('First Name is required.', 'error');
      return false;
    }
    if (!form.middle_name.trim()) {
      showToast('Father Name is required.', 'error');
      return false;
    }
    if (!form.last_name.trim()) {
      showToast('Last Name is required.', 'error');
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
    if (form.age && isNaN(form.age)) {
      showToast('Age must be a valid number.', 'error');
      return false;
    }
    if (!form.phone.trim()) {
      showToast('Phone Number is required.', 'error');
      return false;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      showToast('Phone Number must be exactly 10 digits and numeric only.', 'error');
      return false;
    }
    if (form.alt_mobile && form.alt_mobile.trim() && !/^\d{10}$/.test(form.alt_mobile.trim())) {
      showToast('Alternate Mobile must be exactly 10 digits and numeric only.', 'error');
      return false;
    }
    if (!form.email.trim()) {
      showToast('Email Address is required.', 'error');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }
    if (!form.address.trim()) {
      showToast('Street Address is required.', 'error');
      return false;
    }
    if (!form.village.trim()) {
      showToast('Village / Landmark is required.', 'error');
      return false;
    }
    if (!form.city.trim()) {
      showToast('City is required.', 'error');
      return false;
    }
    if (!form.state.trim()) {
      showToast('State is required.', 'error');
      return false;
    }
    if (!form.pin.trim() || !/^\d{6}$/.test(form.pin.trim())) {
      showToast('Pincode is required and must be exactly 6 digits.', 'error');
      return false;
    }
    if (!form.aadhaar.trim() || !/^\d{12}$/.test(form.aadhaar.trim())) {
      showToast('Aadhaar Number is required and must be exactly 12 digits.', 'error');
      return false;
    }
    if (!form.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
      showToast('PAN Number is required and must be valid (e.g. ABCDE1234F).', 'error');
      return false;
    }
    if (form.joining_fee_commission_percent === undefined || form.joining_fee_commission_percent === null || form.joining_fee_commission_percent === '') {
      showToast('Joining Fee Commission is required.', 'error');
      return false;
    }
    const commJoin = Number(form.joining_fee_commission_percent);
    if (isNaN(commJoin) || commJoin < 0 || commJoin > 100) {
      showToast('Joining Fee Commission must be between 0 and 100.', 'error');
      return false;
    }

    if (form.installment_commission_percent === undefined || form.installment_commission_percent === null || form.installment_commission_percent === '') {
      showToast('Installment Commission is required.', 'error');
      return false;
    }
    const commInst = Number(form.installment_commission_percent);
    if (isNaN(commInst) || commInst < 0 || commInst > 100) {
      showToast('Installment Commission must be between 0 and 100.', 'error');
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
      
      // KYC File Validation for New Agents
      if (!profileFile) {
        showToast('Profile Photo is required.', 'error');
        return false;
      }
      if (!panImgFile) {
        showToast('PAN Card Image is required.', 'error');
        return false;
      }
      if (!aadhaarFrontFile) {
        showToast('Aadhaar Front Image is required.', 'error');
        return false;
      }
      if (!aadhaarBackFile) {
        showToast('Aadhaar Back Image is required.', 'error');
        return false;
      }
      if (!signatureFile) {
        showToast('Signature Image is required.', 'error');
        return false;
      }
    } else {
      // In edit mode, if password is provided, validate it
      if (form.password && form.password.trim()) {
        if (form.password !== form.confirm_password) {
          showToast('Password and Confirm Password do not match.', 'error');
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
    
    // Append all form inputs
    Object.keys(form).forEach(key => {
      if (key === 'confirm_password') return;
      if (isEditMode && key === 'password' && (!form.password || !form.password.trim())) return; // Do not send empty password on edit
      formData.append(key, form[key]);
    });

    // Append files if selected
    if (profileFile) formData.append('profile', profileFile);
    if (panImgFile) formData.append('pan_img', panImgFile);
    if (aadhaarFrontFile) formData.append('aadhaar_front', aadhaarFrontFile);
    if (aadhaarBackFile) formData.append('aadhaar_back', aadhaarBackFile);
    if (signatureFile) formData.append('signature', signatureFile);

    try {
      let res;
      if (isEditMode) {
        formData.append('id', agentId);
        res = await apiRequest('/api/agent/update', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await apiRequest('/api/agent/create', {
          method: 'POST',
          body: formData
        });
      }

      if (res.s === 1) {
        showToast(isEditMode ? 'Agent profile updated successfully!' : 'Agent profile created successfully!', 'success');
        
        if (!isEditMode && res.r?.temp_password_info) {
          showToast(`Agent password is: ${res.r.temp_password_info}`, 'info');
        }

        // Redirect
        router.push(isEditMode ? `/agents/${agentId}` : '/agents');
      } else {
        showToast(res.m || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while saving the agent profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getMediaUrl = (urlPath) => {
    if (!urlPath) return '';
    if (urlPath.startsWith('blob:') || urlPath.startsWith('http:') || urlPath.startsWith('https:')) return urlPath;
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
    return `${base}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Loading agent profile...</span>
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
            onClick={() => router.back()} 
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569' }}
          >
            <ArrowLeft size={18} /> <span>Back</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              {isEditMode ? 'Edit Agent Profile' : 'Add New Agent'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '3px', margin: 0 }}>
              {isEditMode ? `Update administrative details & document records for ${form.first_name || ''} ${form.last_name || ''}` : 'Fill in registration details to onboard a new field agent'}
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
                <span>Saving Agent...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Agent Profile' : 'Create Agent'}</span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid-responsive-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Main Form Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: Profile Information */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: '700', fontSize: '1.1rem' }}>
                  👤
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Personal & Profile Information</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Full legal name, demographics, and commission rates</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.first_name} onChange={e => handleInputChange('first_name', e.target.value)} className="premium-input" placeholder="e.g. Rahul" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Father Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.middle_name} onChange={e => handleInputChange('middle_name', e.target.value)} className="premium-input" placeholder="e.g. Rameshchandra" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.last_name} onChange={e => handleInputChange('last_name', e.target.value)} className="premium-input" placeholder="e.g. Patel" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={form.gender} onChange={e => handleInputChange('gender', e.target.value)} className="premium-input" style={{ width: '100%', background: '#fff' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" required value={form.dob} max={todayStr} min={minDateStr} onChange={e => handleInputChange('dob', e.target.value)} className="premium-input" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Age (Years)</label>
                    <input type="text" value={form.age} readOnly className="premium-input" placeholder="Auto calculated" style={{ width: '100%', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Occupation</label>
                    <input type="text" value={form.occupation} onChange={e => handleInputChange('occupation', e.target.value)} className="premium-input" placeholder="e.g. Insurance Consultant" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Joining Comm. (%) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" min="0" max="100" required value={form.joining_fee_commission_percent} onChange={e => handleInputChange('joining_fee_commission_percent', e.target.value)} className="premium-input" placeholder="e.g. 20" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Installment Comm. (%) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" min="0" max="100" required value={form.installment_commission_percent} onChange={e => handleInputChange('installment_commission_percent', e.target.value)} className="premium-input" placeholder="e.g. 15" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Contact & Credentials */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>
                  📞
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Contact & Security Credentials</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Primary phone, email, and authentication password</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required 
                      readOnly={isEditMode}
                      value={form.phone} 
                      onChange={e => handleInputChange('phone', e.target.value)} 
                      className="premium-input" 
                      placeholder="10-digit mobile" 
                      style={{ width: '100%', background: isEditMode ? '#f8fafc' : '#fff', cursor: isEditMode ? 'not-allowed' : 'text' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Alternate Mobile</label>
                    <input type="text" value={form.alt_mobile} onChange={e => handleInputChange('alt_mobile', e.target.value)} className="premium-input" placeholder="Alternate mobile" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" required value={form.email} onChange={e => handleInputChange('email', e.target.value)} className="premium-input" placeholder="name@domain.com" style={{ width: '100%' }} />
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
                          placeholder={isEditMode ? "Leave blank to keep current" : "Enter agent password"} 
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
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Street Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.address} onChange={e => handleInputChange('address', e.target.value)} className="premium-input" placeholder="House/Flat No., Building, Street" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Village / Landmark <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.village} onChange={e => handleInputChange('village', e.target.value)} className="premium-input" placeholder="Near Temple / Area" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="grid-r-3" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>City <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.city} onChange={e => handleInputChange('city', e.target.value)} className="premium-input" placeholder="e.g. Ahmedabad" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>State <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.state} onChange={e => handleInputChange('state', e.target.value)} className="premium-input" placeholder="e.g. Gujarat" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Pincode <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" required value={form.pin} onChange={e => handleInputChange('pin', e.target.value)} className="premium-input" placeholder="6-digit pincode" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Administrative Notes */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontWeight: '700', fontSize: '1.1rem' }}>
                  📝
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Additional Administrative Notes</h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Internal references or remarks</span>
                </div>
              </div>
              <textarea 
                value={form.notes} 
                onChange={e => handleInputChange('notes', e.target.value)} 
                className="premium-input" 
                placeholder="Add optional administrative notes or remarks about this agent..." 
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
                📸 Profile Photo {!isEditMode && <span style={{ color: '#ef4444' }}>*</span>}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {previews.profile ? (
                    <img src={getMediaUrl(previews.profile)} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '12px' }}>
                      <Upload size={28} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                      <span style={{ fontSize: '0.72rem', display: 'block', fontWeight: '600' }}>Upload Photo</span>
                    </div>
                  )}
                </div>
                
                <input type="file" id="profile-upload" accept="image/*" onChange={e => handleFileChange(e, 'profile')} style={{ display: 'none' }} />
                <label htmlFor="profile-upload" className="btn-secondary" style={{ width: '100%', padding: '9px 16px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '10px', boxSizing: 'border-box' }}>
                  {previews.profile ? 'Change Photo' : 'Select Photo'}
                </label>
              </div>
            </div>

            {/* Card B: KYC Documents */}
            <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid #e8edf2' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🪪 Verification & KYC Files
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Aadhaar Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required value={form.aadhaar} onChange={e => handleInputChange('aadhaar', e.target.value)} className="premium-input" placeholder="12-digit Aadhaar number" style={{ width: '100%' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>PAN Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required value={form.pan} onChange={e => handleInputChange('pan', e.target.value)} className="premium-input" placeholder="e.g. ABCDE1234F" style={{ width: '100%', textTransform: 'uppercase' }} />
                </div>

                {/* File Upload Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                  {/* Aadhaar Front */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Aadhaar Front {!isEditMode && '*'}</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {previews.aadhaar_front ? (
                        <img src={getMediaUrl(previews.aadhaar_front)} alt="Aadhaar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Aadhaar Back {!isEditMode && '*'}</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {previews.aadhaar_back ? (
                        <img src={getMediaUrl(previews.aadhaar_back)} alt="Aadhaar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>PAN Card {!isEditMode && '*'}</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {previews.pan_img ? (
                        <img src={getMediaUrl(previews.pan_img)} alt="PAN Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" id="pan-image-upload" accept="image/*" onChange={e => handleFileChange(e, 'pan_img')} style={{ display: 'none' }} />
                    <label htmlFor="pan-image-upload" className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Upload PAN
                    </label>
                  </div>

                  {/* Signature Image */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Signature {!isEditMode && '*'}</span>
                    <div style={{ height: '75px', borderRadius: '8px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {previews.signature ? (
                        <img src={getMediaUrl(previews.signature)} alt="Signature Card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Upload size={18} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <input type="file" ref={signatureFileInputRef} accept="image/*" onChange={handleSignatureFileChange} style={{ display: 'none' }} />
                    <button type="button" onClick={() => signatureFileInputRef.current?.click()} className="btn-secondary" style={{ padding: '6px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center', borderRadius: '6px' }}>
                      Crop Sign
                    </button>
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
                    <span>Saving Agent...</span>
                  </>
                ) : (
                  <span>{isEditMode ? 'Update Agent Profile' : 'Submit & Register Agent'}</span>
                )}
              </button>
            </div>

          </div>

        </div>
      </form>

      {/* Signature Crop Modal */}
      {isCropModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '24px', background: '#fff', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Crop Signature</h3>
              <button 
                type="button"
                onClick={() => { setIsCropModalOpen(false); if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''; }}
                style={{ background: 'none', border: 0, fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '-6px 0 0 0' }}>
              Drag signature inside the box to position it. Use controls below to zoom and rotate. Bright white background will automatically be made transparent.
            </p>

            <div style={{ 
              width: '100%', 
              background: '#f1f5f9', 
              borderRadius: '12px', 
              padding: '20px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ 
                  border: '2px dashed #3b82f6', 
                  cursor: 'grab', 
                  maxWidth: '100%', 
                  height: 'auto', 
                  background: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', minWidth: '60px' }}>Zoom:</span>
                <input 
                  type="range" 
                  min="0.2" 
                  max="3.0" 
                  step="0.05"
                  value={zoom} 
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', minWidth: '40px', textAlign: 'right' }}>{Math.round(zoom * 100)}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
                >
                  🔄 Rotate 90°
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setIsCropModalOpen(false); if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''; }}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCropApply}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#10b981', borderRadius: '10px' }}
                  >
                    Crop & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
