import fs from 'fs';

let content = fs.readFileSync('src/app/marriages/form/page.js', 'utf8');

// Fix plan fetching
content = content.replace(
  'setPlans(res.r.filter(p => Number(p.plan_type || 1) === 1));',
  'setPlans(res.r);'
);

// Add amount_given to emptyForm
content = content.replace(
  'const emptyForm = {',
  'const emptyForm = {\n  amount_given: \'\','
);

// Add amount_given to fetchMarriageDetails
content = content.replace(
  'notes: details.notes || \'\',',
  'notes: details.notes || \'\',\n          amount_given: details.amount_given || \'\','
);

// Change file preview label to be generic
content = content.replace(
  'setExistingCard(cardPath);',
  'setExistingCard(details.photo_url || cardPath);'
);

fs.writeFileSync('src/app/marriages/form/page.js', content);
console.log('Done replacements part 1');
