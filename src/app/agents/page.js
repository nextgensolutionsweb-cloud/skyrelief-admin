'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Users, Search, ChevronRight, ChevronLeft, UserCheck, Shield } from 'lucide-react';
import { formatCurrency, apiRequest, showToast } from '@/lib/api';
import Modal, { ConfirmModal } from '@/components/Modal';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Suspended' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted' },
};

const avatarColors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

export default function AgentsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [imageErrors, setImageErrors] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Delete states
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/agent/get-all?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.s === 1 && Array.isArray(res.r)) {
        setList(res.r);
        setMeta(res.meta || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleDeleteAgent = async () => {
    try {
      const formData = new FormData();
      formData.append('id', deleteId);
      formData.append('status', '-1');
      const res = await apiRequest('/api/agent/status', {
        method: 'POST',
        body: formData,
      });
      if (res.s === 1) {
        showToast('Agent deleted successfully', 'success');
        setDeleteId(null);
        fetchAgents();
      } else {
        showToast(res.m || 'Failed to delete agent', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'AG';
  };

  const filtered = list.filter(a => {
    if (a.status === -1 && activeFilter !== 'Deleted' && activeFilter !== 'All') {
      return false;
    }
    if (activeFilter === 'All') {
      return a.status !== -1;
    }
    if (activeFilter === 'Active') {
      return a.status === 1;
    }
    if (activeFilter === 'Suspended') {
      return a.status === 0 || a.status === 2;
    }
    if (activeFilter === 'Deleted') {
      return a.status === -1;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
              Agent Management
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '4px', fontWeight: '500' }}>
            {list.length} registered agents
          </p>
        </div>

        <button className="btn-primary" onClick={() => router.push('/agents/form')}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Agent</span>
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
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name, code, mobile..."
              className="premium-input"
              style={{ paddingLeft: '40px', fontSize: '0.84rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Active', 'Suspended', 'Deleted'].map(t => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: activeFilter === t ? 'none' : '1.5px solid #e2e8f0',
                  background: activeFilter === t ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' : '#ffffff',
                  color: activeFilter === t ? '#ffffff' : '#64748b',
                  boxShadow: activeFilter === t ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none',
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
            Loading agents...
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Agent / Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '28px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => {
                const profileUrl = a.profile || a.profile_photo;
                const imageUrl = profileUrl ? getImageUrl(profileUrl) : "";
                const initials = getInitials(a.first_name, a.last_name);
                const showFallback = !imageUrl || imageErrors[a.id];
                const statusInfo = statusStyle[a.status] || { bg: '#f1f5f9', color: '#475569', label: 'Pending' };

                return (
                  <tr key={a.id}>
                    {/* Agent Name / Avatar */}
                    <td>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => router.push(`/agents/${a.id}`)}
                        title="View Agent Profile"
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '13px',
                          background: avatarColors[idx % avatarColors.length],
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {showFallback ? (
                            initials
                          ) : (
                            <img
                              src={imageUrl}
                              alt={`${a.first_name} ${a.last_name}`}
                              onError={() => setImageErrors(prev => ({ ...prev, [a.id]: true }))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </div>

                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>
                            {a.first_name} {a.last_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* <span>Code: AG-{a.id}</span> */}
                            {/* <span>•</span> */}
                            <span style={{ fontWeight: '750', color: '#0284c7' }}>
                              {a.total_members || 0} Members
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td style={{ fontWeight: '600', color: '#334155' }}>
                      {a.phone}
                    </td>

                    {/* Email */}
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {a.email || 'N/A'}
                    </td>

                    {/* Joining Date */}
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {a.created_at ? a.created_at.split('T')[0] : (a.joining_date ? a.joining_date.split('T')[0] : 'N/A')}
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
                          title="View Profile"
                          onClick={() => router.push(`/agents/${a.id}`)}
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
                          title="Edit Agent"
                          onClick={() => router.push(`/agents/form?id=${a.id}`)}
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
                          title="Delete Agent"
                          onClick={() => setDeleteId(a.id)}
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

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', fontWeight: '500' }}>
                    No agents found matching your search.
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
              Showing {meta.skip + 1} to {Math.min(meta.skip + meta.limit, meta.total)} of {meta.total} agents
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
        onConfirm={handleDeleteAgent}
        title="Delete Agent"
        message="Are you sure you want to delete this agent? This action cannot be undone."
        danger={true}
      />
    </div>
  );
}
