import fs from 'node:fs';
const path = 'src/features/ui/MeetingUI.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);
// Remove lines 190 to 299 (1-based index)
// 0-based: 189 to 298
// Keep 0..188 and 299..end
const newLines = [
    ...lines.slice(0, 189),
    ...lines.slice(299)
];
fs.writeFileSync(path, newLines.join('\n'));
console.log('Deleted lines 190-299');
