const fs = require('fs');
const lines = fs.readFileSync('src/HybridPrescriptionView.jsx', 'utf8').split('\n');

const titleIdx = lines.findIndex(l => l.includes('지금 마음의 크기는 어느 정도인가요?'));
if (titleIdx !== -1) {
  console.log('--- Title Text ---');
  console.log(lines.slice(titleIdx - 5, titleIdx + 5).join('\n'));
}

const sliderIdx = lines.findIndex(l => l.includes('마음이 무거워요') || l.includes('여유가 없어요'));
if (sliderIdx !== -1) {
  console.log('--- Slider Text ---');
  console.log(lines.slice(sliderIdx - 10, sliderIdx + 20).join('\n'));
}
