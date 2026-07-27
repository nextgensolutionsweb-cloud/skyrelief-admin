'use client';
import { useState } from 'react';
import { Plus, TrendingUp, Eye, EyeOff, Trash2, Bell } from 'lucide-react';
import { notifications as initial } from '@/lib/data';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const typeColor = {
  Push:   { bg: '#dbeafe', color: '#1d4ed8' },
  SMS:    { bg: '#dcfce7', color: '#15803d' },
  Email:  { bg: '#ede9fe', color: '#6d28d9' },
  System: { bg: '#fef3c7', color: '#92400e' },
};

const empty = { title: '', desc: '', type: 'Push', visible: true };

export default function NotificationsPage() {
  const [list, setList]         = useState(initial);
  const [filter, setFilter]     = useState('All');
  const [addOpen, setAddOpen]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState(empty);

  const stats = [
    { label: 'Push Sent',     value: '124K', change: '+8.2%', iconBg: '#dbeafe', icon: '📱' },
    { label: 'SMS Sent',      value: '48K',  change: '+4.1%', iconBg: '#dcfce7', icon: '💬' },
    { label: 'Emails',        value: '32K',  change: '+3.5%', iconBg: '#ede9fe', icon: '📧' },
    { label: 'System Alerts', value: list.filter(n => n.type === 'System').length, change: '+2.0%', iconBg: '#fef3c7', icon: '🔔' },
  ];

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    setList(prev => [{ id: `N-${String(prev.length + 1).padStart(3,'0')}`, icon: '🔔', time: 'Just now', unread: true, ...form }, ...prev]);
    setAddOpen(false); setForm(empty);
  };

  const markRead    = (id) => setList(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  const markAllRead = ()   => setList(prev => prev.map(n => ({ ...n, unread: false })));
  const toggleVis   = (id) => setList(prev => prev.map(n => n.id === id ? { ...n, visible: !n.visible } : n));

  const displayed = filter === 'All' ? list : list.filter(n => n.type === filter);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Notification Center</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Push · SMS · Email · System alerts</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={markAllRead} style={{ padding: '9px 16px', borderRadius: '9999px', border: '1px solid #e8edf2', background: '#fff', fontSize: '0.82rem', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>Mark All Read</button>
          <button className="btn-primary" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus size={15} /> Send Notification</button>
        </div>
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

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
          {['All','Push','SMS','Email','System'].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', border: filter === t ? 'none' : '1px solid #e8edf2', background: filter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: filter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
        {displayed.map((n, i) => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 20px', borderBottom: i < displayed.length - 1 ? '1px solid #f8fafc' : 'none', background: n.unread ? '#fafcff' : 'white', opacity: n.visible ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: typeColor[n.type].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ fontWeight: n.unread ? '700' : '600', fontSize: '0.875rem', color: '#0f172a' }}>{n.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', background: typeColor[n.type].bg, color: typeColor[n.type].color }}>{n.type}</span>
                  {n.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />}
                  {n.unread && <button onClick={() => markRead(n.id)} title="Mark Read" style={{ color: '#0ea5e9', cursor: 'pointer', padding: '3px', borderRadius: '5px', border: 'none', background: 'none', fontSize: '0.7rem', fontWeight: '600' }}>✓ Read</button>}
                  <button onClick={() => toggleVis(n.id)} title={n.visible ? 'Hide' : 'Show'} style={{ color: '#94a3b8', cursor: 'pointer', padding: '3px', borderRadius: '5px', border: 'none', background: 'none' }}>
                    {n.visible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => setDeleteId(n.id)} style={{ color: '#ef4444', cursor: 'pointer', padding: '3px', borderRadius: '5px', border: 'none', background: 'none' }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>{n.desc}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Send Notification">
        <FormField label="Title" value={form.title} onChange={v => f('title', v)} placeholder="Notification title" />
        <FormField label="Message" type="textarea" value={form.desc} onChange={v => f('desc', v)} placeholder="Write your message..." />
        <FormField label="Type" type="select" value={form.type} onChange={v => f('type', v)} options={['Push','SMS','Email','System']} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleAdd} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Send</button>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { setList(p => p.filter(n => n.id !== deleteId)); setDeleteId(null); }} title="Delete Notification?" message="This notification will be removed." />
    </div>
  );
}
