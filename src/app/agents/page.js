'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, Eye, Pencil, Trash2, Users, X, MapPin, FileText, Key, Check } from 'lucide-react';
import { formatCurrency, apiRequest, showToast } from '@/lib/api';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.skyrelief.org';

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const statusStyle = {
  1: { bg: '#dcfce7', color: '#15803d', label: 'Active', class: 'active' },
  2: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  0: { bg: '#fef3c7', color: '#92400e', label: 'Suspended', class: 'pending' },
  '-1': { bg: '#fee2e2', color: '#991b1b', label: 'Deleted', class: 'inactive' },
};

const avatarColors = ['#0ea5e9', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

const emptyPersonal = {
  phone: '', first_name: '', last_name: '', dob: '', email: '', middle_name: '', gender: 'Male',
  alternate_mobile: '', aadhaar_number: '', pan_number: '', commission_percentage: '10.0', notes: '', profileFile: null,
  address_line_1: '', address_line_2: '', city: '', state: '', pincode: ''
};

const emptyAddress = {
  address_line_1: '', address_line_2: '', city: '', state: '', pincode: ''
};

export default function AgentsPage() {
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);
  const [imageErrors, setImageErrors] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Menu/Delete states
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

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

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 1 ? 0 : 1; // Toggle active (1) vs suspended/blocked (0)
      const formData = new FormData();
      formData.append('id', id);
      formData.append('status', String(nextStatus));
      const res = await apiRequest('/api/agent/status', {
        method: 'POST',
        body: formData,
      });
      if (res.s === 1) {
        showToast('Agent status updated successfully', 'success');
        setMenuOpen(null);
        fetchAgents();
      } else {
        showToast(res.m || 'Failed to change status', 'error');
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Agent Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>{list.length} registered agents</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/agents/form')}>
          <Plus size={15} strokeWidth={2.5} /> Add Agent
        </button>
      </div>

      {/* Table search & filter */}
      <div className="card" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
          <input type="text" value={searchInput} onChange={handleSearchChange}
            placeholder="Search by name, code, mobile..."
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.82rem', outline: 'none', width: '280px', fontFamily: 'inherit', background: '#f8fafc', color: '#0f172a' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'Active', 'Suspended', 'Deleted'].map(t => (
              <button key={t} onClick={() => setActiveFilter(t)} style={{ padding: '5px 16px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', border: activeFilter === t ? 'none' : '1px solid #e8edf2', background: activeFilter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: activeFilter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#0ea5e9', fontWeight: 'bold' }}>Loading agents...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['CODE / NAME', 'MOBILE', 'EMAIL', 'JOINING DATE', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => {
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(() => {
                          const profileUrl = a.profile || a.profile_photo;
                          const imageUrl = profileUrl ? getImageUrl(profileUrl) : "";
                          const initials = `${a.first_name?.[0] || ""}${a.last_name?.[0] || ""}`.toUpperCase();
                          const showFallback = !imageUrl || imageErrors[a.id];
                          return (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColors[idx % avatarColors.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {showFallback ? (
                                initials || 'AG'
                              ) : (
                                <img
                                  src={imageUrl}
                                  alt={`${a.first_name} ${a.last_name}`}
                                  onError={() => setImageErrors(prev => ({ ...prev, [a.id]: true }))}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{a.first_name} {a.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#334155' }}>{a.phone}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#64748b' }}>{a.email || 'N/A'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#64748b' }}>{a.created_at ? a.created_at.split('T')[0] : (a.joining_date ? a.joining_date.split('T')[0] : 'N/A')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-block', textAlign: 'center', minWidth: '70px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: statusStyle[a.status]?.bg || '#f1f5f9', color: statusStyle[a.status]?.color || '#475569' }}>
                        {statusStyle[a.status]?.label || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button title="View Details" onClick={() => router.push(`/agents/${a.id}`)} style={{ color: '#0ea5e9', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        ><Eye size={15} /></button>

                        <button title="Edit Agent" onClick={() => router.push(`/agents/form?id=${a.id}`)} style={{ color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        ><Pencil size={15} /></button>

                        <button title="Delete Agent" onClick={() => setDeleteId(a.id)} style={{ color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        ><Trash2 size={15} /></button>

                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)} style={{ color: '#94a3b8', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontWeight: '800', fontSize: '1rem', lineHeight: 1, border: 'none', background: 'none' }}>⋯</button>
                          {menuOpen === a.id && (
                            <div style={{ position: 'absolute', right: 0, top: '28px', background: 'white', border: '1px solid #e8edf2', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '155px', overflow: 'hidden' }}>
                              <button onClick={() => handleToggleStatus(a.id, a.status)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', fontSize: '0.82rem', fontWeight: '600', color: '#334155', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                {a.status === 1 ? '🚫 Suspend' : '✅ Activate'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.875rem' }}>No agents found</div>
        )}

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
              Showing <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.skip + 1}</span> to{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{Math.min(meta.skip + meta.limit, meta.total)}</span> of{' '}
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{meta.total}</span> agents
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

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setDeleteId(null)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', textAlign: 'center', marginBottom: '8px' }}>Delete Agent</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '22px', lineHeight: '1.4' }}>
              <p style={{ marginBottom: '8px', textAlign: 'center' }}>Are you sure you want to delete this agent?</p>
              <p style={{ fontWeight: '700', color: '#334155', marginBottom: '6px' }}>This action will:</p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Soft delete the agent</li>
                <li>Disable login access</li>
                <li>Preserve existing records and documents</li>
                <li>Preserve member history</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleDeleteAgent} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', background: '#ef4444', color: 'white', boxShadow: 'none', border: 'none', fontSize: '0.82rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >Delete Agent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
