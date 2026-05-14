import fs from 'fs';

let content = fs.readFileSync('src/views/EditorView.tsx', 'utf-8');

// Replace Column placement block
const colRegex = /<div className="flex flex-col gap-1 col-span-full">\s*<label className="text-\[10px\] font-bold uppercase">Column placement<\/label>[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(colRegex, '');

// Replace Alignment block  
const alignRegex = /<div className="flex flex-col gap-1 col-span-full">\s*<label className="text-\[10px\] font-bold uppercase">Alignment<\/label>[\s\S]*?<\/div>\s*<\/div>/g;
content = content.replace(alignRegex, '');

fs.writeFileSync('src/views/EditorView.tsx', content);

console.log("Replaced");
