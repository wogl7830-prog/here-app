const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update Instantiation
const instOld = `<MonthlyAnalyticsView
                  userName={formData?.name || '당신'}
                  onReset={() => setStep('dashboard')}
                />`;
const instNew = `<MonthlyAnalyticsView
                  userName={formData?.name || '당신'}
                  isPremiumUnlocked={isPremiumUnlocked}
                  setIsPremiumUnlocked={setIsPremiumUnlocked}
                  latestAnalysisResult={latestAnalysisResult}
                  onReset={() => { setStep('dashboard'); window.scrollTo(0, 0); }}
                />`;

if (content.includes(instOld)) {
  content = content.replace(instOld, instNew);
} else {
  console.log("Could not find the exact old instantiation of MonthlyAnalyticsView. Checking for an alternative format...");
  // Alternative regex replacement
  const renderRegex = /<MonthlyAnalyticsView\s+userName=\{[^\}]+\}\s+onReset=\{[^\}]+\}\s*\/>/;
  if (renderRegex.test(content)) {
    content = content.replace(renderRegex, instNew);
  } else {
    console.log("Failed to find instantiation.");
  }
}


// 2. Replace the MonthlyAnalyticsView Component
const compStartStr = "function MonthlyAnalyticsView({ userName = \"당신\", onReset }) {";
const compStartIdx = content.indexOf(compStartStr);

