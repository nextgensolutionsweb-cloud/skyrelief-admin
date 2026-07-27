'use client';
import { useState } from 'react';
import { Plus, TrendingUp, Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { donations as initialDonations, formatCurrency } from '@/lib/data';
import Modal, { ConfirmModal, FormField, ActionMenu } from '@/components/Modal';

const statusStyle = {
  Completed: { bg: '#dcfce7', color: '#15803d' },
  Pending:   { bg: '#fef3c7', color: '#92400e' },
  Rejected:  { bg: '#fee2e2', color: '#991b1b' },
};

const fundData = [
  { label: 'Welfare',   pct: 40, color: '#0ea5e9' },
  { label: 'Marriage',  pct: 25, color: '#22c55e' },
  { label: 'Education', pct: 20, color: '#f59e0b' },
  { label: 'Medical',   pct: 15, color: '#8b5cf6' },
];

const empty = { name: '', amount: '', method: 'Online', status: 'Pending', note: '' };

export default function DonationsPage() {
  const [list, setList]             = useState(initialDonations);
  const [menuOpen, setMenuOpen]     = useState(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [viewItem, setViewItem]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [form, setForm]             = useState(empty);

  const totalDonations = list.reduce((s, d) => s + d.amount, 0);
  const thisMonth      = list.filter(d => d.date.startsWith('2024-03')).reduce((s, d) => s + d.amount, 0);
  const pending        = list.filter(d => d.status === 'Pending').reduce((s, d) => s + d.amount, 0);
  const topDonor       = list.reduce((m, d) => d.amount > m ? d.amount : m, 0);

  const stats = [
    { label: 'Total Donations', value: formatCurrency(totalDonations), change: '+14%',  iconBg: '#dbeafe', icon: '💙' },
    { label: 'This Month',      value: formatCurrency(thisMonth),      change: '+9.2%', iconBg: '#dcfce7', icon: '📈' },
    { label: 'Pending',         value: formatCurrency(pending),        change: '+2.1%', iconBg: '#fef3c7', icon: '⏳' },
    { label: 'Top Donor',       value: formatCurrency(topDonor),       change: '+5.4%', iconBg: '#ede9fe', icon: '🏆' },
  ];

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (editItem) {
      setList(prev => prev.map(d => d.id === editItem.id ? { ...d, ...form, amount: parseInt(form.amount) || d.amount } : d));
    } else {
      const newD = { id: `DON-${String(list.length + 1).padStart(3, '0')}`, initials: form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), color: '#0ea5e9', date: new Date().toISOString().slice(0, 10), ...form, amount: parseInt(form.amount) || 0 };
      setList(prev => [newD, ...prev]);
    }
    setAddOpen(false); setEditItem(null); setForm(empty);
  };

  const handleDelete = () => {
    setList(prev => prev.filter(d => d.id !== deleteId));
    setDeleteId(null);
  };

  const handleStatusChange = (id, status) => {
    setList(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    setMenuOpen(null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Donations</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Fundraising dashboard & transactions</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus size={15} /> Record Donation</button>
      </div>

      <div className="grid-r-4" style={{ marginBottom: '22px' }}>
        {stats.map(({ label, value, change, iconBg, icon }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{icon}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}><TrendingUp size={10} strokeWidth={3} />{change}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-r-split-16-1">
        <div className="card" style={{ padding: '0', overflow: 'visible' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>All Donations</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['DONOR','AMOUNT','DATE','METHOD','STATUS','ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: d.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>{d.initials}</div>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(d.amount)}</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.78rem', color: '#64748b' }}>{d.date}</td>
                  <td style={{ padding: '11px 16px', fontSize: '0.78rem', color: '#64748b' }}>{d.method}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusStyle[d.status]?.bg, color: statusStyle[d.status]?.color }}>● {d.status}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button title="View" onClick={() => setViewItem(d)} style={{ color: '#0ea5e9', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}><Eye size={14} /></button>
                      <button title="Edit" onClick={() => { setEditItem(d); setForm({ name: d.name, amount: d.amount, method: d.method, status: d.status, note: d.note || '' }); setAddOpen(true); }} style={{ color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}><Pencil size={14} /></button>
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setMenuOpen(menuOpen === d.id ? null : d.id)} style={{ color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontWeight: '800', border: 'none', background: 'none' }}>⋯</button>
                        {menuOpen === d.id && (
                          <ActionMenu onClose={() => setMenuOpen(null)} items={[
                            { icon: '✅', label: 'Mark Completed', onClick: () => handleStatusChange(d.id, 'Completed') },
                            { icon: '⏳', label: 'Mark Pending',   onClick: () => handleStatusChange(d.id, 'Pending') },
                            'divider',
                            { icon: '🗑️', label: 'Delete', danger: true, onClick: () => setDeleteId(d.id) },
                          ]} />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', marginBottom: '16px' }}>Fund Distribution</div>
          {fundData.map(({ label, pct, color }) => (
            <div key={label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#334155' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>{pct}%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '9999px' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '18px', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Monthly Target</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>₹50 L</div>
            <div style={{ marginTop: '8px', height: '8px', background: '#e8edf2', borderRadius: '9999px' }}>
              <div style={{ height: '100%', width: '97%', background: 'linear-gradient(90deg,#0ea5e9,#22c55e)', borderRadius: '9999px' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', marginTop: '5px' }}>₹48.5 L — 97% of target</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); setForm(empty); }} title={editItem ? 'Edit Donation' : 'Record Donation'}>
        <FormField label="Donor Name" value={form.name} onChange={v => f('name', v)} placeholder="Full name" />
        <FormField label="Amount (₹)" type="number" value={form.amount} onChange={v => f('amount', v)} placeholder="e.g. 25000" />
        <FormField label="Method" type="select" value={form.method} onChange={v => f('method', v)} options={['Online','Bank Transfer','Cheque','Cash','UPI']} />
        <FormField label="Status" type="select" value={form.status} onChange={v => f('status', v)} options={['Pending','Completed','Rejected']} />
        <FormField label="Note" type="textarea" value={form.note} onChange={v => f('note', v)} placeholder="Optional note..." />
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button onClick={() => { setAddOpen(false); setEditItem(null); }} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Donation Details">
        {viewItem && (
          <div>
            {[['Donor', viewItem.name], ['Amount', formatCurrency(viewItem.amount)], ['Date', viewItem.date], ['Method', viewItem.method], ['Status', viewItem.status], ['Note', viewItem.note || '—']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>{k}</span>
                <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '700' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Donation?" message="This record will be permanently removed." />
    </div>
  );
}
