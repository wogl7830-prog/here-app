const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const concernIdx = lines.findIndex(l => l.includes("step === 'concern'"));
if (concernIdx !== -1) {
  console.log('--- concern step ---');
  console.log(lines.slice(concernIdx, concernIdx + 20).join('\n'));
}

const mlIdx = lines.findIndex(l => l.includes('감정 선택 칩 (편지 생성 전)'));
if (mlIdx !== -1) {
  console.log('--- morning_letter chips ---');
  console.log(lines.slice(mlIdx, mlIdx + 40).join('\n'));
}
