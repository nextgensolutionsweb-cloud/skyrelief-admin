import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

// Fix Deposits Table Row
const depTableRowStr = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

const depTableRowReplace = `                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.payment_mode || 'Cash'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{d.reference_note || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {d.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${d.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold' }}>View</a>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

content = content.replace(depTableRowStr, depTableRowReplace);
// Also fix the colSpan for empty state in deposits
content = content.replace(/colSpan="5"/, 'colSpan="6"');

// Fix Payouts Table Header
const payTableHeaderStr = `{['DATE', 'AMOUNT (₹)', 'NOTES', 'ACTIONS'].map(h => (`;
const payTableHeaderReplace = `{['DATE', 'AMOUNT (₹)', 'NOTES', 'PROOF', 'ACTIONS'].map(h => (`;

// Fix Payouts Table Row
const payTableRowStr = `                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '800' }}>- {Number(p.amount_paid).toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{p.reference_note || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

const payTableRowReplace = `                          <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#3b82f6', fontWeight: '800' }}>- {Number(p.amount_paid).toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b' }}>{p.reference_note || '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem' }}>
                            {p.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${p.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold' }}>View</a>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>`;

content = content.replace(payTableHeaderStr, payTableHeaderReplace);
content = content.replace(payTableRowStr, payTableRowReplace);
// Also fix colSpan for empty state in payouts
content = content.replace(/colSpan="4"/, 'colSpan="5"');

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Tables fixed successfully.');
