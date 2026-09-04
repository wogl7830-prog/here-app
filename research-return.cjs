const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const stepIdx = lines.findIndex(l => l.includes("{step === 'mypage'"));
if (stepIdx !== -1) {
  console.log('Found first step render at', stepIdx);
  // look backwards for the main return
  let i = stepIdx;
  while (i > 0 && !lines[i].includes('return (')) {
    i--;
  }
  console.log('Return found at', i);
  console.log(lines.slice(i, i + 30).join('\n'));
}

// look for BottomTab or TabBar
const tabIdx = lines.findIndex(l => l.includes('Bottom') || l.includes('TabBar') || l.includes('Nav'));
if (tabIdx !== -1) {
  console.log('Found tab-related keyword at', tabIdx);
}
