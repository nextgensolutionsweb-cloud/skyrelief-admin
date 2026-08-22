const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app');

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Payments
  if (content.includes("onClick={() => router.push('/payments')}")) {
    content = content.replace(/onClick=\{\(\) => router\.push\('\/payments'\)\}/g, "onClick={() => router.back()}");
    changed = true;
  }
  // Members
  if (content.includes("onClick={() => router.push('/members')}")) {
    content = content.replace(/onClick=\{\(\) => router\.push\('\/members'\)\}/g, "onClick={() => router.back()}");
    changed = true;
  }
  // Marriages
  if (content.includes("onClick={() => router.push('/marriages')}")) {
    content = content.replace(/onClick=\{\(\) => router\.push\('\/marriages'\)\}/g, "onClick={() => router.back()}");
    changed = true;
  }
  // Insurance
  if (content.includes("onClick={() => router.push('/insurance')}")) {
    content = content.replace(/onClick=\{\(\) => router\.push\('\/insurance'\)\}/g, "onClick={() => router.back()}");
    changed = true;
  }
  // Agents
  if (content.includes("onClick={() => router.push('/agents')}")) {
    content = content.replace(/onClick=\{\(\) => router\.push\('\/agents'\)\}/g, "onClick={() => router.back()}");
    changed = true;
  }

  // Edit forms Cancel / Back buttons
  const formPattern = /onClick=\{\(\) => router\.push\(isEditMode \? `\/[a-z]+\/\$\{.*?\}` : '\/[a-z]+'\)\}/g;
  if (formPattern.test(content)) {
    content = content.replace(formPattern, "onClick={() => router.back()}");
    changed = true;
  }

  // Handle back to listing from form where no ID check is used (e.g. create mode only)
  // But wait, the previous ones handle it.

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
  }
}

const findFiles = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath);
    } else if (fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  });
};

findFiles(dir);
