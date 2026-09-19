'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
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
      // Let's pass page and limit in case pagination is supported
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

  // Local filtering for search and status filter if backend doesn't filter
  const filteredList = list.filter(item => {
    // 1. Status Filter
    if (statusFilter === 'Active' && item.status !== 1) return false;
    if (statusFilter === 'Inactive' && item.status !== 0) return false;
    // Hide soft-deleted by default
    if (item.status === -1) return false;

    // 2. Search query (matches scheme name or description)
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return nameMatch || descMatch;
    }

    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Insurance Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>{filteredList.length} plans available</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/insurance/form')}>
          <Plus size={15} strokeWidth={2.5} /> Add Insurance
        </button>
      </div>

      {/* Age-wise Stats Section */}
      {/* {stats.length > 0 && (
        <div className="card" style={{ padding: '0', marginBottom: '22px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Age-wise Member Distribution</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem' }}>Member count grouped by age range across active plans</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>PLAN NAME</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>0-18</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>19-30</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>31-40</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>41-50</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>51-60</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>60+</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {stats.filter(s => parseInt(s.total_members) > 0).map((stat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0ea5e9' }}>{stat.insurance_name}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_0_18}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_19_30}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_31_40}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_41_50}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_51_60}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>{stat.age_60_plus}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', background: '#f8fafc' }}>{stat.total_members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Search & Filter bar */}
      <div className="card" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by plan name, description..."
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '280px', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Active', 'Inactive'].map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                style={{
                  padding: '5px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: statusFilter === t ? 'none' : '1px solid #e8edf2',
                  background: statusFilter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff',
                  color: statusFilter === t ? 'white' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>Loading plans...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'IMAGE', 'SCHEME NAME', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => {
                  const statusInfo = statusStyle[item.status] || { bg: '#f1f5f9', color: '#475569', label: 'Unknown' };
                  const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${BASE_API_URL}${item.image}`) : null;
                  
                  return (
                    <tr key={item.id !== undefined && item.id !== null ? `${item.id}-${index}` : index} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Serial Number */}
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b', fontSize: '0.875rem' }}>
                        {meta ? meta.skip + index + 1 : index + 1}
                      </td>

                      {/* Image column */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a' }}>{item.name}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: statusInfo.bg, color: statusInfo.color }}>
                          ● {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            title="View Details"
                            onClick={() => router.push(`/insurance/${item.id}`)}
                            style={{ color: '#0ea5e9', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            title="Edit Plan"
                            onClick={() => router.push(`/insurance/form?id=${item.id}`)}
                            style={{ color: '#64748b', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title="Delete Plan"
                            onClick={() => setDeleteId(item.id)}
                            style={{ color: '#ef4444', cursor: 'pointer', padding: '5px', borderRadius: '6px', border: 'none', background: 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredList.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.875rem' }}>No insurance plans found</div>
        )}

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.total}</span> plans
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={!meta.hasPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: '1px solid #e8edf2',
                  background: meta.hasPrev ? '#fff' : '#f8fafc',
                  color: meta.hasPrev ? '#475569' : '#94a3b8',
                  cursor: meta.hasPrev ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', minWidth: '40px', textAlign: 'center' }}>
                {page}
              </span>
              <button
                disabled={!meta.hasNext}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: '1px solid #e8edf2',
                  background: meta.hasNext ? '#fff' : '#f8fafc',
                  color: meta.hasNext ? '#475569' : '#94a3b8',
                  cursor: meta.hasNext ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Insurance Plan"
        message="Are you sure you want to delete this insurance plan? This will set its status to deleted."
      />
    </div>
  );
}
