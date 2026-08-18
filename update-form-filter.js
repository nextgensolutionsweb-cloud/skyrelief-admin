import fs from 'fs';

let content = fs.readFileSync('src/app/marriages/form/page.js', 'utf8');

const oldFilter = `        const activeMembers = res.r.filter(m => {
          const isActive = m.insurance_status === 1 || String(m.insurance_status) === '1' || 
            m.account_status === 1 || String(m.account_status) === '1' ||
            m.status === 1 || String(m.status) === '1' || 
            m.status === 'Active' || m.insurance_status_text === 'Active';
          
          if (!isActive) return false;

          if (selectMemberIdAfterFetch && String(m.member_id || m.id) === String(selectMemberIdAfterFetch)) {
            return true;
          }

          const hasMarriage = m.marriage_status === 1 || String(m.marriage_status) === '1' ||
                              m.marriage_status === 2 || String(m.marriage_status) === '2' ||
                              m.is_married === true || String(m.is_married) === 'true' ||
                              (m.marriage_event_id !== null && m.marriage_event_id !== undefined && String(m.marriage_event_id).trim() !== '');

          return !hasMarriage;
        });`;

const newFilter = `        const activeMembers = res.r.filter(m => {
          const isDeceased = m.insurance_status === 5 || String(m.insurance_status) === '5' || m.status === 5 || String(m.status) === '5' || m.insurance_status_text === 'Deceased';
          if (isDeceased) return false;

          const isActive = m.insurance_status === 1 || String(m.insurance_status) === '1' || 
            m.account_status === 1 || String(m.account_status) === '1' ||
            m.status === 1 || String(m.status) === '1' || 
            m.status === 'Active' || m.insurance_status_text === 'Active';
          
          if (!isActive) return false;

          if (selectMemberIdAfterFetch && String(m.member_id || m.id) === String(selectMemberIdAfterFetch)) {
            return true;
          }
          
          const thisPlan = plans.find(p => String(p.id) === String(planId));
          const isDeath = thisPlan && (Number(thisPlan.plan_type) === 2 || String(thisPlan.name).toLowerCase().includes('सुरक्षा') || String(thisPlan.name).toLowerCase().includes('suraksha'));
          
          if (isDeath) {
            return true;
          }

          const hasMarriage = m.marriage_status === 1 || String(m.marriage_status) === '1' ||
                              m.marriage_status === 2 || String(m.marriage_status) === '2' ||
                              m.is_married === true || String(m.is_married) === 'true' ||
                              (m.marriage_event_id !== null && m.marriage_event_id !== undefined && String(m.marriage_event_id).trim() !== '');

          return !hasMarriage;
        });`;

content = content.replace(oldFilter, newFilter);
fs.writeFileSync('src/app/marriages/form/page.js', content);
console.log('Fixed member filtering logic in form page');
