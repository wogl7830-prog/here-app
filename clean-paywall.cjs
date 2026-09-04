const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');

// Precisely remove only the premium paywall block:
// Start: blank line before the {/* 💎 프리미엄 딥다이브 리포트 페이월 */} comment
// End: up to and including the closing )}\n after the 상대방 창문 block

const PAYWALL_START = `\n              {/* 💎 프리미엄 딥다이브 리포트 페이월 */}`;
const PAYWALL_END = `            </>\n          )}\n\n        {/* 나의 방으로`;

const startIdx = content.indexOf(PAYWALL_START);
const endIdx = content.indexOf(PAYWALL_END);

if (startIdx === -1) {
  console.log('❌ Could not find PAYWALL_START');
  process.exit(1);
}
if (endIdx === -1) {
  console.log('❌ Could not find PAYWALL_END');
  process.exit(1);
}

// We want to keep PAYWALL_END from the `)}\n\n        {/* 나의 방으로` part
const keepFromIdx = endIdx + `            </>\n          )}\n\n`.length;

const newContent = content.substring(0, startIdx) + content.substring(keepFromIdx);
fs.writeFileSync('src/App.jsx', newContent, 'utf8');
console.log('✅ Premium paywall block removed. File updated.');
console.log('Removed', keepFromIdx - startIdx, 'chars');
