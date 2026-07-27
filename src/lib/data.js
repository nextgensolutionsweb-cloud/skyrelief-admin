// ─── Central Data Store ───────────────────────────────────────────────────────

export const agents = [
  { id: 'AGT-0001', name: 'Ananya Verma',    initials: 'AV', color: '#0ea5e9', mobile: '+91 9817881042', city: 'Ahmedabad', joining: '2021-01-01', vimas: 1, status: 'Inactive', email: 'ananya@skyrelief.org' },
  { id: 'AGT-0002', name: 'Anika Gupta',     initials: 'AG', color: '#22c55e', mobile: '+91 9882095624', city: 'Mumbai',    joining: '2022-02-02', vimas: 1, status: 'Active',   email: 'anika@skyrelief.org' },
  { id: 'AGT-0003', name: 'Krishna Kulkarni',initials: 'KK', color: '#8b5cf6', mobile: '+91 9800482819', city: 'Vadodara', joining: '2023-03-03', vimas: 2, status: 'Active',   email: 'krishna@skyrelief.org' },
  { id: 'AGT-0004', name: 'Saanvi Solanki',  initials: 'SS', color: '#f59e0b', mobile: '+91 9818397480', city: 'Rajkot',   joining: '2024-04-04', vimas: 2, status: 'Active',   email: 'saanvi@skyrelief.org' },
  { id: 'AGT-0005', name: 'Rohan Mehta',     initials: 'RM', color: '#ef4444', mobile: '+91 9845123456', city: 'Surat',    joining: '2022-06-15', vimas: 3, status: 'Active',   email: 'rohan@skyrelief.org' },
  { id: 'AGT-0006', name: 'Priya Shah',      initials: 'PS', color: '#06b6d4', mobile: '+91 9812987654', city: 'Jamnagar', joining: '2023-08-20', vimas: 2, status: 'Active',   email: 'priya@skyrelief.org' },
];

