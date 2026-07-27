'use client';
import { useState, useEffect } from 'react';
import { Check, CheckCircle2, Trash2, Trash } from 'lucide-react';
import { apiRequest, showToast } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await apiRequest(`/api/admin/notifications?limit=${limit}&offset=${offset}`);
      if (res.s === 1) {
        const notifs = res.r?.notifications || [];
        setNotifications(notifs);
        setTotal(res.r?.total_count || 0);

        // Auto mark as read if there are unread notifications
        if (notifs.some(n => !n.is_read)) {
          apiRequest('/api/admin/notifications/read', {
            method: 'POST',
            body: JSON.stringify({ notification_id: null }),
          }).then((r) => {
             if(r.s === 1) {
               setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
               // Dispatch custom event to notify header
               window.dispatchEvent(new Event('sky-notifications-read'));
             }
          }).catch(() => {});
        }
      }
    } catch (err) {
      showToast('Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id = null) => {
    try {
      const res = await apiRequest('/api/admin/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notification_id: id }),
      });
      if (res.s === 1) {
        showToast('Notification(s) marked as read', 'success');
        fetchNotifications();
      }
    } catch (err) {
      showToast('Error updating notification', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      const res = await apiRequest('/api/admin/notifications/delete', {
        method: 'POST',
        body: JSON.stringify({ notification_id: id }),
      });
      if (res.s === 1) {
        showToast('Notification deleted', 'success');
        fetchNotifications();
      }
    } catch (err) {
      showToast('Error deleting notification', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all your notifications? This cannot be undone.')) return;
    try {
      const res = await apiRequest('/api/admin/notifications/clear-all', {
        method: 'POST',
      });
      if (res.s === 1) {
        showToast('All notifications cleared', 'success');
        setPage(1);
        fetchNotifications();
      }
    } catch (err) {
      showToast('Error clearing notifications', 'error');
    }
  };

  if (loading && notifications.length === 0) return <div style={{ padding: '20px' }}>Loading notifications...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Notifications</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={() => handleMarkAsRead()}
              style={{ background: 'none', border: 'none', color: '#0ea5e9', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={16} /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleClearAll}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash size={16} /> Clear All
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <div style={{ background: 'white', padding: '32px', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>
            No notifications found.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              borderLeft: n.is_read ? '4px solid transparent' : '4px solid #0ea5e9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0ea5e9', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>{n.type}</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>{n.title}</h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{n.message}</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!n.is_read && (
                  <button 
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as read"
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(n.id)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Trash2 size={22} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#94a3b8' : '#0f172a', fontWeight: '500' }}
            >
              Previous
            </button>
            <button 
              disabled={page * limit >= total} 
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: page * limit >= total ? 'not-allowed' : 'pointer', color: page * limit >= total ? '#94a3b8' : '#0f172a', fontWeight: '500' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
