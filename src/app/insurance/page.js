'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Shield, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatCurrency, apiRequest, showToast } from '@/lib/api';
import { ConfirmModal } from '@/components/Modal';

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Inactive' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

export default function InsuranceListPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState([]);

  // Delete state
  const [deleteId, setDeleteId] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/insurance/get-all?page=${page}&limit=10`);
      if (res.s === 1 && Array.isArray(res.r)) {
        setList(res.r);
        setMeta(res.meta || null);
      }
    } catch (err) {
      console.error('Error fetching insurance plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiRequest('/api/dashboard/insurance-age-stats');
      if (res.s === 1 && Array.isArray(res.r)) {
        setStats(res.r);
      }
    } catch (err) {
      console.error('Error fetching insurance stats:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, [page]);

  const handleDeleteConfirm = async () => {
    try {
      const formData = new FormData();
      formData.append('id', deleteId);
      formData.append('status', '-1');
      
      const res = await apiRequest('/api/insurance/status', {
        method: 'POST',
        body: formData,
      });

      if (res.s === 1) {
        showToast('Insurance plan deleted successfully', 'success');
        setDeleteId(null);
        fetchPlans();
      } else {
        showToast(res.m || 'Failed to delete insurance plan', 'error');
      }
    } catch (err) {
      console.error('Error deleting insurance plan:', err);
    }
  };

  // Local filtering for search and status filter
  const filteredList = list.filter(item => {
    if (statusFilter === 'Active' && item.status !== 1) return false;
    if (statusFilter === 'Inactive' && item.status !== 0) return false;
    if (item.status === -1) return false;

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
              Insurance Management
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px', fontWeight: '500' }}>
            {filteredList.length} plans available
          </p>
        </div>

        <button className="btn-primary" onClick={() => router.push('/insurance/form')}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Insurance</span>
        </button>
      </div>

      {/* Main Table Card Container */}
      <div className="premium-table-container">
        {/* Search & Filter Header */}
        <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap', gap: '14px', background: '#ffffff' }}>
          
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#0ea5e9' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by plan name, description..."
              className="premium-input"
              style={{ paddingLeft: '40px', fontSize: '0.84rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Active', 'Inactive'].map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: statusFilter === t ? 'none' : '1.5px solid #e2e8f0',
                  background: statusFilter === t ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' : '#ffffff',
                  color: statusFilter === t ? '#ffffff' : '#64748b',
                  boxShadow: statusFilter === t ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#0ea5e9', fontWeight: '800', fontSize: '0.9rem' }}>
            Loading plans...
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '80px' }}>Image</th>
                <th>Scheme Name</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '28px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, index) => {
                const statusInfo = statusStyle[item.status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${BASE_API_URL}${item.image}`) : null;
                
                return (
                  <tr key={item.id !== undefined && item.id !== null ? `${item.id}-${index}` : index}>
                    {/* Index */}
                    <td style={{ fontWeight: '700', color: '#64748b' }}>
                      {meta ? meta.skip + index + 1 : index + 1}
                    </td>

                    {/* Image */}
                    <td>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#f0f9ff',
                        border: '1px solid #e0f2fe',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Shield size={20} style={{ color: '#0ea5e9' }} />
                        )}
                      </div>
                    </td>

                    {/* Scheme Name */}
                    <td>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>{item.name}</div>
                    </td>

                    {/* Status */}
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.73rem',
                        fontWeight: '700',
                        background: statusInfo.bg,
                        color: statusInfo.color
                      }}>
                        ● {statusInfo.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          title="View Details"
                          onClick={() => router.push(`/insurance/${item.id}`)}
                          style={{
                            color: '#0ea5e9',
                            cursor: 'pointer',
                            padding: '7px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#f0f9ff',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#0ea5e9'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.color = '#0ea5e9'; }}
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>

                        <button
                          title="Edit Scheme"
                          onClick={() => router.push(`/insurance/form?id=${item.id}`)}
                          style={{
                            color: '#6366f1',
                            cursor: 'pointer',
                            padding: '7px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#eef2ff',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; }}
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </button>

                        <button
                          title="Delete Scheme"
                          onClick={() => setDeleteId(item.id)}
                          style={{
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '7px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#fef2f2',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', fontWeight: '500' }}>
                    No insurance plans found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Footer Pagination */}
        {meta && (
          <div style={{ padding: '16px 24px', borderTop: '1.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#ffffff' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              Showing {meta.skip + 1} to {Math.min(meta.skip + meta.limit, meta.total)} of {meta.total} plans
            </span>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.78rem', opacity: page <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              
              <span style={{ padding: '6px 12px', borderRadius: '8px', background: '#0ea5e9', color: '#ffffff', fontWeight: '800', fontSize: '0.8rem' }}>
                {page}
              </span>

              <button
                disabled={meta && meta.skip + meta.limit >= meta.total}
                onClick={() => setPage(page + 1)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.78rem', opacity: (meta && meta.skip + meta.limit >= meta.total) ? 0.5 : 1 }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Insurance Scheme"
        message="Are you sure you want to delete this insurance scheme? This action cannot be undone."
        danger={true}
      />
    </div>
  );
}
