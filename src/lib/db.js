import { agents as initialAgents, members as initialMembers } from './data';

const getLocalStorage = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const setLocalStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

export function getAgents() {
  const local = getLocalStorage('skyrelief_agents');
  if (local) return local;
  
  const enriched = initialAgents.map(a => ({
    ...a,
    aadhaar: a.aadhaar || '5432-8765-1092',
    pan: a.pan || 'ABGPA8721K',
    address: a.address || `${a.city}, Gujarat, India`,
    email: a.email || `${a.name.toLowerCase().replace(/ /g, '')}@skyrelief.org`,
    joining: a.joining || '2022-04-15'
  }));
  setLocalStorage('skyrelief_agents', enriched);
  return enriched;
}

export function saveAgents(agentsList) {
  setLocalStorage('skyrelief_agents', agentsList);
}

export function getMembers() {
  const local = getLocalStorage('skyrelief_members');
  if (local) return local;
  
  const enriched = initialMembers.map(m => ({
    ...m,
    schemeName: m.schemeName || 'Kanya Vivah Suraksha',
    schemeAmount: m.schemeAmount || '₹50,000',
    joiningDate: m.joiningDate || m.joinDate || '2024-01-01',
    maturityDate: m.maturityDate || '2029-01-01',
    totalInstallments: m.totalInstallments || 60,
    paidInstallments: m.paidInstallments || 12,
    remainingInstallments: m.remainingInstallments || 48,
    totalAmount: m.totalAmount || 50000,
    paidAmount: m.totalPaid || m.paidAmount || 12000,
    dueAmount: m.totalDue || m.dueAmount || 38000,
    paymentScore: m.paymentScore || 85,
    lastPaymentDate: m.lastPaymentDate || '2024-04-10'
  }));
  setLocalStorage('skyrelief_members', enriched);
  return enriched;
}

export function saveMembers(membersList) {
  setLocalStorage('skyrelief_members', membersList);
}

export function getAgentById(id) {
  return getAgents().find(a => a.id === id);
}

export function getMemberById(id) {
  return getMembers().find(m => m.id === id);
}

export function updateAgent(id, updatedFields) {
  const list = getAgents();
  const index = list.findIndex(a => a.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedFields };
    saveAgents(list);
    return list[index];
  }
  return null;
}

export function updateMember(id, updatedFields) {
  const list = getMembers();
  const index = list.findIndex(m => m.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updatedFields };
    saveMembers(list);
    return list[index];
  }
  return null;
}

export function deleteAgent(id) {
  const list = getAgents().filter(a => a.id !== id);
  saveAgents(list);
  
  // Optional: Clean up members associated with the deleted agent?
  // Let's keep them but disassociate, or keep them as is.
  return true;
}

export function deleteMember(id) {
  const list = getMembers().filter(m => m.id !== id);
  saveMembers(list);
  return true;
}

export function addAgent(agent) {
  const list = getAgents();
  list.push(agent);
  saveAgents(list);
  return agent;
}

export function addMember(member) {
  const list = getMembers();
  list.push(member);
  saveMembers(list);
  return member;
}
