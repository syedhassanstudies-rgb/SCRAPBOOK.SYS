const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace w-full max-w-[...px] with w-[<current-50>px] sm:w-[...px] max-w-[90vw]
  const newContent = content.replace(/w-full max-w-\[([0-9]+)px\]/g, (match, p1) => {
    changed = true;
    const val = parseInt(p1);
    const mobile = Math.max(280, val - 100);
    return `w-[${mobile}px] sm:w-[${val}px] max-w-[90vw]`;
  });

  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}
