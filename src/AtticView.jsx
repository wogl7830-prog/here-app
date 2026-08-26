import React, { useState, useEffect, useRef } from 'react';
import { fetchCounselingReply } from './services/aiEngine';

// 3인의 AI 마음 메이트 프로필 데이터 ([세트 2: 전문 상담사형] 해밀, 온솔, 그루)
const COUNSELORS = [
  {
    id: 'inner',
    name: '나의 마음 상담사',
    tag: '개인 심리 케어',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B85C4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    color: '#FF8A75',
    badgeColor: '#FF8A75',
    bgColor: 'rgba(255, 138, 117, 0.18)',
    borderColor: 'rgba(255, 138, 117, 0.4)',
    highlightColor: '#B85C4A',
    cardBg: '#FBF1EE',
    desc: '내면아이 상처를 보듬는 1:1 심리 전문 상담사'
  },
  {
    id: 'family',
    name: '가족 코치',
    tag: '가족/양육 코칭',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A5C48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    color: '#FBBF24',
    badgeColor: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    highlightColor: '#7A5C48',
    cardBg: '#FAF5F0',
    desc: '가족 간 역동을 이해하고 건강한 소통을 돕는 코치'
  },
  {
    id: 'relation',
    name: '관계 & 부부 멘토',
    tag: '대인관계/부부 케어',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E5B7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a2.12 2.12 0 1 0 3-3L15 9l-1.25-1.25a2 2 0 0 0-2.83 0l-3.5 3.5a2 2 0 0 0 0 2.83L11 17"/><path d="m4.84 15.58-.84-.84a2 2 0 0 1 0-2.83L7 9l2.75 2.75L11 14"/><path d="m12.5 7.5 4-4a2 2 0 0 1 2.83 2.83l-4 4"/><path d="M11 11 8.5 8.5a2.12 2.12 0 1 0-3 3L8 14"/></svg>,
    color: '#A5B4FC',
    badgeColor: '#A5B4FC',
    bgColor: 'rgba(165, 180, 252, 0.18)',
    borderColor: 'rgba(165, 180, 252, 0.4)',
    highlightColor: '#2E5B7A',
    cardBg: '#EEF4F9',
    desc: '깊은 공감과 건강한 경계를 세우는 관계 멘토'
  }
];

// 3대 다정한 오프닝 심리학적 개별 문구 생성기
const getCounselorWelcome = (id, targetName, hasTodayRecord, hasPastRecord, pastSummary, todaySummary) => {
  const name = (targetName && targetName !== '당신') ? targetName : '재희';

  // 1. 오늘 우체통 기록이 있을 때
  if (hasTodayRecord) {
     if (id === 'inner') return `${name} 님, 오늘 남겨주신 '${todaySummary}' 이야기를 찬찬히 살펴보았습니다. 혹시 내면의 어린 아이가 혼자 아파하고 있지는 않나요? 왜곡된 생각의 틀을 찾아 함께 교정해 나가는 연습을 해보아요.`;
     if (id === 'family') return `${name} 님, 오늘 남겨주신 '${todaySummary}' 이야기를 보며 가족 안에서 느끼셨을 짐이 전해졌습니다. 서로의 기대가 엇갈렸던 지점을 함께 찾아가며, 부드럽게 마음을 연결해 볼까요?`;
     if (id === 'relation') return `${name} 님, 오늘 적어주신 '${todaySummary}' 상황을 보며 관계에서 느끼셨을 피로감이 와닿았습니다. 방어기제를 잠시 내려놓고, 비폭력대화(NVC)로 진짜 연결을 만들어가는 대화를 저와 함께 시작해 보아요.`;
  }
  
  // 2. 오늘 기록은 없지만 과거 기록이 있는 기존 유저일 때
  if (hasPastRecord && pastSummary) {
     if (id === 'inner') return `${name} 님, 다시 와주셔서 반가워요. 지난번 나누셨던 '${pastSummary}' 일은 마음속에서 어떻게 정리되고 있나요? 오늘은 어떤 생각이 당신을 힘들게 하는지 편하게 들려주세요.`;
     if (id === 'family') return `${name} 님, 어서 오세요. 지난번 고민하셨던 '${pastSummary}' 문제가 계속 마음에 쓰였어요. 가족은 하나의 시스템과 같죠. 오늘 가족의 어느 부분이 삐걱거렸는지 저와 함께 풀어보아요.`;
     if (id === 'relation') return `${name} 님, 다시 만나 반가워요. 지난번 '${pastSummary}' 문제로 많이 지치셨었죠? 사람과 사람 사이의 안전한 경계를 세우는 일, 오늘 저와 함께 다시 한걸음 내디뎌 보아요.`;
  }

  // 3. 신규 유저일 때 (Fallback)
  if (id === 'inner') return `${name} 님, 반가워요. 언제든 마음이 무겁거나 스스로를 다독이고 싶을 때 편하게 들려주세요. 이곳에선 당신의 내면아이를 돌보는 것에만 집중해 드릴게요.`;
  if (id === 'family') return `${name} 님, 어서 오세요. 가족들의 감정과 일상을 챙기느라 정작 ${name} 님의 마음은 돌보지 못하셨죠? 꼬인 가족 간의 역동을 저와 함께 부드럽게 풀어갈 시간입니다.`;
  if (id === 'relation') return `${name} 님, 반가워요. 복잡한 관계의 실타래 속에서 나를 지켜내느라 피곤하셨죠? 언제든 평가나 판단 없이, 당신의 느낌과 욕구에만 집중하는 대화를 나누어 보아요.`;
  
  return '';
};

