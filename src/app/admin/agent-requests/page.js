'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, UserPlus, ShieldAlert, History } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function AgentRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
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
                  requests.map((req) => (
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
                            onClick={() => router.push(`/members/${req.member_id}`)}
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
                  logs.map((log) => (
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
        </div>
      )}

      {showRejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle color="#ef4444" /> Reject Request
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '16px' }}>
              This will permanently delete the submitted details so the agent can retry. Please provide a clear reason for rejection.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Aadhaar card image is blurred, Name mismatch..."
              style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', fontFamily: 'inherit', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                disabled={processing || !rejectReason.trim()}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: processing || !rejectReason.trim() ? 'not-allowed' : 'pointer' }}
              >
                {processing ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
