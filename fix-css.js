import fs from 'fs';

let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Ensure content-area doesn't have flex: 1 that might cause container collapse
css = css.replace(/\.content-area\s*\{[^}]+\}/g, (match) => {
  let newRule = match.replace(/flex:\s*1;?/g, '');
  // Make sure it has adequate padding-bottom
  if (!newRule.includes('padding-bottom')) {
    newRule = newRule.replace(/padding:\s*32px\s*40px;?/g, 'padding: 32px 40px 100px 40px;');
  }
  return newRule;
});

// Also remove flex: 1 from main-content-wrapper, it doesn't really need it if it's the only static child block of body
// Actually, app-container is flex row, so main-content-wrapper needs flex: 1 to expand horizontally.
// We'll leave main-content-wrapper flex: 1 alone.

// One more check: if app-container has height: 100vh instead of min-height, let's fix that.
css = css.replace(/height:\s*100vh;?\s*overflow:\s*hidden;/g, 'min-height: 100vh;');

fs.writeFileSync('src/app/globals.css', css);
console.log('CSS fixed');
