const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('function MonthlyAnalyticsView'));
if (startIdx !== -1) {
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('{')) depth += (lines[i].match(/{/g) || []).length;
    if (lines[i].includes('}')) depth -= (lines[i].match(/}/g) || []).length;
    if (depth === 0 && i > startIdx) {
      endIdx = i;
      break;
    }
  }
  console.log(lines.slice(startIdx, endIdx + 1).join('\n'));
} else {
  console.log('MonthlyAnalyticsView not found');
}
