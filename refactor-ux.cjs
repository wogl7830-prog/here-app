const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove dashboardEmotions rendering in the dashboard view
const dashEmotionsStartStr = "                        {dashboardEmotions.map(emo => (";
const startIdx = content.indexOf(dashEmotionsStartStr);
if (startIdx !== -1) {
  // The block starts a bit before this with a div for EMOTION SELECTION
  const blockStartStr = "{/* ── 감정 선택 칩 (EMOTION SELECTION) ── */}";
  const blockStartIdx = content.indexOf(blockStartStr, startIdx - 500);
  
  if (blockStartIdx !== -1) {
    // Find where the accordion ends
    // It's under {/* ── 아코디언 모닝 레터 펼침 ── */}
    const accordionStart = content.indexOf("{/* ── 아코디언 모닝 레터 펼침 ── */}");
    if (accordionStart !== -1) {
      // Find the end of the accordion which is inside a )
      const afterAccordionStr = "                        )}";
      const accordionEnd = content.indexOf(afterAccordionStr, accordionStart) + afterAccordionStr.length;
      
      content = content.substring(0, blockStartIdx) + content.substring(accordionEnd);
    }
  }
}

// 2. Remove the auto-fetch useEffect for morning_letter
const effectStartStr = "// ── 모닝레터 진입 시 Gemini API 호출 ──────────────────────────────────────";
const effectIdx = content.indexOf(effectStartStr);
if (effectIdx !== -1) {
  // It's a standard useEffect
  const endEffectStr = "  }, [step, morningLetterAI, formData]);"; // Need to guess exact closing, or we can use bracket matching
  
  // Since it's simpler, I'll just find the next comment block or next blank line after standard useEffect
  let effectEnd = content.indexOf("}, [step, morningLetterAI, formData]);", effectIdx);
  if (effectEnd === -1) {
    effectEnd = content.indexOf("  }, [step", effectIdx);
    effectEnd = content.indexOf(");", effectEnd) + 2;
  }
  
  if (effectEnd !== -1) {
    content = content.substring(0, effectIdx) + content.substring(effectEnd + 1);
  }
}

// 3. Add emotion chips to morning_letter view
const morningLetterRenderStr = "{step === 'morning_letter' && (() => {";
const mlRenderIdx = content.indexOf(morningLetterRenderStr);
if (mlRenderIdx !== -1) {
  // We need to inject the emotion chips when !isLoadingMorningLetter && !morningLetterAI
  
  const injectTargetStr = "{/* ── 편지 본문 + 필사 영역 (AI 응답 후) ── */}";
  const injectIdx = content.indexOf(injectTargetStr, mlRenderIdx);
  
  if (injectIdx !== -1) {
    const emotionUI = `
                    {/* ── 감정 선택 칩 (편지 생성 전) ── */}
                    {!isLoadingMorningLetter && !morningLetterAI && (
                      <div style={{ textAlign: 'center', margin: '40px 0' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>오늘 느껴지는 감정 카드를 하나 선택해 보세요.</p>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', whiteSpace: 'nowrap', justifyContent: 'center', flexWrap: 'wrap' }} className="hide-scrollbar">
                          {['🌱 평온함', '☁️ 불안', '🌧️ 슬픔', '🔥 분노', '🫧 무기력', '✨ 설렘'].map(emo => (
                            <button
                              key={emo}
                              onClick={() => {
                                const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : { name: '목(木)' };
                                const elementalTrait = ilgan ? ilgan.elementName || ilgan.name : '목(木)';
                                setIsLoadingMorningLetter(true);
                                window.scrollTo(0, 0);
                                fetchGeminiMorningLetter({
                                  name: formData.name || '',
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
                              }}
                              style={{
                                background: '#FFF',
                                border: '1px solid #EAEAEA',
                                borderRadius: '20px',
                                padding: '10px 18px',
                                fontSize: '0.9rem',
                                color: '#444',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E2725B'; e.currentTarget.style.color = '#E2725B'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.color = '#444'; }}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
`;
    content = content.substring(0, injectIdx) + emotionUI + content.substring(injectIdx);
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Successfully refactored App.jsx for morning_letter UX.');