export const members = [
  { id: 'SR-20241000', name: 'Neha Shah',      initials: 'NS', color: '#0ea5e9', agentId: 'AGT-0001', mobile: '+91 9845347951', email: 'neha.shah@email.com',    branch: 'Jamnagar',   type: 'Premium', status: 'Pending',  address: '12, Shree Nagar Society, Jamnagar, Gujarat - 361001',    dob: '1990-05-14', gender: 'Female', aadhaar: 'XXXX-XXXX-4521', totalPaid: 48000,  totalDue: 12000, nextDue: '2024-05-01',
    payments: [
      { date: '2024-01-10', amount: 12000, method: 'Bank Transfer', status: 'Paid' },
      { date: '2024-02-10', amount: 12000, method: 'Online',        status: 'Paid' },
      { date: '2024-03-10', amount: 12000, method: 'Cheque',        status: 'Paid' },
      { date: '2024-04-10', amount: 12000, method: 'Online',        status: 'Paid' },
      { date: '2024-05-10', amount: 12000, method: 'Bank Transfer', status: 'Due'  },
    ],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2024-01-05' },
      { name: 'PAN Card',      status: 'Verified', date: '2024-01-05' },
      { name: 'Address Proof', status: 'Pending',  date: '2024-03-20' },
      { name: 'Photo',         status: 'Verified', date: '2024-01-05' },
    ],
  },
  { id: 'SR-20241001', name: 'Ananya Gupta',   initials: 'AG', color: '#22c55e', agentId: 'AGT-0002', mobile: '+91 9862608676', email: 'ananya.gupta@email.com', branch: 'Mumbai',     type: 'Annual',   status: 'Active',   address: '45, Bandra West, Mumbai, Maharashtra - 400050',          dob: '1988-09-22', gender: 'Female', aadhaar: 'XXXX-XXXX-7832', totalPaid: 12100,  totalDue: 0,     nextDue: '2025-01-01',
    payments: [{ date: '2024-01-15', amount: 12100, method: 'Online', status: 'Paid' }],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2023-12-10' },
      { name: 'PAN Card',      status: 'Verified', date: '2023-12-10' },
      { name: 'Address Proof', status: 'Verified', date: '2023-12-10' },
      { name: 'Photo',         status: 'Verified', date: '2023-12-10' },
    ],
  },
  { id: 'SR-20241002', name: 'Arjun Pillai',   initials: 'AP', color: '#f59e0b', agentId: 'AGT-0002', mobile: '+91 9816558012', email: 'arjun.pillai@email.com', branch: 'Rajkot',     type: 'Annual',   status: 'Active',   address: '7, Kalawad Road, Rajkot, Gujarat - 360001',             dob: '1995-03-11', gender: 'Male',   aadhaar: 'XXXX-XXXX-3341', totalPaid: 49700,  totalDue: 5000,  nextDue: '2024-05-15',
    payments: [
      { date: '2024-01-20', amount: 15000, method: 'Bank Transfer', status: 'Paid' },
      { date: '2024-02-20', amount: 15000, method: 'Bank Transfer', status: 'Paid' },
      { date: '2024-03-20', amount: 14700, method: 'Online',        status: 'Paid' },
      { date: '2024-04-20', amount: 5000,  method: 'Bank Transfer', status: 'Due'  },
    ],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2024-01-18' },
      { name: 'PAN Card',      status: 'Pending',  date: '2024-03-01' },
      { name: 'Address Proof', status: 'Verified', date: '2024-01-18' },
      { name: 'Photo',         status: 'Verified', date: '2024-01-18' },
    ],
  },
  { id: 'SR-20241003', name: 'Riya Chauhan',   initials: 'RC', color: '#8b5cf6', agentId: 'AGT-0003', mobile: '+91 9834521076', email: 'riya.chauhan@email.com', branch: 'Surat',      type: 'Premium',  status: 'Active',   address: '22, Ring Road, Surat, Gujarat - 395001',                dob: '1992-07-30', gender: 'Female', aadhaar: 'XXXX-XXXX-9910', totalPaid: 240000, totalDue: 0,     nextDue: '2025-03-01',
    payments: [
      { date: '2023-03-01', amount: 120000, method: 'Bank Transfer', status: 'Paid' },
      { date: '2024-03-01', amount: 120000, method: 'Bank Transfer', status: 'Paid' },
    ],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2023-02-20' },
      { name: 'PAN Card',      status: 'Verified', date: '2023-02-20' },
      { name: 'Address Proof', status: 'Verified', date: '2023-02-20' },
      { name: 'Photo',         status: 'Verified', date: '2023-02-20' },
      { name: 'Income Proof',  status: 'Verified', date: '2023-02-20' },
    ],
  },
  { id: 'SR-20241004', name: 'Vivaan Parmar',  initials: 'VP', color: '#ef4444', agentId: 'AGT-0003', mobile: '+91 9871234560', email: 'vivaan.parmar@email.com',branch: 'Vadodara',   type: 'Basic',    status: 'Inactive', address: '9, Alkapuri, Vadodara, Gujarat - 390007',               dob: '1998-12-05', gender: 'Male',   aadhaar: 'XXXX-XXXX-5567', totalPaid: 8500,   totalDue: 3500,  nextDue: '2024-04-20',
    payments: [
      { date: '2024-01-05', amount: 5000, method: 'Online', status: 'Paid' },
      { date: '2024-02-05', amount: 3500, method: 'Online', status: 'Paid' },
      { date: '2024-03-05', amount: 3500, method: 'Online', status: 'Due'  },
    ],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2024-01-02' },
      { name: 'PAN Card',      status: 'Rejected', date: '2024-02-10' },
      { name: 'Address Proof', status: 'Pending',  date: '2024-03-15' },
      { name: 'Photo',         status: 'Verified', date: '2024-01-02' },
    ],
  },
  { id: 'SR-20241005', name: 'Priya Mehta',    initials: 'PM', color: '#06b6d4', agentId: 'AGT-0004', mobile: '+91 9800123456', email: 'priya.mehta@email.com',  branch: 'Ahmedabad',  type: 'Premium',  status: 'Active',   address: '18, Satellite Road, Ahmedabad, Gujarat - 380015',       dob: '1985-02-18', gender: 'Female', aadhaar: 'XXXX-XXXX-2278', totalPaid: 310000, totalDue: 0,     nextDue: '2025-01-15',
    payments: [
      { date: '2023-01-15', amount: 150000, method: 'Bank Transfer', status: 'Paid' },
      { date: '2024-01-15', amount: 160000, method: 'Bank Transfer', status: 'Paid' },
    ],
    documents: [
      { name: 'Aadhaar Card',   status: 'Verified', date: '2023-01-10' },
      { name: 'PAN Card',       status: 'Verified', date: '2023-01-10' },
      { name: 'Address Proof',  status: 'Verified', date: '2023-01-10' },
      { name: 'Photo',          status: 'Verified', date: '2023-01-10' },
      { name: 'Bank Statement', status: 'Verified', date: '2023-01-10' },
    ],
  },
  { id: 'SR-20241006', name: 'Karan Solanki',  initials: 'KS', color: '#ec4899', agentId: 'AGT-0005', mobile: '+91 9845098765', email: 'karan.solanki@email.com',branch: 'Gandhinagar',type: 'Annual',   status: 'Active',   address: '5, Sector 21, Gandhinagar, Gujarat - 382021',           dob: '1993-11-08', gender: 'Male',   aadhaar: 'XXXX-XXXX-8812', totalPaid: 22300,  totalDue: 0,     nextDue: '2025-02-01',
    payments: [{ date: '2024-02-01', amount: 22300, method: 'Online', status: 'Paid' }],
    documents: [
      { name: 'Aadhaar Card',  status: 'Verified', date: '2024-01-25' },
      { name: 'PAN Card',      status: 'Verified', date: '2024-01-25' },
      { name: 'Address Proof', status: 'Verified', date: '2024-01-25' },
      { name: 'Photo',         status: 'Verified', date: '2024-01-25' },
    ],
  },
  { id: 'SR-20241007', name: 'Sneha Patel',    initials: 'SP', color: '#14b8a6', agentId: 'AGT-0006', mobile: '+91 9812345670', email: 'sneha.patel@email.com',  branch: 'Bhavnagar',  type: 'Basic',    status: 'Pending',  address: '3, Waghawadi Road, Bhavnagar, Gujarat - 364001',        dob: '2000-06-25', gender: 'Female', aadhaar: 'XXXX-XXXX-1190', totalPaid: 5200,   totalDue: 2800,  nextDue: '2024-05-01',
    payments: [
      { date: '2024-02-15', amount: 5200, method: 'Cheque', status: 'Paid' },
      { date: '2024-04-01', amount: 2800, method: 'Online', status: 'Due'  },
    ],
    documents: [
      { name: 'Aadhaar Card',  status: 'Pending', date: '2024-02-10' },
      { name: 'PAN Card',      status: 'Pending', date: '2024-02-10' },
      { name: 'Address Proof', status: 'Pending', date: '2024-02-10' },
      { name: 'Photo',         status: 'Verified',date: '2024-02-10' },
    ],
  },
];

