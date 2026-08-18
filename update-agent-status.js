import fs from 'fs';

let content = fs.readFileSync('src/app/agents/[agentId]/page.js', 'utf8');

const oldMap = `    if (item.insurance_status === 3) return { bg: '#f3e8ff', color: '#7e22ce', label: 'Invoice Generated' };
    if (item.insurance_status === 0) return { bg: '#fef3c7', color: '#92400e', label: 'Pending/Suspended' };
    if (item.insurance_status === -1) return { bg: '#fee2e2', color: '#991b1b', label: 'Removed' };`;

const newMap = `    if (item.insurance_status === 0) return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
    if (item.insurance_status === 2) return { bg: '#fee2e2', color: '#ef4444', label: 'Suspended' };
    if (item.insurance_status === 4) return { bg: '#dcfce7', color: '#22c55e', label: 'Settled' };
    if (item.insurance_status === 5) return { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' };
    if (item.insurance_status === 6) return { bg: '#fef9c3', color: '#ca8a04', label: 'Upcoming' };
    if (item.insurance_status === 7) return { bg: '#ede9fe', color: '#6d28d9', label: 'Married' };
    if (item.insurance_status === -1) return { bg: '#f3f4f6', color: '#4b5563', label: 'Removed' };`;

content = content.replace(oldMap, newMap);

fs.writeFileSync('src/app/agents/[agentId]/page.js', content);
console.log('Fixed agent page status mapping');
