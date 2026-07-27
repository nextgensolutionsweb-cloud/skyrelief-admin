'use client';
import { useState } from 'react';
import { Plus, Megaphone, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { announcements as initial } from '@/lib/data';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const typeColor = {
  General:  { bg: '#dbeafe', color: '#1d4ed8' },
  Scheme:   { bg: '#dcfce7', color: '#15803d' },
  Campaign: { bg: '#fef3c7', color: '#92400e' },
  Notice:   { bg: '#ede9fe', color: '#6d28d9' },
  Training: { bg: '#fce7f3', color: '#9d174d' },
};

const empty = { title: '', type: 'General', audience: 'All Members', status: 'Active', desc: '', visible: true };

export default function AnnouncementsPage() {
  const [list, setList]         = useState(initial);
  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState(empty);
  const [filter, setFilter]     = useState('All');

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (editItem) {
      setList(prev => prev.map(a => a.id === editItem.id ? { ...a, ...form } : a));
    } else {
      setList(prev => [{ id: `ANN-${String(prev.length + 1).padStart(3, '0')}`, date: new Date().toISOString().slice(0, 10), ...form }, ...prev]);
    }
    setAddOpen(false); setEditItem(null); setForm(empty);
  };

  const toggleVisible = (id) => setList(prev => prev.map(a => a.id === id ? { ...a, visible: !a.visible } : a));
  const toggleStatus  = (id) => setList(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Active' ? 'Completed' : 'Active' } : a));

  const displayed = filter === 'All' ? list : list.filter(a => a.status === filter || a.type === filter);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Announcements</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>{list.filter(a => a.visible).length} visible · {list.filter(a => !a.visible).length} hidden</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus size={15} /> New Announcement</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {['All','Active','Completed','General','Scheme','Campaign','Notice','Training'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', border: filter === t ? 'none' : '1px solid #e8edf2', background: filter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: filter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayed.map(a => (
          <div key={a.id} className="card" style={{ padding: '18px 20px', opacity: a.visible ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: typeColor[a.type]?.bg || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Megaphone size={18} color={typeColor[a.type]?.color || '#64748b'} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {a.title}
                    {!a.visible && <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '5px', fontWeight: '600' }}>Hidden</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{a.date} · {a.audience}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', background: typeColor[a.type]?.bg || '#f1f5f9', color: typeColor[a.type]?.color || '#64748b' }}>{a.type}</span>
                <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: a.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: a.status === 'Active' ? '#15803d' : '#64748b' }}>● {a.status}</span>
                <button onClick={() => setViewItem(a)} title="View" style={{ color: '#0ea5e9', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Eye size={14} /></button>
                <button onClick={() => { setEditItem(a); setForm({ title: a.title, type: a.type, audience: a.audience, status: a.status, desc: a.desc, visible: a.visible }); setAddOpen(true); }} title="Edit" style={{ color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Pencil size={14} /></button>
                <button onClick={() => toggleVisible(a.id)} title={a.visible ? 'Hide' : 'Show'} style={{ color: a.visible ? '#64748b' : '#0ea5e9', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}>
                  {a.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => setDeleteId(a.id)} title="Delete" style={{ color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Trash2 size={14} /></button>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>{a.desc}</p>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <button onClick={() => toggleStatus(a.id)} style={{ padding: '4px 12px', borderRadius: '7px', border: `1px solid ${a.status === 'Active' ? '#fef3c7' : '#dcfce7'}`, background: '#fff', color: a.status === 'Active' ? '#92400e' : '#15803d', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                {a.status === 'Active' ? '⏹ Mark Completed' : '▶ Mark Active'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); }} title={editItem ? 'Edit Announcement' : 'New Announcement'}>
        <FormField label="Title" value={form.title} onChange={v => f('title', v)} placeholder="Announcement title" />
        <FormField label="Type" type="select" value={form.type} onChange={v => f('type', v)} options={['General','Scheme','Campaign','Notice','Training']} />
        <FormField label="Audience" type="select" value={form.audience} onChange={v => f('audience', v)} options={['All Members','Agents','Donors','Applicants','Admin']} />
        <FormField label="Status" type="select" value={form.status} onChange={v => f('status', v)} options={['Active','Completed']} />
        <FormField label="Description" type="textarea" value={form.desc} onChange={v => f('desc', v)} placeholder="Write announcement content..." />
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="checkbox" id="vis" checked={form.visible} onChange={e => f('visible', e.target.checked)} style={{ accentColor: '#0ea5e9', width: '16px', height: '16px' }} />
          <label htmlFor="vis" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>Visible to users</label>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Announcement">
        {viewItem && <div>
          <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a', marginBottom: '8px' }}>{viewItem.title}</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '14px' }}>{viewItem.date} · {viewItem.audience} · {viewItem.type}</div>
          <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.7 }}>{viewItem.desc}</p>
        </div>}
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { setList(p => p.filter(a => a.id !== deleteId)); setDeleteId(null); }} title="Delete Announcement?" message="This announcement will be permanently deleted." />
    </div>
  );
}
