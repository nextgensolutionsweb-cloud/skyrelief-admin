'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, UserPlus, ShieldAlert, History, Mic, Square, Play, Trash2, CreditCard } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';
import Modal from '@/components/Modal';

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function AgentRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectData, setRejectData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const [speechLang, setSpeechLang] = useState('gu-IN');
  const [interimText, setInterimText] = useState('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Use interim for live feedback
        recognition.lang = speechLang;

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          setInterimText(currentInterim);

          if (finalTranscript.trim()) {
            setRejectReason(prev => {
              const current = prev.trim();
              return current ? current + ' ' + finalTranscript.trim() : finalTranscript.trim();
            });
          }
        };

        // Prevent it from stopping automatically if user pauses for a moment
        recognition.onend = () => {
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) { }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      showToast('Microphone access denied or unavailable', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart loop
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setInterimText('');
    }
  };

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [zoomImage, setZoomImage] = useState(null);
  const [zoomTitle, setZoomTitle] = useState('');

  useEffect(() => {
    if (selectedRequest && selectedRequest.member_id) {
      fetchMemberDetails(selectedRequest);
    } else {
      setMemberDetails(null);
    }
  }, [selectedRequest]);

  const fetchMemberDetails = async (req) => {
    setLoadingDetails(true);
    try {
      const res = await apiRequest(`/api/member/get?id=${req.member_id}`);
      if (res.s === 1 && res.r) {
        const dataArr = Array.isArray(res.r) ? res.r : [res.r];
        let relevantData = dataArr[0];
        if (req.type === 'plan') {
          const match = dataArr.find(d => d.insurance_id === req.request_id);
          if (match) relevantData = match;
        } else {
          const match = dataArr.find(d => d.insurance_status === 0);
          if (match) relevantData = match;
        }
        setMemberDetails(relevantData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatAadhaar = (aadhaar) => {
    if (!aadhaar) return '—';
    const cleaned = String(aadhaar).replace(/\D/g, '');
    if (cleaned.length === 12) {
      return cleaned.match(/.{1,4}/g).join(' ');
    }
    return aadhaar;
  };

  const renderImage = (path, title) => {
    if (!path) return null;
    const url = path.startsWith('http') ? path : `${BASE_API_URL}${path}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
        <img
          src={url}
          alt={title}
          onClick={() => { setZoomImage(url); setZoomTitle(title); }}
          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc' }}
          onError={(e) => e.target.style.display = 'none'}
        />
        <span style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>{title}</span>
      </div>
    );
  };


  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'pending') {
      fetchRequests();
    } else {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/agent-requests');
      if (res.s === 1) {
        setRequests((res.r || []).filter(r => r.type !== 'payment'));
      }
    } catch (err) {
      showToast('Failed to fetch agent requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/admin/agent-requests/logs');
      if (res.s === 1) {
        setLogs(res.r || []);
      }
    } catch (err) {
      showToast('Failed to fetch rejected history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, type) => {
    if (!confirm('Are you sure you want to approve this request?')) return;
    try {
      const res = await apiRequest('/api/admin/agent-requests/approve', {
        method: 'POST',
        body: JSON.stringify({ request_id: id, type }),
      });
      if (res.s === 1) {
        showToast('Request approved successfully', 'success');
        fetchRequests();
      } else {
        showToast(res.m || 'Failed to approve request', 'error');
      }
    } catch (err) {
      showToast('Error trying to approve request', 'error');
    }
  };

  const initiateReject = (id, type) => {
    setRejectData({ request_id: id, type });
    setRejectReason('');
    setAudioBlob(null);
    setIsRecording(false);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Reason is required to reject a request', 'error');
      return;
    }
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('request_id', rejectData.request_id);
      formData.append('type', rejectData.type);
      formData.append('reason', rejectReason);
      if (audioBlob) {
        formData.append('voice_note', audioBlob, 'voice_note.webm');
      }

      const res = await apiRequest('/api/admin/agent-requests/reject', {
        method: 'POST',
        body: formData,
      });
      if (res.s === 1) {
        showToast('Request rejected and removed successfully', 'success');
        setShowRejectModal(false);
        fetchRequests();
      } else {
        showToast(res.m || 'Failed to reject request', 'error');
      }
    } catch (err) {
      showToast('Error trying to reject request', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const currentRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalRequestPages = Math.ceil(requests.length / itemsPerPage);

  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalLogPages = Math.ceil(logs.length / itemsPerPage);

  return (
    <div style={{ maxWidth: '1350px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>Agent Requests Manager</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px', margin: 0 }}>
            Review agent requests for new member registrations and insurance plan assignments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: activeTab === 'pending' ? 'none' : '1px solid #e2e8f0',
            fontWeight: '700',
            fontSize: '0.83rem',
            cursor: 'pointer',
            background: activeTab === 'pending' ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff',
            color: activeTab === 'pending' ? 'white' : '#64748b',
            boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Pending Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: activeTab === 'history' ? 'none' : '1px solid #e2e8f0',
            fontWeight: '700',
            fontSize: '0.83rem',
            cursor: 'pointer',
            background: activeTab === 'history' ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff',
            color: activeTab === 'history' ? 'white' : '#64748b',
            boxShadow: activeTab === 'history' ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none',
            transition: 'all 0.15s'
          }}
        >
          Rejected History ({logs.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Loading pending requests...</span>
            </div>
          ) : (
            <div className="premium-table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REQUEST TYPE</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MEMBER DETAILS</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AGENT</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REQUESTED AT</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>No pending requests to review.</div>
                      </td>
                    </tr>
                  ) : (
                    currentRequests.map((req) => (
                      <tr key={`${req.type}-${req.request_id}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          {req.type === 'member' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: '700' }}>
                              <UserPlus size={13} /> New Member
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: '700' }}>
                              <ShieldAlert size={13} /> New Plan
                            </span>
                          )}
                          {req.plan_name && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>Plan: {req.plan_name}</div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{req.member_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Code: {req.member_code}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0284c7', fontSize: '0.83rem' }}>{req.agent_name || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569' }}>
                          {new Date(req.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedRequest(req)}
                              title="View Profile Details"
                              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600' }}>
                              <Eye size={14} /> View
                            </button>
                            <button onClick={() => handleApprove(req.request_id, req.type)} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button onClick={() => initiateReject(req.request_id, req.type)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '700' }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && totalRequestPages > 1 && (
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8rem', fontWeight: '600' }}>Previous</button>
              <span style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Page {currentPage} of {totalRequestPages}</span>
              <button disabled={currentPage === totalRequestPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalRequestPages ? '#f8fafc' : 'white', cursor: currentPage === totalRequestPages ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8rem', fontWeight: '600' }}>Next</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div className="spinner" style={{ width: '20px', height: '20px', border: '3px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span>Loading history...</span>
            </div>
          ) : (
            <div className="premium-table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REQUEST TYPE</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MEMBER NAME</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AGENT</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REJECTION REASON</th>
                    <th style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REJECTED AT</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>No rejected history found.</div>
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log) => (
                      <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          {log.type === 'member' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0284c7', padding: '4px 10px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: '700' }}>
                              <UserPlus size={13} /> New Member
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '99px', fontSize: '0.73rem', fontWeight: '700' }}>
                              <ShieldAlert size={13} /> New Plan
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{log.member_name}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0284c7', fontSize: '0.83rem' }}>{log.agent_name || 'Unknown'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-block' }}>
                            {log.reason}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && totalLogPages > 1 && (
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8rem', fontWeight: '600' }}>Previous</button>
              <span style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>Page {currentPage} of {totalLogPages}</span>
              <button disabled={currentPage === totalLogPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalLogPages ? '#f8fafc' : 'white', cursor: currentPage === totalLogPages ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8rem', fontWeight: '600' }}>Next</button>
            </div>
          )}
        </div>
      )}


      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>Reject Request</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical', marginBottom: '12px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', margin: 0 }}>Voice Note & Speech-to-Text</label>
                <select
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="gu-IN">Gujarati</option>
                </select>
              </div>

              {interimText && (
                <div style={{ padding: '8px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px', fontStyle: 'italic' }}>
                  {interimText}...
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {!audioBlob ? (
                  isRecording ? (
                    <button
                      onClick={stopRecording}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                      <Square size={16} fill="currentColor" /> Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                      <Mic size={16} /> Record Voice Note
                    </button>
                  )
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <audio src={URL.createObjectURL(audioBlob)} controls style={{ height: '36px', flex: 1 }} />
                    <button
                      onClick={() => setAudioBlob(null)}
                      title="Discard Recording"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Request Modal */}
      <Modal open={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Request Details" width={600}>
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Request Type</span>
                <span style={{ fontWeight: '600' }}>{selectedRequest.type === 'member' ? 'New Member Registration' : 'New Plan Assignment'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Requested At</span>
                <span style={{ fontWeight: '600' }}>{new Date(selectedRequest.created_at).toLocaleString()}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Agent</span>
                <span style={{ fontWeight: '600', color: '#0ea5e9' }}>{selectedRequest.agent_name || 'N/A'}</span>
              </div>
            </div>

            {loadingDetails ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading details...</div>
            ) : memberDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Member Info</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                    <div><span style={{ color: '#64748b' }}>Name:</span> <span style={{ fontWeight: '600' }}>{memberDetails.full_name}</span></div>
                    <div><span style={{ color: '#64748b' }}>Code:</span> <span style={{ fontWeight: '600' }}>{memberDetails.member_code}</span></div>
                    <div><span style={{ color: '#64748b' }}>Phone:</span> <span style={{ fontWeight: '600' }}>{memberDetails.phone}</span></div>
                    <div><span style={{ color: '#64748b' }}>Aadhaar:</span> <span style={{ fontWeight: '600' }}>{formatAadhaar(memberDetails.aadhaar || memberDetails.aadhaar_number)}</span></div>
                    <div><span style={{ color: '#64748b' }}>DOB:</span> <span style={{ fontWeight: '600' }}>{memberDetails.dob ? new Date(memberDetails.dob).toLocaleDateString() : '—'}</span></div>
                    <div><span style={{ color: '#64748b' }}>Gender:</span> <span style={{ fontWeight: '600' }}>{memberDetails.gender || '—'}</span></div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Requested Insurance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>Plan:</span> <span style={{ fontWeight: '600' }}>{memberDetails.plan_name || selectedRequest.plan_name || 'N/A'}</span></div>
                    <div><span style={{ color: '#64748b' }}>Guardian:</span> <span style={{ fontWeight: '600' }}>{memberDetails.guardian || '—'}</span></div>
                    <div><span style={{ color: '#64748b' }}>Relation:</span> <span style={{ fontWeight: '600' }}>{memberDetails.relation || '—'}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>Guardian Aadhaar:</span> <span style={{ fontWeight: '600' }}>{formatAadhaar(memberDetails.guardian_aadhaar_number || memberDetails.guardian_aadhar_no)}</span></div>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Documents</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {renderImage(memberDetails.photo, 'Photo')}
                    {renderImage(memberDetails.aadhaar_front, 'Aadhaar Front')}
                    {renderImage(memberDetails.aadhaar_back, 'Aadhaar Back')}
                    {renderImage(memberDetails.pan_img, 'PAN Card')}
                    {renderImage(memberDetails.guardian_aadhaar_img, 'Guardian Aadhaar')}
                    {renderImage(memberDetails.signature, 'Signature')}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>Could not load full details.</div>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { router.push(`/members/${selectedRequest.member_id}`); setSelectedRequest(null); }} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>View Full Profile</button>
              <button onClick={() => { handleApprove(selectedRequest.request_id, selectedRequest.type); setSelectedRequest(null); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Approve</button>
              <button onClick={() => { initiateReject(selectedRequest.request_id, selectedRequest.type); setSelectedRequest(null); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Zoom Lightbox */}
      {zoomImage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '24px', right: '32px', display: 'flex', gap: '16px' }}>
            <button onClick={() => setZoomImage(null)} style={{ background: 'white', color: '#0f172a', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={24} />
            </button>
          </div>
          <div style={{ position: 'absolute', top: '32px', left: '32px', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>{zoomTitle}</div>
          <img src={zoomImage} alt={zoomTitle} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
        </div>
      )}

    </div>
  );
}
