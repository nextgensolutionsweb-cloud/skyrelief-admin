'use client';
import { useState } from 'react';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const initialQueue = [
  { name: 'Neha Sharma',   initials: 'NS', color: '#0ea5e9', doc: 'Aadhaar Card',       id: 'DOC-4000', status: 'Pending' },
  { name: 'Vivaan Parmar', initials: 'VP', color: '#22c55e', doc: 'PAN Card',            id: 'DOC-3999', status: 'Verified' },
  { name: 'Riya Chauhan',  initials: 'RC', color: '#8b5cf6', doc: 'Income Certificate', id: 'DOC-3998', status: 'Verified' },
  { name: 'Ananya Verma',  initials: 'AV', color: '#f59e0b', doc: 'Address Proof',      id: 'DOC-3997', status: 'Verified' },
  { name: 'Priya Desai',   initials: 'PD', color: '#ef4444', doc: 'Bank Passbook',      id: 'DOC-3996', status: 'Pending' },
  { name: 'Karan Solanki', initials: 'KS', color: '#06b6d4', doc: 'Birth Certificate',  id: 'DOC-3995', status: 'Rejected' },
];

const statusStyle = {
  Verified: { bg: '#dcfce7', color: '#15803d' },
  Pending:  { bg: '#fef3c7', color: '#92400e' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
};

export default function DocumentsPage() {
  const [queue, setQueue] = useState(initialQueue);
  const [selected, setSelected] = useState(initialQueue[0]);

  const verified = queue.filter(q => q.status === 'Verified').length;
  const pending  = queue.filter(q => q.status === 'Pending').length;
  const rejected = queue.filter(q => q.status === 'Rejected').length;

  const stats = [
    { label: 'Verified', value: String(56843 + verified), change: '+4.2%', iconBg: '#dcfce7', icon: 'V' },
    { label: 'Pending',  value: String(342 - verified + pending), change: '+1.8%', iconBg: '#fef3c7', icon: 'P' },
    { label: 'Rejected', value: String(128 + rejected), change: '-2.1%', iconBg: '#fee2e2', icon: 'R' },
    { label: 'Today',    value: String(queue.length), change: '+12%', iconBg: '#dbeafe', icon: 'T' },
  ];

  const updateStatus = (id, status) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    setSelected(prev => prev && prev.id === id ? { ...prev, status } : prev);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>Document Verification</h1>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Review and verify submitted documents</p>
      </div>

      <div className="grid-r-4" style={{ marginBottom: '22px' }}>
        {stats.map(function(s) { return (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '800', color: '#334155' }}>{s.icon}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px' }}>{s.change}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{s.label}</div>
          </div>
        ); })}
      </div>

      <div className="grid-r-2">
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Verification Queue</div>
          <div>
            {queue.map(function(q, i) { return (
              <div key={q.id} onClick={function() { setSelected(q); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < queue.length - 1 ? '1px solid #f8fafc' : 'none', background: selected && selected.id === q.id ? '#f0f9ff' : 'white', cursor: 'pointer', borderLeft: selected && selected.id === q.id ? '3px solid #0ea5e9' : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: q.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>{q.initials}</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{q.doc}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{q.name}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusStyle[q.status].bg, color: statusStyle[q.status].color }}>&#9679; {q.status}</span>
              </div>
            ); })}
          </div>
        </div>

        {selected ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>{selected.doc}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{selected.name} - {selected.id}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700', background: statusStyle[selected.status].bg, color: statusStyle[selected.status].color }}>&#9679; {selected.status}</span>
            </div>

            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', minHeight: '220px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>&#128196;</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Document Preview</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Submitted for verification</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={function() { updateStatus(selected.id, 'Verified'); }} disabled={selected.status === 'Verified'} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', background: selected.status === 'Verified' ? '#dcfce7' : 'linear-gradient(135deg,#22c55e,#16a34a)', color: selected.status === 'Verified' ? '#15803d' : 'white', fontWeight: '700', fontSize: '0.85rem', cursor: selected.status === 'Verified' ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {selected.status === 'Verified' ? 'Verified' : 'Verify'}
              </button>
              <button onClick={function() { updateStatus(selected.id, 'Rejected'); }} disabled={selected.status === 'Rejected'} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid #fee2e2', background: selected.status === 'Rejected' ? '#fee2e2' : '#fff', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', cursor: selected.status === 'Rejected' ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {selected.status === 'Rejected' ? 'Rejected' : 'Reject'}
              </button>
            </div>
            {selected.status !== 'Pending' && (
              <button onClick={function() { updateStatus(selected.id, 'Pending'); }} style={{ marginTop: '8px', padding: '8px', borderRadius: '9px', border: '1px solid #e8edf2', background: '#fff', color: '#64748b', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>Reset to Pending</button>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Select a document</div>
        )}
      </div>
    </div>
  );
}