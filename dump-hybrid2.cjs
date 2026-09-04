const fs = require('fs');
const lines = fs.readFileSync('src/HybridPrescriptionView.jsx', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('type="range"'));
if (idx !== -1) {
  console.log(lines.slice(idx + 15, idx + 40).join('\n'));
}
