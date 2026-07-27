// mockData.js

export const agents = [
  {
    id: 'AGT-001',
    name: 'Ananya Verma',
    mobile: '+91 9817881042',
    city: 'Ahmedabad',
    joiningDate: '2021-01-01',
    vimas: 1,
    status: 'Active',
    avatarInitials: 'AV',
    color: '#3b82f6'
  },
  {
    id: 'AGT-002',
    name: 'Krishna Kulkarni',
    mobile: '+91 9800482819',
    city: 'Vadodara',
    joiningDate: '2023-03-03',
    vimas: 2,
    status: 'Active',
    avatarInitials: 'KK',
    color: '#8b5cf6'
  },
  {
    id: 'AGT-003',
    name: 'Saanvi Solanki',
    mobile: '+91 9818397480',
    city: 'Rajkot',
    joiningDate: '2024-04-04',
    vimas: 2,
    status: 'Inactive',
    avatarInitials: 'SS',
    color: '#ef4444'
  }
];

export const members = [
  // Members for Agent 001
  {
    id: 'MBR-1001',
    agentId: 'AGT-001',
    name: 'Neha Shah',
    registrationNo: 'SR-20241000',
    mobile: '+91 9845347951',
    branch: 'Jamnagar',
    type: 'Premium',
    donated: '₹1.2 L',
    status: 'Pending',
    avatarInitials: 'NS',
    color: '#3b82f6',
    
    // Profile specific details
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    aadharCard: 'XXXX-XXXX-4567',
    panCard: 'ABCDE1234F',
    paymentScore: 750,
    totalPaymentDue: '₹15,000',
    address: '123, Ring Road, Jamnagar, Gujarat',
    joinDate: '2024-02-15'
  },
  {
    id: 'MBR-1002',
    agentId: 'AGT-001',
    name: 'Priya Mehta',
    registrationNo: 'SR-20241005',
    mobile: '+91 9876543210',
    branch: 'Surat',
    type: 'Annual',
    donated: '₹25K',
    status: 'Active',
    avatarInitials: 'PM',
    color: '#10b981',
    
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    aadharCard: 'XXXX-XXXX-8901',
    panCard: 'QWERT5678Y',
    paymentScore: 810,
    totalPaymentDue: '₹0',
    address: '45, VIP Road, Surat, Gujarat',
    joinDate: '2023-11-10'
  },
  
  // Members for Agent 002
  {
    id: 'MBR-2001',
    agentId: 'AGT-002',
    name: 'Ananya Gupta',
    registrationNo: 'SR-20241001',
    mobile: '+91 9862608676',
    branch: 'Mumbai',
    type: 'Annual',
    donated: '₹12.1K',
    status: 'Active',
    avatarInitials: 'AG',
    color: '#f59e0b',
    
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    aadharCard: 'XXXX-XXXX-1122',
    panCard: 'ZXCVB9012N',
    paymentScore: 680,
    totalPaymentDue: '₹5,500',
    address: 'Andheri West, Mumbai, Maharashtra',
    joinDate: '2024-01-20'
  },
  {
    id: 'MBR-2002',
    agentId: 'AGT-002',
    name: 'Arjun Pillai',
    registrationNo: 'SR-20241002',
    mobile: '+91 9816558012',
    branch: 'Rajkot',
    type: 'Annual',
    donated: '₹49.7K',
    status: 'Active',
    avatarInitials: 'AP',
    color: '#8b5cf6',
    
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    aadharCard: 'XXXX-XXXX-3344',
    panCard: 'PLMKO3456B',
    paymentScore: 790,
    totalPaymentDue: '₹2,000',
    address: 'Race Course Ring Road, Rajkot, Gujarat',
    joinDate: '2023-08-05'
  }
];
