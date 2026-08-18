import fs from 'fs';

let content = fs.readFileSync('src/app/marriages/page.js', 'utf8');

content = content.replace(
  "{['MEMBER', 'PLAN', 'AGENT', 'MARRIAGE DATE', 'INVITATION CARD', 'AMOUNT GIVEN', 'STATUS', 'ACTIONS'].map(h => (",
  "{['MEMBER', 'PLAN', 'AGENT', 'EVENT DATE', 'DOCUMENTS', 'AMOUNT GIVEN', 'STATUS', 'ACTIONS'].map(h => ("
);

content = content.replace(
  "color: '#64748b' }}>Marriage Date:</span>",
  "color: '#64748b' }}>Event Date:</span>"
);

fs.writeFileSync('src/app/marriages/page.js', content);
console.log('Done replacement in page.js');
