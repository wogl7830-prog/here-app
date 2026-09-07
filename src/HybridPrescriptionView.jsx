import React, { useState, useEffect } from 'react';
import { sendPromptToGemini } from './services/aiEngine';

const EmotionData = {
  '가슴이 답답하고 숨이 막혀요': {
    reply: '어떤 결과가 나올지 몰라 마음이 한껏 웅크러든 상태군요.\n긴장을 풀어줄 부드러운 전환이 필요해요.',
    routineName: '숨 고르기 모드',
    icon: '🌪️',
    duration: 15
  },
  '어디서부터 해야 할지 막막해요': {
    reply: '어디서부터 손을 대야 할지 길이 보이지 않는군요.\n작은 한 걸음을 위한 환기가 필요해요.',
    routineName: '한 걸음 내딛기 모드',
    icon: '🧭',
    duration: 15
  },
  '모든 에너지가 고갈된 것 같아요': {
    reply: '모든 에너지를 다 써버려 고갈된 기분이군요.\n아무것도 하지 않고 온전히 쉬는 호흡이 필요해요.',
    routineName: '온전한 충전 모드',
    icon: '🪫',
    duration: 15
  }
};

export default function HybridPrescriptionView({ onBack, userName = '당신' }) {
  const [phase, setPhase] = useState(1);
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customEmotion, setCustomEmotion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  
  // 페이즈 2 타이머 로직
  useEffect(() => {
    let timer;
    if (phase === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 2 && timeLeft === 0) {
      setTimeout(() => {
        setPhase(3);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleCustomSubmit = async () => {
    if (!customEmotion.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `당신은 ${userName} 님을 존중하고 따뜻하게 안아주는 전문 심리 상담가입니다. ${userName} 님의 현재 감정 상태는 "${customEmotion}"이며, 이 감정의 강도는 100점 만점에 ${intensity}점입니다. 이 감정을 분석해서 따뜻하고 섬세한 위로의 말(reply)과 추천 호흡 루틴 이름(routineName), 그리고 적절한 호흡 가이드 시간(breathingDuration, 기본 15초이나 강도가 70 이상이면 20~30초 사이로 설정)을 JSON 형식으로 반환해 주세요. 응답은 반드시 JSON 객체만 포함해야 합니다. 예시: { "reply": "...", "routineName": "...", "breathingDuration": 20 }`;

      // sendPromptToGemini → Render 백엔드 → Gemini API
      const resultObj = await sendPromptToGemini(prompt);

      setAiResult({
        reply: resultObj.reply,
        routineName: resultObj.routineName,
        duration: resultObj.breathingDuration || (intensity >= 70 ? 25 : 15)
      });
      setSelectedEmotion('custom');
    } catch (error) {
      console.error('AI 분석 에러:', error);
      // Fallback
      setAiResult({
        reply: `${userName} 님의 감정을 온전히 받아들이고 있어요.\n잠시 깊은 호흡으로 마음을 다독여볼까요?`,
        routineName: '맞춤형 위로 모드',
        duration: intensity >= 70 ? 25 : 15
      });
      setSelectedEmotion('custom');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const emotionInfo = selectedEmotion === 'custom' ? aiResult : EmotionData[selectedEmotion];

  const handleStartBreathing = () => {
    setTimeLeft(emotionInfo.duration || 15);
    setPhase(2);
  };

  // Thermometer color logic
  const getIntensityColor = (val) => {
    if (val < 40) return '#4CAF50'; // Green (Mild)
    if (val < 70) return '#FF9800'; // Orange (Moderate)
    return '#E2725B'; // Red (Intense)
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeInFadeOut {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes deepBreathing {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.6); opacity: 0.2; }
            100% { transform: scale(1); opacity: 0.7; }
          }
          @keyframes warmGlow {
            0% { background: radial-gradient(circle at center, rgba(253,242,240,0) 0%, rgba(255,255,255,0) 100%); }
            50% { background: radial-gradient(circle at center, rgba(253,242,240,1) 0%, rgba(255,245,235,1) 50%, rgba(255,255,255,1) 100%); }
            100% { background: radial-gradient(circle at center, rgba(253,242,240,0.6) 0%, rgba(255,255,255,0) 100%); }
          }
          @keyframes particleFloat {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            20% { opacity: 0.8; }
            100% { transform: translateY(-100px) rotate(45deg); opacity: 0; }
          }
          @keyframes pulseLight {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          .anim-fade {
            animation: fadeInFadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          .anim-breathing {
            animation: deepBreathing 4s ease-in-out infinite;
          }
          .anim-glow {
            animation: warmGlow 3s ease-in-out forwards;
          }
          .loading-pulse {
            animation: pulseLight 1.5s infinite;
          }
          
          /* Custom Slider styling */
          input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            margin-top: -10px;
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            cursor: pointer;
            background: #E0E0E0;
            border-radius: 4px;
          }
        `}
      </style>

      {/* 상단 헤더 */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#D8D8D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div style={styles.contentArea}>
        {/* Phase 1: 감정 선택 */}
        {phase === 1 && (
          <div className="anim-fade" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#4A4A4A', fontWeight: '800', marginBottom: '8px', textAlign: 'center', wordBreak: 'keep-all', lineHeight: '1.4' }}>
              {userName && userName !== '당신' ? `${userName} 님, 오늘 마음의 여유는 어느 정도인가요? 🌿` : '오늘 마음의 여유는 어느 정도인가요? 🌿'}
            </h2>
            
            {/* Emotion Thermometer */}
            <div style={{ width: '100%', maxWidth: '300px', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: getIntensityColor(intensity), marginBottom: '12px' }}>
                {intensity < 25 ? '여유가 전혀 없어요 🌧️' : intensity < 50 ? '조금 지쳐있어요 ☁️' : intensity < 75 ? '나름 평온해요 🌿' : '마음의 여유가 넘쳐요 ✨'} ({intensity})
              </span>
              <div style={{ position: 'relative', width: '100%', height: '6px', borderRadius: '4px', background: `linear-gradient(to right, ${getIntensityColor(intensity)} ${intensity}%, #E0E0E0 ${intensity}%)` }}>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={intensity} 
                  onChange={(e) => setIntensity(Number(e.target.value))} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '-9px',
                  left: `calc(${intensity}% - 12px)`,
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: `2px solid ${getIntensityColor(intensity)}`,
                  pointerEvents: 'none'
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px', fontSize: '0.8rem', color: '#888' }}>
                <span>여유 없음</span>
                <span>여유 가득</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', color: '#666', fontWeight: '700', marginBottom: '16px' }}>가장 가까운 감정을 골라주세요</h3>

            {!isCustomMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
                {Object.keys(EmotionData).map(emotion => (
                  <button
                    key={emotion}
                    onClick={() => { setSelectedEmotion(emotion); setAiResult(null); setIsCustomMode(false); }}
                    style={{
                      ...styles.emotionChip,
                      backgroundColor: selectedEmotion === emotion ? '#FDF2F0' : '#F9F9F9',
                      color: selectedEmotion === emotion ? '#E2725B' : '#555',
                      border: selectedEmotion === emotion ? '1.5px solid #E2725B' : '1.5px solid transparent',
                      transform: selectedEmotion === emotion ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: selectedEmotion === emotion ? '0 4px 16px rgba(226,114,91,0.15)' : '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem', marginRight: '10px' }}>{EmotionData[emotion].icon}</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>{emotion}</span>
                  </button>
                ))}
                <button
                  onClick={() => { setIsCustomMode(true); setSelectedEmotion(''); }}
                  style={{
                    ...styles.emotionChip,
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    border: '1.5px dashed #D1D5DB',
                    marginTop: '8px'
                  }}
                >
                  <span style={{ fontSize: '1.05rem', fontWeight: '700' }}>✏️ 직접 입력하기</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px' }}>
                <textarea
                  value={customEmotion}
                  onChange={(e) => setCustomEmotion(e.target.value)}
                  placeholder={`${userName} 님의 감정을 편하게 적어주세요...`}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid #D1D5DB',
                    fontSize: '1rem',
                    resize: 'none',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    backgroundColor: '#FAFAFA',
                    fontFamily: 'inherit'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsCustomMode(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#6B7280', fontWeight: '700' }}>
                    취소
                  </button>
                  <button onClick={handleCustomSubmit} disabled={isAnalyzing || !customEmotion.trim()} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#E2725B', color: '#FFF', fontWeight: '700', opacity: (isAnalyzing || !customEmotion.trim()) ? 0.7 : 1 }}>
                    {isAnalyzing ? '분석 중...' : '마음 보내기'}
                  </button>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="loading-pulse" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✨</div>
                <p style={{ color: '#888', fontWeight: '600' }}>AI가 {userName} 님의 마음을 읽고 있어요...</p>
              </div>
            )}

            {selectedEmotion && emotionInfo && !isAnalyzing && (
              <div className="anim-fade" style={{ marginTop: '40px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '0.95rem', color: '#6B4C3B', textAlign: 'center', lineHeight: '1.6', wordBreak: 'keep-all', fontWeight: '600', backgroundColor: '#FDF2F0', padding: '20px 24px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 8px 24px rgba(226,114,91,0.1)' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>💬</p>
                  {emotionInfo.reply.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                </div>
                <button onClick={handleStartBreathing} style={styles.primaryBtn}>
                  {emotionInfo.routineName} 시작하기 ({emotionInfo.duration}초)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: 호흡 유도 타이머 */}
        {phase === 2 && (
          <div className="anim-fade" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', transform: 'translateY(-40px)' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#4A4A4A', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
              {emotionInfo.routineName}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#888', marginBottom: '60px', textAlign: 'center', wordBreak: 'keep-all' }}>
              원의 움직임에 맞춰 천천히 호흡을 따라 해보세요.
            </p>
            
            <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="anim-breathing" style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: getIntensityColor(intensity), opacity: 0.5, pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#FFFFFF', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <span style={{ fontSize: '1.8rem', color: getIntensityColor(intensity), fontWeight: '800' }}>{timeLeft > 0 ? timeLeft : '완료!'}</span>
              </div>
            </div>
            
            <p className="anim-fade" style={{ marginTop: '60px', fontSize: '1.2rem', color: getIntensityColor(intensity), fontWeight: '700', letterSpacing: '0.5px' }}>
              {timeLeft % 4 >= 2 ? '들이마시고...' : '내쉬고...'}
            </p>
          </div>
        )}

        {/* Phase 3: 자원 적립 및 축하 */}
        {phase === 3 && (
          <div className="anim-glow" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10 }}>
            {/* 파티클 효과용 엘리먼트 */}
            <div style={{ position: 'absolute', top: '30%', left: '20%', width: '12px', height: '12px', borderRadius: '50%', background: '#F8B195', animation: 'particleFloat 3s ease-in infinite' }} />
            <div style={{ position: 'absolute', top: '60%', right: '25%', width: '10px', height: '10px', borderRadius: '50%', background: '#F67280', animation: 'particleFloat 4s ease-in infinite 1s' }} />
            <div style={{ position: 'absolute', top: '40%', left: '80%', width: '14px', height: '14px', borderRadius: '50%', background: '#C06C84', animation: 'particleFloat 3.5s ease-in infinite 0.5s' }} />

            <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 11, textAlign: 'center', transform: 'translateY(-20px)' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(226,114,91,0.25)', marginBottom: '24px' }}>
                <span style={{ fontSize: '3rem' }}>🛡️</span>
              </div>
              <h2 style={{ fontSize: '1.8rem', color: '#E2725B', fontWeight: '900', marginBottom: '16px', letterSpacing: '-0.5px', wordBreak: 'keep-all' }}>
                오늘의 마음 방패<br/>장착 완료!
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#666', fontWeight: '700', backgroundColor: '#FFFFFF', padding: '14px 32px', borderRadius: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '50px' }}>
                ✨ +1 심리 자원 적립
              </p>

              <button onClick={onBack} style={{ ...styles.primaryBtn, width: '100%', maxWidth: '240px' }}>
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100vh',
    backgroundColor: '#FCFCFC',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9999,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    height: '60px',
    zIndex: 20
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#F0F0F0',
    transition: 'background-color 0.2s',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: '10px'
  },
  emotionChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px 20px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  primaryBtn: {
    padding: '18px 32px',
    borderRadius: '24px',
    backgroundColor: '#E2725B',
    color: '#FFFFFF',
    fontSize: '1.1rem',
    fontWeight: '800',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(226,114,91,0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }
};
