'use client';
import { Download } from 'lucide-react';

const reports = [
  { title: 'Member Report',      desc: '24,856 members · growth, status, type',    records: '24,856 records', iconBg: '#dbeafe', icon: '👥' },
  { title: 'Donation Report',    desc: '₹12.8 Cr · funds, donors, methods',        records: '18,420 records', iconBg: '#dcfce7', icon: '💰' },
  { title: 'Marriage Report',    desc: '1,845 completed · budgets, success',        records: '1,971 records',  iconBg: '#fce7f3', icon: '💍' },
  { title: 'Beneficiary Report', desc: '8,924 beneficiaries · aid disbursed',      records: '8,924 records',  iconBg: '#fef3c7', icon: '🎯' },
  { title: 'Vima Report',        desc: 'Welfare schemes · coverage & enrolment',   records: '42 records',     iconBg: '#ede9fe', icon: '🛡️' },
  { title: 'Agent Report',       desc: '385 agents · success & approvals',         records: '385 records',    iconBg: '#fee2e2', icon: '🧑‍💼' },
];

const scheduled = [
  { title: 'Weekly Donation Summary',   freq: 'Every Monday 9:00 AM',  format: 'Excel' },
  { title: 'Monthly Member Report',     freq: 'Every 1st of the month', format: 'PDF' },
  { title: 'Quarterly Vima Overview',   freq: 'Every 3 months',         format: 'Excel' },
];

export default function ReportsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Reports Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '3px' }}>Generate and export organisation reports</p>
      </div>

      <div className="grid-r-3" style={{ marginBottom: '28px' }}>
        {reports.map(({ title, desc, records, iconBg, icon }) => (
          <div key={title} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{desc}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>{records}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                📕 PDF
              </button>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '7px', borderRadius: '8px', border: '1px solid #dcfce7', background: '#fff', color: '#16a34a', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
                📗 Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scheduled */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a' }}>Scheduled Exports</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Automated report delivery</div>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e8edf2', fontSize: '0.78rem', fontWeight: '600', color: '#334155', background: '#fff', cursor: 'pointer' }}>
            <Download size={13} /> Export All
          </button>
        </div>
        {scheduled.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < scheduled.length - 1 ? '1px solid #f8fafc' : 'none' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>{s.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{s.freq}</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: s.format === 'PDF' ? '#fee2e2' : '#dcfce7', color: s.format === 'PDF' ? '#991b1b' : '#15803d' }}>{s.format}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
