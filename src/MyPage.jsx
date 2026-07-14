import React, { useState, useEffect } from 'react';

// --- Sub-components for Scalability ---

// 1. Inner Map (나의 내면 지도)
const InnerMap = ({ formData, mbtiTrait, onboardingMbti, resourceScore }) => {
  const [gauge, setGauge] = useState(0);

  useEffect(() => {
    // Animate gauge bar on mount
    const timer = setTimeout(() => setGauge(resourceScore), 300);
    return () => clearTimeout(timer);
  }, [resourceScore]);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #FFFFFF 0%, #FDFBF7 100%)',
      borderRadius: '24px',
      padding: '28px',
      marginBottom: '24px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
      border: '1px solid #F0EDE8'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #E2725B, #ECA493)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(226,114,91,0.2)'
        }}>
          {formData?.name ? formData.name.charAt(0) : '나'}
        </div>
        <div style={{ marginLeft: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#3A2E2A', fontWeight: '800' }}>
            {formData?.name || '조재희'} 님
          </h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {onboardingMbti && (
              <span style={{ padding: '4px 10px', background: '#E8E4F2', borderRadius: '12px', fontSize: '0.75rem', color: '#6A5ACD', fontWeight: '700' }}>
                {onboardingMbti}
              </span>
            )}
            <span style={{ padding: '4px 10px', background: '#F4EDE6', borderRadius: '12px', fontSize: '0.75rem', color: '#8A7A72', fontWeight: '700' }}>
              {mbtiTrait?.name || 'INTJ'}
            </span>
            <span style={{ padding: '4px 10px', background: '#E8F0ED', borderRadius: '12px', fontSize: '0.75rem', color: '#5C7A6D', fontWeight: '700' }}>
              {mbtiTrait?.elementName || '숲의 기운'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#6A6058', fontWeight: '600' }}>오늘의 내면 자원 수치</span>
          <span style={{ fontSize: '1.2rem', color: '#E2725B', fontWeight: '800' }}>{gauge}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: '#F0EBE6', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${gauge}%`, height: '100%',
            background: 'linear-gradient(to right, #ECA493, #E2725B)',
            borderRadius: '6px', transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'anim-glow 2s infinite'
            }} />
          </div>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#A0958C', textAlign: 'center' }}>
          차곡차곡 쌓인 마음의 힘이 꽤 단단해졌어요.
        </p>
      </div>
    </div>
  );
};

// 2. Family Data Hub (우리 가족 데이터 허브)
const FamilyDataHub = () => {
  const familyMembers = [
    { id: 'm1', name: '진현 (남편)', tags: ['ISTJ', '책임감 강한 바위', '안정 추구'], color: '#7E9BA0' },
    { id: 'm2', name: '혁이 (아들)', tags: ['ENFP', '호기심 많은 불꽃', '자유로운 영혼'], color: '#E09C62' },
    { id: 'm3', name: '율이 (딸)', tags: ['ISFJ', '다정한 새싹', '공감 요정'], color: '#C17A6B' }
  ];

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#3A2E2A', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>👨‍👩‍👧‍👦</span> 우리 가족 데이터 허브
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {familyMembers.map(member => (
          <div key={member.id} style={{
            background: '#FFFFFF', borderRadius: '18px', padding: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #F5F2EF',
            display: 'flex', flexDirection: 'column',
            transition: 'transform 0.2s', cursor: 'pointer'
          }} className="family-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.05rem', color: '#4A403A', fontWeight: '800' }}>{member.name}</span>
              <button style={{ background: 'none', border: 'none', color: '#B8ABA2', cursor: 'pointer', padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {member.tags.map((tag, idx) => (
                <span key={idx} style={{
                  padding: '4px 10px',
                  background: idx === 0 ? `${member.color}15` : '#F8F6F4',
                  color: idx === 0 ? member.color : '#8A7A72',
                  borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
                  border: `1px solid ${idx === 0 ? `${member.color}30` : 'transparent'}`
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        
        {/* 추가 버튼 */}
        <button style={{
          width: '100%', padding: '16px', background: '#FAFAFA', border: '2px dashed #E0DDD8',
          borderRadius: '18px', color: '#A0958C', fontSize: '0.95rem', fontWeight: '700',
          cursor: 'pointer', transition: 'all 0.2s'
        }} className="family-add-btn">
          + 가족 구성원 추가하기
        </button>
      </div>
    </div>
  );
};

// 3. Settings (내 마음 루틴 환경 설정)
const Settings = () => {
  const [tension, setTension] = useState(() => {
    const saved = localStorage.getItem('here_tension_threshold');
    return saved ? Number(saved) : 70;
  });
  const [pushEnabled, setPushEnabled] = useState(true);
  const [kakaoEnabled, setKakaoEnabled] = useState(false);

  useEffect(() => {
    localStorage.setItem('here_tension_threshold', tension);
  }, [tension]);

  return (
    <div style={{ marginBottom: '40px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#3A2E2A', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>⚙️</span> 내 마음 루틴 환경 설정
      </h3>
      
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #F5F2EF' }}>
        
        {/* 긴장도 슬라이더 */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.95rem', color: '#4A403A', fontWeight: '700' }}>선제적 예보 민감도</span>
            <span style={{ fontSize: '0.9rem', color: '#E2725B', fontWeight: '800' }}>{tension}% 이상 알림</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#9A8E85', marginBottom: '12px', lineHeight: '1.4' }}>
            이 수치 이상의 긴장도가 예상되는 일정이 있을 때만 선제적 예보를 띄웁니다.
          </p>
          <input
            type="range" min="0" max="100" value={tension} onChange={(e) => setTension(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#E2725B', cursor: 'pointer' }}
          />
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid #F0EDE8', margin: '0 -24px 24px -24px' }} />

        {/* 알림 토글 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.95rem', color: '#4A403A', fontWeight: '700' }}>앱 푸시 알림</div>
              <div style={{ fontSize: '0.75rem', color: '#A0958C', marginTop: '4px' }}>처방전 및 위로 메시지 수신</div>
            </div>
            <ToggleSwitch isOn={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.95rem', color: '#4A403A', fontWeight: '700' }}>카카오 알림톡 수신</div>
              <div style={{ fontSize: '0.75rem', color: '#A0958C', marginTop: '4px' }}>가족 관계망 공유 알림</div>
            </div>
            <ToggleSwitch isOn={kakaoEnabled} onToggle={() => setKakaoEnabled(!kakaoEnabled)} />
          </div>
        </div>

      </div>
    </div>
  );
};

const ToggleSwitch = ({ isOn, onToggle }) => (
  <div onClick={onToggle} style={{
    width: '50px', height: '28px', borderRadius: '14px',
    background: isOn ? '#E2725B' : '#E0DDD8',
    position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
  }}>
    <div style={{
      width: '24px', height: '24px', borderRadius: '50%', background: 'white',
      position: 'absolute', top: '2px', left: isOn ? '24px' : '2px',
      transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }} />
  </div>
);


// --- Main Component ---

export default function MyPage({ formData, mbtiTrait, onboardingMbti, onBack, emotionDB }) {
  // Calculate a mock resource score based on DB length (max 100)
  const score = Math.min((emotionDB?.length || 0) * 5 + 45, 100);

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      backgroundColor: '#FDFBF7', padding: '20px', paddingBottom: '100px',
      fontFamily: '"Nanum Myeongjo", serif',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes anim-glow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .family-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; }
        .family-add-btn:hover { background: #F5F2EF !important; color: '#8A7A72' !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', paddingTop: '10px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 8px 8px 0', marginRight: '12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3A2E2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 style={{ fontSize: '1.4rem', color: '#3A2E2A', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
          내 마음 프로필
        </h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '60px' }}>
        {/* 1. 나의 내면 지도 */}
        <InnerMap formData={formData} mbtiTrait={mbtiTrait} onboardingMbti={onboardingMbti} resourceScore={score} />

        {/* 2. 우리 가족 데이터 허브 */}
        <FamilyDataHub />

        {/* 3. 내 마음 루틴 환경 설정 */}
        <Settings />
      </div>
    </div>
  );
}
