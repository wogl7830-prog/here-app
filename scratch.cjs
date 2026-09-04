const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add state variables for dashboard morning letter
if (!content.includes('const [dashboardMorningLetter')) {
  content = content.replace('const [morningLetterAI, setMorningLetterAI] = useState(null);', 'const [morningLetterAI, setMorningLetterAI] = useState(null);\n  const [dashboardMorningLetter, setDashboardMorningLetter] = useState(null);\n  const [isGeneratingDashboardLetter, setIsGeneratingDashboardLetter] = useState(false);');
}

// 2. Change emotion chips
content = content.replace(
  /const dashboardEmotions = \['🌱 평온함', '☁️ 불안', '🌧️ 무기력', '⚡ 억울\/분노', '🔥 번아웃', '🕊️ 감사'\];/,
  "const dashboardEmotions = ['🌱 평온함', '☁️ 불안', '🌧️ 슬픔', '🔥 분노', '🫧 무기력', '✨ 설렘'];"
);

// 3. Update onClick in dashboardEmotions.map and add accordion
const oldChipMap = `                        {dashboardEmotions.map(emo => (
                          <button
                            key={emo}
                            onClick={() => {
                              const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : null;
                              const elementalTrait = ilgan ? ilgan.elementName : '';
                              setIsLoadingMorningLetter(true);
                              setStep('morning_letter');
                              window.scrollTo(0, 0);
                              fetchGeminiMorningLetter({
                                name: formData.name,
                                ampm: '',
                                elementName: elementalTrait,
                                emotions: [emo]
                              }).then(data => {
                                setMorningLetterAI(data);
                                setIsLoadingMorningLetter(false);
                              }).catch(err => {
                                console.error('Morning Letter Error:', err);
                                setIsLoadingMorningLetter(false);
                              });
                            }}`;

const newChipMap = `                        {dashboardEmotions.map(emo => (
                          <button
                            key={emo}
                            onClick={() => {
                              const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : null;
                              const elementalTrait = ilgan ? ilgan.elementName : '';
                              setIsGeneratingDashboardLetter(true);
                              fetchGeminiMorningLetter({
                                name: formData.name,
                                ampm: '',
                                elementName: elementalTrait,
                                emotions: [emo]
                              }).then(data => {
                                setDashboardMorningLetter(data);
                                setIsGeneratingDashboardLetter(false);
                              }).catch(err => {
                                console.error('Morning Letter Error:', err);
                                setIsGeneratingDashboardLetter(false);
                              });
                            }}`;
                            
content = content.replace(oldChipMap, newChipMap);

const accordionUI = `                        </div>

                        {/* ── 아코디언 모닝 레터 펼침 ── */}
                        {(isGeneratingDashboardLetter || dashboardMorningLetter) && (
                          <div style={{ marginTop: '16px', animation: 'fadeIn 0.5s ease', backgroundColor: cPreviewBg, borderRadius: '16px', padding: '20px', border: \`1px solid \${cPreviewBorder}\` }}>
                            {isGeneratingDashboardLetter ? (
                              <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ width: '24px', height: '24px', border: \`3px solid \${cLabel}\`, borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
                                <span style={{ fontSize: '0.85rem', color: cPreviewText, fontWeight: 'bold' }}>마음 결에 맞춘 편지를 적고 있어요...</span>
                              </div>
                            ) : dashboardMorningLetter && (
                              <>
                                <h3 style={{ fontSize: '1.1rem', color: cTitle, fontWeight: '800', margin: '0 0 12px 0', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                                  {dashboardMorningLetter.title}
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: cPreviewText, lineHeight: '1.7', margin: '0 0 16px 0', wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>
                                  {dashboardMorningLetter.content}
                                </p>
                                <div style={{ backgroundColor: isLight ? '#FFF' : 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: isLight ? '1px solid #F0F0F0' : 'none' }}>
                                  <span style={{ fontSize: '0.75rem', color: cLabel, fontWeight: '800', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>TODAY'S AFFIRMATION</span>
                                  <span style={{ fontSize: '1rem', color: cTitle, fontWeight: '700', wordBreak: 'keep-all' }}>"{dashboardMorningLetter.affirmation}"</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}`;