export const donations = [
  { id: 'DON-001', name: 'Rajesh Mehta',   initials: 'RM', color: '#0ea5e9', amount: 2500000, date: '2024-03-15', method: 'Bank Transfer', status: 'Completed', note: 'Annual donation' },
  { id: 'DON-002', name: 'Priya Shah',     initials: 'PS', color: '#22c55e', amount: 1250000, date: '2024-03-10', method: 'Cheque',        status: 'Completed', note: '' },
  { id: 'DON-003', name: 'Ankit Solanki',  initials: 'AS', color: '#f59e0b', amount: 820000,  date: '2024-03-08', method: 'Online',        status: 'Completed', note: 'Education fund' },
  { id: 'DON-004', name: 'Kavya Patel',    initials: 'KP', color: '#8b5cf6', amount: 560000,  date: '2024-03-05', method: 'Bank Transfer', status: 'Pending',   note: '' },
  { id: 'DON-005', name: 'Ravi Kulkarni',  initials: 'RK', color: '#ef4444', amount: 380000,  date: '2024-03-02', method: 'Online',        status: 'Completed', note: 'Vima support' },
  { id: 'DON-006', name: 'Sneha Joshi',    initials: 'SJ', color: '#06b6d4', amount: 210000,  date: '2024-02-28', method: 'Cheque',        status: 'Pending',   note: '' },
];

