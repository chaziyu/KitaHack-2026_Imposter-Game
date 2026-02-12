const fs = require('fs');
const path = 'src/features/ui/MeetingUI.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
// We want to remove lines 190 to 299 (1-based).
// 0-based index: 189 to 298.
// We keep 0..188 and 299..end.
const newLines = [
    ...lines.slice(0, 189),
    ...lines.slice(299)
];
fs.writeFileSync(path, newLines.join('\n'));
console.log('Deleted lines 190-299');
