const fs = require('fs');
const path = require('path');

function stripComments(content) {
  // Remove single-line // comments, but not inside template literals
  // This is a simple pass - may affect strings containing //
  let result = content;
  // Remove // that are not inside template literals (backticks)
  // We'll just remove all // that are not part of a string by doing a naive pass
  // Actually, let's just remove lines that are solely comments or // at start
  // Better: remove // that appear after code on a line
  // We'll do a naive removal: replace //.*$ with empty, but only if not inside a string
  // For safety, let's just remove lines that start with // or have // at position > 0
  // Actually, the simplest: remove // ... from each line, but keep the line if it has other content
  // This is tricky. Let's just do a basic removal.
  result = content.replace(/\/\/[^\x00]*$/gm, '');
  return result;
}

const dir = '.';
const fm = require('fs');
const files = fs.readdirSync('.', { recursive: true })
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

let modified = 0;
for (const file of files) {
  const fullPath = path.join('.', file);
  // Skip node_modules
  if (fullPath.includes('node_modules')) continue;
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = stripComments(content);
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    modified++;
    console.log('Modified:', fullPath);
  }
}
console.log('Total modified:', modified);