export const marriages = [
  { id: 'MAR-2024-001', name: 'Priya Sharma & Raj Patel',     date: '2024-04-15', district: 'Ahmedabad', amount: 25000, status: 'Upcoming',   agent: 'AGT-0001' },
  { id: 'MAR-2024-002', name: 'Neha Gupta & Amit Verma',      date: '2024-04-18', district: 'Surat',     amount: 25000, status: 'Upcoming',   agent: 'AGT-0002' },
  { id: 'MAR-2024-003', name: 'Riya Solanki & Karan Mehta',   date: '2024-03-12', district: 'Vadodara',  amount: 25000, status: 'Completed',  agent: 'AGT-0003' },
  { id: 'MAR-2024-004', name: 'Ankita Joshi & Deepak Shah',   date: '2024-03-28', district: 'Rajkot',    amount: 25000, status: 'Completed',  agent: 'AGT-0004' },
  { id: 'MAR-2024-005', name: 'Kavya Pillai & Aryan Kumar',   date: '2024-04-22', district: 'Mumbai',    amount: 25000, status: 'Pending',    agent: 'AGT-0005' },
  { id: 'MAR-2024-006', name: 'Sunita Patel & Mohan Desai',   date: '2024-05-05', district: 'Bhavnagar', amount: 25000, status: 'Upcoming',   agent: 'AGT-0006' },
];

export const vimaSchemes = [
  { id: 'VIMA-0001', name: 'Kanya Vivah Suraksha', type: 'Marriage Vima', agents: 1, premium: 1800, coverage: 810000,  status: 'Inactive', from: '2025-01-01', to: '2026-01-01', desc: 'Financial support for marriage ceremonies of girl members.' },
  { id: 'VIMA-0002', name: 'Aarogya Raksha',        type: 'Health Vima',   agents: 2, premium: 6600, coverage: 370000,  status: 'Active',   from: '2025-02-01', to: '2026-06-01', desc: 'Health insurance covering hospitalization and medical expenses.' },
  { id: 'VIMA-0003', name: 'Jeevan Jyoti',          type: 'Life Vima',     agents: 3, premium: 8900, coverage: 820000,  status: 'Active',   from: '2025-03-01', to: '2026-03-01', desc: 'Life cover for members and their immediate family.' },
  { id: 'VIMA-0004', name: 'Shiksha Suraksha',      type: 'Education',     agents: 2, premium: 4200, coverage: 500000,  status: 'Active',   from: '2025-04-01', to: '2026-04-01', desc: 'Education assistance for children of members.' },
  { id: 'VIMA-0005', name: 'Durghatna Kavach',      type: 'Accident',      agents: 1, premium: 2500, coverage: 250000,  status: 'Active',   from: '2025-05-01', to: '2026-05-01', desc: 'Accident insurance with disability and death benefits.' },
];

export const tasks = [
  { id: 'T-001', title: 'Review new member applications',     assignee: 'Arjun Verma',  due: '2024-04-10', priority: 'High',   status: 'Pending',     type: 'Approval' },
  { id: 'T-002', title: 'Approve agent KYC documents',        assignee: 'Riya Mehta',   due: '2024-04-11', priority: 'High',   status: 'In Progress', type: 'KYC' },
  { id: 'T-003', title: 'Process marriage assistance claims', assignee: 'Anil Shah',    due: '2024-04-12', priority: 'Medium', status: 'Pending',     type: 'Claims' },
  { id: 'T-004', title: 'Verify donation receipts — March',   assignee: 'Arjun Verma',  due: '2024-04-08', priority: 'Low',    status: 'Completed',   type: 'Finance' },
  { id: 'T-005', title: 'Update Vima scheme coverage list',   assignee: 'Priya Patel',  due: '2024-04-15', priority: 'Medium', status: 'Pending',     type: 'Admin' },
  { id: 'T-006', title: 'Send renewal reminders to members',  assignee: 'Team',         due: '2024-04-09', priority: 'High',   status: 'Completed',   type: 'Campaign' },
];

