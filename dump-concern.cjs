const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes("{step === 'concern'"));
if (idx !== -1) {
  console.log(lines.slice(idx, idx + 40).join('\n'));
} else {
  console.log('Not found');
}
