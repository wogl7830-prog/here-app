import React, { useState, useEffect, useRef } from 'react';
import { getCalendarEvents, saveCalendarEvent, deleteCalendarEvent } from './services/proactive/EventScheduler';

// --- Shared SVG Icons ---
const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const CrownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);
const JournalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF6B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const LabIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0M5.52 16h12.96" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const FlameIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const ampmOptions = [
  { val: '오전', label: '오전', icon: '🌅' },
  { val: '오후', label: '오후', icon: '🌇' },
];

// --- Sub-components ---

// 1. Inner Map (나의 내면 지도) 및 프로필 정보 통합 카드
const InnerMap = ({ formData, mbtiTrait, onboardingMbti, resourceScore, userSession, isPaid, onEditClick }) => {
  const [gauge, setGauge] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setGauge(resourceScore), 300);
    return () => clearTimeout(timer);
  }, [resourceScore]);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #FFF5F0 0%, #FFFFFF 100%)',
      borderRadius: '24px',
      padding: '28px',
      marginBottom: '20px',
      boxShadow: '0 10px 40px rgba(255, 107, 74, 0.15)',
      border: '1px solid rgba(255, 107, 74, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B4A, #FFA38F)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(255, 107, 74, 0.2)',
          flexShrink: 0
        }}>
          {userSession?.displayName ? userSession.displayName.charAt(0) : (formData?.name ? formData.name.charAt(0) : '나')}
        </div>
        
        <div style={{ marginLeft: '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#333333', fontWeight: '800' }}>
              {userSession?.displayName || formData?.name || '나'} 님
            </h2>
            <button onClick={onEditClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#BBA898', display: 'flex', alignItems: 'center' }}>
              <PencilIcon />
            </button>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', 
              background: isPaid ? '#FFF5F0' : '#F5F5F5', 
              color: isPaid ? '#FF6B4A' : '#777777', border: isPaid ? '1px solid #FFCDC0' : '1px solid #E5E5E5' 
            }}>
              {isPaid ? <CrownIcon /> : null} {isPaid ? '프리미엄 회원' : '무료 회원'}
            </span>
          </div>

          {userSession?.email && (
            <div style={{ fontSize: '0.85rem', color: '#777777', marginBottom: '8px' }}>
              {userSession.email}
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {onboardingMbti && (
              <span style={{ padding: '4px 12px', background: '#F5F5F5', borderRadius: '12px', fontSize: '0.8rem', color: '#555555', fontWeight: '700' }}>
                {onboardingMbti}
              </span>
            )}
            {mbtiTrait?.name && (
              <span style={{ padding: '4px 12px', background: '#F5F5F5', borderRadius: '12px', fontSize: '0.8rem', color: '#555555', fontWeight: '700' }}>
                {mbtiTrait.name}
              </span>
            )}
            {mbtiTrait?.elementName && (
              <span style={{ padding: '4px 12px', background: '#F5F5F5', borderRadius: '12px', fontSize: '0.8rem', color: '#555555', fontWeight: '700' }}>
                {mbtiTrait.elementName}
              </span>
            )}
          </div>

          {!isPaid && (
            <div style={{ marginTop: '12px' }}>
              <button style={{
                background: 'none', border: 'none', color: '#FF6B4A', fontSize: '0.85rem', fontWeight: '800',
                textDecoration: 'underline', cursor: 'pointer', padding: 0
              }}>
                프리미엄 업그레이드 ➔
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#777777', fontWeight: '600' }}>오늘의 내면 자원 수치</span>
          <span style={{ fontSize: '1.2rem', color: '#FF6B4A', fontWeight: '800' }}>{gauge}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: '#E5E5E5', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${gauge}%`, height: '100%',
            background: 'linear-gradient(to right, #FFA38F, #FF6B4A)',
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
        <p style={{ margin: '14px 0 0', fontSize: '0.8rem', color: '#999999', textAlign: 'center' }}>
          차곡차곡 쌓인 마음의 힘이 꽤 단단해졌어요.
        </p>
      </div>
    </div>
  );
};

const FamilyDataHub = ({ familyMembers }) => {
  const safeMembers = Array.isArray(familyMembers) ? familyMembers : [];

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.1rem', color: '#333333', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', color: '#FF6B4A', display: 'flex' }}><UsersIcon /></span> 우리 가족 데이터 허브
      </h3>
      
      {safeMembers.length > 0 && (
        <div 
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          className="hide-scrollbar" 
          style={{ 
            display: 'flex', flexDirection: 'row', gap: '14px', 
            overflowX: 'auto', scrollSnapType: 'x mandatory', 
            paddingBottom: '16px', marginRight: '-20px', paddingRight: '20px',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {safeMembers.map(member => (
            <div key={member.id || Math.random()} className="family-card" style={{
              flex: '0 0 auto', width: '280px', height: '100%', minHeight: '140px', scrollSnapAlign: 'start',
              background: '#FFFFFF', borderRadius: '18px', padding: '20px', boxSizing: 'border-box',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E5E5E5',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.05rem', color: '#333333', fontWeight: '800' }}>{member.name || '가족 구성원'}</span>
                <button style={{ background: 'none', border: 'none', color: '#999999', padding: '4px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {member.mbti && (
                  <span style={{
                    padding: '4px 10px',
                    background: '#F5F5F5',
                    color: '#555555',
                    borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800',
                  }}>
                    {member.mbti}
                  </span>
                )}
                {(Array.isArray(member.tags) ? member.tags : []).map((tag, idx) => {
                  const isPrimary = !member.mbti && idx === 0;
                  return (
                    <span key={idx} style={{
                      padding: '4px 10px',
                      background: '#F5F5F5',
                      color: isPrimary ? '#333333' : '#777777',
                      borderRadius: '8px', fontSize: '0.75rem', fontWeight: isPrimary ? '800' : '600',
                    }}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 가로형 빈 상태 / 추가 배너 */}
      <div 
        className="family-add-btn"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '16px',
          padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
          marginTop: safeMembers.length > 0 ? '0' : '0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#999999', display: 'flex' }}><PlusIcon /></div>
          <span style={{ color: '#777777', fontSize: '0.95rem', fontWeight: '600' }}>
            {safeMembers.length > 0 ? '새로운 가족 추가하기' : '아직 등록된 가족이 없어요'}
          </span>
        </div>
        <span style={{ color: '#FF6B4A', fontSize: '0.9rem', fontWeight: '700' }}>추가하기</span>
      </div>
    </div>
  );
};

// 3. Settings (내 마음 루틴 환경 설정)
const Settings = ({ onTriggerAlimtalk }) => {
  const [tension, setTension] = useState(() => {
    const saved = localStorage.getItem('here_tension_threshold');
    return saved ? Number(saved) : 70;
  });

  useEffect(() => {
    localStorage.setItem('here_tension_threshold', tension);
  }, [tension]);

  let tensionDescription = '';
  if (tension < 50) {
    tensionDescription = '미세한 스트레스 예보까지 섬세하게 미리 챙겨드려요.';
  } else if (tension <= 80) {
    tensionDescription = '가장 적절한 타이밍에 마음의 대비를 하도록 도와드려요.';
  } else {
    tensionDescription = '강한 긴장과 스트레스가 예상될 때만 든든하게 멘탈 방패를 씌워드려요.';
  }

  return (
    <div>
      <h3 style={{ fontSize: '1.1rem', color: '#333333', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', color: '#FF6B4A', display: 'flex' }}><GearIcon /></span> 내 마음 루틴 환경 설정
      </h3>
      
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #E5E5E5' }}>
        
        {/* 긴장도 슬라이더 */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.95rem', color: '#333333', fontWeight: '700' }}>선제적 예보 민감도</span>
            <span style={{ fontSize: '0.9rem', color: '#FF6B4A', fontWeight: '800' }}>{tension}% 이상 알림</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#777777', marginBottom: '12px', lineHeight: '1.4' }}>
            {tensionDescription}
          </p>
          <input
            type="range" min="0" max="100" value={tension} onChange={(e) => setTension(Number(e.target.value))}
            className="tension-slider"
            style={{ 
              width: '100%', cursor: 'pointer',
              accentColor: '#FF6B4A',
              background: `linear-gradient(to right, #FF6B4A 0%, #FF6B4A ${tension}%, #E5E5E5 ${tension}%, #E5E5E5 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ isOn, onToggle }) => (
  <div onClick={onToggle} style={{
    width: '50px', height: '28px', borderRadius: '14px',
    background: isOn ? '#FF6B4A' : '#E5E5E5',
    position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
  }}>
    <div style={{
      width: '24px', height: '24px', borderRadius: '50%', background: 'white',
      position: 'absolute', top: '2px', left: isOn ? '24px' : '2px',
      transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
    }} />
  </div>
);


const GoogleCalendarSection = () => {
  const [isCalendarConnected, setIsCalendarConnected] = useState(
    () => localStorage.getItem('here_calendar_connected') === 'true'
  );
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [mockEvents, setMockEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTension, setNewEventTension] = useState(75);
  const [newEventCategory, setNewEventCategory] = useState('work');

  useEffect(() => {
    setMockEvents(getCalendarEvents());
  }, []);

  const handleConnectToggle = () => {
    if (isCalendarConnected) {
      localStorage.setItem('here_calendar_connected', 'false');
      setIsCalendarConnected(false);
    } else {
      setShowOAuthModal(true);
    }
  };

  const handleOAuthApprove = () => {
    setIsOAuthLoading(true);
    setTimeout(() => {
      setIsOAuthLoading(false);
      setShowOAuthModal(false);
      localStorage.setItem('here_calendar_connected', 'true');
      setIsCalendarConnected(true);
    }, 1200); 
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const updated = saveCalendarEvent({
      title: newEventTitle,
      tensionWeight: parseInt(newEventTension),
      category: newEventCategory,
      time: '15:30' 
    });
    setMockEvents(updated);
    setNewEventTitle('');
  };

  const handleDeleteEvent = (id) => {
    const updated = deleteCalendarEvent(id);
    setMockEvents(updated);
  };

  return (
    <>
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px 20px', borderRadius: '20px', border: '1px solid #E5E5E5', marginTop: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#FF6B4A', display: 'flex' }}><CalendarIcon /></span> Google 캘린더 연동 설정
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: isCalendarConnected ? '#FFF5F0' : '#F5F5F5',
            color: isCalendarConnected ? '#FF6B4A' : '#999999'
          }}>
            {isCalendarConnected ? '● 연동 완료' : '○ 미연동'}
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#777777', lineHeight: '1.6', margin: '0 0 20px 0', wordBreak: 'keep-all' }}>
          구글 캘린더 일정을 자동으로 스캔하여 고긴장도 업무, 미팅, 집안 대소사가 다가오기 전 다정하게 노크해 마음의 방패를 장착하도록 안내해 드려요.
        </p>

        <button
          onClick={handleConnectToggle}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: isCalendarConnected ? '1px solid #E5E5E5' : 'none',
            backgroundColor: isCalendarConnected ? '#FFFFFF' : '#FF6B4A',
            color: isCalendarConnected ? '#333333' : '#FFFFFF',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          {isCalendarConnected ? '구글 캘린더 연동 해제하기' : 'Google 계정으로 연동하기'}
        </button>

        {isCalendarConnected && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #E5E5E5' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#333333', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ color: '#999999', display: 'flex' }}><LabIcon /></span> 행동 예보 시뮬레이션 연구소 (QA)
            </span>

            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                placeholder="가상 일정 입력 (예: 팀장님 면담, 시댁 제사)"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E5E5', boxSizing: 'border-box', outline: 'none', fontSize: '0.85rem' }}
              />

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={newEventCategory} onChange={e => setNewEventCategory(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E5E5E5', outline: 'none', backgroundColor: '#FFF', fontSize: '0.85rem' }}>
                  <option value="work">업무/회의</option>
                  <option value="family">가족/대소사</option>
                </select>

                <div style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#777777', whiteSpace: 'nowrap', fontWeight: 'bold' }}>긴장도: {newEventTension}</span>
                  <input
                    type="range"
                    min="30" max="100"
                    value={newEventTension}
                    onChange={e => setNewEventTension(e.target.value)}
                    style={{ flex: 1, accentColor: '#FF6B4A', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'rgba(255, 107, 74, 0.05)', color: '#FF6B4A', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <PlusIcon /> 일정 등록 및 즉시 예보 반영
              </button>
            </form>

            <div style={{ marginTop: '16px', maxHeight: '180px', overflowY: 'auto' }}>
              {(Array.isArray(mockEvents) ? mockEvents : []).map(ev => (
                <div key={ev.id || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#F9F9F9', borderRadius: '8px', marginBottom: '8px', border: '1px solid #E5E5E5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#999999', display: 'flex' }}>
                      {ev.category === 'work' ? <BriefcaseIcon /> : <HomeIcon />}
                    </span>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333333' }}>{ev.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#999999', marginLeft: '6px' }}>({ev.category === 'work' ? '업무' : '가족'})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: ev.tensionWeight >= 70 ? '#FF6B4A' : '#999999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FlameIcon /> {ev.tensionWeight}
                    </span>
                    <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: '#999999', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', padding: '0 4px' }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showOAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', fontFamily: 'sans-serif' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: '40px', height: '40px', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#333333', margin: '0 0 8px 0', fontWeight: '800' }}>Google 계정으로 로그인</h3>
            <p style={{ fontSize: '0.85rem', color: '#777777', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              <strong>H.E.R.e</strong>가 사용자의 구글 캘린더 일정을 조회하고 긴장도를 스캔하도록 허용하시겠습니까?
            </p>

            {isOAuthLoading ? (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', border: '2.5px solid #F5F5F5', borderTop: '2.5px solid #FF6B4A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: '0.8rem', color: '#FF6B4A', fontWeight: '600' }}>캘린더 정보 안전 동기화 중...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={handleOAuthApprove} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#1A73E8', color: '#FFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                  허용 및 동기화 시작
                </button>
                <button onClick={() => setShowOAuthModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E5E5', backgroundColor: '#FFF', color: '#333333', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// --- Main Component ---

export default function MyPage({ formData = {}, setFormData, mbtiTrait = {}, onboardingMbti = '', onBack, emotionDB = [], userSession = null, onLogout, familyDB = [], onTriggerAlimtalk, onGoToJournal }) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({});
  const safeEmotionDB = Array.isArray(emotionDB) ? emotionDB : [];
  const score = Math.min(safeEmotionDB.length * 5 + 45, 100);
  const isPaid = new URLSearchParams(window.location.search).get('boundaryPayment') === 'success' || new URLSearchParams(window.location.search).get('payment') === 'success';

  const handleLogout = () => {
    if (onLogout) {
      onLogout(); 
      return;
    }
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    alert('로그아웃 되었습니다.');
    window.location.href = '/';
  };

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      backgroundColor: '#FAFAFA', padding: '20px', paddingBottom: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes anim-glow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .family-card { transform: translateY(0); transition: all 0.2s ease; cursor: pointer; }
        .family-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important; }
        .family-add-btn:hover { background: #F5F5F5 !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 8px 8px 0', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <h1 style={{ fontSize: '1.4rem', color: '#333333', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', lineHeight: '1' }}>
              내 마음의 방
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#888888', fontWeight: '400', letterSpacing: '-0.2px' }}>
              나의 정보와 마음 루틴을 관리하는 곳
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* GROUP 1: SELF */}
        <div style={{ fontSize: '0.75rem', color: '#999999', letterSpacing: '1px', fontWeight: '700', marginBottom: '16px' }}>SELF · REFLECTION</div>
        <InnerMap 
          formData={formData} 
          mbtiTrait={mbtiTrait} 
          onboardingMbti={onboardingMbti} 
          resourceScore={score} 
          userSession={userSession} 
          isPaid={isPaid}
          onEditClick={() => {
            setEditData({
              name: formData.name || '',
              year: formData.year || '',
              month: formData.month || '',
              day: formData.day || '',
              ampm: formData.ampm || '오전',
              hour: formData.hour || '',
            });
            setIsEditingProfile(true);
          }}
        />

        <div
          onClick={onGoToJournal}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5',
            borderRadius: '20px', padding: '20px 22px',
            cursor: onGoToJournal ? 'pointer' : 'default',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #FFF5F0, #FFFFFF)',
              border: '1px solid rgba(255, 107, 74, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <JournalIcon />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#333333', marginBottom: '2px' }}>마음 저널</div>
              <div style={{ fontSize: '0.8rem', color: '#777777' }}>
                수집된 문장 {safeEmotionDB.length}개 · 전체 기록 타임라인
              </div>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>

        {/* GROUP 2: FAMILY */}
        <div style={{ fontSize: '0.75rem', color: '#999999', letterSpacing: '1px', fontWeight: '700', marginBottom: '16px', marginTop: '48px' }}>FAMILY · CONNECTION</div>
        <FamilyDataHub familyMembers={familyDB} />

        {/* GROUP 3: SETTINGS */}
        <div style={{ fontSize: '0.75rem', color: '#999999', letterSpacing: '1px', fontWeight: '700', marginBottom: '16px', marginTop: '48px' }}>SETTINGS · PREFERENCES</div>
        <Settings onTriggerAlimtalk={onTriggerAlimtalk} />
        {/* <GoogleCalendarSection /> - 기능 미구현으로 임시 숨김 */}

        {/* Footer & Logout */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
          <button 
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: '#999999', fontSize: '0.85rem',
              textDecoration: 'underline', cursor: 'pointer', padding: '10px', marginBottom: '20px'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 프로필 수정 모달 */}
      {isEditingProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeIn 0.3s ease',
          padding: '20px'
        }}>
          <div className="onb-card" style={{ width: '100%', maxWidth: '400px', margin: 0, maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#FDFBF7', padding: '30px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}>
            <style>{`
              .onb-label { font-size: 0.8rem; font-weight: 700; color: #B08070; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; display: block; }
              .onb-input { width: 100%; padding: 13px 16px; border-radius: 14px; border: none; background: #F9F4EF; font-size: 1rem; color: #4A3728; font-family: inherit; outline: none; box-sizing: border-box; transition: background 0.2s; }
              .onb-input:focus { background: #F3EBE3; }
              .onb-input::placeholder { color: #C8B8A8; }
              .ampm-pill { flex: 1; padding: 11px 6px; border-radius: 12px; border: 1.5px solid #E8DDD5; background: #F9F4EF; color: #9A8070; font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s ease; text-align: center; line-height: 1.5; }
              .ampm-pill:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
              .ampm-pill.active { background: #E2725B; border-color: #E2725B; color: white; box-shadow: 0 3px 10px rgba(226,114,91,0.22); }
              .onb-enter-btn { width: 100%; padding: 18px; border-radius: 16px; border: none; background: linear-gradient(135deg, #E8855A 0%, #D05A42 100%); color: white; font-size: 1.05rem; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.5px; box-shadow: 0 6px 20px rgba(208,90,66,0.25); transition: all 0.3s ease; margin-top: 4px; }
              .onb-enter-btn:hover { box-shadow: 0 8px 24px rgba(208,90,66,0.35); transform: translateY(-1px); }
            `}</style>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#333333', fontWeight: '800', textAlign: 'center' }}>나의 정보 수정</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 이름 */}
              <div>
                <span className="onb-label">이름 <span style={{color: '#E2725B'}}>*</span></span>
                <input
                  className="onb-input"
                  placeholder="어떻게 불러드릴까요?"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>

              {/* 생년월일 */}
              <div>
                <span className="onb-label">태어난 날 <span style={{color: '#E2725B'}}>*</span></span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="onb-input"
                    style={{ flex: 2, textAlign: 'center', appearance: 'none', cursor: 'pointer' }}
                    value={editData.year || ''}
                    onChange={(e) => {
                      const newYear = e.target.value;
                      let newDay = editData.day;
                      if (newYear && editData.month && newDay) {
                        const maxDays = new Date(parseInt(newYear), parseInt(editData.month), 0).getDate();
                        if (parseInt(newDay) > maxDays) newDay = maxDays.toString();
                      }
                      setEditData({ ...editData, year: newYear, day: newDay });
                    }}
                  >
                    <option value="">연도</option>
                    {Array.from({length: new Date().getFullYear() - 1930 + 1}, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    className="onb-input"
                    style={{ flex: 1, textAlign: 'center', appearance: 'none', cursor: 'pointer' }}
                    value={editData.month || ''}
                    onChange={(e) => {
                      const newMonth = e.target.value;
                      let newDay = editData.day;
                      if (editData.year && newMonth && newDay) {
                        const maxDays = new Date(parseInt(editData.year), parseInt(newMonth), 0).getDate();
                        if (parseInt(newDay) > maxDays) newDay = maxDays.toString();
                      }
                      setEditData({ ...editData, month: newMonth, day: newDay });
                    }}
                  >
                    <option value="">월</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                  <select
                    className="onb-input"
                    style={{ flex: 1, textAlign: 'center', appearance: 'none', cursor: 'pointer' }}
                    value={editData.day || ''}
                    onChange={(e) => setEditData({ ...editData, day: e.target.value })}
                  >
                    <option value="">일</option>
                    {Array.from({length: (!editData.year || !editData.month || editData.year === '연도' || editData.month === '월') ? 31 : new Date(parseInt(editData.year), parseInt(editData.month), 0).getDate()}, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 태어난 시간 */}
              <div>
                <span className="onb-label">태어난 시간 <span style={{fontSize: '0.7rem', color: '#9A8070', fontWeight: 'normal'}}>(선택)</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {ampmOptions.slice(0, 2).map(opt => (
                      <button
                        key={opt.val}
                        className={`ampm-pill${editData.ampm === opt.val ? ' active' : ''}`}
                        onClick={() => setEditData({ ...editData, ampm: opt.val })}
                        style={{ flex: 1 }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {(editData.ampm === '오전' || editData.ampm === '오후') && (
                      <div style={{ flex: 1.2, animation: 'fadeIn 0.3s ease' }}>
                        <select
                          className="onb-input"
                          style={{
                            textAlign: 'center', appearance: 'none', cursor: 'pointer',
                            border: editData.hour ? '1.5px solid #E8DDD5' : '1.5px solid #E2725B', 
                            background: editData.hour ? '#F9F4EF' : '#FFF5EE', 
                            color: editData.hour ? '#4A3728' : '#E2725B', 
                            fontWeight: editData.hour ? 'normal' : 'bold',
                            animation: editData.hour ? 'none' : 'pulseBorder 2s infinite',
                            padding: '11px 16px',
                          }}
                          value={editData.hour || ''}
                          onChange={(e) => setEditData({ ...editData, hour: e.target.value })}
                        >
                          <option value="">시각 선택</option>
                          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}시</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  {ampmOptions.slice(2).map(opt => (
                    <button
                      key={opt.val}
                      className={`ampm-pill${editData.ampm === opt.val ? ' active' : ''}`}
                      onClick={() => setEditData({ ...editData, ampm: opt.val, hour: '' })}
                      style={{ width: '100%' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button 
                style={{ flex: 1, padding: '16px 0', borderRadius: '16px', backgroundColor: '#F5F5F5', color: '#777777', border: 'none', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
                onClick={() => setIsEditingProfile(false)}
              >
                취소
              </button>
              <button 
                className="onb-enter-btn"
                style={{ flex: 2, padding: '16px 0', margin: 0, marginTop: 0 }}
                onClick={() => {
                  if (!editData.name || editData.name.trim() === '') {
                    alert('이름을 입력해주세요.');
                    return;
                  }
                  if (!editData.year || editData.year === '연도' || !editData.month || editData.month === '월' || !editData.day || editData.day === '일') {
                    alert('생년월일을 모두 선택해주세요.');
                    return;
                  }
                  const updated = { ...formData, ...editData };
                  if (setFormData) setFormData(updated);
                  localStorage.setItem('here_my_info', JSON.stringify({
                    name: updated.name, year: updated.year, month: updated.month, day: updated.day,
                    ampm: updated.ampm, hour: updated.hour
                  }));
                  setIsEditingProfile(false);
                }}
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
