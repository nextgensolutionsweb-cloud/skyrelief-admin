'use client';
import { useState } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, Pencil, Trash2, Check } from 'lucide-react';
import { tasks as initial } from '@/lib/data';
import Modal, { ConfirmModal, FormField } from '@/components/Modal';

const priorityStyle = {
  High:   { bg: '#fee2e2', color: '#991b1b' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  Low:    { bg: '#dcfce7', color: '#15803d' },
};
const statusStyle = {
  Pending:       { bg: '#f1f5f9', color: '#475569' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  Completed:     { bg: '#dcfce7', color: '#15803d' },
};

const empty = { title: '', assignee: '', due: '', priority: 'Medium', status: 'Pending', type: 'Admin' };

export default function TasksPage() {
  const [list, setList]         = useState(initial);
  const [filter, setFilter]     = useState('All');
  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm]         = useState(empty);

  const pending = list.filter(t => t.status === 'Pending').length;
  const inProg  = list.filter(t => t.status === 'In Progress').length;
  const done    = list.filter(t => t.status === 'Completed').length;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (editItem) {
      setList(prev => prev.map(t => t.id === editItem.id ? { ...t, ...form } : t));
    } else {
      setList(prev => [...prev, { id: `T-${String(prev.length + 1).padStart(3, '0')}`, ...form }]);
    }
    setAddOpen(false); setEditItem(null); setForm(empty);
  };

  const markComplete = (id) => setList(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
  const markProgress = (id) => setList(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress' } : t));

  const displayed = filter === 'All' ? list : list.filter(t => t.status === filter);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Tasks & Approvals</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Manage pending tasks and approvals</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setAddOpen(true); }}><Plus size={15} /> New Task</button>
      </div>

      <div className="grid-r-3" style={{ marginBottom: '22px' }}>
        {[
          { label: 'Pending',     value: pending, icon: <Clock size={20} color="#f59e0b" />,      bg: '#fef3c7' },
          { label: 'In Progress', value: inProg,  icon: <AlertCircle size={20} color="#2563eb" />, bg: '#dbeafe' },
          { label: 'Completed',   value: done,    icon: <CheckCircle size={20} color="#16a34a" />, bg: '#dcfce7' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
            onClick={() => setFilter(label === 'In Progress' ? 'In Progress' : label)}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '0', overflow: 'visible' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
          {['All','Pending','In Progress','Completed'].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', border: filter === t ? 'none' : '1px solid #e8edf2', background: filter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: filter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['TASK','ASSIGNEE','DUE DATE','PRIORITY','STATUS','ACTIONS'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', color: t.status === 'Completed' ? '#94a3b8' : '#0f172a', textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>{t.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{t.type}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#334155' }}>{t.assignee}</td>
                <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748b' }}>{t.due}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', background: priorityStyle[t.priority].bg, color: priorityStyle[t.priority].color }}>{t.priority}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '700', background: statusStyle[t.status].bg, color: statusStyle[t.status].color }}>● {t.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {t.status === 'Pending' && <button onClick={() => markProgress(t.id)} title="Start" style={{ color: '#2563eb', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid #dbeafe', background: '#fff' }}>▶ Start</button>}
                    {t.status !== 'Completed' && <button onClick={() => markComplete(t.id)} title="Complete" style={{ color: '#15803d', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Check size={15} /></button>}
                    <button onClick={() => { setEditItem(t); setForm({ title: t.title, assignee: t.assignee, due: t.due, priority: t.priority, status: t.status, type: t.type }); setAddOpen(true); }} style={{ color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(t.id)} style={{ color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', border: 'none', background: 'none' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => { setAddOpen(false); setEditItem(null); }} title={editItem ? 'Edit Task' : 'New Task'}>
        <FormField label="Task Title" value={form.title} onChange={v => f('title', v)} placeholder="Describe the task" />
        <FormField label="Assignee" value={form.assignee} onChange={v => f('assignee', v)} placeholder="Person responsible" />
        <FormField label="Due Date" type="date" value={form.due} onChange={v => f('due', v)} />
        <div className="grid-r-2" style={{ gap: '12px' }}>
          <FormField label="Priority" type="select" value={form.priority} onChange={v => f('priority', v)} options={['High','Medium','Low']} />
          <FormField label="Type" type="select" value={form.type} onChange={v => f('type', v)} options={['Approval','KYC','Claims','Finance','Admin','Campaign']} />
        </div>
        <FormField label="Status" type="select" value={form.status} onChange={v => f('status', v)} options={['Pending','In Progress','Completed']} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1px solid #e8edf2', fontWeight: '600', color: '#334155', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { setList(p => p.filter(t => t.id !== deleteId)); setDeleteId(null); }} title="Delete Task?" message="This task will be permanently removed." />
    </div>
  );
}
