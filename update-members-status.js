import fs from 'fs';

let content = fs.readFileSync('src/app/members/page.js', 'utf8');

const oldStyles = `  const insuranceStatusStyle = {
    0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
    2: { bg: '#e0e7ff', color: '#4338ca', label: 'Married' },
    3: { bg: '#f3e8ff', color: '#7e22ce', label: 'Invoice Generated' },
    '-1': { bg: '#f1f5f9', color: '#475569', label: 'Removed' },
  };`;

const newStyles = `  const insuranceStatusStyle = {
    0: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    1: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
    2: { bg: '#fee2e2', color: '#ef4444', label: 'Suspended' },
    4: { bg: '#dcfce7', color: '#22c55e', label: 'Settled' },
    5: { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' },
    6: { bg: '#fef9c3', color: '#ca8a04', label: 'Upcoming' },
    7: { bg: '#ede9fe', color: '#6d28d9', label: 'Married' },
    '-1': { bg: '#f3f4f6', color: '#4b5563', label: 'Removed' },
  };`;

content = content.replace(oldStyles, newStyles);

const oldHack = `                  if (planType === 2 && (String(item.insurance_status) === '3' || String(item.insurance_status) === '2')) {
                    insStatusInfo = { bg: '#fee2e2', color: '#991b1b', label: 'Deceased' };
                  }`;
const newHack = `                  // Using exact insurance status directly`;

content = content.replace(oldHack, newHack);

fs.writeFileSync('src/app/members/page.js', content);
console.log('Fixed members page status mapping');
