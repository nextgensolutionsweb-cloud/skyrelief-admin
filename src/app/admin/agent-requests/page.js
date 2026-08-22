'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, UserPlus, ShieldAlert, History } from 'lucide-react';
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
        setRequests(res.r || []);
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
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Reason is required to reject a request', 'error');
      return;
    }
    setProcessing(true);
    try {
      const res = await apiRequest('/api/admin/agent-requests/reject', {
        method: 'POST',
        body: JSON.stringify({ request_id: rejectData.request_id, type: rejectData.type, reason: rejectReason }),
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Agent Requests</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Review pending registrations or view rejected history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
              background: activeTab === 'pending' ? 'white' : 'transparent',
              color: activeTab === 'pending' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
              background: activeTab === 'history' ? 'white' : 'transparent',
              color: activeTab === 'history' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Rejected History
          </button>
        </div>
      </div>
      
      {activeTab === 'pending' && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading requests...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ padding: '16px' }}>REQUEST TYPE</th>
                  <th style={{ padding: '16px' }}>MEMBER DETAILS</th>
                  <th style={{ padding: '16px' }}>AGENT</th>
                  <th style={{ padding: '16px' }}>REQUESTED AT</th>
                  <th style={{ padding: '16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                      No pending requests to review.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((req) => (
                    <tr key={`${req.type}-${req.request_id}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px' }}>
                        {req.type === 'member' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                            <UserPlus size={14} /> New Member
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                            <ShieldAlert size={14} /> New Plan
                          </span>
                        )}
                        {req.plan_name && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>Plan: {req.plan_name}</div>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{req.member_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Code: {req.member_code}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#0ea5e9' }}>{req.agent_name || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569' }}>
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => setSelectedRequest(req)}
                            title="View Profile Details"
                            style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            <Eye size={14} /> View
                          </button>
                          <button onClick={() => handleApprove(req.request_id, req.type)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button onClick={() => initiateReject(req.request_id, req.type)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          {!loading && totalRequestPages > 1 && (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569' }}>Previous</button>
              <span style={{ padding: '6px 12px', fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Page {currentPage} of {totalRequestPages}</span>
              <button disabled={currentPage === totalRequestPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalRequestPages ? '#f1f5f9' : 'white', cursor: currentPage === totalRequestPages ? 'not-allowed' : 'pointer', color: '#475569' }}>Next</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
                <tr>
                  <th style={{ padding: '16px' }}>REQUEST TYPE</th>
                  <th style={{ padding: '16px' }}>MEMBER NAME</th>
                  <th style={{ padding: '16px' }}>AGENT</th>
                  <th style={{ padding: '16px' }}>REJECTION REASON</th>
                  <th style={{ padding: '16px' }}>REJECTED AT</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                      No rejected history found.
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log) => (
                    <tr key={log.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px' }}>
                        {log.type === 'member' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                            <UserPlus size={14} /> New Member
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                            <ShieldAlert size={14} /> New Plan
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{log.member_name}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#0ea5e9' }}>{log.agent_name || 'Unknown'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          {log.reason}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', color: '#475569' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          {!loading && totalLogPages > 1 && (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569' }}>Previous</button>
              <span style={{ padding: '6px 12px', fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>Page {currentPage} of {totalLogPages}</span>
              <button disabled={currentPage === totalLogPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalLogPages ? '#f1f5f9' : 'white', cursor: currentPage === totalLogPages ? 'not-allowed' : 'pointer', color: '#475569' }}>Next</button>
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
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical' }}
              />
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
