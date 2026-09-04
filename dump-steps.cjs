const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const aIdx = lines.findIndex(l => l.includes("{step === 'monthly_analytics'"));
if (aIdx !== -1) {
  console.log('monthly_analytics rendering at', aIdx);
  console.log(lines.slice(aIdx, aIdx + 10).join('\n'));
}

const rIdx = lines.findIndex(l => l.includes("{step === 'monthly_report'"));
if (rIdx !== -1) {
  console.log('monthly_report rendering at', rIdx);
  console.log(lines.slice(rIdx, rIdx + 10).join('\n'));
}

const myRoomIdx = lines.findIndex(l => l.includes("{step === 'my_room'"));
if (myRoomIdx !== -1) {
  console.log('my_room rendering at', myRoomIdx);
} else {
  console.log('my_room not found');
}
