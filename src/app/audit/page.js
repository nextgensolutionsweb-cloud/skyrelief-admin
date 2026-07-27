'use client';
import { useState } from 'react';

const initialLogs = [
  { id: 1, user: 'Arjun Verma',  initials: 'AV', color: '#0ea5e9', action: 'Member Added',      detail: 'New member Neha Shah (SR-20241000) registered.',     time: '2 min ago',  type: 'Create' },
  { id: 2, user: 'Riya Mehta',   initials: 'RM', color: '#22c55e', action: 'Document Verified', detail: 'Aadhaar card for Vivaan Parmar approved.',            time: '15 min ago', type: 'Update' },
  { id: 3, user: 'Arjun Verma',  initials: 'AV', color: '#0ea5e9', action: 'Donation Recorded', detail: 'Donation of ₹25,000 recorded from Rajesh Mehta.',    time: '1 hr ago',   type: 'Create' },
  { id: 4, user: 'Priya Patel',  initials: 'PP', color: '#8b5cf6', action: 'Agent Updated',     detail: 'Agent AGT-0003 Krishna Kulkarni KYC renewed.',        time: '2 hr ago',   type: 'Update' },
  { id: 5, user: 'Anil Shah',    initials: 'AS', color: '#f59e0b', action: 'Role Changed',      detail: 'User Sneha Joshi role updated from Viewer to Agent.', time: '3 hr ago',   type: 'Update' },
  { id: 6, user: 'Arjun Verma',  initials: 'AV', color: '#0ea5e9', action: 'Vima Deactivated',  detail: 'Vima VIMA-0001 set to Inactive.',                     time: '5 hr ago',   type: 'Delete' },
  { id: 7, user: 'System',       initials: 'SY', color: '#64748b', action: 'Auto Backup',       detail: 'Daily database backup completed successfully.',       time: '8 hr ago',   type: 'System' },
  { id: 8, user: 'Riya Mehta',   initials: 'RM', color: '#22c55e', action: 'Report Exported',   detail: 'Monthly Member Report exported as PDF.',              time: '1 day ago',  type: 'Export' },
];

const typeStyle = {
  Create: { bg: '#dcfce7', color: '#15803d' },
  Update: { bg: '#dbeafe', color: '#1d4ed8' },
  Delete: { bg: '#fee2e2', color: '#991b1b' },
  System: { bg: '#f1f5f9', color: '#475569' },
  Export: { bg: '#ede9fe', color: '#6d28d9' },
};

export default function AuditPage() {
  const [filter, setFilter] = useState('All');
  const [logs] = useState(initialLogs);

  const displayed = filter === 'All' ? logs : logs.filter(l => l.type === filter);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Audit Logs</h1>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Track all system activity and changes</p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All','Create','Update','Delete','System','Export'].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '600', border: filter === t ? 'none' : '1px solid #e8edf2', background: filter === t ? 'linear-gradient(135deg,#0ea5e9,#6366f1)' : '#fff', color: filter === t ? 'white' : '#64748b', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
          <input type="date" style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e8edf2', fontSize: '0.78rem', color: '#334155', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {displayed.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 20px', borderBottom: i < displayed.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.15s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: l.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>{l.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{l.user}</span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}> · {l.action}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', background: typeStyle[l.type].bg, color: typeStyle[l.type].color }}>{l.type}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{l.time}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>{l.detail}</div>
            </div>
          </div>
        ))}

        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.875rem' }}>No logs for this filter</div>
        )}
      </div>
    </div>
  );
}