// 초개인화된 추천 첫마디 (Suggested Replies) 생성기
const getSuggestedReplies = (counselorId, userName, mbti, emotion) => {
  const name = userName && userName !== '당신' ? userName : '나';
  
  if (counselorId === 'inner') {
    return [
      `진짜 열심히 버텼는데, 누구라도 ${name} 수고했다고 말해줬으면 좋겠어.`,
      `오늘도 완벽하게 해내려다 보니까 스스로 너무 지치네.`
    ];
  } else if (counselorId === 'family') {
    return [
      `가족한테 서운한 일이 있었는데, 화내지 않고 잘 말할 방법이 있을까?`,
      `내가 참으면 다 해결될 줄 알았는데, ${emotion}한 감정만 계속 쌓이네.`
    ];
  } else if (counselorId === 'relation') {
    return [
      `회사에서 인간관계 때문에 너무 지쳤어, 내 편 좀 들어줄래?`,
      `내 진심이 곡해될까 봐 자꾸 눈치 보게 되고 마음이 너무 ${emotion}해.`
    ];
  }
  return [
    "마음이 너무 힘들었어. 내 이야기 좀 들어줄래?",
    "누군가에게 털어놓고 싶은데 마땅한 사람이 없네."
  ];
};

export default function AtticView({ userName = '당신', onReset, setToastMsg, onChatStateChange }) {
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [ticketCount, setTicketCount] = useState(1); // 마음 한 아름
  const [shieldCount, setShieldCount] = useState(3); // 마음 방패
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // 초기 팝업 상태
  const [isDangerState, setIsDangerState] = useState(false);
  const [dangerSystemMessage, setDangerSystemMessage] = useState('');

  const isOnlyEmoji = (str) => {
    if (!str) return false;
    const trimmed = str.trim();
    if (!trimmed) return false;
    const emojiRegex = /^(\p{Extended_Pictographic}|\u200d|\ufe0f|\s)+$/u;
    return emojiRegex.test(trimmed) && [...trimmed].length <= 8;
  };

  const userMBTI = 'INTJ'; // 임시 가상 데이터
  const recentEmotion = '불안'; // 임시 가상 데이터
  const suggestedReplies = selectedCounselor ? getSuggestedReplies(selectedCounselor.id, userName, userMBTI, recentEmotion) : [];

  // 1:1 대화방 진입/이탈 상태 상위 App.jsx에 동기화 (하단 탭 바 조건부 숨김)
  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(!!selectedCounselor);
    }
    return () => {
      if (onChatStateChange) {
        onChatStateChange(false);
      }
    };
  }, [selectedCounselor, onChatStateChange]);

  // 1:1 대화방 열림 시 창 전체 바디 스크롤 차단 (바깥 창 스크롤 및 불필요한 공백 방지)
  useEffect(() => {
    if (selectedCounselor) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCounselor]);

  // 채팅 스크롤 제어: 초기 진입 시 최상단 헤더 보존, 메시지 추가 시 하단 스크롤
  useEffect(() => {
    if (!selectedCounselor) return;

    if (messages.length === 1) {
      // 1:1 대화방 최초 진입 시: 화면 최상단(서브 헤더)이 무조건 보이도록 스크롤 0으로 고정
      window.scrollTo(0, 0);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0;
      }
    } else if (messages.length > 1 && chatEndRef.current) {
      // 메시지를 주고받을 때만 부드럽게 하단 스크롤
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, isTyping, selectedCounselor]);

  const startCounseling = (counselor) => {
    if (ticketCount < 1) {
      setShowExchangeModal(true);
      return;
    }
    setTicketCount(prev => prev - 1);
    setSelectedCounselor(counselor);
    const savedMailbox = localStorage.getItem('here_attic_mailbox');
    const targetName = (userName && userName !== '당신') ? userName : '재희';

    const hasTodayRecord = !!savedMailbox;
    const hasPastRecord = !hasTodayRecord && userName !== '당신';
    const pastSummary = "남편과의 대화 단절"; 
    
    const todaySummary = savedMailbox 
      ? (savedMailbox.length > 20 ? savedMailbox.substring(0, 20) + '...' : savedMailbox) 
      : '';

    const welcomeText = getCounselorWelcome(counselor.id, targetName, hasTodayRecord, hasPastRecord, pastSummary, todaySummary);

    if (savedMailbox) {
      localStorage.removeItem('here_attic_mailbox');
    }

    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: welcomeText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    window.scrollTo(0, 0);
  };

  const handleSelectCounselor = (counselor) => {
    startCounseling(counselor);
  };

  // 메시지 전송 로직
  const handleSendMessage = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : inputVal.trim();
    if (!textToSend || isTyping || !selectedCounselor) return;

    const userText = textToSend;
    setInputVal('');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let resultStr = await fetchCounselingReply(selectedCounselor.id, userName, userText);
      let aiReply = '';
      
      try {
        const parsed = JSON.parse(resultStr);
        if (parsed.statusCode === 'DANGER') {
          setIsDangerState(true);
          setDangerSystemMessage(parsed.systemMessage || '위기 상황이 감지되었습니다.');
          setIsTyping(false);
          return;
        } else {
          aiReply = parsed.reply || `${userName} 님의 이야기를 가만히 들으니 마음이 묵직해지네요. 제가 언제든 이 자리에 있을게요.`;
        }
      } catch (e) {
        aiReply = resultStr || `${userName} 님의 이야기를 가만히 들으니 마음이 묵직해지네요. 제가 언제든 이 자리에 있을게요.`;
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.warn('Attic AI Chat Fallback:', err);
      setIsTyping(false);
      const fallbackReply = `${userName} 님, 그동안 말하지 못했던 그 아픔과 피로가 참 깊으셨네요. 언제든 남들의 기대나 시선은 다 내려놓고, 이곳에서 온전히 편안하게 숨 고르시길 바랄게요. 제가 늘 따뜻하게 안아드릴게요. 🌸`;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <>
      <style>{`
        @keyframes candleFlicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(0.92); }
        }
        @keyframes doorOpen {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .attic-container {
          animation: doorOpen 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {showExchangeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            width: '90%', maxWidth: '340px', backgroundColor: '#FDFBF7',
            border: '1px solid #EAE0D8', borderRadius: '24px', padding: '28px 24px',
            textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', color: '#3A2E2A'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🌸</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 12px 0', lineHeight: '1.5', wordBreak: 'keep-all' }}>
              상담을 시작하려면<br/>'마음 조각'이 필요해요.
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#7A6B63', margin: '0 0 24px 0', lineHeight: '1.6', wordBreak: 'keep-all' }}>
              🛡️ 보유한 마음 방패 2개를<br/>마음 조각(상담 1회)으로 교환할까요?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  if (shieldCount >= 2) {
                    setShieldCount(prev => prev - 2);
                    setTicketCount(prev => prev + 1);
                    setShowExchangeModal(false);
                  } else {
                    if (setToastMsg) setToastMsg('마음 방패가 부족해요 😢');
                    else alert('마음 방패가 부족해요 😢');
                  }
                }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                  backgroundColor: '#E2725B', color: '#FFF', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(226,114,91,0.3)'
                }}
              >
                교환하기
              </button>
              <button
                onClick={() => { setShowExchangeModal(false); }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #EAE0D8',
                  backgroundColor: 'transparent', color: '#9E8071', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
                }}
              >
                다음에 할게요
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcomePopup && !selectedCounselor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            width: '85%', maxWidth: '320px', backgroundColor: '#FDFBF7',
            borderRadius: '24px', padding: '30px 24px',
            textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', color: '#3A2E2A'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌸</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 12px 0', color: '#E2725B' }}>
              다정한 상담소에 오신 것을 환영해요
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#6B4C3B', margin: '0 0 24px 0', lineHeight: '1.6', wordBreak: 'keep-all' }}>
              지금 보유하신 <b>'마음 한 아름' 1개</b>로<br/>
              상담 3회(<b>'마음 조각' 3개</b>)를<br/>이용하실 수 있어요.
            </p>
            <button
              onClick={() => {
                setTicketCount(3);
                setShowWelcomePopup(false);
              }}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                backgroundColor: '#E2725B', color: '#FFF', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(226,114,91,0.3)'
              }}
            >
              상담 메이트 만나기
            </button>
          </div>
        </div>
      )}


      <div style={{
        maxWidth: '480px', margin: '0 auto',
        backgroundColor: '#FDFBF7',
        backgroundImage: 'none',
        color: '#3A2E2A',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        height: selectedCounselor ? '100vh' : 'auto',
        overflow: selectedCounselor ? 'hidden' : 'visible',
        display: 'flex', flexDirection: 'column', position: 'relative',
        transition: 'background-color 0.8s ease, color 0.8s ease',
        boxSizing: 'border-box',
        paddingBottom: selectedCounselor ? '0px' : '80px'
      }}>

        {/* 상단 헤더 (상담실 목록에서만 표시) */}
        {!selectedCounselor && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#FDFBF7',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #EAE0D8',
            zIndex: 20
          }}>
            <button onClick={onReset} style={{ background: 'none', border: 'none', color: '#3A2E2A', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.3px', color: '#3A2E2A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌸</span> 다정한 상담소
            </div>
          </div>
        )}

        <div className="attic-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── [Sub-Screen 1] 마음 메이트 선택 목록 ── */}
          {!selectedCounselor && (
            <div style={{ padding: '24px 20px 100px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
              <div style={{ textAlign: 'center', padding: '4px 0 12px 0' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#3A2E2A', fontWeight: '800', margin: '0 0 10px 0', wordBreak: 'keep-all' }}>
                  <span>{userName && userName !== '당신' ? userName : '당신'} 님, 언제든 편하게 이야기 나눠요 🌸</span>
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#7A6B63', margin: 0, lineHeight: '1.6', wordBreak: 'keep-all' }}>
                  마음이 힘들 때 언제든 찾아올 수 있는 3인의 AI 마음 메이트입니다. 이야기 나누고 싶은 메이트를 선택해 주세요.
                </p>
              </div>

              {/* 🌸 마음 조각(상담권) 배너 - Pill style */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  backgroundColor: '#FFF0ED', border: '1px solid #FADED7',
                  borderRadius: '20px', padding: '6px 14px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#993C1D', fontWeight: '800' }}>
                    🌸 마음 조각 {ticketCount}개 남음
                  </span>
                </div>
              </div>

              {/* 마음 메이트 프로필 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {COUNSELORS.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCounselor(c)}
                    style={{
                      position: 'relative',
                      backgroundColor: c.cardBg || '#FFFFFF', borderRadius: '16px', padding: '16px 14px',
                      border: '1px solid #EAE0D8', borderLeft: `3px solid ${c.highlightColor || '#EAE0D8'}`, cursor: 'pointer',
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      transition: 'background-color 0.2s ease, transform 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                  >
                    <div style={{ width: '52px', height: '52px', backgroundColor: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${c.highlightColor || c.color}`, marginTop: '2px' }}>
                      {c.icon}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#3A2E2A', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.highlightColor || '#4CAF50' }} />
                          <span style={{ fontSize: '0.7rem', color: c.highlightColor || '#4CAF50', fontWeight: 'bold' }}>대화 가능</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '0.7rem', color: c.highlightColor || c.badgeColor || c.color, backgroundColor: 'transparent',
                          border: `1px solid ${c.highlightColor || c.borderColor || c.color}`, padding: '2px 8px', borderRadius: '12px',
                          fontWeight: '600', display: 'inline-block'
                        }}>
                          {c.tag}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#7A6B63', margin: 0, lineHeight: '1.4', wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.desc}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 준비 중인 메이트 */}
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#F1EFE8', borderRadius: '16px', padding: '14px 16px',
                    border: '1px solid #EAE0D8', borderLeft: '3px solid rgba(196, 192, 182, 0.65)',
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    opacity: 0.7, cursor: 'not-allowed'
                  }}
                >
                  <div style={{ width: '46px', height: '46px', backgroundColor: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #C4C0B6', marginTop: '2px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#999', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>오피스 멘토</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: '#999', fontWeight: 'bold' }}>🚧 준비 중</span>
                      </div>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '0.65rem', color: '#999', backgroundColor: 'transparent',
                        border: '1px solid #C4C0B6', padding: '2px 6px', borderRadius: '10px',
                        fontWeight: '700', display: 'inline-block'
                      }}>
                        직장/사회생활
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#777', margin: 0, lineHeight: '1.4', wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      직장 내 인간관계와 진로 고민을 나누는 멘토
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── [Sub-Screen 2] 1:1 실시간 상담 채팅창 ── */}
          {selectedCounselor && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              backgroundColor: '#FDFBF7', overflow: 'hidden'
            }}>

              {/* 채팅 헤더 (2행 구조) */}
              <div style={{ backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #EAE0D8', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {/* 1행: 뒤로가기 + 프로필 + 이름 */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => { setSelectedCounselor(null); if (onChatStateChange) onChatStateChange(false); window.scrollTo(0, 0); }} style={{ background: 'none', border: 'none', color: '#3A2E2A', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: selectedCounselor.bgColor, border: `1px solid ${selectedCounselor.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                      {selectedCounselor.icon}
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#3A2E2A' }}>{selectedCounselor.name}</span>
                  </div>
                </div>
                {/* 2행: 상태 및 배지 바 */}
                <div style={{ padding: '8px 16px', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0F0F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8E8E93', fontWeight: '600' }}>현재 이용 현황</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF0ED', border: '1px solid #FADED7', borderRadius: '20px', padding: '4px 10px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#E2725B', fontWeight: '800' }}>🌸 조각 {ticketCount}</span>
                    <div style={{ width: '1px', height: '10px', backgroundColor: '#FADED7' }} />
                    <span style={{ fontSize: '0.7rem', color: '#E2725B', fontWeight: '800' }}>🛡️ 방패 {shieldCount}</span>
                  </div>
                </div>
              </div>

              {/* 메시지 스크롤 영역 */}
              <div ref={chatContainerRef} style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, idx) => {
                  const isUser = m.sender === 'user';
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const isSameSender = prevMsg && prevMsg.sender === m.sender;

                  if (isUser) {
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'flex-end',
                          maxWidth: '78%', gap: '4px', marginTop: isSameSender ? '-6px' : '0px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                          <span style={{ fontSize: '0.65rem', color: '#8E8E93', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {m.time}
                          </span>
                          <div
                            style={isOnlyEmoji(m.text) ? {
                              fontSize: '2.5rem', lineHeight: '1.2', padding: '2px 4px', backgroundColor: 'transparent'
                            } : {
                              backgroundColor: '#FF8A75', color: '#FFFFFF', padding: '10px 14px',
                              borderRadius: '16px 16px 4px 16px', fontSize: '0.92rem', lineHeight: '1.5',
                              wordBreak: 'break-word', textAlign: 'left', width: 'fit-content'
                            }}
                          >
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex', gap: '8px', alignItems: 'flex-start', alignSelf: 'flex-start',
                        width: '100%', maxWidth: '88%', marginTop: isSameSender ? '-6px' : '0px'
                      }}
                    >
                      {!isSameSender ? (
                        <div
                          style={{
                            width: '36px', height: '36px', borderRadius: '40%', backgroundColor: selectedCounselor.bgColor,
                            border: `1px solid ${selectedCounselor.color}`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, marginTop: '2px'
                          }}
                        >
                          {selectedCounselor.icon}
                        </div>
                      ) : (
                        <div style={{ width: '36px', flexShrink: 0 }} />
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                        {!isSameSender && (
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#7A6B63', paddingLeft: '2px', textAlign: 'left' }}>
                            {selectedCounselor.name}
                          </span>
                        )}

                        {/* 말풍선 */}
                        <div
                          style={isOnlyEmoji(m.text) ? {
                            fontSize: '2.5rem', lineHeight: '1.2', padding: '2px 4px', backgroundColor: 'transparent'
                          } : {
                            display: 'block',
                            backgroundColor: '#FFFFFF', color: '#3A2E2A', padding: '10px 14px',
                            borderRadius: '4px 20px 20px 20px', fontSize: '0.92rem', lineHeight: '1.5',
                            wordBreak: 'break-word', textAlign: 'left',
                            border: '1px solid #EAE0D8', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}
                        >
                          {m.text}
                        </div>

                        {/* 시간 표시 - 말풍선 아래에 별도 행 */}
                        <span style={{ fontSize: '0.65rem', color: '#8E8E93', paddingLeft: '2px', textAlign: 'left' }}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '95%', textAlign: 'left' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: selectedCounselor.bgColor, border: `1px solid ${selectedCounselor.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {selectedCounselor.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#7A6B63', paddingLeft: '2px', textAlign: 'left' }}>{selectedCounselor.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2725B', fontSize: '0.82rem', padding: '10px 14px', backgroundColor: '#FFFFFF', border: '1px solid #EAE0D8', borderRadius: '20px 20px 20px 4px', width: 'fit-content' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid #E2725B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <span>생각을 다듬어 적는 중...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>


              {/* ── 입력 폼 ── */}
              <div style={{ padding: '14px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px', backgroundColor: '#FDFBF7', borderTop: '1px solid #EAE0D8', boxSizing: 'border-box' }}>
                {isDangerState ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: '#FFF0F0', padding: '20px 16px', borderRadius: '16px', border: '1px solid #FFCDD2' }}>
                      <p style={{ color: '#D32F2F', fontSize: '0.95rem', fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: '1.5', wordBreak: 'keep-all' }}>🚨 상담이 일시 중단되었습니다.</p>
                      <p style={{ color: '#5C3A21', fontSize: '0.85rem', margin: '0', lineHeight: '1.5', wordBreak: 'keep-all' }}>{dangerSystemMessage}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <a href="tel:1393" style={{ display: 'block', backgroundColor: '#D32F2F', color: '#FFF', padding: '14px', borderRadius: '14px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.95rem' }}>자살예방상담전화 1393 연결</a>
                      <a href="tel:1366" style={{ display: 'block', backgroundColor: '#FFFFFF', color: '#D32F2F', border: '1px solid #D32F2F', padding: '14px', borderRadius: '14px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.95rem' }}>여성긴급전화 1366 연결</a>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.length <= 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 0px 12px 0px', margin: '0 0' }}>
                        {suggestedReplies.slice(0, 2).map((chipTxt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chipTxt)}
                          style={{
                            width: '100%',
                            backgroundColor: '#FFF0ED', border: '1px dashed #FADED7',
                            borderRadius: '16px', padding: '12px 16px', color: '#E2725B', fontSize: '0.9rem', fontWeight: '600',
                            cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
                            whiteSpace: 'normal', wordBreak: 'keep-all', height: 'auto', minHeight: '48px', lineHeight: '1.4',
                            boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FADED7'; e.currentTarget.style.borderColor = '#E2725B'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF0ED'; e.currentTarget.style.borderColor = '#FADED7'; }}
                        >
                          ✨ {chipTxt}
                        </button>
                      ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box' }}>
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #EAE0D8',
                        borderRadius: '50px', padding: '0 16px', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        minWidth: 0
                      }}>
                        <input
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                          placeholder="메시지 입력"
                          style={{
                            flex: 1, padding: '12px 0', border: 'none', backgroundColor: 'transparent',
                            color: '#3A2E2A', fontSize: '0.95rem', outline: 'none', minWidth: 0
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputVal.trim() || isTyping}
                        style={{
                          width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#FEE500',
                          opacity: inputVal.trim() && !isTyping ? 1 : 0.4, border: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          cursor: inputVal.trim() && !isTyping ? 'pointer' : 'default',
                          flexShrink: 0, padding: 0, transition: 'opacity 0.2s ease'
                        }}
                        title="전송"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}
