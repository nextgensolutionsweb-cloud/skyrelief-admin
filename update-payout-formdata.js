import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

const oldPayoutStr = `    try {
      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, amount_paid: payoutAmount, reference_note: payoutNotes })
      });`;

const newPayoutStr = `    try {
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('amount_paid', payoutAmount);
      formData.append('reference_note', payoutNotes);
      if (payoutProofImage) formData.append('proof_image', payoutProofImage);

      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        body: formData
      });`;

content = content.replace(oldPayoutStr, newPayoutStr);

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Fixed handleAddPayout');
