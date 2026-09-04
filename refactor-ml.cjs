const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Insert new state variables
if (!content.includes('const [customEmotionInput, setCustomEmotionInput]')) {
  content = content.replace(
    "const [step, setStep] = useState('dashboard');",
    "const [step, setStep] = useState('dashboard');\n  const [customEmotionInput, setCustomEmotionInput] = useState('');\n  const [showCustomEmotionInput, setShowCustomEmotionInput] = useState(false);"
  );
}

// 2. Replace chips
const startStr = "{/* ── 감정 선택 칩 (편지 생성 전) ── */}";
const endStr = "                    )}";
const startIdx = content.indexOf(startStr);
if (startIdx !== -1) {
  // Find the closing )} of the !isLoadingMorningLetter && !morningLetterAI block
  const blockStart = content.indexOf("{!isLoadingMorningLetter && !morningLetterAI && (", startIdx);
  if (blockStart !== -1) {
    const fallbackEnd = content.indexOf(endStr, startIdx);
    
    if (fallbackEnd !== -1) {
      const newChipsUI = `{/* ── 감정 선택 칩 (편지 생성 전) ── */}
                    {!isLoadingMorningLetter && !morningLetterAI && (
                      <div style={{ textAlign: 'center', margin: '40px 0', padding: '0 20px' }}>
                        <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '24px', fontWeight: '600' }}>오늘 느껴지는 감정 카드를 하나 선택해 보세요.</p>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: '12px', 
                          maxWidth: '400px', 
                          margin: '0 auto' 
                        }}>
                          {['🌱 평온함', '☁️ 불안/걱정', '🌧️ 무기력/슬픔', '⚡ 억울/분노', '🔥 번아웃', '✨ 설렘/감사'].map(emo => (
                            <button
                              key={emo}
                              onClick={() => {
                                const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : { name: '목(木)' };
                                const elementalTrait = ilgan ? ilgan.elementName || ilgan.name : '목(木)';
                                setIsLoadingMorningLetter(true);
                                setShowCustomEmotionInput(false);
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
                                border: '1.5px solid #EAEAEA',
                                borderRadius: '16px',
                                padding: '14px 12px',
                                fontSize: '0.9rem',
                                color: '#444',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                letterSpacing: '-0.3px'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E2725B'; e.currentTarget.style.color = '#E2725B'; e.currentTarget.style.backgroundColor = '#FFF6F4'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.color = '#444'; e.currentTarget.style.backgroundColor = '#FFF'; }}
                            >
                              {emo}
                            </button>
                          ))}
                          
                          {/* 직접 입력 칩 */}
                          {!showCustomEmotionInput ? (
                            <button
                              onClick={() => setShowCustomEmotionInput(true)}
                              style={{
                                background: '#F8F9FA',
                                border: '1.5px dashed #D0D0D0',
                                borderRadius: '16px',
                                padding: '14px 12px',
                                fontSize: '0.9rem',
                                color: '#666',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                gridColumn: '1 / -1'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#999'; e.currentTarget.style.color = '#333'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D0D0D0'; e.currentTarget.style.color = '#666'; }}
                            >
                              ✏️ 직접 입력하기
                            </button>
                          ) : (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                placeholder="어떤 감정인가요?"
                                value={customEmotionInput}
                                onChange={e => setCustomEmotionInput(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '12px 16px',
                                  borderRadius: '16px',
                                  border: '1.5px solid #E2725B',
                                  fontSize: '0.9rem',
                                  outline: 'none',
                                  fontFamily: 'inherit'
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (!customEmotionInput.trim()) return;
                                  const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : { name: '목(木)' };
                                  const elementalTrait = ilgan ? ilgan.elementName || ilgan.name : '목(木)';
                                  setIsLoadingMorningLetter(true);
                                  setShowCustomEmotionInput(false);
                                  window.scrollTo(0, 0);
                                  fetchGeminiMorningLetter({
                                    name: formData.name || '',
                                    ampm: '',
                                    elementName: elementalTrait,
                                    emotions: [customEmotionInput.trim()]
                                  }).then(data => {
                                    setMorningLetterAI(data);
                                    setIsLoadingMorningLetter(false);
                                  }).catch(err => {
                                    console.error('Morning Letter Error:', err);
                                    setIsLoadingMorningLetter(false);
                                  });
                                }}
                                style={{
                                  padding: '0 20px',
                                  borderRadius: '16px',
                                  backgroundColor: '#E2725B',
                                  color: '#FFF',
                                  border: 'none',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem'
                                }}
                              >
                                완료
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}`;
      content = content.substring(0, startIdx) + newChipsUI + content.substring(fallbackEnd + endStr.length);
    }
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Successfully applied ML chip updates to App.jsx');
