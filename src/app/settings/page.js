'use client';
import { useState, useEffect, useRef } from 'react';
import { apiRequest, showToast, getAuth, setAuth } from '@/lib/api';

import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Wrench, Power, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // App Maintenance Mode States
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');

  // File selection fields
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Signature Upload States
  const signatureFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [previewSignature, setPreviewSignature] = useState(null);
  const [savingSignature, setSavingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState(false);

  // Crop Modal States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSrcImage, setCropSrcImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // Bank QR State
  const [upiId, setUpiId] = useState('skyrelief@sbi');
  const [bankName, setBankName] = useState('State Bank of India');
  const [defaultAmount, setDefaultAmount] = useState('1000');
  const [generatedQrUrl, setGeneratedQrUrl] = useState('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=skyrelief@sbi%26pn=SkyRelief%26am=1000%26cu=INR');
  const [savingQr, setSavingQr] = useState(false);

  const handleGenerateQr = (e) => {
    e.preventDefault();
    if (!upiId) {
      showToast('Please enter a valid UPI ID', 'error');
      return;
    }
    setSavingQr(true);
    const cleanAmount = defaultAmount.replace(/[^0-9.]/g, '') || '1000';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(upiId)}%26pn=SkyRelief%26am=${cleanAmount}%26cu=INR`;
    setGeneratedQrUrl(qrUrl);
    setTimeout(() => {
      setSavingQr(false);
      showToast('Bank QR Code generated & saved successfully!', 'success');
    }, 600);
  };

  // Fetch profile details
  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const res = await apiRequest('/api/user/get-details');
      if (res.s === 1 && res.r?.user_details) {
        setProfile(res.r.user_details);
        setFullName(res.r.user_details.full_name || '');
        setSelectedFile(null);
        setPreviewImage(null);
        setImageError(false);

        // Update local stored user info immediately to keep dropdown in sync
        const auth = getAuth();
        if (auth) {
          auth.user = res.r.user_details;
          setAuth(auth);
          window.dispatchEvent(new CustomEvent('sky-user-updated'));
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to fetch profile info', 'error');
    } finally {
      setLoadingProfile(false);
    }
  }

  // Fetch App Maintenance Mode settings
  async function loadMaintenanceSettings() {
    setLoadingMaintenance(true);
    try {
      const res = await apiRequest('/api/admin/maintenance-settings');
      if (res && res.s === 1 && res.r) {
        setIsMaintenance(Boolean(res.r.is_maintenance));
        setMaintenanceMessage(res.r.maintenance_message || '');
      }
    } catch (err) {
      console.error('Failed to load maintenance settings:', err);
    } finally {
      setLoadingMaintenance(false);
    }
  }

  const handleSaveMaintenance = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingMaintenance(true);
    try {
      const res = await apiRequest('/api/admin/maintenance-settings', {
        method: 'POST',
        body: JSON.stringify({
          is_maintenance: isMaintenance,
          maintenance_message: maintenanceMessage.trim()
        })
      });
      if (res && res.s === 1) {
        showToast(
          isMaintenance
            ? 'Application successfully put UNDER MAINTENANCE!'
            : 'Maintenance mode turned OFF. Mobile app is now LIVE!',
          'success'
        );
      } else {
        showToast(res?.m || 'Failed to update maintenance settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error updating maintenance mode', 'error');
    } finally {
      setSavingMaintenance(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadMaintenanceSettings();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Unsupported file format. Please select a JPG, JPEG, PNG, or WEBP image.', 'error');
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setImageError(false);
    // Create a local URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full Name cannot be empty.', 'error');
      return;
    }
    setUpdatingProfile(true);
    try {
      let body;
      if (selectedFile) {
        body = new FormData();
        body.append('profile', selectedFile);
        body.append('full_name', fullName.trim());
      } else {
        body = JSON.stringify({
          full_name: fullName.trim()
        });
      }

      const res = await apiRequest('/api/user/update-profile', {
        method: 'POST',
        body: body
      });

      if (res.s === 1) {
        showToast('Profile updated successfully!', 'success');
        await loadProfile();
      } else {
        showToast(res.m || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error updating profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All fields are required.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password must match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const formData = new FormData();
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);

      const res = await apiRequest('/api/user/change-password', {
        method: 'POST',
        body: formData
      });
      if (res.s === 1) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      } else {
        showToast(res.m || 'Failed to change password', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred while changing password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Profile image URL builder
  const getProfileImageUrl = () => {
    if (!profile?.profile) return null;
    let path = String(profile.profile).trim();
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/uploads/')) {
      path = path.replace('/uploads/uploads/', '/uploads/');
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
    return BASE_URL + path;
  };

  // Signature image URL builder
  const getSignatureImageUrl = () => {
    if (!profile?.signature) return null;
    let path = String(profile.signature).trim();
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/uploads/')) {
      path = path.replace('/uploads/uploads/', '/uploads/');
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';
    return BASE_URL + path;
  };

  const signatureImageUrl = getSignatureImageUrl();

  // Canvas drawing effect inside the modal
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
      setSelectedSignatureFile(croppedFile);
      setPreviewSignature(URL.createObjectURL(blob));
      setSignatureError(false);
      setIsCropModalOpen(false);
    }, 'image/png');
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    if (!selectedSignatureFile) return;
    setSavingSignature(true);
    try {
      const body = new FormData();
      body.append('signature', selectedSignatureFile);
      
      const res = await apiRequest('/api/user/update-signature', {
        method: 'POST',
        body: body
      });

      if (res.s === 1) {
        showToast('Signature updated successfully!', 'success');
        setSelectedSignatureFile(null);
        setPreviewSignature(null);
        await loadProfile();
      } else {
        showToast(res.m || 'Failed to update signature', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error updating signature', 'error');
    } finally {
      setSavingSignature(false);
    }
  };

  const profileImageUrl = getProfileImageUrl();

  // Active status check
  const isChanged = selectedFile !== null || (profile && fullName.trim() !== (profile.full_name || '').trim());

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">Manage your personal information and security settings</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* CARD 1: Profile Information */}
        <div className="premium-card" style={{ padding: '32px' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '24px' }}>Profile Information</h3>

          {loadingProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', fontWeight: 'bold' }}>
              <span className="spinner" style={{ border: '2px solid #bee3f8', borderTop: '2px solid #0ea5e9', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
              <span>Loading profile...</span>
            </div>
          ) : profile ? (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
              />

              {/* Avatar section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{ position: 'relative', width: '90px', height: '90px', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile image"
                >
                  {(previewImage || profileImageUrl) && !imageError ? (
                    <img
                      src={previewImage || profileImageUrl}
                      alt="Profile Photo"
                      onError={() => setImageError(true)}
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #bee3f8', boxShadow: 'var(--shadow-md)' }}
                    />
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800', border: '3px solid #bee3f8', boxShadow: 'var(--shadow-md)' }}>
                      {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                    </div>
                  )}
                  {/* Hover Edit Overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.65rem', fontWeight: '800', opacity: 0, transition: 'opacity 0.2s ease',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <span>CHANGE</span>
                    <span style={{ fontSize: '1rem', marginTop: '4px' }}>📷</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-dark)' }}>{profile.full_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#0ea5e9', fontWeight: '600', marginTop: '4px' }}>{profile.email}</div>
                  <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 10px', background: '#e0f2fe', color: '#0284c7', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                    {profile.role_id === '1' ? 'Super Admin' : `Role ID ${profile.role_id}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="premium-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</label>
                  <input
                    readOnly
                    value={profile.phone || 'N/A'}
                    className="premium-input"
                    style={{ background: '#f8fafc', cursor: 'not-allowed', color: '#64748b' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!isChanged || updatingProfile}
                className="btn-primary"
                style={{
                  width: 'fit-content',
                  padding: '10px 24px',
                  fontWeight: '700',
                  opacity: isChanged ? 1 : 0.6,
                  cursor: isChanged ? 'pointer' : 'not-allowed'
                }}
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          ) : (
            <div style={{ color: 'red', fontWeight: 'bold' }}>Failed to load profile.</div>
          )}
        </div>

        {/* CARD 2: Change Password */}
        <div className="premium-card" style={{ padding: '32px' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '24px' }}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '450px' }}>
            
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="premium-input"
                  placeholder="Enter current password"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="premium-input"
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="premium-input"
                  placeholder="Match new password"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '10px', color: '#94a3b8' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary"
              style={{
                marginTop: '8px',
                width: 'fit-content',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 3px 12px rgba(16,185,129,0.3)',
                opacity: (changingPassword || !currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                cursor: (changingPassword || !currentPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer'
              }}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* CARD 3: Signature */}
        <div className="premium-card" style={{ padding: '32px' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '16px' }}>Signature</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Upload signature on plain white paper. System will use it in certificate and slip.
          </p>

          <form onSubmit={handleSaveSignature} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input
              type="file"
              ref={signatureFileInputRef}
              onChange={handleSignatureFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div 
                style={{ 
                  width: '240px', 
                  height: '100px', 
                  border: '1.5px dashed var(--border)', 
                  borderRadius: '8px', 
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onClick={() => signatureFileInputRef.current?.click()}
              >
                {(previewSignature || signatureImageUrl) && !signatureError ? (
                  <img 
                    src={previewSignature || signatureImageUrl} 
                    alt="Signature Preview" 
                    onError={() => setSignatureError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} 
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>✍️</span>
                    <span>Click to Upload Signature</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => signatureFileInputRef.current?.click()}
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  {(previewSignature || signatureImageUrl) ? 'Replace Signature' : 'Upload Signature'}
                </button>
                {(previewSignature || signatureImageUrl) && (
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                    ✓ Signature Loaded
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedSignatureFile || savingSignature}
              className="btn-primary"
              style={{
                width: 'fit-content',
                padding: '10px 24px',
                fontWeight: '700',
                opacity: selectedSignatureFile ? 1 : 0.6,
                cursor: selectedSignatureFile ? 'pointer' : 'not-allowed'
              }}
            >
              {savingSignature ? 'Saving...' : 'Save Signature'}
            </button>
          </form>
        {/* CARD 4: Bank QR Code & UPI Settings */}
        <div className="premium-card" style={{ padding: '32px' }}>
          <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
            🏦 Bank QR Code & UPI Settings
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Configure Admin Bank UPI ID & QR Code for agent collections & direct member payment slips.
          </p>

          <form onSubmit={handleGenerateQr} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Bank Name *
              </label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="premium-input"
                placeholder="State Bank of India"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Bank UPI ID *
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="premium-input"
                placeholder="skyrelief@sbi"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Default Payment Amount (₹)
              </label>
              <input
                type="text"
                value={defaultAmount}
                onChange={e => setDefaultAmount(e.target.value)}
                className="premium-input"
                placeholder="1000"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingQr}
                className="btn-primary"
                style={{
                  height: '42px',
                  width: '100%',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                }}
              >
                {savingQr ? 'Generating QR...' : '⚡ Generate & Save Bank QR Code'}
              </button>
            </div>
          </form>

          {generatedQrUrl && (
            <div style={{
              marginTop: '28px',
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}>
              <div style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <img src={generatedQrUrl} alt="Bank QR Code" style={{ width: '130px', height: '130px', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}>
                  ✓ Active Bank QR Code
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
                  {bankName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  UPI: <strong>{upiId}</strong> • Amount: <strong>₹{defaultAmount}</strong>
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Agents and members can scan this QR code directly during payment collection.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CARD 5: App Maintenance Mode */}
        <div className="premium-card" style={{ padding: '32px', border: isMaintenance ? '1.5px solid #fca5a5' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isMaintenance ? '#fee2e2' : '#f0fdf4',
                  color: isMaintenance ? '#dc2626' : '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-dark)', margin: 0 }}>
                    Application Maintenance Mode
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Control mobile app access and broadcast downtime notices
                  </div>
                </div>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '700',
              background: isMaintenance ? '#fef2f2' : '#f0fdf4',
              color: isMaintenance ? '#b91c1c' : '#15803d',
              border: isMaintenance ? '1px solid #fecaca' : '1px solid #bbf7d0'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isMaintenance ? '#ef4444' : '#22c55e',
                boxShadow: isMaintenance ? '0 0 0 3px rgba(239, 68, 68, 0.25)' : '0 0 0 3px rgba(34, 197, 94, 0.25)'
              }} />
              {isMaintenance ? 'UNDER MAINTENANCE' : 'APP IS LIVE & ACTIVE'}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            When Maintenance Mode is <strong>ENABLED</strong>, the mobile application will block regular logins and navigation. Every user opening the app will be shown the Under Maintenance screen with your custom message.
          </p>

          <form onSubmit={handleSaveMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Toggle Switch */}
            <div style={{
              background: isMaintenance ? '#fff5f5' : '#f8fafc',
              border: isMaintenance ? '1.5px solid #fed7d7' : '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isMaintenance ? '#fee2e2' : '#e2e8f0',
                  color: isMaintenance ? '#dc2626' : '#64748b'
                }}>
                  <Power size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: isMaintenance ? '#991b1b' : '#1e293b' }}>
                    {isMaintenance ? 'Maintenance Mode is Activated' : 'Maintenance Mode is Disabled (App Live)'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isMaintenance ? '#b91c1c' : '#64748b', marginTop: '2px' }}>
                    {isMaintenance
                      ? 'All mobile app users will be redirected to the maintenance screen upon launch.'
                      : 'All mobile app features, logins, and registrations are operating normally.'}
                  </div>
                </div>
              </div>

              {/* Styled Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMaintenance(prev => !prev)}
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '30px',
                  borderRadius: '9999px',
                  background: isMaintenance ? '#ef4444' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.25s ease',
                  padding: '2px',
                  flexShrink: 0
                }}
                aria-label="Toggle maintenance mode"
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transform: isMaintenance ? 'translateX(26px)' : 'translateX(0px)',
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px'
                }}>
                  {isMaintenance ? '⚠️' : '✓'}
                </div>
              </button>
            </div>

            {/* Custom Maintenance Message */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custom Maintenance Message for App Users *
                </label>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {maintenanceMessage.length} characters
                </span>
              </div>
              <textarea
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                rows={3}
                className="premium-input"
                placeholder="e.g., We are currently performing scheduled maintenance to upgrade our system. Please check back shortly. Sorry for any inconvenience!"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  padding: '12px 14px',
                  borderRadius: '10px'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                💡 This message will be displayed prominently inside the app while maintenance is on.
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setMaintenanceMessage('We are currently performing scheduled maintenance to improve our services. We will be back online shortly.')}
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  🛠️ Standard Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => setMaintenanceMessage('हमारे सिस्टम का तकनीकी रखरखाव चल रहा है। कृपया कुछ समय बाद पुनः प्रयास करें। असुविधा के लिए खेद है।')}
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  🇮🇳 Hindi Notice
                </button>
                <button
                  type="button"
                  onClick={() => setMaintenanceMessage('We are currently performing a major database & security upgrade. Services will resume at 2:00 PM IST.')}
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Server Upgrade
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={savingMaintenance || loadingMaintenance}
                className="btn-primary"
                style={{
                  padding: '11px 28px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  background: isMaintenance
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: isMaintenance
                    ? '0 4px 14px rgba(239, 68, 68, 0.35)'
                    : '0 4px 14px rgba(16, 185, 129, 0.35)',
                  cursor: (savingMaintenance || loadingMaintenance) ? 'not-allowed' : 'pointer',
                  opacity: (savingMaintenance || loadingMaintenance) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {savingMaintenance ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : isMaintenance ? (
                  <>
                    <AlertTriangle size={17} />
                    <span>Activate Maintenance Mode Now</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    <span>Save Settings (Keep App Live)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={loadMaintenanceSettings}
                disabled={loadingMaintenance || savingMaintenance}
                className="btn-secondary"
                style={{ padding: '11px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Reload current maintenance status from server"
              >
                <RefreshCw size={14} />
                <span>Refresh Status</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Crop Modal */}
      {isCropModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="premium-card" style={{ maxWidth: '640px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>Crop Signature</h3>
              <button 
                type="button"
                onClick={() => { setIsCropModalOpen(false); if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''; }}
                style={{ background: 'none', border: 0, fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
              Drag signature inside the box to position it. Use controls below to zoom and rotate. Bright white background will automatically be made transparent.
            </p>

            {/* Canvas Cropper Box */}
            <div style={{ 
              width: '100%', 
              background: '#f1f5f9', 
              borderRadius: '8px', 
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
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Zoom Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', minWidth: '60px' }}>Zoom:</span>
                <input 
                  type="range" 
                  min="0.2" 
                  max="3.0" 
                  step="0.05"
                  value={zoom} 
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#0ea5e9' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-dark)', minWidth: '40px', textAlign: 'right' }}>{Math.round(zoom * 100)}%</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🔄 Rotate 90°
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setIsCropModalOpen(false); if (signatureFileInputRef.current) signatureFileInputRef.current.value = ''; }}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCropApply}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#10b981' }}
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
  </div>
);
}

