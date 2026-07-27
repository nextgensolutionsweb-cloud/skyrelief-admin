'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Key, Check } from 'lucide-react';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const allPerms = ['Full Access','User Management','Finance','Reports','Settings','Member Mgmt','Agent Mgmt','Vima View','Member View','Donation Entry','Document Upload','Read Only','Reports View','Audit View'];

const initialRoles = [
  { id: 1, name: 'Super Admin',   users: 1, color: '#ef4444', bg: '#fee2e2', permissions: ['Full Access','User Management','Finance','Reports','Settings'] },
  { id: 2, name: 'Admin',         users: 3, color: '#f59e0b', bg: '#fef3c7', permissions: ['Member Mgmt','Agent Mgmt','Reports','Donations'] },
  { id: 3, name: 'Agent Manager', users: 5, color: '#0ea5e9', bg: '#dbeafe', permissions: ['Agent Mgmt','Vima View','Member View'] },
  { id: 4, name: 'Field Agent',   users: 15, color: '#22c55e', bg: '#dcfce7', permissions: ['Member View','Donation Entry','Document Upload'] },
  { id: 5, name: 'Viewer',        users: 4, color: '#8b5cf6', bg: '#ede9fe', permissions: ['Read Only','Reports View'] },
];

const colors = [
  { color: '#ef4444', bg: '#fee2e2' }, { color: '#f59e0b', bg: '#fef3c7' },
  { color: '#0ea5e9', bg: '#dbeafe' }, { color: '#22c55e', bg: '#dcfce7' },
  { color: '#8b5cf6', bg: '#ede9fe' }, { color: '#06b6d4', bg: '#e0f2fe' },
];

const empty = { name: '', users: 1, colorIdx: 2, permissions: [] };

export default function RolesPage() {
  const [roles, setRoles]       = useState(initialRoles);
  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState(empty);

  const togglePerm = (p) => setForm(prev => ({
    ...prev,
    permissions: prev.permissions.includes(p)
      ? prev.permissions.filter(x => x !== p)
      : [...prev.permissions, p],
  }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const c = colors[form.colorIdx] || colors[0];
    if (editItem) {
      setRoles(prev => prev.map(r => r.id === editItem.id ? { ...r, name: form.name, permissions: form.permissions, ...c } : r));
    } else {
      setRoles(prev => [...prev, { id: Date.now(), name: form.name, users: parseInt(form.users) || 0, permissions: form.permissions, ...c }]);
    }
    setAddOpen(false); setEditItem(null); setForm(empty);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Role Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Manage user roles and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setEditItem(null); setAddOpen(true); }}><Plus size={15} /> Add Role</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {roles.map(r => (
          <div key={r.id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Key size={18} color={r.color} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>{r.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{r.users} user{r.users !== 1 ? 's' : ''} assigned</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditItem(r); setForm({ name: r.name, users: r.users, colorIdx: colors.findIndex(c => c.color === r.color) ?? 0, permissions: [...r.permissions] }); setAddOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e8edf2', fontSize: '0.78rem', fontWeight: '600', color: '#334155', background: '#fff', cursor: 'pointer' }}>
                  <Pencil size={13} /> Edit
                </button>
                {r.name !== 'Super Admin' && (
                  <button onClick={() => setDeleteId(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '0.78rem', fontWeight: '600', color: '#ef4444', background: '#fff', cursor: 'pointer' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {r.permissions.map(p => (
                <span key={p} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: r.bg, color: r.color }}>{p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); }} title={editItem ? 'Edit Role' : 'Add Role'} width={520}>
        <FormField label="Role Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Finance Manager" />
        <FormField label="Users Count" type="number" value={String(form.users)} onChange={v => setForm(p => ({ ...p, users: v }))} placeholder="0" />

        {/* Color picker */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Role Color</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map((c, i) => (
              <button key={i} type="button" onClick={() => setForm(p => ({ ...p, colorIdx: i }))} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c.color, border: form.colorIdx === i ? `3px solid ${c.color}` : '3px solid transparent', outline: form.colorIdx === i ? `2px solid ${c.color}` : 'none', outlineOffset: '2px', cursor: 'pointer', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Permissions</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allPerms.map(p => {
              const selected = form.permissions.includes(p);
              return (
                <button key={p} type="button" onClick={() => togglePerm(p)} style={{ padding: '5px 12px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', border: selected ? 'none' : '1px solid #e8edf2', background: selected ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#f8fafc', color: selected ? 'white' : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {selected && <Check size={11} strokeWidth={3} />}{p}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { setRoles(p => p.filter(r => r.id !== deleteId)); setDeleteId(null); }} title="Delete Role?" message="This role will be removed. Users assigned this role may lose access." />
    </div>
  );
}
