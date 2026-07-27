'use client';
import { useState } from 'react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { supportTickets as initial } from '@/lib/data';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const priorityStyle = { High: { bg: '#fee2e2', color: '#991b1b' }, Medium: { bg: '#fef3c7', color: '#92400e' }, Low: { bg: '#dcfce7', color: '#15803d' } };
const statusStyle   = { Open: { bg: '#dbeafe', color: '#1d4ed8' }, 'In Progress': { bg: '#fef3c7', color: '#92400e' }, Resolved: { bg: '#dcfce7', color: '#15803d' }, Closed: { bg: '#f1f5f9', color: '#475569' } };

const faqs = [
  { q: 'How to add a new member?',         a: 'Go to Members → Click "Add Member" and fill in the required details.' },
  { q: 'How to record a donation?',         a: 'Navigate to Donations → Click "Record" and enter the donation details.' },
  { q: 'How to verify a document?',         a: 'Open Documents → Select the pending document from the queue and click Verify.' },
  { q: 'How to assign a Vima to an agent?', a: 'Go to Vima Management → Edit the Vima and assign agents from the dropdown.' },
];

const empty = { subject: '', user: '', priority: 'Medium', status: 'Open', category: 'General' };

export default function SupportPage() {
  const [list, setList]         = useState(initial);
  const [filter, setFilter]     = useState('All');
  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState(empty);

  const open     = list.filter(t => t.status === 'Open').length;
  const inProg   = list.filter(t => t.status === 'In Progress').length;
  const resolved = list.filter(t => t.status === 'Resolved').length;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (editItem) {
      setList(prev => prev.map(t => t.id === editItem.id ? { ...t, ...form } : t));
    } else {
      setList(prev => [...prev, { id: `TKT-${String(prev.length + 1).padStart(3,'0')}`, initials: form.user.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(), color: '#0ea5e9', date: new Date().toISOString().slice(0,10), ...form }]);
    }
    setAddOpen(false); setEditItem(null); setForm(empty);
  };

  const updateStatus = (id, status) => setList(prev => prev.map(t => t.id === id ? { ...t, status } : t));

  const displayed = filter === 'All' ? list : list.filter(t => t.status === filter);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Support</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Help desk & ticket management</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus size={15} /> New Ticket</button>
      </div>

      {/* Summary */}
      <div className="grid-r-3" style={{ marginBottom: '22px' }}>
        {[['Open', open, '#dbeafe'],['In Progress', inProg, '#fef3c7'],['Resolved', resolved, '#dcfce7']].map(([l, v, bg]) => (
          <div key={l} className="card" style={{ padding: '18px 20px', cursor: 'pointer' }} onClick={() => setFilter(l)}>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>{v}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>{l}</div>
            <div style={{ marginTop: '10px', height: '4px', background: bg, borderRadius: '9999px' }} />
          </div>
        ))}
      </div>

      <div className="grid-r-split-14-1">
        <div className="card" style={{ padding: '0', overflow: 'visible' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
            {['All','Open','In Progress','Resolved'].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', border: filter === t ? 'none' : '1px solid #e8edf2', background: filter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: filter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['TICKET','USER','PRIORITY','STATUS','ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#0f172a' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>{t.id} · {t.category}</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: t.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '700' }}>{t.initials}</div>
                      <span style={{ fontSize: '0.78rem', color: '#334155' }}>{t.user}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', background: priorityStyle[t.priority].bg, color: priorityStyle[t.priority].color }}>{t.priority}</span></td>
                  <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusStyle[t.status]?.bg || '#f1f5f9', color: statusStyle[t.status]?.color || '#475569' }}>● {t.status}</span></td>
                  <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setViewItem(t)} style={{ color: '#0ea5e9', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Eye size={13} /></button>
                      <button onClick={() => { setEditItem(t); setForm({ subject: t.subject, user: t.user, priority: t.priority, status: t.status, category: t.category }); setAddOpen(true); }} style={{ color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Pencil size={13} /></button>
                      {t.status !== 'Resolved' && <button onClick={() => updateStatus(t.id, 'Resolved')} style={{ color: '#15803d', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid #dcfce7', background: '#fff' }}>✓ Resolve</button>}
                      <button onClick={() => setDeleteId(t.id)} style={{ color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', marginBottom: '16px' }}>Frequently Asked</div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8edf2', marginBottom: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#0f172a', marginBottom: '5px' }}>❓ {faq.q}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); }} title={editItem ? 'Edit Ticket' : 'New Support Ticket'}>
        <FormField label="Subject" value={form.subject} onChange={v => f('subject', v)} placeholder="Describe the issue" />
        <FormField label="User Name" value={form.user} onChange={v => f('user', v)} placeholder="Who reported this?" />
        <div className="grid-r-2" style={{ gap: '12px' }}>
          <FormField label="Priority" type="select" value={form.priority} onChange={v => f('priority', v)} options={['High','Medium','Low']} />
          <FormField label="Category" type="select" value={form.category} onChange={v => f('category', v)} options={['Document','Finance','Technical','Account','Form','General']} />
        </div>
        <FormField label="Status" type="select" value={form.status} onChange={v => f('status', v)} options={['Open','In Progress','Resolved','Closed']} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Ticket Details">
        {viewItem && [['ID', viewItem.id], ['Subject', viewItem.subject], ['User', viewItem.user], ['Priority', viewItem.priority], ['Status', viewItem.status], ['Category', viewItem.category], ['Date', viewItem.date]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>{k}</span>
            <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '700' }}>{v}</span>
          </div>
        ))}
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { setList(p => p.filter(t => t.id !== deleteId)); setDeleteId(null); }} title="Delete Ticket?" message="This support ticket will be permanently removed." />
    </div>
  );
}
