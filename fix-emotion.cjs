const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove the EMOTION SELECTION block
const emotionStartStr = '{/* ── 감정 선택 칩 (EMOTION SELECTION) ── */}';
const startIdx = content.indexOf(emotionStartStr);
if (startIdx !== -1) {
  const endMarkerStr = '</button>\n                        ))}\n                      </div>\n                    </div>';
  const endIdx = content.indexOf(endMarkerStr, startIdx);
  if (endIdx !== -1) {
    const fullEndIdx = endIdx + endMarkerStr.length;
    content = content.substring(0, startIdx) + content.substring(fullEndIdx);
  } else {
    // try a looser end match if exact formatting changed
    const fallbackEnd = content.indexOf('</div>\n                    </div>', content.indexOf('dashboardEmotions.map', startIdx));
    if (fallbackEnd !== -1) {
      content = content.substring(0, startIdx) + content.substring(fallbackEnd + 15);
    }
  }
}

// 2. Fix the sub text that mentions EMOTION SELECTION
const oldSubStr = "'복잡한 일상 속에서 잠시 숨을 돌리기 잘하셨어요. 아래 [EMOTION SELECTION]에서 오늘 느껴지는 감정 카드를 하나 선택해 보세요.';";
const newSubStr = "'복잡한 일상 속에서 잠시 숨을 돌리기 잘하셨어요. [오늘의 편지 열어보기]를 눌러 맞춤형 편지를 받아보세요.';";
content = content.replace(oldSubStr, newSubStr);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Removed EMOTION SELECTION block');
