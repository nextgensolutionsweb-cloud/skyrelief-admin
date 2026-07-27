'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiRequest('/api/admin/auth/requests');
      if (res.s === 1) {
        setHistory(res.r || []);
      }
    } catch (err) {
      showToast('Failed to fetch login history', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading history...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Login History</h1>
      
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
            <tr>
              <th style={{ padding: '16px' }}>ADMIN</th>
              <th style={{ padding: '16px' }}>IP ADDRESS</th>
              <th style={{ padding: '16px' }}>DEVICE INFO</th>
              <th style={{ padding: '16px' }}>STATUS</th>
              <th style={{ padding: '16px' }}>REQUESTED AT</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No login history found.</td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '600' }}>{record.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{record.email}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem' }}>{record.ip_address}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.device_info}>{record.device_info}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Success</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b' }}>{new Date(record.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
