import fs from 'fs';

let content = fs.readFileSync('src/app/members/[memberId]/page.js', 'utf8');

const oldModal = `{/* Edit Joining Fee Modal */}
      {showEditJoiningModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={18} color="var(--primary)" /> Edit Joining Fee
            </h3>
            
            <form onSubmit={handleEditJoiningFee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-r-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Amount (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.joining_amount} onChange={e => {
                    const total = e.target.value;
                    const coll = editJoiningForm.collected_amount || 0;
                    const rem = parseFloat(total || 0) - parseFloat(coll);
                    setEditJoiningForm({ ...editJoiningForm, joining_amount: total, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Collected (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.collected_amount} onChange={e => {
                    const coll = e.target.value;
                    const total = editJoiningForm.joining_amount || 0;
                    const rem = parseFloat(total) - parseFloat(coll || 0);
                    setEditJoiningForm({ ...editJoiningForm, collected_amount: coll, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="grid-r-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Remaining (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.remaining_amount} onChange={e => setEditJoiningForm({ ...editJoiningForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%', backgroundColor: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Date</label>
                  <input type="date" required value={editJoiningForm.joining_date} onChange={e => setEditJoiningForm({ ...editJoiningForm, joining_date: e.target.value })} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>`;

const newModal = `{/* Edit Joining Fee Modal */}
      {showEditJoiningModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="premium-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={18} color="var(--primary)" /> Edit Insurance Details
            </h3>
            
            <form onSubmit={handleEditJoiningFee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Agent</label>
                <select
                  value={editJoiningForm.agent_id}
                  onChange={(e) => setEditJoiningForm({ ...editJoiningForm, agent_id: e.target.value })}
                  className="premium-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Direct / No Agent</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name || \`\${a.first_name || ''} \${a.last_name || ''}\`.trim()}</option>
                  ))}
                </select>
              </div>

              <div className="grid-r-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Amount (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.joining_amount} onChange={e => {
                    const total = e.target.value;
                    const coll = editJoiningForm.collected_amount || 0;
                    const rem = parseFloat(total || 0) - parseFloat(coll);
                    setEditJoiningForm({ ...editJoiningForm, joining_amount: total, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Collected (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.collected_amount} onChange={e => {
                    const coll = e.target.value;
                    const total = editJoiningForm.joining_amount || 0;
                    const rem = parseFloat(total) - parseFloat(coll || 0);
                    setEditJoiningForm({ ...editJoiningForm, collected_amount: coll, remaining_amount: rem >= 0 ? rem : 0 });
                  }} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="grid-r-2" style={{ gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Remaining (₹)</label>
                  <input type="number" required min="0" value={editJoiningForm.remaining_amount} onChange={e => setEditJoiningForm({ ...editJoiningForm, remaining_amount: e.target.value })} className="premium-input" style={{ width: '100%', backgroundColor: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Joining Date</label>
                  <input type="date" required value={editJoiningForm.joining_date} onChange={e => setEditJoiningForm({ ...editJoiningForm, joining_date: e.target.value })} className="premium-input" style={{ width: '100%' }} />
                </div>
              </div>`;

if (!content.includes(oldModal)) {
    console.error("String not found in file!");
    process.exit(1);
}
content = content.replace(oldModal, newModal);
fs.writeFileSync('src/app/members/[memberId]/page.js', content);
console.log('Update successful');
