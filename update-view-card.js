import fs from 'fs';

let content = fs.readFileSync('src/app/marriages/page.js', 'utf8');

const oldLine = 'const cardUrl = getInvitationCardUrl(item.invitation_card);';
const newLine = 'const cardUrl = getInvitationCardUrl(item.invitation_card || item.photo || item.photo_url);';

content = content.replace(oldLine, newLine);

fs.writeFileSync('src/app/marriages/page.js', content);
console.log('Fixed View Card for death plans');
