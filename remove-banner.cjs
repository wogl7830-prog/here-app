const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

// 1. Add SvgReport and update sanctuaries
const sanctuariesStartIdx = lines.findIndex(l => l.includes('const sanctuaries = ['));
if (sanctuariesStartIdx !== -1) {
  const endIdx = lines.findIndex((l, i) => i > sanctuariesStartIdx && l.includes('];'));
  
  // We can insert SvgReport just before sanctuariesStartIdx
  const svgReportStr = `                const SvgReport = ({ color }) => (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 6C4 4.9 4.9 4 6 4H12L18 10V16C18 17.1 17.1 18 16 18H6C4.9 18 4 17.1 4 16V6Z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 4V10H18" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 14H14" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><path d="M8 10H10" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>
                );`;
  
  const newSanctuaries = [
    "                const sanctuaries = [",
    "                  { id: 'my-room', Icon: SvgSelf, title: '나의 방', sub: 'SELF · DISCOVERY', desc: '사주·내면 기질 분석\\n나를 안아주는 기록', color: '#6A5B53', accentBg: '#F4F0EB', border: '#D9C9BC', onClick: () => { setIsEnteringRoom(true); setTimeout(() => { setStep('my_room'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                  { id: 'family-room', Icon: SvgFamily, title: '가족의 방', sub: 'FAMILY · HEALING', desc: '서로의 다름 수용\\n다정한 대화 처방전', color: '#7A5C48', accentBg: '#FAF5F0', border: '#D9C9BC', onClick: () => { setTrackType('다정한 식탁'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                  { id: 'relation-room', Icon: SvgRelation, title: '관계의 방', sub: 'RELATION · BOUNDARY', desc: '건강한 거리 두기\\n페르소나 실전 화법', color: '#2E5B7A', accentBg: '#EEF4F9', border: '#B8CEDE', onClick: () => { setTrackType('나를 지키는 울타리'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                  { id: 'premium-report', Icon: SvgReport, title: '프리미엄 리포트', sub: 'PREMIUM · REPORT', desc: '주간 마음 리포트\\n가족 심리 분석', color: '#1A2A4E', accentBg: '#F2F5FB', border: '#C5D3E8', onClick: () => { setIsEnteringRoom(true); setTimeout(() => { setStep('premium_report'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                ];"
  ];
  
  lines.splice(sanctuariesStartIdx, endIdx - sanctuariesStartIdx + 1, svgReportStr, ...newSanctuaries);
}

// 2. Remove the standalone premium banner below sanctuaries.map
let content = lines.join('\n');
const bannerStartStr = '{/* ── 프리미엄 딥다이브 리포트 배너 ── */}';
const bannerStartIndex = content.indexOf(bannerStartStr);
if (bannerStartIndex !== -1) {
  // It starts with a <div>...</div>
  // Let's find the closing </div> of this block.
  // We can just find the string that follows it in the UI to figure out the exact slice.
  // It's inside <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
  // The banner has a closing </div>. We can do an indexOf up to "</div>\n                    </div>\n" or just trace divs.
  const bannerEndStr = '</svg>\n                      </div>\n                    </div>';
  const bannerEndIndex = content.indexOf(bannerEndStr, bannerStartIndex);
  if (bannerEndIndex !== -1) {
    const fullEnd = bannerEndIndex + bannerEndStr.length;
    content = content.substring(0, bannerStartIndex) + content.substring(fullEnd);
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Successfully updated App.jsx');