if (compStartIdx !== -1) {
  let depth = 0;
  let endIdx = compStartIdx;
  for (let i = compStartIdx; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const newComponent = `function MonthlyAnalyticsView({ userName = "당신", isPremiumUnlocked, setIsPremiumUnlocked, latestAnalysisResult, onReset }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [chatToast, setChatToast] = useState('');
  const [selectedStage, setSelectedStage] = useState(1);

  // Parse markdown bold text to add highlight effect
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\\*\\*.*?\\*\\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={index} className="highlight-text active">{part.slice(2, -2)}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const mockMonthlyData = "평온 40%, 불안 30%, 분노 15%, 슬픔 15% (최근 1주일간 평온 증가 추세)";
        // We still fetch mock monthly data if we want the climate
        // But the climate is a fixed mock for now. Let's assume we don't need to actually fetch from gemini to save time,
        // or we keep the fetch call for future-proofing.
        // The original code had: await fetchGeminiMonthlyAnalytics(...)
        // To avoid reference error, we just set mock data immediately if fetchGeminiMonthlyAnalytics is not defined
        // Actually, fetchGeminiMonthlyAnalytics is already in App.jsx so we can call it.
        const data = typeof fetchGeminiMonthlyAnalytics === 'function' ? await fetchGeminiMonthlyAnalytics(userName, mockMonthlyData) : null;
        if (!ignore) {
          if(data) {
             setAnalysisData(data);
          } else {
             setAnalysisData({
                premium_monthly_analytics: {
                  monthly_theme_title: "파도를 견디며 나만의 항로를 찾아간 한 달",
                  growth_evidence_data: "지난달보다 **'불안' 수치가 15% 감소**했습니다.",
                  trigger_pattern_insight: "주로 **'인정받지 못할 때'** 분노가 트리거됩니다.",
                  next_month_mission: "작은 성취를 스스로 칭찬해 주기",
                  acquired_badges: ["🌱 평온의 발견", "🛡️ 경계선 수호자"]
                }
             });
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Monthly analytics error:", err);
        if (!ignore) {
          setAnalysisData({
            premium_monthly_analytics: {
              monthly_theme_title: "파도를 견디며 나만의 항로를 찾아간 한 달",
              growth_evidence_data: "지난달보다 **'불안' 수치가 15% 감소**했습니다.",
              trigger_pattern_insight: "주로 **'인정받지 못할 때'** 분노가 트리거됩니다.",
              next_month_mission: "작은 성취를 스스로 칭찬해 주기",
              acquired_badges: ["🌱 평온의 발견", "🛡️ 경계선 수호자"]
            }
          });
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [userName]);

  const handleUnlockPremium = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsPremiumUnlocked(true);
      setIsUnlocking(false);
    }, 1200);
  };

  const report = analysisData?.premium_monthly_analytics || {};
  const badges = report.acquired_badges || [];

  return (
    <>
      <style>{\`
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes floatWave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .highlight-text { position: relative; display: inline-block; font-weight: bold; z-index: 1; }
        .highlight-text::after {
          content: ''; position: absolute; bottom: 2px; left: -2px; right: -2px; height: 10px;
          background-color: rgba(248, 175, 156, 0.5); z-index: -1;
          transform: scaleX(0); transform-origin: left center; transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          border-radius: 4px;
        }
        .highlight-text.active::after { transform: scaleX(1); }
        .blur-locked { filter: blur(8px); pointer-events: none; user-select: none; transition: filter 0.5s ease-out; }
        .chat-bubble-in { animation: chatIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes chatIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      \`}</style>
      
      <div className="dynamic-fade-layer" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FDFBF7' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', position: 'relative' }}>
          <button onClick={onReset} style={{ position: 'absolute', left: '20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', backgroundColor: '#F5F0EA' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B4C3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span style={{ fontSize: '1.05rem', color: '#4A3728', fontWeight: '800', letterSpacing: '0.5px' }}>프리미엄 리포트 허브</span>
        </div>

        {/* 빈 상태 (데이터 없음) */}
        {!latestAnalysisResult ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 80px 24px', textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#F5F0EA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '2.5rem' }}>🌿</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#4A3728', fontWeight: '800', margin: '0 0 16px 0', wordBreak: 'keep-all', lineHeight: '1.4' }}>
              아직 분석된<br />관계 지도가 없습니다
            </h2>
            <p style={{ fontSize: '1rem', color: '#8A7A72', lineHeight: '1.7', marginBottom: '32px', wordBreak: 'keep-all' }}>
              가족의 방이나 관계의 방에 당신의 일상 속 깊은 고민을 먼저 털어놓아 보세요. 세상에 하나뿐인 나만을 위한 프리미엄 심층 리포트와 실전 대화 시나리오가 이곳에 선물처럼 기록됩니다.
            </p>
            <button
              onClick={onReset}
              style={{
                padding: '16px 32px', borderRadius: '30px', border: 'none', backgroundColor: '#E2725B',
                color: '#FFF', fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(226,114,91,0.25)', transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 24px 80px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', animation: 'fadeIn 0.6s ease-out' }}>
            
            {/* [Part 1] 이달의 마음 기후 (Mock Data) */}
            <div style={{
              background: 'linear-gradient(270deg, #FDF0E6, #EDF5FA, #FFF5F0)', backgroundSize: '400% 400%',
              animation: 'gradientShift 10s ease infinite', borderRadius: '24px', padding: '30px 24px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: '-10px', left: 0, right: 0, height: '60px', opacity: 0.6, animation: 'floatWave 4s ease-in-out infinite' }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}><path d="M-5.36,65.63 C182.56,-36.01 279.06,140.63 505.36,44.90 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#FFFFFF' }}></path></svg>
              </div>
              <div style={{ position: 'absolute', bottom: '-5px', left: 0, right: 0, height: '40px', opacity: 0.4, animation: 'floatWave 5s ease-in-out infinite reverse' }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}><path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#FFF' }}></path></svg>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', color: '#D96A53', fontWeight: '800', margin: '0 0 16px 0' }}>🌤️ 이달의 마음 기후</h3>
                <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '40%', backgroundColor: '#A8D8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A2A4E', fontSize: '0.7rem', fontWeight: 'bold' }}>평온 40%</div>
                  <div style={{ width: '30%', backgroundColor: '#F1AC9D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold' }}>불안 30%</div>
                  <div style={{ width: '15%', backgroundColor: '#E2725B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold' }}>분노 15%</div>
                  <div style={{ width: '15%', backgroundColor: '#B8CEDE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A2A4E', fontSize: '0.7rem', fontWeight: 'bold' }}>슬픔 15%</div>
                </div>
                {isLoading ? (
                   <p style={{ fontSize: '0.9rem', color: '#5A4A42', fontWeight: 'bold' }}>기록을 분석 중입니다...</p>
                ) : (
                   <p style={{ fontSize: '0.95rem', color: '#5A4A42', lineHeight: '1.6', margin: 0, fontWeight: '700', wordBreak: 'keep-all' }}>
                     이번 달 {userName} 님의 마음에 가장 오래 머문 계절은 '잔잔한 바람(평온)'이었습니다.
                   </p>
                )}
              </div>
            </div>

            {/* 페이월 오버레이 래퍼 */}
            <div style={{ position: 'relative' }}>
              {!isPremiumUnlocked && (
                <div style={{
                  position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)',
                  width: '90%', maxWidth: '340px', backgroundColor: '#FFFFFF', borderRadius: '24px',
                  padding: '32px 24px', zIndex: 10, textAlign: 'center',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(226,114,91,0.2)'
                }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔒</div>
                  <h3 style={{ fontSize: '1.25rem', color: '#4A3728', fontWeight: '800', margin: '0 0 12px 0', wordBreak: 'keep-all', lineHeight: '1.4' }}>
                    우리 관계의 진짜 속마음과<br />실전 대화법 열기
                  </h3>
                  {latestAnalysisResult?.premium_teaser && (
                    <p style={{ fontSize: '0.9rem', color: '#8A7A72', lineHeight: '1.6', marginBottom: '24px', wordBreak: 'keep-all' }}>
                      "{latestAnalysisResult.premium_teaser}"
                    </p>
                  )}
                  <button
                    onClick={handleUnlockPremium}
                    disabled={isUnlocking}
                    style={{
                      width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                      backgroundColor: '#E2725B', color: '#FFF', fontSize: '0.95rem', fontWeight: '700',
                      cursor: 'pointer', boxShadow: '0 8px 24px rgba(226,114,91,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', wordBreak: 'keep-all'
                    }}
                  >
                    {isUnlocking ? (
                      <div style={{ width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      '🔑 딥다이브 & 3단계 시나리오 해제하기 (2,900원)'
                    )}
                  </button>
                </div>
              )}

              {/* [Part 2 & Part 3] 블러 영역 */}
              <div className={!isPremiumUnlocked ? 'blur-locked' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* [Part 2] 딥다이브 에세이 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #EAE0D8', paddingBottom: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#C4A99A', letterSpacing: '2px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>DEEP-DIVE REPORT</span>
                    <h2 style={{ fontSize: '1.4rem', color: '#3A2E2A', fontWeight: '800', margin: 0 }}>심리 성장 딥다이브</h2>
                  </div>
                  
                  {/* 에세이 1 */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#D96A53', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🧩</span> 우리를 옭아맨 갈등의 톱니바퀴
                    </h3>
                    <div style={{ fontSize: '1.05rem', color: '#333', lineHeight: '1.85', margin: 0, wordBreak: 'keep-all', fontFamily: "'KoPubBatang', 'Nanum Myeongjo', serif" }}>
                      {renderFormattedText(latestAnalysisResult.premium_deepdive_report?.core_conflict_mechanism || "아직 분석된 데이터가 없습니다.")}
                    </div>
                  </div>

                  {/* 에세이 2 */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#D96A53', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🌑</span> 무의식의 그림자와 내면 아이
                    </h3>
                    <div style={{ fontSize: '1.05rem', color: '#333', lineHeight: '1.85', margin: 0, wordBreak: 'keep-all', fontFamily: "'KoPubBatang', 'Nanum Myeongjo', serif" }}>
                      {renderFormattedText(latestAnalysisResult.premium_deepdive_report?.unconscious_projection || "아직 분석된 데이터가 없습니다.")}
                    </div>
                  </div>

                  {/* 에세이 3 */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: '#D96A53', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🕯️</span> 치유를 향한 관계의 재구성
                    </h3>
                    <div style={{ fontSize: '1.05rem', color: '#333', lineHeight: '1.85', margin: 0, wordBreak: 'keep-all', fontFamily: "'KoPubBatang', 'Nanum Myeongjo', serif" }}>
                      {renderFormattedText(latestAnalysisResult.premium_deepdive_report?.healing_insight || "아직 분석된 데이터가 없습니다.")}
                    </div>
                  </div>
                </div>

                {/* [Part 3] 3단계 실전 핑퐁 대화 시나리오 */}
                {latestAnalysisResult.premium_scenario_expansion && (
                  <div style={{ backgroundColor: '#F8F9FA', borderRadius: '24px', padding: '32px 20px', border: '1px solid #E9ECEF' }}>
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#C4A99A', letterSpacing: '2px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>PRACTICE ROOM</span>
                      <h3 style={{ fontSize: '1.3rem', color: '#3A2E2A', fontWeight: '800', margin: 0 }}>악순환을 끊는 실전 대화법</h3>
                    </div>

                    <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '20px', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* 1단계 말풍선 */}
                      <div className="chat-bubble-in" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '8px' }}>
                        <button
                          className="copy-btn-chat"
                          onClick={() => {
                            if (navigator.clipboard) navigator.clipboard.writeText(latestAnalysisResult.premium_scenario_expansion?.stage_1_soft_boundary);
                            setChatToast('📋 1단계 멘트가 복사되었습니다!');
                            setTimeout(() => setChatToast(''), 2500);
                          }}
                          style={{ background: 'none', border: 'none', color: '#E2725B', opacity: 0.7, fontSize: '1.1rem', padding: '4px', flexShrink: 0, marginBottom: '4px', cursor: 'pointer' }}
                        >📋</button>
                        <div style={{ backgroundColor: '#E2725B', color: '#FFF', borderRadius: '20px 20px 4px 20px', padding: '16px 20px', maxWidth: '85%', fontSize: '0.95rem', lineHeight: '1.6', wordBreak: 'keep-all', boxShadow: '0 4px 16px rgba(226,114,91,0.3)', position: 'relative' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: '#FFD5CC', fontWeight: '800', marginBottom: '6px', letterSpacing: '0.5px' }}>1단계: 부드러운 시작</span>
                          {latestAnalysisResult.premium_scenario_expansion?.stage_1_soft_boundary}
                        </div>
                      </div>

                      {/* 상대방 반응 선택 버튼 */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedStage(2)}
                          style={{ flex: 1, padding: '12px 10px', borderRadius: '12px', border: \`1.5px solid \${selectedStage === 2 ? '#E2725B' : '#E0E0E0'}\`, backgroundColor: selectedStage === 2 ? '#FFF5F2' : '#FFF', color: selectedStage === 2 ? '#E2725B' : '#666', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', wordBreak: 'keep-all', lineHeight: '1.4' }}
                        >
                          A. {latestAnalysisResult.premium_scenario_expansion?.situational_branches?.[0]?.expected_reaction_A || '서운해하거나 오해할 때'}
                        </button>
                        <button
                          onClick={() => setSelectedStage(3)}
                          style={{ flex: 1, padding: '12px 10px', borderRadius: '12px', border: \`1.5px solid \${selectedStage === 3 ? '#5A6B8A' : '#E0E0E0'}\`, backgroundColor: selectedStage === 3 ? '#F0F4F8' : '#FFF', color: selectedStage === 3 ? '#5A6B8A' : '#666', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', wordBreak: 'keep-all', lineHeight: '1.4' }}
                        >
                          B. {latestAnalysisResult.premium_scenario_expansion?.timeout_exit_strategy?.expected_reaction_B || '비난하거나 선을 넘을 때'}
                        </button>
                      </div>

                      {/* 2단계 전개 (A 버튼 클릭 시) */}
                      {selectedStage === 2 && (
                        <div className="chat-bubble-in" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '8px', marginTop: '16px' }}>
                          <button
                            className="copy-btn-chat"
                            onClick={() => {
                              if (navigator.clipboard) navigator.clipboard.writeText(latestAnalysisResult.premium_scenario_expansion?.situational_branches?.[0]?.stage_2_cushion_response);
                              setChatToast('📋 2단계 멘트가 복사되었습니다!');
                              setTimeout(() => setChatToast(''), 2500);
                            }}
                            style={{ background: 'none', border: 'none', color: '#E2725B', opacity: 0.7, fontSize: '1.1rem', padding: '4px', flexShrink: 0, marginBottom: '4px', cursor: 'pointer' }}
                          >📋</button>
                          <div style={{ backgroundColor: '#FFF5F2', color: '#4A3728', border: '1px solid #FFD5CC', borderRadius: '20px 20px 4px 20px', padding: '16px 20px', maxWidth: '85%', fontSize: '0.95rem', lineHeight: '1.6', wordBreak: 'keep-all', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#E2725B', fontWeight: '800', marginBottom: '6px', letterSpacing: '0.5px' }}>2단계: 쿠션어로 마음 다독이기</span>
                            {latestAnalysisResult.premium_scenario_expansion?.situational_branches?.[0]?.stage_2_cushion_response}
                          </div>
                        </div>
                      )}

                      {/* 3단계 전개 (B 버튼 클릭 시) */}
                      {selectedStage === 3 && (
                        <div className="chat-bubble-in" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '8px', marginTop: '16px' }}>
                          <button
                            className="copy-btn-chat"
                            onClick={() => {
                              if (navigator.clipboard) navigator.clipboard.writeText(latestAnalysisResult.premium_scenario_expansion?.timeout_exit_strategy?.stage_3_firm_timeout);
                              setChatToast('📋 타임아웃 멘트가 복사되었습니다!');
                              setTimeout(() => setChatToast(''), 2500);
                            }}
                            style={{ background: 'none', border: 'none', color: '#5A6B8A', opacity: 0.7, fontSize: '1.1rem', padding: '4px', flexShrink: 0, marginBottom: '4px', cursor: 'pointer' }}
                          >📋</button>
                          <div style={{ backgroundColor: '#F0F4F8', color: '#2C3E50', border: '1px solid #D0DCE5', borderRadius: '20px 20px 4px 20px', padding: '16px 20px', maxWidth: '85%', fontSize: '0.95rem', lineHeight: '1.6', wordBreak: 'keep-all', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#5A6B8A', fontWeight: '800', marginBottom: '6px', letterSpacing: '0.5px' }}>3단계: 단호한 타임아웃</span>
                            {latestAnalysisResult.premium_scenario_expansion?.timeout_exit_strategy?.stage_3_firm_timeout}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}

        {/* 채팅 복사 토스트 팝업 */}
        {chatToast && (
          <div style={{ position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.85)', color: '#FFF', padding: '12px 24px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '700', zIndex: 10002, animation: 'chatIn 0.3s ease', whiteSpace: 'nowrap' }}>
            {chatToast}
          </div>
        )}
      </div>
    </>
  );
}`;
  content = content.substring(0, compStartIdx) + newComponent + content.substring(endIdx + 1);
  fs.writeFileSync('src/App.jsx', content, 'utf8');
  console.log("Component successfully replaced.");
} else {
  console.log("Could not find MonthlyAnalyticsView component to replace.");
}
