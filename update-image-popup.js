import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

const depProofHtml = `{d.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${d.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold' }}>View</a>
                            ) : '—'}`;

const depProofReplace = `{d.proof_image ? (
                              <button onClick={() => { setZoomTitle('Deposit Proof'); setZoomImage(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${d.proof_image}\`); }} style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                            ) : '—'}`;

content = content.replace(depProofHtml, depProofReplace);

const payProofHtml = `{p.proof_image ? (
                              <a href={\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${p.proof_image}\`} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold' }}>View</a>
                            ) : '—'}`;

const payProofReplace = `{p.proof_image ? (
                              <button onClick={() => { setZoomTitle('Commission Proof'); setZoomImage(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/\${p.proof_image}\`); }} style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                            ) : '—'}`;

content = content.replace(payProofHtml, payProofReplace);

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Done replacing image popups.');
