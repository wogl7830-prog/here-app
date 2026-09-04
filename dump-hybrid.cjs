const fs = require('fs');
const lines = fs.readFileSync('src/HybridPrescriptionView.jsx', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('function HybridPrescriptionView'));
if (idx !== -1) {
  console.log(lines.slice(idx, idx + 10).join('\n'));
}

const sliderIdx = lines.findIndex(l => l.includes('type="range"'));
if (sliderIdx !== -1) {
  console.log('--- slider part ---');
  console.log(lines.slice(sliderIdx - 15, sliderIdx + 20).join('\n'));
}
