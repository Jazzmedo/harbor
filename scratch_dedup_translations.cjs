const fs = require('fs');

const files = [
  '/Users/yasser/Downloads/harbor-main newUpdate/src/lib/i18n/locales/ar/addons.ts',
  '/Users/yasser/Downloads/harbor-main newUpdate/src/lib/i18n/locales/ar/library.ts',
  '/Users/yasser/Downloads/harbor-main newUpdate/src/lib/i18n/locales/ar/player.ts'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const seenKeys = new Set();
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Attempt to match a key-value pair line, e.g., "Key": "Value",
    const match = line.match(/^\s*"([^"]+)"\s*:/);
    
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        console.log(`Removed duplicate key in ${file.split('/').pop()}: "${key}"`);
        continue; // Skip this duplicate line
      } else {
        seenKeys.add(key);
      }
    } else {
      // Also match unquoted keys like Key: "Value",
      const matchUnquoted = line.match(/^\s*([A-Za-z0-9_]+)\s*:/);
      if (matchUnquoted && !line.includes('const') && !line.includes('export') && !line.includes('default')) {
         const key = matchUnquoted[1];
         if (seenKeys.has(key)) {
            console.log(`Removed duplicate unquoted key in ${file.split('/').pop()}: ${key}`);
            continue;
         } else {
            seenKeys.add(key);
         }
      }
    }
    
    newLines.push(line);
  }
  
  const newContent = newLines.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed ${file.split('/').pop()}`);
  }
}