export const announcements = [
  { id: 'ANN-001', title: 'Annual Membership Renewal Drive',   date: '2024-04-01', type: 'General',  audience: 'All Members', status: 'Active',    desc: 'Annual renewal drive for all SkyRelief members. Discounts available for early renewals before April 30.', visible: true },
  { id: 'ANN-002', title: 'New Vima Scheme Launched',          date: '2024-03-28', type: 'Scheme',   audience: 'Agents',      status: 'Active',    desc: 'Introducing Aarogya Plus — a comprehensive health vima with enhanced coverage up to ₹10 Lakhs.', visible: true },
  { id: 'ANN-003', title: 'Festival Donation Campaign',        date: '2024-03-20', type: 'Campaign', audience: 'Donors',      status: 'Completed', desc: 'Navratri special donation campaign. Target of ₹5 Crore was successfully achieved.', visible: false },
  { id: 'ANN-004', title: 'Marriage Assistance Form Update',   date: '2024-03-15', type: 'Notice',   audience: 'Applicants',  status: 'Active',    desc: 'Updated application form for Marriage Assistance Programme is now available.', visible: true },
  { id: 'ANN-005', title: 'Agent Training Workshop',           date: '2024-03-10', type: 'Training', audience: 'Agents',      status: 'Completed', desc: 'Training workshop for all field agents on new CRM system. 24 agents attended.', visible: false },
];

export const supportTickets = [
  { id: 'TKT-001', subject: 'Unable to upload Aadhaar document', user: 'Neha Shah',    initials: 'NS', color: '#0ea5e9', priority: 'High',   status: 'Open',        date: '2024-04-08', category: 'Document' },
  { id: 'TKT-002', subject: 'Donation receipt not generated',    user: 'Ravi Mehta',   initials: 'RM', color: '#22c55e', priority: 'Medium', status: 'In Progress', date: '2024-04-07', category: 'Finance' },
  { id: 'TKT-003', subject: 'Agent dashboard showing wrong data',user: 'Priya Patel',  initials: 'PP', color: '#8b5cf6', priority: 'High',   status: 'Open',        date: '2024-04-06', category: 'Technical' },
  { id: 'TKT-004', subject: 'Cannot reset password',             user: 'Anil Shah',    initials: 'AS', color: '#f59e0b', priority: 'Low',    status: 'Resolved',    date: '2024-04-05', category: 'Account' },
  { id: 'TKT-005', subject: 'Marriage form submission error',    user: 'Kavya Verma',  initials: 'KV', color: '#ef4444', priority: 'Medium', status: 'Resolved',    date: '2024-04-04', category: 'Form' },
];

export const notifications = [
  { id: 'N-001', icon: '🔵', title: '342 approvals pending',            desc: 'Member and agent document approvals awaiting review.', type: 'System', time: 'Just now',  unread: true,  visible: true },
  { id: 'N-002', icon: '🟢', title: 'Monthly donation target reached',  desc: '₹48.5 L collected — 104% of March target.',            type: 'Push',   time: '1 hr ago',  unread: true,  visible: true },
  { id: 'N-003', icon: '💍', title: '12 marriages scheduled this week', desc: 'Coordinate venues and budget allocations.',             type: 'Email',  time: '3 hr ago',  unread: true,  visible: true },
  { id: 'N-004', icon: '📲', title: 'SMS campaign delivered',           desc: 'Festival greetings sent to 24,856 members.',           type: 'SMS',    time: '5 hr ago',  unread: false, visible: true },
  { id: 'N-005', icon: '🔴', title: 'Agent KYC expiring soon',          desc: '4 agents have KYC documents expiring this month.',     type: 'System', time: '1 day ago', unread: false, visible: true },
  { id: 'N-006', icon: '🟡', title: 'New member registrations',         desc: '28 new members registered in the last 24 hours.',      type: 'Push',   time: '1 day ago', unread: false, visible: false },
];

// Helpers
export const getMembersByAgent = (agentId) => members.filter(m => m.agentId === agentId);
export const getMemberById     = (id)       => members.find(m => m.id === id);
export const getAgentById      = (id)       => agents.find(a => a.id === id);

export const formatCurrency = (n) => {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};
