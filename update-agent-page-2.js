import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

const depositInputStr = `              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={depositNotes} 
                  onChange={e => setDepositNotes(e.target.value)} 
                  className="premium-input" 
                  placeholder="e.g. Received by..." 
                  style={{ width: '100%' }} 
                />
              </div>`;

const depositInputReplace = depositInputStr + `\n              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Proof Image (Optional, for UPI/Bank)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => setDepositProofImage(e.target.files[0])} 
                  className="premium-input" 
                  style={{ width: '100%', padding: '6px' }} 
                />
              </div>`;

const payoutInputStr = `              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Notes (Optional)</label>
                <input 
                  type="text" 
                  value={payoutNotes} 
                  onChange={e => setPayoutNotes(e.target.value)} 
                  className="premium-input" 
                  placeholder="e.g. Bank transfer ref #..." 
                  style={{ width: '100%' }} 
                />
              </div>`;

const payoutInputReplace = payoutInputStr + `\n              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Proof Image (Optional)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={e => setPayoutProofImage(e.target.files[0])} 
                  className="premium-input" 
                  style={{ width: '100%', padding: '6px' }} 
                />
              </div>`;

content = content.replace(depositInputStr, depositInputReplace);
content = content.replace(payoutInputStr, payoutInputReplace);

// Fix Tables: Deposits
const depTableHeaderStr = `{['DATE', 'AMOUNT (₹)', 'MODE', 'NOTES', 'ACTIONS'].map(h => (`;
const depTableHeaderReplace = `{['DATE', 'AMOUNT (₹)', 'MODE', 'NOTES', 'PROOF', 'ACTIONS'].map(h => (`;

const depTableRowStr = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

const depTableRowReplace = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '-'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {d.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${d.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>View</a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

content = content.replace(depTableHeaderStr, depTableHeaderReplace);
content = content.replace(depTableRowStr, depTableRowReplace);

// Fix Tables: Payouts
const payTableHeaderStr = `{['DATE', 'AMOUNT (₹)', 'MODE', 'NOTES', 'ACTIONS'].map(h => (`;
const payTableHeaderReplace = `{['DATE', 'AMOUNT (₹)', 'MODE', 'NOTES', 'PROOF', 'ACTIONS'].map(h => (`;

const payTableRowStr = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '-'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

const payTableRowReplace = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '-'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {d.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${d.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>View</a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

content = content.replace(payTableHeaderStr, payTableHeaderReplace);
content = content.replace(payTableRowStr, payTableRowReplace);

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Update Phase 2 successful');
