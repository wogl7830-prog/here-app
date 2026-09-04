const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

// 1. Remove the wrong sanctuaries block at line ~1630
const firstIdx = lines.findIndex(l => l.includes('const sanctuaries = ['));
if (firstIdx !== -1 && firstIdx < 2000) {
  const endIdx = lines.findIndex((l, i) => i > firstIdx && l.includes('];'));
  lines.splice(firstIdx, endIdx - firstIdx + 1);
}

// 2. Find the real sanctuaries block and replace it
const secondIdx = lines.findIndex(l => l.includes('const sanctuaries = ['));
if (secondIdx !== -1) {
  const endIdx = lines.findIndex((l, i) => i > secondIdx && l.includes('];'));
  const newBlock = [
    "                const sanctuaries = [",
    "                  { id: 'my-room', Icon: SvgSelf, title: '나의 방', sub: 'SELF · DISCOVERY', desc: '사주·내면 기질 분석\\n나를 안아주는 기록', color: '#6A5B53', accentBg: '#F4F0EB', border: '#D9C9BC', onClick: () => { setIsEnteringRoom(true); setTimeout(() => { setStep('my_room'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                  { id: 'family-room', Icon: SvgFamily, title: '가족의 방', sub: 'FAMILY · HEALING', desc: '서로의 다름 수용\\n다정한 대화 처방전', color: '#7A5C48', accentBg: '#FAF5F0', border: '#D9C9BC', onClick: () => { setTrackType('다정한 식탁'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                  { id: 'relation-room', Icon: SvgRelation, title: '관계의 방', sub: 'RELATION · BOUNDARY', desc: '건강한 거리 두기\\n페르소나 실전 화법', color: '#2E5B7A', accentBg: '#EEF4F9', border: '#B8CEDE', onClick: () => { setTrackType('나를 지키는 울타리'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },",
    "                ];"
  ];
  lines.splice(secondIdx, endIdx - secondIdx + 1, ...newBlock);
}

let content = lines.join('\n');

// 3. Insert Premium Banner after sanctuaries.map ends
const premiumBannerUI = `
                    {/* ── 프리미엄 딥다이브 리포트 배너 ── */}
                    <div
                      onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setStep('premium_report'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); }}
                      style={{
                        background: 'linear-gradient(135deg, #1A2A4E 0%, #101B33 100%)', borderRadius: '18px', padding: '24px 20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: '0 8px 20px rgba(26,42,78,0.3)', transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        border: '1px solid #2A3C6B', marginTop: '12px'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(26,42,78,0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,42,78,0.3)'; }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>💎</span>
                          <span style={{ fontSize: '0.75rem', color: '#88A0D9', letterSpacing: '1px', fontWeight: '800' }}>PREMIUM REPORT</span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: '800', margin: '0 0 6px 0' }}>나의 마음 성장 관측소</h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0, wordBreak: 'keep-all' }}>AI가 분석하는 무의식 패턴과 심리 처방</p>
                      </div>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
`;

const mapStart = content.indexOf('{sanctuaries.map(');
if (mapStart !== -1) {
  let blockStr = content.substring(mapStart, mapStart + 2000);
  let divEnd = blockStr.indexOf('))}');
  let realEnd = blockStr.indexOf('</div>', divEnd);
  
  if (realEnd !== -1 && !content.includes('프리미엄 딥다이브 리포트 배너')) {
    let insertIndex = mapStart + realEnd + 6;
    content = content.substring(0, insertIndex) + '\n' + premiumBannerUI + content.substring(insertIndex);
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx fixed layouts.');
