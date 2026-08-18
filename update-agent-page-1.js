import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

// 1. Add states
const stateMatch = `const [depositPaymentMode, setDepositPaymentMode] = useState('Cash');`;
const newStates = `const [depositPaymentMode, setDepositPaymentMode] = useState('Cash');\n  const [depositProofImage, setDepositProofImage] = useState(null);\n  const [payoutProofImage, setPayoutProofImage] = useState(null);`;

content = content.replace(stateMatch, newStates);

// 2. Update handleAddDeposit
const addDepositMatch = `const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return showToast('Enter valid amount', 'error');
    
    setSubmittingDeposit(true);
    try {
      const res = await apiRequest('/api/agent/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent_id: agentId, 
          amount: depositAmount, 
          reference_note: depositNotes,
          payment_mode: depositPaymentMode 
        })
      });`;
      
const addDepositReplace = `const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) return showToast('Enter valid amount', 'error');
    
    setSubmittingDeposit(true);
    try {
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('amount', depositAmount);
      formData.append('reference_note', depositNotes);
      formData.append('payment_mode', depositPaymentMode);
      if (depositProofImage) formData.append('proof_image', depositProofImage);

      const res = await apiRequest('/api/agent/deposit', {
        method: 'POST',
        body: formData
      });`;

content = content.replace(addDepositMatch, addDepositReplace);

// 3. Clear state in handleAddDeposit success
const clearDepositMatch = `setDepositPaymentMode('Cash');`;
const clearDepositReplace = `setDepositPaymentMode('Cash');\n        setDepositProofImage(null);`;
content = content.replace(clearDepositMatch, clearDepositReplace);

// 4. Update handleAddPayout
const addPayoutMatch = `const handleAddPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return showToast('Enter valid amount', 'error');
    
    setSubmittingPayout(true);
    try {
      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent_id: agentId, 
          amount_paid: payoutAmount, 
          reference_note: payoutNotes 
        })
      });`;
      
const addPayoutReplace = `const handleAddPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return showToast('Enter valid amount', 'error');
    
    setSubmittingPayout(true);
    try {
      const formData = new FormData();
      formData.append('agent_id', agentId);
      formData.append('amount_paid', payoutAmount);
      formData.append('reference_note', payoutNotes);
      if (payoutProofImage) formData.append('proof_image', payoutProofImage);

      const res = await apiRequest('/api/agent/payout', {
        method: 'POST',
        body: formData
      });`;

content = content.replace(addPayoutMatch, addPayoutReplace);

// 5. Clear state in handleAddPayout success
const clearPayoutMatch = `setPayoutNotes('');\n        fetchWalletSummary();`;
const clearPayoutReplace = `setPayoutNotes('');\n        setPayoutProofImage(null);\n        fetchWalletSummary();`;
content = content.replace(clearPayoutMatch, clearPayoutReplace);

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Update Phase 1 successful');