if (content.includes(newChipMap)) {
  const scrollContainerIndex = content.indexOf('className="hide-scrollbar"');
  if (scrollContainerIndex !== -1) {
    const mapStart = content.indexOf('{dashboardEmotions.map', scrollContainerIndex);
    const scrollContainerEndIndex = content.indexOf('</div>', content.indexOf('</button>', mapStart));
    
    if (scrollContainerEndIndex !== -1 && !content.includes('아코디언 모닝 레터 펼침')) {
      content = content.substring(0, scrollContainerEndIndex + 6) + '\n' + accordionUI.replace('                        </div>\n\n', '') + content.substring(scrollContainerEndIndex + 6);
    }
  }
}

// 4. Update sanctuaries and add premium banner
const oldSanctuaries = `                const sanctuaries = [
                  { id: 'relation-room', Icon: SvgRelation, title: '관계의 방', sub: 'RELATION · BOUNDARY', desc: '건강한 거리 두기\\n페르소나 실전 화법', color: '#2E5B7A', accentBg: '#EEF4F9', border: '#B8CEDE', onClick: () => { setTrackType('나를 지키는 울타리'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                  { id: 'family-room', Icon: SvgFamily, title: '가족의 방', sub: 'FAMILY · HEALING', desc: '서로의 다름 수용\\n다정한 대화 처방전', color: '#7A5C48', accentBg: '#FAF5F0', border: '#D9C9BC', onClick: () => { setTrackType('다정한 식탁'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                ];`;

const newSanctuaries = `                const sanctuaries = [
                  { id: 'my-room', Icon: SvgSelf, title: '나의 방', sub: 'SELF · DISCOVERY', desc: '사주·내면 기질 분석\\n나와의 다정한 대화', color: '#6A5B53', accentBg: '#F4F0EB', border: '#D9C9BC', onClick: () => { setIsEnteringRoom(true); setTimeout(() => { setStep('my_room'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                  { id: 'family-room', Icon: SvgFamily, title: '가족의 방', sub: 'FAMILY · HEALING', desc: '서로의 다름 수용\\n다정한 대화 처방전', color: '#7A5C48', accentBg: '#FAF5F0', border: '#D9C9BC', onClick: () => { setTrackType('다정한 식탁'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                  { id: 'relation-room', Icon: SvgRelation, title: '관계의 방', sub: 'RELATION · BOUNDARY', desc: '건강한 거리 두기\\n페르소나 실전 화법', color: '#2E5B7A', accentBg: '#EEF4F9', border: '#B8CEDE', onClick: () => { setTrackType('나를 지키는 울타리'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                ];`;
content = content.replace(oldSanctuaries, newSanctuaries);

const premiumBannerUI = `
                    {/* ── 프리미엄 딥다이브 리포트 배너 ── */}
                    <div
                      onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setStep('premium_report'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); }}
                      style={{
                        background: 'linear-gradient(135deg, #1A2A4E 0%, #101B33 100%)', borderRadius: '18px', padding: '24px 20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: '0 8px 20px rgba(26,42,78,0.3)', transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        border: '1px solid #2A3C6B'
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

// Insert the premium banner after the sanctuaries map
const mapEndIndex = content.indexOf('))}</div>', content.indexOf('sanctuaries.map'));
if (mapEndIndex !== -1 && !content.includes('프리미엄 딥다이브 리포트 배너')) {
  const finalInsertIdx = mapEndIndex + 9;
  content = content.substring(0, finalInsertIdx) + '\n' + premiumBannerUI + content.substring(finalInsertIdx);
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx successfully modified.');
