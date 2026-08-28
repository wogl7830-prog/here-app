import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
  syncEmotionDBToCloud,
  fetchEmotionDBFromCloud,
  subscribeToAuthState,
  startAnonymousSession,
  getAuthToken,
  checkRedirectAuthResult,
} from './firebase';
import { encryptData, decryptData } from './crypto';
import MindKnockBox from './MindKnockBox';
import MindJournal from './MindJournal';
import WeatherDashboard, { buildBriefing } from './WeatherDashboard';
import BreathingModal from './BreathingModal';
import { useProactiveForecast } from './hooks/useProactiveForecast';
import HybridPrescriptionView from './HybridPrescriptionView';
import MyPage from './MyPage';
import AtticView from './AtticView';
import {
  fetchGeminiMorningLetter,
  fetchGeminiFollowUp,
  fetchGeminiCoupleAnalysis,
  fetchGeminiFamilyAnalysis,
  fetchGeminiRelationshipAnalysis,
  fetchGeminiSelfAnalysis,
  fetchGeminiMonthlyAnalytics,
} from './services/aiEngine';

// ── 사용자화(Personalization) 변수 ──
export const mbtiTraits = {
  INTJ: { name: '전략가', roomText: '전략적 사유 분석 · 깊이 있는 내면 기록' },
  INTP: { name: '사색가', roomText: '논리적 자아 탐색 · 지적 호기심 기록' },
  ENTJ: { name: '통솔자', roomText: '목표 지향적 성찰 · 비전 수립 기록' },
  ENTP: { name: '변론가', roomText: '다각적 자아 탐구 · 창의적 아이디어 기록' },
  INFJ: { name: '옹호자', roomText: '이상적 내면 성찰 · 통찰력 있는 기록' },
  INFP: { name: '중재자', roomText: '감성적 자아 치유 · 따뜻한 내면 기록' },
  ENFJ: { name: '선도자', roomText: '이타적 관계 성찰 · 긍정적 가치 기록' },
  ENFP: { name: '활동가', roomText: '자유로운 감정 탐색 · 열정적인 기록' },
  ISTJ: { name: '현실주의자', roomText: '체계적 일상 회고 · 안정적 내면 기록' },
  ISFJ: { name: '수호자', roomText: '헌신적 자아 돌봄 · 세심한 감정 기록' },
  ESTJ: { name: '경영자', roomText: '실용적 목표 점검 · 효율적 자기 관리' },
  ESFJ: { name: '집정관', roomText: '조화로운 관계 성찰 · 다정한 일상 기록' },
  ISTP: { name: '장인', roomText: '독립적 자아 탐색 · 유연한 현실 기록' },
  ISFP: { name: '모험가', roomText: '감각적 자아 표현 · 자유로운 감정 기록' },
  ESTP: { name: '사업가', roomText: '활동적 자아 성찰 · 에너지 넘치는 기록' },
  ESFP: { name: '연예인', roomText: '긍정적 자아 발견 · 즐거운 일상 기록' },
};
export const defaultMbtiTrait = { name: '따뜻한', roomText: '사주·내면 기질 분석\n나를 안아주는 기록' };


const getJosa = (word, josa = '와/과') => {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) return word;
  const hasJongseong = (lastChar - 0xac00) % 28 > 0;
  if (josa === '와/과') return hasJongseong ? `${word}과` : `${word}와`;
  if (josa === '은/는') return hasJongseong ? `${word}은` : `${word}는`;
  if (josa === '을/를') return hasJongseong ? `${word}을` : `${word}를`;
  if (josa === '이/가') return hasJongseong ? `${word}이` : `${word}가`;
  return word;
};

// ─── Global User Context ────────────────────────────────────────────────────
const UserContext = createContext(null);

const styles = {
  container: {
    backgroundColor: '#FDFBF7',
    minHeight: '100vh',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    color: '#4A4A4A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    transition: 'opacity 0.8s ease'
  },
  logoSection: { textAlign: 'center', marginBottom: '30px' },
  logo: { width: '55px', height: '55px', marginBottom: '8px', cursor: 'pointer' },
  mainTitle: { fontSize: '1.8rem', fontWeight: '700', color: '#E2725B', letterSpacing: '3px', margin: '5px 0' },
  subTitle: { fontSize: '0.95rem', color: '#7A7A7A', lineHeight: '1.6', marginTop: '5px' },
  card: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '40px 30px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: '430px',
    maxHeight: '85vh',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  backButton: { position: 'absolute', top: '25px', left: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  notice: { fontSize: '0.75rem', color: '#BDBDBD', marginBottom: '12px' },
  button: { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#E2725B', color: 'white', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(226, 114, 91, 0.2)', marginTop: '25px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '15px', textAlign: 'left' },
  inputItem: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '0.95rem', color: '#4A4A4A', marginLeft: '5px', fontWeight: '600' },
  nameInput: { padding: '12px 15px', borderRadius: '14px', border: '1px solid #E0E0E0', textAlign: 'left', fontSize: '1rem', backgroundColor: '#FAFAFA', width: '100%', boxSizing: 'border-box', outline: 'none' },
  dateInputGroup: { display: 'flex', gap: '8px' },
  splitInput: { padding: '12px', borderRadius: '14px', border: '1px solid #E0E0E0', textAlign: 'center', fontSize: '1rem', backgroundColor: '#FAFAFA', width: '100%', outline: 'none' },
  timeSelectGroup: { display: 'flex', gap: '5px' },
  select: { padding: '14px 12px', lineHeight: '1.5', borderRadius: '14px', border: '1px solid #E0E0E0', backgroundColor: '#FAFAFA', fontSize: '0.98rem', cursor: 'pointer', flex: 1, outline: 'none' },
  textarea: { padding: '15px', borderRadius: '12px', border: '2px solid #E2725B', fontSize: '1rem', backgroundColor: '#FAFAFA', minHeight: '150px', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6', outline: 'none' },
  optionGroup: { display: 'flex', gap: '10px', marginTop: '5px' },
  optionBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #DDD', backgroundColor: '#FFF', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  optionBtnActive: { backgroundColor: '#FDF2F0', borderColor: '#E2725B', color: '#E2725B', fontWeight: 'bold' },
  scrollContent: { overflowY: 'auto', maxHeight: '100%', paddingRight: '8px', paddingBottom: '20px' },
  chartArea: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', minHeight: '340px', overflow: 'visible' },
  keyPointItem: { borderBottom: '1px solid #F0E6D2', padding: '18px 0', cursor: 'pointer', textAlign: 'left' },
  keyTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' },
  keyTitle: { fontSize: '1rem', fontWeight: '700', color: '#4A4A4A', lineHeight: '1.4' },
  footer: { marginTop: '50px', fontSize: '0.8rem', color: '#C0C0C0', textAlign: 'center' }
};

// 1. 일간(Ilgan) 계산 및 운기 대조 로직 (실제 명리학 연동)
const calculateIlgan = (y, m, d) => {
  if (!y || !m || !d) return { element: 0, metaphor: '어떤 토양에서도 자라나는 꿋꿋한 푸른 나무', name: '목(木)' };
  try {
    const target = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
    const base = new Date(Date.UTC(1900, 0, 1));
    const stemIdx = ((Math.floor((target - base) / 86400000) % 10) + 10) % 10;
    const metaphors = [
      '어떤 토양에서도 단단히 뿌리내리는 꿋꿋한 푸른 나무', '바람을 타고 유연하게 뻗어가는 다정한 덩굴 식물',
      '차가운 세상을 눈부시게 비추는 따스한 태양', '가까운 곳을 섬세하고 포근하게 데우는 모닥불',
      '모든 것을 묵묵히 품어주는 든든한 넓은 대지', '생명을 아름답게 피워내는 기름진 정원',
      '쉽게 깎이지 않는 올곧고 무거운 중심을 가진 바위', '비싸고 투명하게 세공되어 빛나는 단단한 원석',
      '어떤 물결도 거스르지 않는 고요하고 깊은 바다', '메마른 흙 속으로 조용히 스며드는 촉촉한 이슬비'
    ];
    const elementNames = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'];
    const element = Math.floor(stemIdx / 2);
    return { element, metaphor: metaphors[stemIdx], name: elementNames[element] };
  } catch {
    return { element: 0, metaphor: '어떤 토양에서도 자라나는 꿋꿋한 푸른 나무', name: '목(木)' };
  }
};

const calculateInnerEnergy = (birthData) => {
  const d = new Date();
  const todayIlgan = calculateIlgan(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const myIlgan = calculateIlgan(birthData.year, birthData.month, birthData.day || 1);

  const myEl = myIlgan.element;
  const todayEl = todayIlgan.element;
  const name = birthData.name || '당신';

  const myMetaphor = [
    '끊임없이 위로 뻗어나가려는 성장의 에너지',
    '세상을 밝히고 인정받으려는 역동적인 열정의 에너지',
    '모든 것을 수용하고 중심을 잡으려는 안정의 에너지',
    '불필요한 것을 잘라내고 본질에 집중하려는 예리한 에너지',
    '어디에도 얽매이지 않는 유연하고 수용적인 내면의 에너지'
  ][myEl];

  const todayMetaphor = [
    '새로운 시작과 성장을 촉구하는 역동적인 흐름',
    '가장 나다운 모습을 외부로 발산하게 만드는 밝은 흐름',
    '급한 마음을 잠재우고 단단한 안정을 요구하는 정적인 흐름',
    '모호한 경계선을 명확히 정리하게 만드는 결단력의 흐름',
    '상황을 자연스럽게 흘려보내는 유연한 흐름'
  ][todayEl];

  let type = '';
  let description = '';
  let gradientTheme = '';

  const intro = `${name} 님의 고유한 '${myMetaphor}'가 오늘이라는 '${todayMetaphor}'을 만났습니다.`;

  if (myEl === todayEl) {
    type = '머무름 (Still)';
    const stillMetaphors = [
      '성장이 멈추는 답답함이 아니라, 오히려 뿌리를 깊게 내리며',
      '열정이 갇히는 답답함이 아니라, 오히려 고요하게 온기를 머금고',
      '제자리에 갇힌 답답함이 아니라, 오히려 단단하게 토대를 다지며',
      '판단이 멈춘 답답함이 아니라, 오히려 투명하게',
      '생각이 멈춘 답답함이 아니라, 오히려 깊게 고여'
    ];
    description = `${intro} 오늘은 ${stillMetaphors[myEl]} 자신을 들여다보는 **[머무름]**의 예보가 도착했네요.`;
    gradientTheme = 'linear-gradient(135deg, #FDFBF7 0%, #E8F0F2 100%)';
  } else if (todayEl === (myEl + 1) % 5 || myEl === (todayEl + 1) % 5) {
    type = '흐름 (Flow)';
    description = `${intro} 오늘은 세상의 날씨와 나의 풍경이 충돌 없이 어우러져, 가장 자연스럽게 나아가고 물 흐르듯 순환하는 **[흐름]**의 예보가 도착했네요.`;
    gradientTheme = 'linear-gradient(135deg, #F0F4EC 0%, #D8E5D8 100%)';
  } else {
    type = '발산 (Expansion)';
    description = `${intro} 오늘은 역동적인 기운의 마찰로 일시적인 분주함이 일 수 있지만, 도리어 이 마찰열을 통해 씩씩한 에너지가 바깥으로 강하게 뻗어나가는 **[발산]**의 예보가 도착했네요.`;
    gradientTheme = 'linear-gradient(135deg, #FDF2F0 0%, #F5EAE1 100%)';
  }

  return { type, description, gradientTheme };
};



const calculateCoordinates = (formData, concernText = '') => {
  const t = concernText || formData.concern || '';
  // Check if partner info exists to potentially adjust baseline or for logging
  const hasPartnerInfo = !!formData.partnerName || !!formData.partnerYear;

  let x = 0; // -100 (Inward) to +100 (Outward)
  let y = 0; // -100 (Anxiety) to +100 (Stability)

  const inwardKeywords = /우울|무기력|지침|번아웃|피곤|혼자|외로|숨|자책|결핍|고립/g;
  const outwardKeywords = /화|분노|짜증|싸움|갈등|부딪|폭발|미치|무시|억울/g;
  const stableKeywords = /성장|열망|사랑|존중|인정|공감|위로|안도감|자유|다정/g;
  const unstableKeywords = /불안|걱정|상처|두렵|초조|무서|위협|통제/g;

  const countMatches = (regex) => (t.match(regex) || []).length;

  const inwardCount = countMatches(inwardKeywords);
  const outwardCount = countMatches(outwardKeywords);
  const stableCount = countMatches(stableKeywords);
  const unstableCount = countMatches(unstableKeywords);

  x = (outwardCount * 25) - (inwardCount * 25);
  y = (stableCount * 25) - (unstableCount * 25);

  if (x === 0 && y === 0 && t.length > 0) {
    x = t.length % 2 === 0 ? 15 : -15;
    y = t.length % 3 === 0 ? -15 : 15;
  }

  // Slight variance if partner is present (data pipeline integration)
  if (hasPartnerInfo) {
    x += (formData.partnerName.length % 2 === 0 ? 5 : -5);
  }

  const finalX = Math.max(-100, Math.min(100, x));
  const finalY = Math.max(-100, Math.min(100, y));

  // [DEBUG] 실제 좌표 및 키워드 카운트 확인
  console.log('[DEBUG][calculateCoordinates] Text:', t);
  console.log(`[DEBUG] 카운트 - In:${inwardCount} Out:${outwardCount} Stable:${stableCount} Unstable:${unstableCount}`);
  console.log(`[DEBUG] 계산된 좌표 - x: ${finalX}, y: ${finalY}`);

  return {
    x: finalX,
    y: finalY
  };
};

const getQuadrantInterpretation = (x, y, roomName) => {
  const isQ1 = x >= 0 && y >= 0;
  const isQ2 = x < 0 && y >= 0;
  const isQ3 = x < 0 && y < 0;
  const isQ4 = x >= 0 && y < 0;

  if (roomName === '다정한 식탁') {
    if (isQ1) return { title: '건강한 상호작용 (Healthy Interaction)', desc: '관계에서 에너지가 긍정적으로 흐르고 있습니다. 상대를 이해하려는 포용력이 높게 발현되는 상태입니다.' };
    if (isQ2) return { title: '내면화된 대상 (Internalized Object)', desc: '관계에 대한 성찰이 내면으로 향하고 있습니다. 스스로의 마음을 다독이며 안전 기지를 다지는 중입니다.' };
    if (isQ3) return { title: '유기 불안 (Abandonment Anxiety)', desc: '상대와 멀어질까 두려운 마음이 수축된 형태로 나타납니다. 거절당할 것에 대한 깊은 불안이 웅크리고 있습니다.' };
    return { title: '투사적 동일시 (Projective Identification)', desc: '나의 불안하고 힘든 감정이 밖으로 표출되어, 상대에게 강하게 투사되고 있는 갈등의 상태입니다.' };
  }
  if (roomName === '나를 지키는 울타리') {
    if (isQ1) return { title: '유연한 경계선 확장 (Flexible Boundary)', desc: '외부와의 상호작용에 주도권을 쥐고, 사회적 역할을 긍정적으로 확장하고 있습니다.' };
    if (isQ2) return { title: '안전지대 강화 (Safety Zone)', desc: '사회적 소음을 차단하고, 나의 내면적 에너지를 보호하기 위해 자발적으로 경계선을 강화했습니다.' };
    if (isQ3) return { title: '역할 과부하 (Role Overload)', desc: '타인의 기대와 역할에 짓눌려 에너지가 소진되었습니다. 심리적 압박감으로 인해 안으로 위축된 상태입니다.' };
    return { title: '방어적 영토 분쟁 (Territorial Dispute)', desc: '나의 존엄과 경계를 침범받았다고 느끼며, 이를 지키기 위해 강하게 에너지를 발산하며 방어 중입니다.' };
  }
  if (roomName === '성장 탐험가') {
    if (isQ1) return { title: '주도적 자아 탐색 (Proactive Exploration)', desc: '새로운 가능성을 향해 적극적으로 나아가며, 자신의 정체성을 당당하게 구축하고 있습니다.' };
    if (isQ2) return { title: '정체성 내면화 (Identity Internalization)', desc: '외부의 기준보다는 나만의 고유한 내면 가치에 집중하며 단단하게 자아를 다지는 시기입니다.' };
    if (isQ3) return { title: '역할 혼미 (Role Confusion)', desc: '내가 누구인지, 어디로 가야 할지에 대한 깊은 고민과 방향 상실감으로 인해 에너지가 정체되어 있습니다.' };
    return { title: '반항적 자아 분화 (Rebellious Differentiation)', desc: '기성세대나 부모의 통제에서 벗어나기 위해 거칠게 부딪히며 독립을 선언하는 성장통입니다.' };
  }

  // 비밀의 방앗간 (Default)
  if (isQ1) return { title: '능동적 에너지 분출 (Active Release)', desc: '내 안의 에너지가 역동적으로 솟아오르며 새로운 목표나 열망을 향해 힘차게 뻗어가고 있습니다.' };
  if (isQ2) return { title: '수용적 휴식 (Receptive Rest)', desc: '완벽주의를 내려놓고 스스로를 다정하게 수용하며 고요하고 건강한 휴식을 취하는 중입니다.' };
  if (isQ3) return { title: '자기 고갈 (Self Depletion)', desc: '더 잘해내려다 한계에 부딪혀 에너지가 소진되었습니다. 무기력함 속에 깊이 웅크리고 있습니다.' };
  return { title: '방어적 자기 비판 (Self-Critical Excess)', desc: '불안함을 통제하기 위해 스스로에게 채찍질을 하며 거칠고 날 선 에너지를 뿜어내고 있습니다.' };
};

// ─── LoadingScreen: 조건부 텍스트 + Fade 애니메이션 ────────────────────────────
const LOADING_TEXTS_SELF = [
  '무거운 마음을 이곳에 꺼내주셔서 감사합니다.',
  '고르신 감정들 속에 담긴, 당신의 진짜 마음을 가만히 들여다보고 있어요.',
  '당신의 마음이 지금 어디쯤 있는지, 좌표를 정성껏 그리는 중이에요.',
  '이번에는 더 깊은 내면을 들여다보느라\n시간이 조금 더 걸릴 수 있어요. 잠시만 기다려주세요...',
];
const LOADING_TEXTS_FAMILY = [
  '식탁 위에 올려진 두 사람의 마음에\n따뜻한 온기를 불어넣고 있습니다.',
  '날선 감정은 거두고, 온전히 닿을 수 있는\n다정한 언어를 고르는 중입니다...',
  '상대방의 마음에 부드럽게 스며들,\n당신의 진짜 목소리를 찾았습니다.',
];
const LOADING_TEXTS_RELATION = [
  '누구에게도 상처받지 않도록,\n당신의 마음을 지키는 단단한 방패를 만들고 있습니다.',
  '무례한 말들이 당신의 내면을 침범하지 못하게,\n선명한 마음의 선을 긋는 중입니다.',
  '내일 바로 꺼내 쓸 수 있는\n당신만의 실전 사회생활 호신술을 준비하고 있어요.',
];

const LoadingScreen = ({ trackType, userName }) => {
  const isRelationRoom = trackType === '나를 지키는 울타리';
  const isFamilyRoom = trackType === '다정한 식탁';
  const texts = isRelationRoom ? LOADING_TEXTS_RELATION : (isFamilyRoom ? LOADING_TEXTS_FAMILY : LOADING_TEXTS_SELF);
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      // fade out
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % texts.length);
        // fade in
        setVisible(true);
      }, 500); // 0.5s for fade-out, then swap text
    }, 2800); // 2.8s total per message
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(253, 251, 247, 0.98)',
      zIndex: 100,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      borderRadius: '24px', padding: '32px',
    }}>
      <style>{`
        @keyframes loadingPulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes loadingDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .loading-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #E2725B; display: inline-block;
          animation: loadingDotBounce 1.4s infinite ease-in-out;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* 아이콘 */}
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #E2725B, #D05A42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '28px',
        animation: 'loadingPulse 2.5s ease-in-out infinite',
        boxShadow: '0 8px 24px rgba(226,114,91,0.25)',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* 이름 */}
      {userName && (
        <p style={{ fontSize: '0.8rem', color: '#C4A090', letterSpacing: '2px', fontWeight: '700', margin: '0 0 16px 0' }}>
          {userName} 님을 위해
        </p>
      )}

      {/* 페이드 텍스트 */}
      <p style={{
        fontSize: '1.08rem', color: '#4A4A4A', lineHeight: '1.9',
        textAlign: 'center', fontWeight: '500', margin: '0 0 32px 0',
        whiteSpace: 'pre-line', wordBreak: 'keep-all',
        minHeight: '72px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
      }}>
        {texts[index]}
      </p>

      {/* 도트 로딩 인디케이터 */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
    </div>
  );
};

const MinimalMindMap = ({ coords }) => {
  if (!coords) return null;
  const size = 300;
  const center = size / 2;
  const maxR = size * 0.35;

  // coords.x, coords.y between -100 and 100
  const x = center + (coords.x / 100) * maxR;
  const y = center - (coords.y / 100) * maxR; // y-axis is inverted in SVG

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', margin: '30px 0 20px 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line x1="0" y1={center} x2={size} y2={center} stroke="#E0E0E0" strokeWidth="1" strokeDasharray="4" />
        <line x1={center} y1="0" x2={center} y2={size} stroke="#E0E0E0" strokeWidth="1" strokeDasharray="4" />
        <circle cx={center} cy={center} r={maxR} fill="none" stroke="#F5F5F5" strokeWidth="2" />

        {/* Labels - X축: 시간의 초점, Y축: 삶의 주도성 */}
        <text x={size - 8} y={center - 8} fill="#B0A090" fontSize="10" textAnchor="end">지금, 여기 ▶</text>
        <text x={8} y={center - 8} fill="#B0A090" fontSize="10" textAnchor="start">◀ 어제와 내일</text>
        <text x={center + 6} y={14} fill="#B0A090" fontSize="10" textAnchor="start">이끄는 하루 ▲</text>
        <text x={center + 6} y={size - 6} fill="#B0A090" fontSize="10" textAnchor="start">끌려가는 하루 ▼</text>

        <circle cx={x} cy={y} r="8" fill="#E2725B" />
        <circle cx={x} cy={y} r="24" fill="#E2725B" opacity="0.15" className="pulse-text" />
      </svg>
    </div>
  );
};

const analyzeKeywords = (dbRecords) => {
  if (!dbRecords || dbRecords.length === 0) return null;
  const keywords = ['경계', '자율성', '책임감', '성장', '자책', '소음', '안전지대', '통제', '존중', '애착', '불안', '상처', '열망', '독립', '인정', '공감', '완벽', '안도감', '자유', '위로', '방어', '분노', '고립', '외로움', '결핍', '피로', '지침', '번아웃', '사랑', '다정함'];
  const counts = {};
  dbRecords.forEach(record => {
    keywords.forEach(kw => {
      if (record.text && record.text.includes(kw)) counts[kw] = (counts[kw] || 0) + 1;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 2) return [sorted[0][0], sorted[1][0]];
  if (sorted.length === 1) return [sorted[0][0]];
  return null;
};

const CarouselBanner = ({ userNameDisplay, onPremiumClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsHovered(true);
  };
  const handleTouchEnd = (e) => {
    setIsHovered(false);
    const endX = e.changedTouches[0].clientX;
    if (touchStart - endX > 40) setCurrentIndex(prev => (prev + 1) % 2); // 좌로 스와이프
    if (touchStart - endX < -40) setCurrentIndex(prev => (prev === 0 ? 1 : 0)); // 우로 스와이프
  };

  const handleMouseDown = (e) => {
    setTouchStart(e.clientX);
    setIsDragging(true);
    setIsHovered(true);
  };
  const handleMouseUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsHovered(false);
    const endX = e.clientX;
    if (touchStart - endX > 40) setCurrentIndex(prev => (prev + 1) % 2);
    if (touchStart - endX < -40) setCurrentIndex(prev => (prev === 0 ? 1 : 0));
  };
  const handleMouseLeave = (e) => {
    setIsHovered(false);
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.clientX;
    if (touchStart - endX > 40) setCurrentIndex(prev => (prev + 1) % 2);
    if (touchStart - endX < -40) setCurrentIndex(prev => (prev === 0 ? 1 : 0));
  };

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % 2);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const slides = [
    {
      id: 0,
      bg: 'linear-gradient(135deg, #FDF0E6 0%, #F8EFEA 100%)',
      border: '#F0DFD8',
      iconColor: '#E2725B',
      title: `[Premium] ${userNameDisplay} 님의 ${new Date().getMonth() + 1}월 심리 성장 리포트`,
      sub: '이번 달 내 마음이 만들어낸 기후 변화 확인하기',
      onClick: onPremiumClick
    },
    {
      id: 1,
      bg: 'linear-gradient(135deg, #F0F8FF 0%, #E6F3F9 100%)',
      border: '#D8E8F0',
      iconColor: '#4A8BAD',
      title: 'H.E.R.e는 어떤 공간인가요?',
      sub: '내 마음의 좌표를 찾고 단단해지는 법 알아보기',
      onClick: () => {}
    }
  ];

  return (
    <div 
      style={{ marginTop: '8px', position: 'relative', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'pan-y', userSelect: 'none' }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
    >
      <div style={{ display: 'flex', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${currentIndex * 100}%)`, width: '100%' }}>
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={slide.onClick}
            style={{ minWidth: '100%', boxSizing: 'border-box', background: slide.bg, border: `1px solid ${slide.border}`, borderRadius: '12px', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {idx === 0 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#FDF0E6" stroke={slide.iconColor} strokeWidth="1.5"/>
                    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke={slide.iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9H9.01" stroke={slide.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 9H15.01" stroke={slide.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke={slide.iconColor} strokeWidth="1.5" />
                    <path d="M12 16v-4M12 8h.01" stroke={slide.iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1, paddingRight: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: slide.iconColor === '#E2725B' ? '#B85C4A' : '#2E5B7A', fontWeight: '800', letterSpacing: '-0.3px', wordBreak: 'keep-all' }}>{slide.title}</span>
                <span style={{ fontSize: '0.7rem', color: '#887A75', marginTop: '2px', wordBreak: 'keep-all' }}>{slide.sub}</span>
              </div>
            </div>
            <div style={{ color: slide.iconColor === '#E2725B' ? '#B85C4A' : '#2E5B7A', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
        {slides.map((_, idx) => (
          <div key={idx} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: currentIndex === idx ? '#E2725B' : '#E0E0E0', transition: 'background-color 0.3s ease' }} />
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState('dashboard');
  const [isComposing, setIsComposing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [isAtticChatting, setIsAtticChatting] = useState(false);

  // --- 일회성 데이터 마이그레이션 로직 ---
  // 과거 '비밀의 방앗간'에 저장된 확언 기록을 식별하고 '모닝 확언'으로 이동시킵니다.
  useEffect(() => {
    try {
      const dbStr = localStorage.getItem('Personal_Emotion_DB');
      if (dbStr) {
        let db = JSON.parse(dbStr);
        let modified = false;
        
        db = db.map(record => {
          if (record.trackType === '비밀의 방앗간') {
            console.log("['나의 방' 과거 기록 확인] 내용:", record.text);
            
            // 기존 고민 분석 기록은 ilgan(일간) 데이터나 상당히 긴 AI 분석 텍스트를 갖습니다.
            // 확언 문장(비교적 짧고, ilgan 속성이 없음)인 경우에만 마이그레이션합니다.
            if (!record.ilgan && record.text && record.text.length < 150) {
              console.log(" => 💡 확언 문장으로 판별되어 '모닝 확언'으로 트랙을 변경합니다.");
              record.trackType = '모닝 확언';
              modified = true;
            } else {
              console.log(" => 고민 분석 결과로 판별되어 그대로 유지합니다.");
            }
          }
          return record;
        });

        if (modified) {
          localStorage.setItem('Personal_Emotion_DB', JSON.stringify(db));
          // 초기 마이그레이션 후 새로고침해야 상태에 완벽히 반영됩니다.
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  // -----------------------------------
  const [showOnboardingFeedback, setShowOnboardingFeedback] = useState(false);
  const [onboardingMbti, setOnboardingMbti] = useState('');
  const [visible, setVisible] = useState(false);
  const [trackType, setTrackType] = useState('비밀의 방앗간');
  const [isEnteringRoom, setIsEnteringRoom] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);
  const [miniMapResult, setMiniMapResult] = useState(null);
  const [selfAnalysisResult, setSelfAnalysisResult] = useState('');
  const [aiSections, setAiSections] = useState(null); // { 마음의좌표계, 심층해석, 전문가의제안 }
  const [emotionDB, setEmotionDB] = useState([]);
  const [sajuScores, setSajuScores] = useState([60, 60, 60, 60, 60]);
  const [mirroredPoints, setMirroredPoints] = useState({});
  const [userSession, setUserSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRedirectChecking, setIsRedirectChecking] = useState(
    // DEV(localhost): 팝업 방식이므로 리다이렉트 확인 대기 불필요
    // PROD(배포): 리다이렉트 복귀 후 결과를 받을 때까지 로딩 표시
    import.meta.env.DEV ? false : true
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [vaultKey, setVaultKey] = useState('');

  const goToStep = (targetStep, options = { requireLogin: false }) => {
    if (options.requireLogin) {
      if (authLoading || isRedirectChecking) {
        setToastMsg('로그인 상태를 확인하고 있어요. 잠시만 기다려주세요 🌿');
        setTimeout(() => setToastMsg(''), 2000);
        return;
      }
      if (!userSession || userSession.isAnonymous) {
        setToastMsg('이 기능은 로그인 후 이용할 수 있어요 🌿');
        setTimeout(() => setToastMsg(''), 3000);
        setPendingAction({ type: 'NAVIGATE', target: targetStep });
        setStep('login');
        window.scrollTo(0, 0);
        return;
      }
    }
    setStep(targetStep);
    window.scrollTo(0, 0);
  };

  const executeWithAuth = (actionFn, fallbackTargetStep = null) => {
    if (authLoading || isRedirectChecking) {
      setToastMsg('로그인 상태를 확인하고 있어요. 잠시만 기다려주세요 🌿');
      setTimeout(() => setToastMsg(''), 2000);
      return false;
    }
    if (!userSession || userSession.isAnonymous) {
      setToastMsg('이 기능은 로그인 후 이용할 수 있어요 🌿');
      setTimeout(() => setToastMsg(''), 3000);
      setPendingAction({ type: 'ACTION', fn: actionFn, originalStep: fallbackTargetStep || step });
      setStep('login');
      window.scrollTo(0, 0);
      return false; // Auth required
    }
    return true; // Already authenticated
  };
  const [showVaultPrompt, setShowVaultPrompt] = useState(false);
  const [showCloudNudge, setShowCloudNudge] = useState(false);
  const [existingCloudData, setExistingCloudData] = useState(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('here_my_info');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      name: parsed.name || '', year: parsed.year || '', month: parsed.month || '', day: parsed.day || '',
      ampm: parsed.ampm || '오전', hour: parsed.hour || '',
      maritalStatus: 'single', hasChildren: 'no', concern: '',
      partnerName: '', partnerYear: '', partnerMonth: '', partnerDay: '', selectedGoal: '', customGoal: ''
    };
  });
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  const [isEditingMyInfo, setIsEditingMyInfo] = useState(false);

  // ── Proactive Forecast 훅 ──
  const userMbtiTrait = mbtiTraits[onboardingMbti] || defaultMbtiTrait;
  const proactiveForecast = useProactiveForecast(userSession?.uid ?? null, formData.name, userMbtiTrait);

  const [guideStep, setGuideStep] = useState(0);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showMonthlyNudge, setShowMonthlyNudge] = useState(false);
  const [isLoadingLetter, setIsLoadingLetter] = useState(false);
  // ── White Screen Fix: concernText lifted to parent ──
  const [concernText, setConcernText] = useState('');
  // ── Morning Letter ──
  const [morningLetterText, setMorningLetterText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [morningLetterAI, setMorningLetterAI] = useState(null);   // { letter, affirmation }
  const [isLoadingMorningLetter, setIsLoadingMorningLetter] = useState(false);

  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const pMonthRef = useRef(null);
  const pDayRef = useRef(null);
  const accordionRefs = useRef([]);

  const [isSharedMode, setIsSharedMode] = useState(false);
  const [sharedStep, setSharedStep] = useState('landing');
  const [toastMsg, setToastMsg] = useState('');

  // -- Daily Limit Logic --
  const MAX_DAILY_LIMIT = 3;
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const getTodayKey = () => {
    const d = new Date();
    return `analysis_count_shared_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  };
  const getDailyUsageCount = () => parseInt(localStorage.getItem(getTodayKey()) || '0', 10);
  const incrementDailyUsageCount = () => {
    const c = getDailyUsageCount() + 1;
    localStorage.setItem(getTodayKey(), c);
    return c;
  };
  const [showKnockBox, setShowKnockBox] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [showCrmDialog, setShowCrmDialog] = useState(false);
  const [showHug, setShowHug] = useState(false);
  const [mockFeedbackReceived, setMockFeedbackReceived] = useState(false);
  const [showHighlightTooltip, setShowHighlightTooltip] = useState(false);
  const FALLBACK_EMOTION_CHIPS = ['답답함', '지침', '서운함', '막막함', '외로움', '억울함', '불안함', '무기력함'];

  // ── State Persistence for Concern/Emotions ──
  const [savedConcernData, setSavedConcernData] = useState(() => {
    const saved = sessionStorage.getItem(`here_concern_data_비밀의 방앗간`);
    const parsed = saved ? JSON.parse(saved) : null;
    return (parsed && parsed.text) ? parsed : null;
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(`here_concern_data_${trackType}`);
    const parsed = saved ? JSON.parse(saved) : null;
    setSavedConcernData((parsed && parsed.text) ? parsed : null);
  }, [trackType]);

  const [currentConcernData, setCurrentConcernData] = useState({
    text: '',
    partnerAction: '',
    emotions: [],
    dynamicChips: FALLBACK_EMOTION_CHIPS,
    dynamicQuestion: {
      normal: '이렇게 밖으로 꺼내어 적는 것만으로도 큰 용기랍니다.',
      bold: '지금 나를 가장 지치게 하는 감정을 골라볼까요?'
    },
    isWritingDone: false
  });

  useEffect(() => {
    if (currentConcernData.text.length > 0) {
      sessionStorage.setItem(`here_concern_data_${trackType}`, JSON.stringify(currentConcernData));
      setSavedConcernData(currentConcernData);
    }
  }, [currentConcernData, trackType]);

  useEffect(() => {
    if (step === 'dashboard') {
      setCurrentConcernData({
        text: '',
        emotions: [],
        dynamicChips: FALLBACK_EMOTION_CHIPS,
        dynamicQuestion: { normal: '이렇게 밖으로 꺼내어 적는 것만으로도 큰 용기랍니다.', bold: '지금 나를 가장 지치게 하는 감정을 골라볼까요?' },
        isWritingDone: false
      });
    }
  }, [step]);

  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('Personal_Emotion_DB');
    if (saved) {
      try {
        setEmotionDB(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  // ── Firebase Auth 구독 + 익명 로그인 자동 시작 ──────────────────────────────
  useEffect(() => {
    // 앱 시작 시 익명 로그인 자동 수행 (UID 확보)
    startAnonymousSession();

    // Auth 상태 실시간 구독
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      console.log(`[Auth Debug] onAuthStateChanged 트리거됨. user: ${firebaseUser?.uid}, isAnonymous: ${firebaseUser?.isAnonymous}`);
      setAuthLoading(false);
      if (firebaseUser) {
        setUserSession({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || formDataRef.current.name || null,
          email: firebaseUser.email || null,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        // 비로그인 상태가 되면 즉시 익명 로그인
        startAnonymousSession();
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 리다이렉트 로그인 결과 수신 (PROD 배포 환경 전용, App 마운트 시 1회) ────
  useEffect(() => {
    // DEV(localhost)에서는 팝업 방식을 사용하므로 이 useEffect는 실행하지 않음
    if (import.meta.env.DEV) return;

    const handleRedirectResult = async () => {
      try {
        const result = await checkRedirectAuthResult();
        if (result) {
          setIsSyncing(true);
          const { user, isNewLink, hadConflict } = result;

          if (isNewLink) {
            setToastMsg('✅ 기존 기록을 그대로 유지하며 Google 계정이 연결되었습니다!');
            setTimeout(() => setToastMsg(''), 3000);
          } else if (hadConflict) {
            setToastMsg('이미 연결된 Google 계정으로 로그인했습니다.');
            setTimeout(() => setToastMsg(''), 3000);
          } else {
            const existingCloudDB = await fetchEmotionDBFromCloud(user.uid);
            if (existingCloudDB) {
              setExistingCloudData(existingCloudDB);
              setToastMsg('이전 금고 기록을 발견했습니다. 잠시 후 동기화됩니다.');
              setTimeout(() => setToastMsg(''), 3000);
            }
          }

          setShowCloudNudge(false);
          setShowVaultPrompt(true);

          // 저장해둔 pendingAction 복원
          const savedPendingStr = sessionStorage.getItem('here_pending_action');
          let restoredPending = null;
          if (savedPendingStr) {
            try {
              restoredPending = JSON.parse(savedPendingStr);
              setPendingAction(restoredPending);
              sessionStorage.removeItem('here_pending_action'); // 복원 후 삭제
            } catch (e) {
              console.error('Failed to parse pending action', e);
            }
          }

          // 리다이렉트 복귀 후 모달이 보이도록 화면 이동
          if (restoredPending?.type === 'NAVIGATE') {
            setStep(restoredPending.target);
          } else if (step === 'login' || step === 'landing') {
            setStep('dashboard');
          }
        }
      } catch (error) {
        console.error('[Auth Debug] Google 리다이렉트 로그인 실패:', error);
        setToastMsg('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        setTimeout(() => setToastMsg(''), 3000);
      } finally {
        setIsSyncing(false);
        console.log('[Auth Debug] isRedirectChecking을 false로 변경합니다.');
        setIsRedirectChecking(false); // 리다이렉트 확인 완료
      }
    };

    handleRedirectResult();
  }, []);

  useEffect(() => {
    if (step === 'result') {
      setShowHighlightTooltip(true);
      const timer = setTimeout(() => setShowHighlightTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ── 모닝레터 시작 (감정 선택 혹은 건너뛰기) ──────────────────────────────────────
  const handleStartMorningLetter = (emo = null) => {
    const ilgan = formData.year
      ? calculateIlgan(formData.year, formData.month, formData.day)
      : { name: '목(木)' };
    setIsLoadingMorningLetter(true);
    const recentEntry = [...emotionDB].reverse().find(r => r.text);
    
    const KEYWORD_STORAGE_KEY = 'here_morning_letter_keywords';
    const recentKeywords = JSON.parse(localStorage.getItem(KEYWORD_STORAGE_KEY) || '[]');
    const dateStr = new Date().toLocaleDateString();
    const fallbackTopics = ["우연히 올려다본 하늘", "스스로에게 허락하는 쉼", "계절의 변화가 주는 위로", "아주 작은 성취의 기쁨", "오롯이 나만을 위한 시간"];
    const fallbackTopic = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];

    const briefing = buildBriefing(emotionDB, formData.name);
    const moodWeather = `${briefing.headline} ${briefing.emoji}`;

    fetchGeminiMorningLetter({
      name: formData.name || '',
      ampm: formData.ampm || '',
      elementName: ilgan.name,
      moodWeather,
      dateStr,
      recentLog: recentEntry?.text || undefined,
      fallbackTopic,
      recentKeywords,
      selectedEmotion: emo
    })
      .then(data => { 
        setMorningLetterAI({ letter: data.letter, affirmation: data.affirmation }); 
        if (data.keywords && Array.isArray(data.keywords)) {
          const prev = JSON.parse(localStorage.getItem(KEYWORD_STORAGE_KEY) || '[]');
          const updated = [...prev, ...data.keywords].slice(-15);
          localStorage.setItem(KEYWORD_STORAGE_KEY, JSON.stringify(updated));
        }
      })
      .catch((err) => {
        console.error(err);
        setMorningLetterAI({
          letter: `오늘 하루도 당신은 충분히 빛나고 있습니다.\n작은 것에도 감사할 수 있는 마음이 하루를 더 풍요롭게 만들어 줍니다.\n지금 이 순간, 당신의 내면에는 이미 모든 것이 준비되어 있습니다.\n오늘도 당신만의 속도로, 단단하게 걸어가세요.`,
          affirmation: '나는 오늘도 내 안의 빛을 믿는다.',
        });
      })
      .finally(() => setIsLoadingMorningLetter(false));
  };

  useEffect(() => {
    if (emotionDB.length >= 3 && !userSession && !localStorage.getItem('hasSeenCloudNudge')) {
      const timer = setTimeout(() => {
        setShowCloudNudge(true);
      }, 1800);
      return () => clearTimeout(timer);
    }

    if (step === 'landing' && emotionDB.length > 0) {
      if (emotionDB.length >= 10 && !localStorage.getItem('hasSeenMonthlyLetter')) {
        setShowMonthlyNudge(true);
      }
    }
  }, [emotionDB, userSession, step]);

  // ── Google 계정 연결 / 로그인 ────────────────────────────────────────────────
  const handleCloudLogin = async () => {
    setIsSyncing(true); // 로그인/동기화 시작 로딩 상태 (리다이렉트 전 표시)
    
    // 리다이렉트 되기 전에 보류 중인 액션이 있다면 백업 (PROD 전용)
    if (!import.meta.env.DEV && pendingAction) {
      sessionStorage.setItem('here_pending_action', JSON.stringify(pendingAction));
    }
    
    try {
      const popupResult = await loginWithGoogle();

      // DEV: 팝업 방식 — 즉시 결과 처리
      if (import.meta.env.DEV && popupResult) {
        const { user, operationType, hadConflict } = popupResult;
        const isNewLink = operationType === 'link';

        if (hadConflict) {
          // linkWithPopup 충돌 → signInWithPopup 재시도 성공 케이스
          setToastMsg('이미 연결된 Google 계정으로 로그인했습니다.');
          setTimeout(() => setToastMsg(''), 3000);
        } else if (isNewLink) {
          setToastMsg('✅ 기존 기록을 그대로 유지하며 Google 계정이 연결되었습니다!');
          setTimeout(() => setToastMsg(''), 3000);
        } else {
          const existingCloudDB = await fetchEmotionDBFromCloud(user.uid);
          if (existingCloudDB) {
            setExistingCloudData(existingCloudDB);
            setToastMsg('이전 금고 기록을 발견했습니다. 잠시 후 동기화됩니다.');
            setTimeout(() => setToastMsg(''), 3000);
          } else {
            setToastMsg('✅ Google 계정으로 로그인되었습니다!');
            setTimeout(() => setToastMsg(''), 3000);
          }
        }

        setShowCloudNudge(false);
        setShowVaultPrompt(true);

        // pendingAction 복원
        if (pendingAction?.type === 'NAVIGATE') {
          setStep(pendingAction.target);
        } else if (step === 'login' || step === 'landing') {
          setStep('dashboard');
        }
      }
      // PROD: 리다이렉트 방식 — 페이지가 이동하므로 이후 코드는 실행되지 않음
    } catch (error) {
      console.error('[Auth] Google 로그인 에러:', error);
      setToastMsg('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setTimeout(() => setToastMsg(''), 3000);
      setIsSyncing(false);
    } finally {
      // DEV: 팝업 완료 후 로딩 해제 (PROD는 페이지가 이동해 실행 안 됨)
      if (import.meta.env.DEV) {
        setIsSyncing(false);
      }
    }
  };

  // ── 이메일 인증 처리 ──────────────────────────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    try {
      if (authMode === 'register') {
        const { isNewLink } = await registerWithEmail(authEmail, authPassword);
        const msg = isNewLink
          ? '✅ 기존 기록을 유지하며 이메일 계정이 연결되었습니다!'
          : '✅ 이메일 계정이 생성되었습니다!';
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
      } else {
        await loginWithEmail(authEmail, authPassword);
        setToastMsg('✅ 로그인되었습니다!');
        setTimeout(() => setToastMsg(''), 3000);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setShowCloudNudge(false);
      setShowVaultPrompt(true);
    } catch (error) {
      const errorMessages = {
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다. 로그인을 시도해보세요.',
        'auth/user-not-found': '가입된 이메일이 없습니다. 회원가입을 먼저 해주세요.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
        'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
      };
      setAuthError(errorMessages[error.code] || '인증에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // ── 로그아웃 ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await firebaseLogout();

    // ── 개인화 state 전체 초기화 (처음 앱을 켠 상태로 리셋) ──
    const emptyFormData = {
      name: '', year: '', month: '', day: '',
      ampm: '오전', hour: '',
      maritalStatus: 'single', hasChildren: 'no', concern: '',
      partnerName: '', partnerYear: '', partnerMonth: '', partnerDay: '',
      selectedGoal: '', customGoal: ''
    };
    setFormData(emptyFormData);
    setEmotionDB([]);
    setMorningLetterAI(null);
    setMorningLetterText('');
    setTranscriptText('');
    setSelfAnalysisResult('');
    setAiSections(null);
    setMiniMapResult(null);
    setSajuScores([60, 60, 60, 60, 60]);
    setMirroredPoints({});
    setSavedConcernData(null);
    setCurrentConcernData({
      text: '', partnerAction: '', emotions: [],
      dynamicChips: FALLBACK_EMOTION_CHIPS,
      dynamicQuestion: {
        normal: '이렇게 밖으로 꺼내어 적는 것만으로도 큰 용기랍니다.',
        bold: '지금 나를 가장 지치게 하는 감정을 골라볼까요?'
      },
      isWritingDone: false
    });
    setConcernText('');
    setOnboardingMbti('');
    setStep('dashboard');
    setIsCloudSynced(false);
    setIsEditingMyInfo(false);

    // ── localStorage / sessionStorage 개인 데이터 클리어 ──
    localStorage.removeItem('here_my_info');
    localStorage.removeItem('Personal_Emotion_DB');
                          sessionStorage.removeItem(`here_concern_data_${trackType}`);

    setToastMsg('로그아웃 되었습니다. 익명 모드로 계속 이용할 수 있습니다.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleVaultSubmit = async () => {
    console.log('[Vault] 1. handleVaultSubmit 호출됨 (vaultKey 길이:', vaultKey.length, ')');
    if (vaultKey.length < 4) {
      setToastMsg("금고 열쇠는 최소 4자리 이상 입력해주세요.");
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    setShowVaultPrompt(false);
    setIsSyncing(true);

    let finalEmotionDB = [...emotionDB];
    let isMerged = false;

    try {
      if (existingCloudData) {
        console.log('[Vault] 2. 기존 클라우드 데이터 병합 시도');
        try {
          const decryptedStr = decryptData(existingCloudData, vaultKey);
          console.log('[Vault] 3. 복호화 성공');
          const decryptedCloudDB = JSON.parse(decryptedStr);
          if (Array.isArray(decryptedCloudDB)) {
            const mergedMap = new Map();
            decryptedCloudDB.forEach(item => mergedMap.set(item.id, item));
            finalEmotionDB.forEach(item => mergedMap.set(item.id, item));
            finalEmotionDB = Array.from(mergedMap.values());
            setEmotionDB(finalEmotionDB);
            localStorage.setItem('Personal_Emotion_DB', JSON.stringify(finalEmotionDB));
            isMerged = true;
            console.log('[Vault] 4. 병합 완료 (총 항목 수:', finalEmotionDB.length, ')');
          }
        } catch (decryptError) {
          console.log('[Vault] 복호화 실패 (vaultKey 불일치 가능성):', decryptError);
          setToastMsg("이전 금고의 열쇠와 일치하지 않습니다. 올바른 열쇠를 입력해주세요.");
          setTimeout(() => setToastMsg(''), 3000);
          setIsSyncing(false);
          setShowVaultPrompt(true); // 열쇠를 다시 입력받도록
          return;
        }
      } else {
        console.log('[Vault] 2. 기존 데이터 없음 (병합 생략)');
      }

      console.log('[Vault] 5. 데이터 암호화 시작');
      const encrypted = encryptData(finalEmotionDB, vaultKey);
      console.log('[Vault] 6. Firestore 동기화(syncEmotionDBToCloud) 요청 시작 - uid:', userSession.uid);
      await syncEmotionDBToCloud(userSession.uid, encrypted);
      console.log('[Vault] 7. Firestore 동기화 완료');
      setExistingCloudData(null);
    } catch (e) {
      console.error('[Vault] 동기화 에러 발생:', e);
      setToastMsg("저장에 실패했어요. 다시 시도해 주세요 🌿");
      setTimeout(() => setToastMsg(''), 3000);
      setIsSyncing(false);
      return;
    }

    console.log('[Vault] 8. 마무리 작업(setTimeout) 시작');
    setTimeout(() => {
      setIsSyncing(false);
      setIsCloudSynced(true);
      setToastMsg(isMerged ? "이전 기록과 함께 안전하게 합쳐졌어요 🌿" : "당신의 진심이 다정한 금고에 안전하게 암호화되어 보관되었습니다.");
      setTimeout(() => setToastMsg(''), 3000);
      localStorage.setItem('hasSeenCloudNudge', 'true');
      
      if (pendingAction) {
        if (pendingAction.type === 'NAVIGATE') {
          setStep(pendingAction.target);
        } else if (pendingAction.type === 'ACTION' && typeof pendingAction.fn === 'function') {
          if (pendingAction.originalStep) setStep(pendingAction.originalStep);
          // 자동 저장/실행 이어서 완료
          pendingAction.fn();
        }
        setPendingAction(null);
      } else if (step === 'login') {
        setStep('dashboard');
      }
    }, 1500);
  };


  useEffect(() => {
    if (openIndex !== -1 && accordionRefs.current[openIndex]) {
      setTimeout(() => {
        accordionRefs.current[openIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // Allow DOM to update and any expanding animations to start
    }
  }, [openIndex]);

  useEffect(() => {
    setVisible(true);
    const params = new URLSearchParams(window.location.search);
    const dataObj = params.get('data');
    if (dataObj) {
      try {
        const decodedStr = decodeURIComponent(escape(atob(dataObj)));
        const parsed = JSON.parse(decodedStr);
        setFormData(parsed.formData || {});
        setTrackType(parsed.trackType || '비밀의 방앗간');
        if (parsed.sajuScores) setSajuScores(parsed.sajuScores);
        setIsSharedMode(true);
        setSharedStep('landing');
        setStep('shared_flow');
      } catch (e) {
        console.error("Failed to parse shared data");
      }
    }
  }, []);

  const handleShare = () => {
    const lightweightFormData = { ...formData };
    delete lightweightFormData.concern;
    const payload = JSON.stringify({ formData: lightweightFormData, trackType, sajuScores });
    const encoded = btoa(unescape(encodeURIComponent(payload)));
    const url = window.location.origin + window.location.pathname + '?data=' + encoded;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setToastMsg("나의 마음 지도가 안전하게 봉투에 담겨 복사되었습니다!");
        setTimeout(() => setToastMsg(''), 4000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setToastMsg("나의 마음 지도가 안전하게 복사되었습니다!");
      } catch (err) {
        setToastMsg("링크 생성 완료! 브라우저 주소창을 복사해주세요.");
      }
      document.body.removeChild(textArea);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  useEffect(() => {
    if (step !== 'concern') return;
    let nextStep = guideStep;
    const textLen = currentConcernData.text.length;

    if (guideStep === 0 && (textLen > 15)) nextStep = 1;
    if (guideStep === 1 && (textLen > 40)) nextStep = 2;
    if (guideStep === 2 && (textLen > 70)) nextStep = 3;

    if (nextStep > guideStep) {
      const timer = setTimeout(() => { setGuideStep(nextStep); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentConcernData.text, step, guideStep]);

  const handleTrackSelect = (roomName) => {
    setTrackType(roomName);
    setIsEnteringRoom(true);
    setTimeout(() => {
      if (roomName === '비밀의 방앗간' || roomName === '성장 탐험가') {
        setStep('concern');
      } else {
        setStep('partner_info');
      }
      setIsEnteringRoom(false);
      window.scrollTo(0, 0);
    }, 600);
  };

  const handleBack = () => {
    setIsEnteringRoom(true);
    setTimeout(() => {
      if (step === 'info') setStep('dashboard');
      else if (step === 'type_selection') setStep('dashboard');
      else if (step === 'partner_info') setStep('dashboard');
      else if (step === 'concern') {
        setGuideStep(0);
        setShowWarning(false);
        if (trackType === '비밀의 방앗간' || trackType === '성장 탐험가') setStep('dashboard');
        else setStep('partner_info');
      }
      else if (step === 'result') setStep('concern');
      else if (step === 'morning_letter' || step === 'daily_forecast') setStep('dashboard');
      setIsEnteringRoom(false);
      window.scrollTo(0, 0);
    }, 450);
  };

  const calculateSaju = async () => {
    const myIlgan = calculateIlgan(formData.year, formData.month, formData.day || 1);
    const myEl = myIlgan.element;

    let scores = [20, 20, 20, 20, 20];
    scores[myEl] = 98;
    scores[(myEl + 1) % 5] = 65 + Math.floor(Math.random() * 5);
    scores[(myEl + 4) % 5] = 40 + Math.floor(Math.random() * 5);
    scores[(myEl + 2) % 5] = 15 + Math.floor(Math.random() * 5);
    scores[(myEl + 3) % 5] = 10 + Math.floor(Math.random() * 5);

    setSajuScores(scores);
    setIsLoadingResult(true);

    if (trackType === '비밀의 방앗간') {
      try {
        const textWithEmotions = `${currentConcernData.text || ''} ${(currentConcernData.emotions || []).join(' ')}`;
        const coords = calculateCoordinates(formData, textWithEmotions);
        const quadrantResult = getQuadrantInterpretation(coords.x, coords.y, trackType);
        const coordsDesc = `시간의 초점은 '${coords.x >= 0 ? "지금, 여기" : "어제와 내일"}', 삶의 주도성은 '${coords.y >= 0 ? "이끄는 하루" : "끌려가는 하루"}' 방향 (${quadrantResult.title})`;
        
        const aiJson = await fetchGeminiSelfAnalysis(
          currentConcernData.text,
          currentConcernData.emotions.join(', '),
          formData.name,
          onboardingMbti,
          myIlgan.name,
          coordsDesc
        );
        
        console.log('[DEBUG][AI Response] fetchGeminiSelfAnalysis:', aiJson); // AI 응답 원본 확인용
        
        if (aiJson.statusCode && aiJson.statusCode !== 'NORMAL') {
          setSelfAnalysisResult(aiJson.systemMessage);
          setAiSections({ statusCode: aiJson.statusCode });
        } else {
          // '나의 진심' 영역
          setSelfAnalysisResult(aiJson.empathy_acceptance || '');
          // 심층 분석 3단계 아코디언 섹션
          setAiSections({
            deepAnalysis1: aiJson.deep_analysis_1_voice || '',
            deepAnalysis2: aiJson.deep_analysis_2_inner_child || '',
            deepAnalysis3: aiJson.deep_analysis_3_action || '',
            statusCode: 'NORMAL'
          });
          const newCount = incrementDailyUsageCount();
          setToastMsg(`오늘 3회 중 ${newCount}회 사용했어요 (${MAX_DAILY_LIMIT - newCount}회 남음) 🌿`);
          setTimeout(() => setToastMsg(''), 4000);
        }
      } catch (e) {
        console.error('[SelfAnalysis] API 실패:', e);
        setSelfAnalysisResult('잠시 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
        setAiSections(null);
      }
    }

    // API 응답 완료 후 즉시 결과 화면으로 이동 (강제 타임아웃 제거)
    setIsLoadingResult(false);
                          sessionStorage.removeItem(`here_concern_data_${trackType}`);
    setSavedConcernData(null);
    setStep('result');
  };

  const handleConcernSubmit = () => {
    if (getDailyUsageCount() >= MAX_DAILY_LIMIT) {
      setShowLimitPopup(true);
      return;
    }

    // '나의 방'(비밀의 방앗간): 10자 이상 + 감정 칩 1개 이상 필요
    if (trackType === '비밀의 방앗간') {
      if (currentConcernData.text.length < 10 || currentConcernData.emotions.length === 0) return;
    } else {
      if (currentConcernData.text.length < 30) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4500);
        return;
      }
    }
    calculateSaju();
  };

  const getAge = () => formData.year ? new Date().getFullYear() - parseInt(formData.year) : 20;

  const getSeasonTheme = () => {
    const month = parseInt(formData.month) || 3;
    if (month >= 2 && month <= 4) return { name: 'Spring', main: '#A8E6CF', stroke: '#81C784', text: '봄날' };
    if (month >= 5 && month <= 7) return { name: 'Summer', main: '#FFD3B6', stroke: '#FFAB91', text: '여름날' };
    if (month >= 8 && month <= 10) return { name: 'Autumn', main: '#D4A5A5', stroke: '#A1887F', text: '가을날' };
    return { name: 'Winter', main: '#A8D8EA', stroke: '#90CAF9', text: '겨울날' };
  };

  // --- 통합 상담 엔진 (안전한 변수 전달 스코프 유지) ---

  const analyzeElementDynamics = (text, elementObj) => {
    const t = text || '';
    if (t.match(/화|짜증|분노|미치|억울|폭발/)) {
      const excessStrs = [
        '과열되어 스스로를 태우는 거친 나무',
        '걷잡을 수 없이 매섭게 타오르는 붉은 불길',
        '너무 메말라 쩍쩍 갈라지는 거친 대지',
        '가시처럼 예리하게 날이 서 주변을 베는 금(金)',
        '거칠게 소용돌이치며 범람하는 검은 바다'
      ];
      return { state: '과잉(Excess)', metaphor: excessStrs[elementObj.element] };
    } else if (t.match(/지침|지쳐|피곤|번아웃|무기력|힘들|우울/)) {
      const defStrs = [
        '물이 말라버려 잎이 타들어 가는 나무',
        '차가운 바람에 위태롭게 흔들리는 작은 모닥불',
        '온기를 잃고 차갑게 얼어붙어 안으로 수축하는 흙',
        '무거운 압박에 억눌려 빛을 잃은 원석',
        '바닥이 말라가며 흐르지 못하고 고인 물'
      ];
      return { state: '결핍(Deficient)', metaphor: defStrs[elementObj.element] };
    } else if (/(부질|흐지부지|채찍질|뒤처|불안)/.test(t)) {
      return { state: '재응축(Re-condensing)', metaphor: elementObj.metaphor };
    }
    return { state: '안정/정체(Suppressed)', metaphor: elementObj.metaphor };
  };

  const analyzeProjection = (text) => {
    const t = text || '';
    if (t.match(/버림|외면|혼자|외로|떠날|멀어/)) return "과거 온전히 안기지 못했던 깊은 '유기 불안(Abandonment Anxiety)'이 무의식적으로 방어선에 투사되어";
    if (t.match(/무시|인정|평가|억울|비교/)) return "어린 시절 충분히 존중받지 못했던 내면 아이의 핵심 감정이 덧씌워져 상대에게 극렬히 '전이(Transference)'되어";
    if (t.match(/위협|통제|내 맘대로|답답|간섭/)) return "자율성을 크게 침해당했던 과거의 억압적 경험에 대한 강렬한 방어 기제가 투사되어 작동하며";
    return "가장 깊이 믿었던 이에게조차 안전하게 기대어 쉴 수 없을 것 같다는 무서운 '애착 불안'이 역작동하여";
  };

  const analyzeDifferentiation = (text) => {
    const t = text || '';
    if (t.match(/미치|무시|계속 생각|못살|미워|죽겠/)) return "지금의 혼란은 나를 잃어버린 것이 아니라, 타인과 밀착되었던 낡은 관계 방식에서 벗어나 나만의 고유한 자기 확신의 근육을 키워가는 '건강한 분화(Differentiation)'의 시작점에 서 있다는 증거입니다.";
    return "이 감정적 요동은 결코 나약함이 아닙니다. 외부 반응에 종속되지 않고 스스로의 내면을 지탱할 수 있는 독립된 경계선을, 단단한 근육통과 함께 세워가는 '분화(Differentiation)'의 치열한 과정입니다.";
  };

  const analyzeSpecificContext = (text) => {
    const t = text || '';
    if (/(교육|학원|성적|아이|육아|애들)/.test(t) && /(남편|신랑|애\s*아빠|배우자)/.test(t) && /(부딪|갈등|싸우|마찰|다름|비난|간섭|화내)/.test(t)) {
      return 'parenting_conflict';
    }
    return 'general';
  };

  const extractEmotion = (text) => {
    if (!text) return '무거운 답답함';
    if (text.match(/화|짜증|분노|미치|억울|무시/)) return '분노와 짜증';
    if (text.match(/불안|걱정|두렵|초조|무서/)) return '불안과 초조함';
    if (text.match(/지침|지쳐|피곤|번아웃|무기력|힘들/)) return '번아웃(소진)';
    return '짙은 슬픔과 답답함';
  };

  const analyzeYearningHolistic = (text) => {
    const t = text || '';
    if (t.match(/존중|인정|가치|칭찬/)) return "부당함에 타협하지 않고 나의 고유한 가치를 증명해내려는 투명한 열망";
    if (t.match(/사랑|애정|여전히/)) return "가볍게 스치는 관계가 아닌, 타인과 깊게 공명하고 싶은 따뜻한 인격의 발현";
    if (t.match(/위로|위안|이해|알아/)) return "스스로의 상처를 방치하지 않고 오롯이 끌어안고 치유하려는 진지한 자기애";
    if (t.match(/안도|안전|편안|불안|겁/)) return "더 나은 삶의 기반을 만들기 위해 안주하지 않고 스스로를 묻는 건강한 긴장감";
    return "홀로 길을 개척하는 리더가 겪는 고귀하고 단단한 성장통";
  };

  const extractRole = (text) => {
    const t = text || '';
    if (/(회사|업무|출근|퇴근|이직|직장|마케팅|성과|팀장|회의|프로젝트)/.test(t)) return '치열하게 고민하는 실무자';
    if (/(과제|학업|시험|공부|성적|취업|졸업|대학|스펙)/.test(t)) return '미래를 준비하는 학생';
    if (/(육아|아이|애들|엄마|남편|시댁|가족|어린이집|등원)/.test(t)) return '가정을 지키려 애쓰는 엄마';
    return '일상의 책임을 묵묵히 다하는 어른';
  };

  const buildSection1 = (concern, elementObj, userName, deepestYearning) => {
    const dynamics = analyzeElementDynamics(concern, elementObj);
    const context = analyzeSpecificContext(concern);
    const role = extractRole(concern);

    let descText = `먼저 조용히 곁에 앉아 쓰다듬듯 글을 읽어보았습니다. 뾰족하고 거칠게 일렁이는 그 감정들을 섣불리 긍정으로 덮거나 억누르지 마세요. 불안하고 지친 그 마음 그대로 이곳에 꺼내두셔도 완벽히 안전합니다.\n\n표면의 일렁이는 파도 아래, ${userName}님의 깊은 심해 속에는 **'${deepestYearning}'**이 굳건히 자리하고 있습니다. 사연 속 감정의 온도를 살펴보니, 현재 ${userName}님의 내면 기운은 본연의 투명함을 넘어 **'${dynamics.metaphor}'**처럼 ${dynamics.state} 상태에서 치열하게 중심을 잡아가고 있습니다.\n\n이는 **'${role}'**으로서 삶의 자리를 진심으로 아끼고 책임을 다하려는 그 뜨거운 열정 때문입니다. 삶을 아무렇게나 대충 살고 싶지 않다는 그 진지한 태도가, 때로는 남들보다 더 묵직한 마찰열을 만들어내고 있는 것이지요.\n\n오늘 당장 이 복잡한 마음의 원인을 찾아내거나 문제를 완벽하게 통제하려 머리를 쓰지 마세요. 우리는 아직 안개 속에 머물러 있지만, 이 모호함을 섣불리 규정짓지 않고 그저 견뎌내는 당신은 이미 충분히 안전하고 유능합니다.`;

    if (context === 'parenting_conflict') {
      descText = `먼저, 가족이라는 가장 가깝고도 어려운 관계 속에서 혼자 삭여야 했던 답답함과 불안한 마음을 이곳에 온전히 내려놓으셔도 좋습니다. 성급한 조언을 하기보다, ${userName}님이 느끼는 그 묵직한 감정들을 가장 안전하게 담아두겠습니다.\n\n이 충돌은 단순한 고집싸움이나 서로에 대한 실망이 아닙니다. 부모로서 '아이를 올바르게 보호하고 사랑하는 방식'이 첨예하게 엇갈린 결과이며, 가족을 지키려는 **'가정을 지키려 애쓰는 엄마'**로서의 뜨거운 책임감의 발로입니다.\n\n${userName}님의 심해 속에는 아이가 스스로 일어설 힘을 믿고 기다려주는 **'자율성이라는 거대한 조력'**의 열망이 자리 잡고 있습니다. 일상의 마찰을 견디며 이 과정을 혼자 감당해온 것은, 결코 포기할 수 없는 진지한 사랑 때문입니다.\n\n오늘 당장 누가 옳았고 누가 틀렸는지 결론을 내리거나 상황을 통제하려 머리를 쓰지 마세요. 우리는 아직 이 갈등의 안개 속에 머물러 있지만, 당신은 이미 아이와 가족을 위해 치열하게 고민하는 훌륭하고 유능한 부모입니다.`;
    }

    return {
      title: `열망의 발견: ${userName}님의 깊은 바닷속 일기`,
      desc: descText
    };
  };

  const buildSection2 = (myElementObj, partnerElementObj, roomName, userName, concernText) => {
    const context = analyzeSpecificContext(concernText);
    const role = extractRole(concernText);

    if (roomName === '성장 탐험가') {
      const myEl = myElementObj.element;
      const elementMotivations = [
        "멈추지 않고 위로 뻗어가려는 직선적인 성장 본능", // 목
        "주변을 밝히고 맹렬하게 타오르려는 역동적인 열정", // 화
        "모든 것을 품고 책임지려는 무겁고 진지한 수용력", // 토
        "가장 투명하고 완벽한 나만의 원칙을 세우려는 예리함", // 금
        "어떤 틀에도 갇히지 않고 깊게 흘러가려는 지혜와 자유" // 수
      ];

      return {
        title: `기운의 점검: 나의 고유한 에너지 모터 확인하기`,
        desc: `명리학의 관점에서 ${myElementObj.metaphor}의 기운을 가진 ${userName} 탐험가님. 지금 느끼는 답답함이나 버거움은 결코 약해서가 아니라, 당신 고유의 **'${elementMotivations[myEl]}'**이 현실의 속도나 제약과 강하게 부딪치면서 발생하는 **'엔진 소음'**일 뿐입니다.\n\n이 혼란스러운 시기는 멈춤이 아닙니다. 다음 도약을 위해 나의 기운을 가장 폭발적으로 응축시키는 게임의 세이브 포인트(Save Point)입니다.\n\n왜 이렇게 힘든지 자책하며 에너지 바를 소모하지 마세요. 불확실성 속에 묵묵히 머무르는 것만으로도 당신은 이미 다음 레벨로 나아갈 준비가 된 훌륭한 플레이어입니다.`
      };
    }

    if (roomName !== '비밀의 방앗간' && partnerElementObj) {
      const myEl = myElementObj.element;
      const ptEl = partnerElementObj.element;
      let theoryTerm = '';
      let natureMetaphor = '';

      if (myEl === ptEl) {
        theoryTerm = '비화(比和, 서로 힘을 묵묵히 보태는 숲)';
        natureMetaphor = '마치 넓은 파도와 파도가 만나 하나의 큰 바다를 이루듯, 서로의 찰랑이는 감정을 거울처럼 알아채며 단단하게 연대하는 역량입니다.';
      } else if (ptEl === (myEl + 1) % 5 || myEl === (ptEl + 1) % 5) {
        theoryTerm = '상생(相生, 에너지를 끝없이 순환시키는 생명력)';
        natureMetaphor = '단비가 대지를 적시고 장작이 불꽃을 피우듯, 서로의 잠재력을 눈부시게 폭발시키는 압도적인 조력의 역량입니다.';
      } else {
        theoryTerm = '상극(相剋, 서로 다듬어가는 투명한 조각상)';
        natureMetaphor = '서로 다름으로 인해 부딪히는 이 마찰은 상대방의 시야를 강제로 확장시켜 극단적으로 좁아지는 것을 막아주는, 가장 건강하고 성숙한 성장의 촉매제입니다.';
      }

      let descText = `명리학의 관점에서 두 분의 갈등은 관계의 실패가 아니라, **'${theoryTerm}'**이라는 역동을 통해 서로를 한 차원 높이 끌어올리는 주도적인 훈련의 과정입니다.\n\n${natureMetaphor}\n\n상대의 거칠거나 무심한 행동은 성격적 결함이나 당신을 향한 공격이 아닙니다. 그것은 자신의 두려움과 상처를 감추고 **'자신을 지키기 위한 방어 기제'**일 뿐입니다. 마찰이 생겼다는 것은 두 사람 모두 관계를 포기하지 못해 미숙하게나마 애착의 신호를 보내고 있다는 가장 강력한 증거입니다. 당장 오해를 다 풀지 못해 답답하더라도, 이 흔들림 속에 머무르는 당신은 이미 타인의 이면을 깊게 공명할 준비가 된 유능한 어른입니다.`;

      if (context === 'parenting_conflict') {
        descText = `남편분은 촘촘한 울타리로 가족의 **'안전지대'**를 구축하는 방식을, ${userName}님은 물처럼 유연하게 자율성을 부여하는 방식을 선택했을 뿐입니다.\n\n서로의 방식이 부딪히는 것은 누구 하나가 틀려서가 아닙니다. 그 밑바닥에는 가족을 지켜내고자 하는 치열한 **'결핍된 욕구'**와 **'표현하지 못한 애착의 신호'**가 방어 기제 형태로 표출되고 있을 뿐입니다. **'${theoryTerm}'**의 역동 속에서 다름을 견뎌내는 당신은 이미 충분히 훌륭하고 안전한 부모입니다.`;
      }

      return {
        title: `기운의 어울림: 상반된 방어 기제가 만들어내는 단단한 균형`,
        desc: descText
      };
    } else {
      const myEl = myElementObj.element;
      const elementBurnout = [
        "멈추지 않고 위로 곧게 뻗어나가려는 성장의 본능이 일시적으로 한계에 부딪혔을 때 느끼는 수축감", // 목
        "세상을 밝히기 위해 내 안의 연료를 한계치까지 맹렬히 태워버린 뒤 찾아오는 열정의 소진", // 화
        "주변의 모든 것을 내가 품고 책임지려다 발생한, 무겁고 진지한 대지의 무게감", // 토
        "스스로 정해둔 가장 예리하고 완벽한 원칙의 기준에 나 자신마저 베여버린 투명한 상처", // 금
        "깊고 유연하게 흘러가고 싶지만, 현실의 둑에 막혀 감정이 깊이 고여버린 고요한 침전" // 수
      ];

      return {
        title: `기운의 점검`,
        desc: `명리학의 관점에서 ${myElementObj.metaphor}의 기운을 가진 ${userName} 님. 지금 스스로 '최대한의 노력을 하지 않고 있다', '너무 쉽게 지친다'며 다그치는 그 속상함은, 역설적으로 **${elementBurnout[myEl]}**의 흔적입니다. 삶을 책임지기 위해 내면의 에너지를 끝까지 연소시켜본 숭고한 성취가(High Achiever)의 증거입니다.\n\n에너지가 잠시 안으로 모이고 웅크리는 이 시기는 나태함이 아닙니다. 다음 도약을 위해 내면의 밀도를 가장 단단하게 압축하는 주도적인 선택의 시간입니다.\n\n왜 멈춰 섰는지 이유를 당장 찾으려 자책하지 마세요. 에너지가 바닥났다는 불확실함 속에 그대로 멈춰 서 있어도 당신의 세계는 무너지지 않습니다. 웅크림조차 덤덤히 수용할 수 있는 당신은 이미 충분히 안전하고 유능한 리더입니다.`
      };
    }
  };

  const buildSection3 = (emotion, roomName, userName, concernText, myElementObj) => {
    const diffText = analyzeDifferentiation(concernText);
    const myEl = myElementObj.element;

    const elementDesires = [
      "스스로 곧게 자라나고 성취하려는 강인한 열망", // 목
      "타인과 세상을 따뜻하게 밝히고 맹렬히 인정받으려는 열망", // 화
      "모두를 안전하게 품어내고 변함없는 안식처가 되려는 열망", // 토
      "누구보다 투명하고 완벽한 기준을 세상에 증명하려는 열망", // 금
      "어디에도 얽매이지 않고 자유롭게 감정을 흘려보내려는 열망" // 수
    ];

    switch (roomName) {
      case '성장 탐험가':
        return {
          title: `마음의 지도: '독립의 근육통'을 견뎌내는 당당한 퀘스트`,
          desc: `지금 마음속에서 충돌하는 이 거친 감정들은 단순한 '반항'이나 엇나감이 아닙니다. 부모님의 안전지대에서 벗어나 **[${myElementObj.name} 기운의 ${elementDesires[myEl]}]**을 확립해 나가는 **'건강한 독립을 위한 근육통'**입니다.\n\n어른들의 눈에는 불안해 보일지라도, 당신의 뇌는 지금 가장 위대한 자아를 건축하기 위해 치열하게 **'공사 중'**입니다. 이 공사 소음과 파편들을 부끄러워하지 마세요.\n\n당장 완벽한 모습으로 증명해야 한다는 압박감을 내려놓아도 좋습니다. 지금 겪는 모든 혼란은 당신만의 멋진 세계를 세우기 위해 반드시 거쳐야 할 필수 퀘스트이며, 당신은 이 퀘스트를 가장 잘 수행하고 있는 훌륭한 탐험가입니다.`
        };
      case '다정한 식탁':
        return {
          title: `마음의 지도: 빙산 아래 숨겨진 애착의 신호와 조율`,
          desc: `사티어(Satir) 빙산 모델을 통해 내면을 살펴보면, 수면 위로는 **'${emotion}'**의 파도가 치고 있지만, 빙산 기저에는 상대의 비난조차도 사실은 '나를 알아봐 달라'는 깊이 결핍된 욕구이자 간절한 **'표현하지 못한 애착의 신호(불안, 외로움)'**가 고여 있습니다.\n\n당신의 내면에 숨겨진 **[${myElementObj.name} 기운의 ${elementDesires[myEl]}]**이 거친 방어 기제로 표출되었을 뿐입니다. 상대의 날 선 행동 역시 그들만의 두려움을 감추기 위한 거울일 뿐입니다. ${diffText}\n\n상대방의 마음이 어떤지, 우리가 왜 엇나가는지 지금 당장 분석을 완료하려 애쓰지 마세요. 엇갈림의 한가운데서 그 아픔을 직시하고 머무르는 것, 그것이 당신의 압도적인 공감 지능이자 가장 성숙한 사랑의 증명입니다.`
        };
      case '나를 지키는 울타리':
        return {
          title: `마음의 지도: 대상관계와 '건강한 경계선'을 수호하려는 방어기제`,
          desc: `대상관계이론을 통해 살펴보면, 수면 위로는 **'${emotion}'**이 솟아오르고 짜증이 맴돌지만, 상대의 무례함이나 날 선 반응은 당신의 잘못이 아닙니다. 그것은 그들 스스로 감당하지 못한 취약성을 숨기려 작동한 거친 **'방어 기제'**일 뿐입니다.\n\n이 스트레스는 모난 성격의 증거가 아닙니다. 당신의 내면 깊은 곳에 자리한 **[${myElementObj.name} 기운의 ${elementDesires[myEl]}]**이 온전히 존중받지 못했을 때 보내는 건강한 경보음입니다. ${diffText}\n\n저 사람이 왜 무례한지 파고들며 정답을 찾지 마세요. 무례함의 모래바람 속에서도 나의 단단한 경계선을 지켜내고 묵묵히 서 있는 것, 그것이 당신이 외부 소음에 휩쓸리지 않는 유능한 어른이라는 가장 명확한 증거입니다.`
        };
      default: // '비밀의 방앗간'
        let icebergDesc = `사티어(Satir) 모델로 들여다보는 당신의 빙산 가장 아래에는, 남이 씌운 굴레가 아니라 나 스스로 부여한 묵직한 성장의 기대가 자리하고 있습니다. 당신 고유의 **[${myElementObj.name} 기운이 가진 ${elementDesires[myEl]}]**이 세상의 잣대와 치열하게 부딪치고 있는 것입니다.\n\n이 혼란스러운 **'${emotion}'**은 나약함이 아닙니다. ${diffText}\n\n현실의 잣대와 나의 성취 기준이 충돌하는 이 과정은, 내면의 자아가 세상에 단단히 뿌리내리기 위해 고군분투하는 진지한 생존법입니다. 삶을 그토록 뜨겁게 사랑하고 책임을 다하기에 겪는 당연한 통증이자 성취입니다.`;

        icebergDesc += `\n\n지금 나의 방향이 맞는지, 내가 과연 잘하고 있는 것인지 당장 확인받으려 헤매지 마세요. 알지 못함의 여백을 스스로에게 허락하세요. 이 안개 낀 불확실함 속에 잠시 멈춰 서 있어도 당신은 이미 삶을 책임질 줄 아는 완벽히 유능하고 단단한 리더입니다.`;

        return {
          title: `마음의 지도: 높은 기준과 멈춤을 허락하지 않는 단단한 책임감`,
          desc: icebergDesc
        };
    }
  };

  const buildSection4 = (roomName, userName, concernText) => {
    const context = analyzeSpecificContext(concernText);

    if (context === 'parenting_conflict' && roomName !== '비밀의 방앗간') {
      return {
        title: `치유의 목소리: 오해를 허물고 자율성을 번역하는 단단한 호흡`,
        desc: `가장 먼저 척추를 곧게 세우고 발바닥이 바닥에 닿는 묵직한 감각을 느껴보세요. 그리고 세 번의 아주 깊은 심호흡으로 뇌에 산소를 공급하며 몸의 긴장을 풉니다.\n\n그라운딩이 되었다면, 비난이 아닌 이성적이고 차분한 언어로 나의 확신을 선언하세요. **"내가 아이를 풀어두는 건 방관이 아니라, 스스로 일어서는 힘을 키우도록 꾹 참고 기다려주는 중이야. 이 단단한 기다림을 알아줬으면 해."**\n\n상대가 이 말을 바로 이해하지 못하더라도 당황하거나 억울해하지 마세요. 우리는 아직 과정 속에 있습니다. 즉각적인 이해를 받지 못하는 모호함 속에서도, 당신의 교육관과 부모로서의 유능함은 이미 완벽하게 안전합니다.`
      };
    }

    switch (roomName) {
      case '다정한 식탁':
        return {
          title: `치유의 목소리: 'I-Message'로 진심을 전하는 안전한 호흡`,
          desc: `무엇을 말하기 전, 어깨를 귀까지 한껏 올렸다가 내쉬는 숨에 툭 떨어뜨리며 뭉친 긴장을 풀어냅니다. 숨이 배 아래까지 깊게 내려가는 것을 물리적으로 확인하세요.\n\n그리고 가장 단단하고 부드러운 어조로 말해보세요. **"나 사실, 당신이 자꾸 멀어진 것 같다고 느낄 때마다 내가 작아지는 것 같아 두려웠어."** 가장 솔직한 나의 연약함을 꺼내는 것이야말로 가장 압도적인 자기 확신의 증명입니다.\n\n상대의 반응이 내 기대와 달라도 괜찮습니다. 관계의 완전한 회복이라는 정답이 당장 주어지지 않는 텅 빈 공간에 머물러도, 당신의 진심은 훼손되지 않으며 당신은 이미 충분히 성숙하고 안전합니다.`
        };
      case '나를 지키는 울타리':
        return {
          title: `치유의 목소리: 단호함과 부드러움을 담은 '건강한 경계선' 선언하기`,
          desc: `말을 되뇌기 전에, 지금 앉아있는 의자의 묵직한 등받이에 몸을 완전히 기대어 내 체중을 온전히 지탱하는 감각에 5초간 집중해 보세요.\n\n감정을 뺀 담백한 오피스 톤으로 선언하세요. **"상황과 다르게 함부로 평가하시니 유감입니다. 선을 지켜주시면 좋겠습니다."** 구구절절 해명하지 않는 명확한 선언이 나의 경계선을 가장 강하게 방어합니다.\n\n상대가 사과하지 않거나 상황이 바로 깔끔해지지 않더라도 그 불쾌함 속에 그대로 머무르세요. 그들이 내 가치를 당장 인정하지 않는다는 불확실함 속에서도 당신의 능력과 평화는 완벽히 안전하게 보장되어 있습니다.`
        };
      default: // '비밀의 방앗간'
        return {
          title: `치유의 목소리: 두 발을 땅에 딛고 스스로에게 건네는 안전한 선언`,
          desc: `과거의 자책이나 미래의 불안으로 떠내려가려는 마음을 지금, 여기로 데려옵니다. 두 발바닥이 바닥에 단단히 닿아 나를 지탱하고 있는 물리적 감각을 5초간 온전히 느껴보세요.\n\n그리고 나 자신에게 단호하게 소리 내어 말해주세요. **"성과나 속도가 어찌 되든 넌 이미 치열하게 삶을 감당하는 훌륭한 어른이야. 불안함 속에서도 오늘 하루를 버텨낸 내가 여기에 있어."**\n\n내일 당장 눈에 띄는 변화가 없어도 좋습니다. 확신이 100% 채워지지 않은 모호함 속에서도, 당신은 하루의 책임을 묵묵히 다해내는 가장 안전하고 유능한 존재입니다.`
        };
    }
  };

  const buildSection5 = (roomName, userName, concernText) => {
    const diffDiagnosis = analyzeDifferentiation(concernText);
    const context = analyzeSpecificContext(concernText);

    if (context === 'parenting_conflict' && roomName !== '비밀의 방앗간') {
      return {
        title: `행동 지침: 3초의 체온으로 세우는 우리의 새로운 안전기지`,
        desc: `논리와 설득을 내려놓고 가장 원초적인 감각에 집중합니다. 어색하게 마주앉기 전, 어떤 말이나 이유 없이 딱 3초만 남편 분의 손등을 덮어 포개 잡거나 어깨를 감싸 쓸어내려 주세요.\n\n이 짧은 접촉이 당장 마법처럼 갈등을 끝내주리란 조급한 기대를 버리세요. 얼어붙은 분위기 속에 어색하게 손을 맞잡고 있는 그 불확실하고 고요한 여백 속에서도, 당신은 관계의 주도권을 쥔 유능한 사람입니다.`
      };
    }

    switch (roomName) {
      case '다정한 식탁':
        return {
          title: `행동 지침: 3초의 스킨십으로 서로의 방어벽 녹이기`,
          desc: `타인의 감정을 분석하려던 머리의 스위치를 끄고 몸의 온기에 집중합니다. 어색한 공기 속에서 먼저 상대의 손등을 덮어 잡거나 어깨를 가만히 쓸어내리는 3초의 물리적 스킨십을 실행해 보세요.\n\n스킨십 이후에 상대가 곧바로 웃어주지 않아도 괜찮습니다. 민망함과 정적이 흐르는 그 모호한 찰나를 피하지 않고 견뎌내는 당신은 이미 관계를 부드럽게 리드할 수 있는 안전하고 성숙한 성인입니다.`
        };
      case '나를 지키는 울타리':
        return {
          title: `행동 지침: 물리적 후퇴를 통한 내면의 그라운딩(Grounding)`,
          desc: `불쾌한 자극이 스칠 때 즉각적으로 반격하지 말고, 물리적으로 한 걸음 뒤로 물러서거나 의자 깊숙이 등을 기대세요. 발바닥이 바닥에 닿는 묵직한 감각을 느끼며 느리게 심호흡을 3번만 반복합니다.\n\n반박하지 않아서 속이 답답하거나 졌다는 느낌이 들 수 있습니다. 하지만 통쾌한 결론을 내리지 않고 그 불편한 정적 속에 머무르는 것, 그 알지 못함의 공간이야말로 당신이 외부 소음에 휩쓸리지 않는 유능한 어른임을 증명하는 가장 안전한 영토입니다.`
        };
      default: // '비밀의 방앗간'
        const isIntrovert = /I|i/i.test(concernText);
        const hasRelationalFatigueLocal = /지침|사람|초대|모임|기가 뺏김|피로|기빨/.test(concernText);

        if (isIntrovert && hasRelationalFatigueLocal) {
          return {
            title: `행동 지침: 감각 차단형 휴식을 통한 신경계 안정`,
            desc: `오늘 당신에게 필요한 것은 성찰이 아니라 신경계의 안정입니다. 스마트폰을 다른 방에 두고 따뜻한 흐르는 물에 두 손을 씻으며, 물의 온도와 피부에 닿는 마찰감에만 3분간 완전히 몰입해 보세요.\n\n쉬는 동안 '이 시간에 무언가 생산적인 일을 해야 하는데'라는 불안감이 올라와도, 그 생각의 끝을 따라가 결론을 내리려 하지 마세요. 아무것도 해결되지 않은 채 물소리만 듣고 있는 이 불확실한 멍함 속에서도 당신의 세계는 완벽하게 안전합니다.`
          };
        }

        return {
          title: `행동 지침: 호흡을 통한 그라운딩(Grounding)과 머무름`,
          desc: `스마트폰과 업무 리스트의 전원을 끄고, 가장 편안한 자세로 누워 자신의 숨이 배를 타고 오르내리는 물리적 부피감에만 온전히 집중해 보세요.\n\n가시적인 성과가 없다는 초조함이 밀려와도 그 답답함에 맞서지 마세요. 불확실성을 억누르지 않고 온전히 비어 있는 10분을 고요히 버텨내는 것, 그 막막함 속에 덤덤히 머무르는 당신은 이미 내일을 주도할 수 있는 가장 단단하고 훌륭한 능력을 입증한 것입니다.`
        };
    }
  };

  const buildSection6 = (roomName, userName, concernText) => {
    const context = analyzeSpecificContext(concernText);

    if (roomName === '성장 탐험가') {
      return {
        title: `마음 진정 숏폼 명상 가이드 (60초)`,
        desc: `지금 겪고 있는 막막함은 그저 방황이 아닙니다. 더 깊고 넓은 나만의 세계를 세우기 위한 성취가(High Achiever)의 **'건강한 확장통'**입니다. 이 확장을 돕기 위해 전문가가 제안하는 가이드를 가만히 시도해 보세요.\n\n**1. 상상 속 엔진 다이얼 줄이기 (시각적 분리)**\n눈을 감고 머릿속을 맴도는 타인의 압박감을 '소음'으로 시각화한 뒤, 볼륨 다이얼을 돌려 줄여보세요. 이 분리 작업은 외부 소음에 휩쓸리지 않는 가장 단단한 내면의 방패가 됩니다.\n\n**2. 60초의 심호흡 (신경계 안정)**\n코로 들이마시며 나의 가능성을 채우고, 입으로 길게 내쉬며 불안을 뱉어냅니다. 깊은 호흡은 각성된 교감신경을 부드럽게 안정시켜, 진짜 내 마음의 소리를 들을 수 있게 해주는 과학적인 이완법입니다.\n\n**3. 나 자신에게 건네는 확신의 한마디 (내면의 비춤)**\n"나는 완벽하지 않아도 이미 온전해."라고 스스로에게 소리 내어 말해주세요. 타인의 평가가 아닌 나 스스로를 타당화(Validation)할 때, 당신의 모험은 가장 단단한 궤도 위에 오릅니다.`
      };
    } else if (roomName === '비밀의 방앗간') {
      return {
        title: `온전한 나를 위한 다정한 행동 지침`,
        desc: `지금 느끼는 피로감은 당신이 부족해서가 아니라, 더 나은 삶을 향해 멈추지 않고 달려온 성취가(High Achiever)의 **'무거운 훈장'**입니다. 스스로를 돌보기 위해, 전문가의 시선으로 조심스럽게 건네는 제안을 가만히 시도해 보세요.\n\n**1. "오늘 하루, 잘 버텨냈어" (자기 타당화)**\n완벽하지 않았던 오늘 하루의 내 모습을 비난하지 않고 있는 그대로 인정해 주세요. 이 타당화(Validation) 과정은 내면의 방어벽을 허물고 억눌렸던 진짜 에너지를 끌어올리는 강력한 회복의 시작입니다.\n\n**2. 텅 빈 15분 허락하기 (의도적 정지)**\n아무것도 하지 않고 가만히 허공을 바라보는 15분을 나에게 허락하세요. 이 의도적인 멈춤은 나태함이 아니라, 엉켜버린 뇌의 스위치를 끄고 새로운 통찰을 받아들이는 가장 적극적인 휴식입니다.\n\n**3. 나를 위한 감각 격리 (내면의 비춤)**\n세상과 타인을 챙기기 전에 무조건 나부터 챙겨주세요. 스마트폰을 끄고 시원한 물 한 잔의 온도에 집중하는 짧은 격리만으로도, 당신의 고갈된 신경계는 놀라울 만큼 빠르게 제자리를 찾을 것입니다.`
      };
    } else {
      let whyText = `지금의 이 갈등은 서로가 미워서가 아닙니다. 관계를 포기하지 않고 더 깊이 연결되고 싶은 성취가(High Achiever)의 **'아픈 노력'**입니다.`;

      if (context === 'parenting_conflict') {
        whyText = `아이 교육이나 양육 방식으로 겪는 이 갈등은 당신이 부족해서가 아닙니다. 아이를 하나의 독립된 인격체로 존중하며 최선을 다하고 싶은 당신의 **'높은 사랑의 기준'**이 빚어낸 건강한 마찰열입니다.`;
      } else if (roomName === '나를 지키는 울타리') {
        whyText = `관계의 소음 속에서 겪는 이 피로감은 나약함이 아닙니다. 타인의 감정을 섬세하게 읽어내며, 동시에 나의 경계선도 건강하게 지켜내려는 성취가(High Achiever)의 **'치열한 균형 잡기'**입니다.`;
      }

      return {
        title: `우리 사이를 잇는 다정한 행동 지침`,
        desc: `${whyText} 두 분이 조금 더 부드럽게 연결될 수 있도록, 전문가의 시선으로 조심스럽게 건네는 제안을 가만히 시도해 보세요.\n\n**1. "내가 어떻게 해주길 바랐어?" (판단 없이 응시하기)**\n상대의 날 선 말꼬리를 잡는 대신 담담히 물어봐 주세요. 평가가 배제된 이 다정한 호기심은 상대의 뾰족한 방어 기제를 허무는 가장 강력한 심리적 무기입니다.\n\n**2. 3초의 침묵과 시선 맞추기 (비언어적 공명)**\n반박하려던 입을 다물고 상대의 눈을 3초간 가만히 응시해 보세요. 이 짧은 침묵과 시선 교환은 뇌의 투쟁-도피 반응을 잠재우고 '나는 너를 공격하지 않는다'는 가장 안전한 신호를 전달합니다.\n\n**3. 나를 위한 15분의 감각 격리 (내면의 비춤)**\n관계를 풀기 전에 반드시 나부터 회복해야 합니다. 방에 들어가 모든 소음을 차단하고, 시원한 물 한 잔의 온도에만 집중해 보세요. 나의 에너지가 충전되어야만 얽혀있는 관계의 지도도 훨씬 선명하게 보일 것입니다.`
      };
    }
  };

  const generateSectionTitles = (text, name, trackType) => {
    const textStr = text || '';
    const hasRelationalFatigue = /지침|사람|초대|모임|기가 뺏김|피로|기빨/.test(textStr);
    const hasHierarchyKeyword = /인사|무시|위치|아래|서열|눈치|위계|자존심/.test(textStr);

    const mbtiRegex = /([I|E|i|e][S|N|s|n][T|F|t|f][J|P|j|p])/g;
    const mbtisRaw = textStr.match(mbtiRegex) || [];
    const mbtis = [...new Set(mbtisRaw.map(m => m.toUpperCase()))];
    const hasPersonalityKeyword = /MBTI|성격|성향|변화|당황|반반|정체성|믿어도 될지/i.test(textStr);

    const hasBurnoutKeyword = /지침|지쳐|피곤|번아웃|무기력|힘들|우울|눈물/.test(textStr);
    const hasFutureKeyword = /미래|불안|앞날|막막|진로|취업|걱정|두려/.test(textStr);
    const hasParenting = /교육|육아|애들/.test(textStr) && /남편|신랑|배우자/.test(textStr) && /부딪|싸우|비난/.test(textStr);

    let title1 = `내면의 나침반: 스스로에게 더 높은 기준을 두고 나아가고 싶은 성실한 열망`;
    let title2 = `기운의 점검: 속도보다 방향을 고민하며 잠시 숨을 고르는 단단한 시간`;
    let title3 = `성찰의 심리학: 확신을 얻기 위해 치열하게 자신을 돌아보는 건강한 의심`;
    let title4 = `치유의 목소리: '이미 충분히 잘 해내고 있다'는 확신을 나에게 선물하기`;
    let title5 = `온기 어린 실천: 완벽한 100% 대신, 지금 내딛는 한 걸음의 가치 인정하기`;

    if (hasRelationalFatigue) {
      title1 = `내면의 나침반: 얕은 관계보다 나만의 깊은 기준을 세우고 싶은 성실한 열망`;
      title2 = `기운의 점검: 소모된 에너지를 회복하고 내면의 밀도를 높이는 단단한 시간`;
      title3 = `성찰의 심리학: 타인의 시선에서 벗어나 내 중심을 찾아가는 건강한 의심`;
      title4 = `치유의 목소리: '내 에너지를 나에게 온전히 써도 괜찮다'는 확신 선물하기`;
      title5 = `온기 어린 실천: 완벽한 친절 대신, 고요히 내 숨소리에 집중하는 가치 인정하기`;
    } else if (hasHierarchyKeyword) {
      title1 = `내면의 나침반: 외부의 서열보다 나의 실질적인 성장에 집중하려는 열망`;
      title2 = `기운의 점검: 감정적 동요를 멈추고 나의 주도권을 되찾아오는 단단한 시간`;
      title3 = `성찰의 심리학: 타인의 평가에 흔들리지 않는 내면의 중심을 세우기 위한 성찰`;
      title4 = `치유의 목소리: '나는 이미 충분히 존중받을 자격이 있다'는 단호한 확신`;
      title5 = `온기 어린 실천: 즉각적인 반응 대신, 물리적 여백을 만들어내는 가치 인정하기`;
    } else if (hasPersonalityKeyword || mbtis.length > 0) {
      let injectedMbti = mbtis.length >= 2 ? `${mbtis[0]}와 ${mbtis[1]} 사이` : (mbtis.length === 1 ? mbtis[0] : '성향의 혼란 속');
      title1 = `내면의 나침반: ${injectedMbti}, 더 나은 나를 찾기 위한 입체적인 열망`;
      title2 = `기운의 점검: 고정된 틀을 깨고 나의 다채로운 가능성을 마주하는 시간`;
      title3 = `성찰의 심리학: 정답이 없음을 수용하고 치열하게 나를 탐구하는 건강한 의심`;
      title4 = `치유의 목소리: '어떤 모습이든 모두 나의 소중한 일부'라는 확신 선물하기`;
      title5 = `온기 어린 실천: 규정된 성향 대신, 지금 당장 끌리는 내 마음의 가치 인정하기`;
    } else if (hasParenting) {
      title1 = `내면의 나침반: 가장 좋은 사랑을 주고 싶어 치열하게 고민하는 부모의 열망`;
      title2 = `기운의 점검: 방식의 차이를 인정하며 잠시 호흡을 고르는 단단한 시간`;
      title3 = `성찰의 심리학: 더 나은 가정을 위해 끝없이 스스로를 돌아보는 건강한 의심`;
      title4 = `치유의 목소리: '나의 노력은 이미 충분히 훌륭하다'는 확신을 서로에게 선물하기`;
      title5 = `온기 어린 실천: 완벽한 양육 대신, 맞잡은 손의 체온이 주는 작은 가치 인정하기`;
    } else if (hasBurnoutKeyword) {
      title1 = `내면의 나침반: 더 높은 기준에 닿기 위해 한계까지 밀어붙였던 성실한 열망`;
      title2 = `기운의 점검: 무조건적인 질주를 멈추고 내 몸의 신호를 수용하는 단단한 시간`;
      title3 = `성찰의 심리학: 나를 소진시키던 완벽주의를 끊어내려는 건강하고 절실한 의심`;
      title4 = `치유의 목소리: '잠시 멈춰도 삶은 무너지지 않는다'는 확신을 나에게 선물하기`;
      title5 = `온기 어린 실천: 대단한 성과 대신, 텅 빈 10분의 쉼이 주는 가치 인정하기`;
    } else if (hasFutureKeyword) {
      title1 = `내면의 나침반: 불확실함 속에서도 내 길을 개척하고 싶은 진지한 열망`;
      title2 = `기운의 점검: 먼 미래보다 지금 딛고 선 발걸음에 집중하는 단단한 시간`;
      title3 = `성찰의 심리학: 확신을 얻기 위해 스스로의 능력을 치열하게 묻는 건강한 의심`;
      title4 = `치유의 목소리: '오지 않은 내일보다 오늘의 내가 더 크다'는 단호한 확신`;
      title5 = `온기 어린 실천: 완벽한 대비 대신, 지금 내쉬는 호흡 한 번의 가치 인정하기`;
    } else {
      if (trackType === '다정한 식탁') {
        title1 = `내면의 나침반: 더 성숙한 관계를 맺고 싶어 스스로를 돌아보는 성실한 열망`;
        title2 = `기운의 점검: 상처주지 않기 위해 잠시 거리를 두고 숨을 고르는 단단한 시간`;
      } else if (trackType === '나를 지키는 울타리') {
        title1 = `내면의 나침반: 세상의 소음 속에서도 나의 기준을 잃지 않으려는 진지한 열망`;
        title2 = `기운의 점검: 흔들림 속에서 나의 주도권을 묵묵히 다잡아가는 단단한 시간`;
      } else if (trackType === '성장 탐험가') {
        title1 = `내면의 나침반: 정답이 아닌 나만의 길을 개척하고 싶은 진지한 열망`;
        title2 = `기운의 점검: 남들의 속도에 맞추지 않고 나만의 엔진을 달구는 시간`;
        title3 = `성찰의 심리학: 성장통을 피하지 않고 마주하는 당당한 퀘스트`;
        title4 = `치유의 목소리: '나는 이미 눈부시게 자라고 있다'는 확신 선물하기`;
        title5 = `온기 어린 실천: 조급함 대신, 지금 나의 가능성을 온전히 인정하기`;
      }
    }

    let title6 = trackType === '성장 탐험가' ? '내면의 주도권 회복하기' : '우리 사이를 잇는 다정한 한마디';
    return [title1, title2, title3, title4, title5, title6];
  };

  const getHolisticReportPoints = () => {
    const rawUserName = formData.name || '당신';
    const textWithEmotions = `${currentConcernData?.text || ''} ${(currentConcernData?.emotions || []).join(' ')}`;
    const coords = calculateCoordinates(formData, textWithEmotions);
    const quadrantResult = getQuadrantInterpretation(coords.x, coords.y, trackType);
    
    const coordFallbackText = `${rawUserName} 님의 텍스트를 분석한 결과, 시간의 초점은 **[${coords.x >= 0 ? "'지금, 여기'에 머무는 중" : "'어제와 내일'을 떠도는 중"}]**, 삶의 주도성은 **[${coords.y >= 0 ? '이끄는 하루' : '끌려가는 하루'}]** 방향에 위치합니다.\n\n이 좌표는 좋고 나쁨의 판단이 아닙니다. 지금 ${rawUserName} 님의 마음이 시간과 삶의 주도권 측면에서 어디에 머물고 있는지를 보여주는 솔직한 지도입니다.`;

    // ── AI 응답이 있으면 우선 사용, 없으면 로컬 키워드 기반 폴백 ──
    if (aiSections && aiSections.deepAnalysis1) {
      return [
        {
          title: `1. 마음의 좌표계: 현재 위치 확인`,
          desc: coordFallbackText
        },
        {
          title: `2. 내 마음 깊은 곳의 목소리`,
          desc: aiSections.deepAnalysis1
        },
        {
          title: `3. 내 안의 어린아이 안아주기`,
          desc: aiSections.deepAnalysis2
        },
        {
          title: `4. 나를 위한 다정한 행동 지침`,
          desc: aiSections.deepAnalysis3
        }
      ];
    }

    // ── 폴백: 로컬 키워드 기반 생성 ──
    return [
      {
        title: `1. 마음의 좌표계: 현재 위치 확인`,
        desc: coordFallbackText
      },
      {
        title: `2. 내 마음 깊은 곳의 목소리`,
        desc: `${quadrantResult.title}\n\n${quadrantResult.desc}`
      },
      {
        title: `3. 내 안의 어린아이 안아주기`,
        desc: `지금 느끼는 복잡한 마음은 일시적인 혼란이 아니라, 이 사분면에 머물며 스스로를 지키거나 한 단계 나아가기 위한 매우 자연스러운 과정입니다.`
      },
      {
        title: `4. 나를 위한 다정한 행동 지침`,
        desc: `이 위치에서 다음 스텝으로 유연하게 넘어가기 위해, 너무 서두르거나 스스로를 탓하지 마세요.\n\n지금은 그저 내 마음이 이 좌표에 잠시 머물러 있음을 있는 그대로 '바라봐주는 것'만으로도 충분합니다.`
      }
    ];
  };

  const getDynamicTips = () => {
    const n = formData.name || '당신';
    switch (trackType) {
      case '다정한 식탁':
        return [
          `${n} 님에게 가장 가까워서 도리어 더 아팠던 그 분의 마음, 저에게 편안하게 다 들려주시겠어요?`,
          `가장 마음에 비수가 됐던 눈빛이나 표정에 대해, 그 찰나에 ${n} 님이 느낀 속상함을 제게 더 나누어 주세요.`,
          `엇갈린 파도 너머로, 그 순간 ${n} 님이 속으로 꾹꾹 참고 바랐던 그 사람의 다정한 원래 모습은 어떤 것이었을까요?`,
          `잘잘못을 다 떠나서, ${n} 님의 존재가 온전히 안기어 보호받고 싶었던 가장 애틋한 진심의 모양은 원래 무엇이었나요?`
        ];
      case '나를 지키는 울타리':
        return [
          `거친 세상과 타인에게 치여 까맣게 지쳐버린 ${n} 님의 하루, 이곳 뒷마당에는 가장 자유롭게 털어놓으셔도 괜찮아요.`,
          `화가 났던 정황이나 무례하게 선을 넘었던 차가운 반응을 조금 더 말씀해 주시면, 제가 ${n} 님의 상처를 더 선명하게 안아드릴게요.`,
          `욱하고 화가 난 이면에서, ${n} 님이 결단코 처절하게 지켜내고 싶었던 정당한 마음의 경계선은 어떤 모양이었나요?`,
          `시끄러운 소음과 잣대를 떠나서, 내 울타리 안에 ${n} 님이 제일 안전하게 지켜내고 싶었던 고유한 빛깔은 무엇이었을까요?`
        ];
      default: // '비밀의 방앗간'
        return [
          `어떤 웅크린 마음이든 다 괜찮아요. 맞춤법 걱정 없이, 가슴 속에 뭉쳐있던 것들을 저에게 편히 토해내듯 적어보시겠어요?`,
          `조금만 멈추어서, 최근 ${n} 님을 숨 막히게 통제하려 했던 잣대나 스스로를 자책하게 만든 짐을 더 마주해 볼까요?`,
          `열심히 버텨온 그 겉모습 아래, ${n} 님의 속마음이 세상 밖으로 꺼내 누군가에게 의지하고 싶었던 제일 여린 기대는 무엇이었을까요?`,
          `매서운 성과를 떼어내도 좋아요. 지친 ${n} 님의 존재 자체가 아무 조건 없이 푹 안기고 싶었던 가장 따뜻한 안도감은 어떤 것일까요?`
        ];
    }
  };

  const generateMonthlyLetter = () => {
    const nameStr = formData.name ? `${formData.name} 님` : '재희 님';
    const topKeywords = analyzeKeywords(emotionDB) || ['성장'];
    const keywordStr = topKeywords.join(', ');
    const highlights = emotionDB.slice(-3).map(db => db.text);

    return {
      paragraphs: [
        `지난 한 달 동안 ${nameStr}은 '${keywordStr}'라는 화두를 안고, 누구보다 치열하게 자신만의 속도를 고민해왔습니다.`,
        `세상의 기준에 흔들리면서도 결코 나침반을 놓지 않으려 했던 그 묵묵한 시간들을 전문가의 시선으로 조용히 지켜보았습니다.`,
        `그 여정 속에서 ${nameStr}이 스스로 발견하고 밑줄을 그었던 소중한 진심들은 이러합니다.`,
        ...highlights.map(h => `"${h}"`),
        `이 문장들은 단순한 기록이 아닙니다. 불안함 속에서도 자신의 감정을 외면하지 않고 온전히 직면해낸, 성숙한 어른만이 가질 수 있는 단단한 내면의 증거입니다.`,
        `당신은 매 순간 가장 최선의 선택을 해왔고, 그 상처와 고민들은 당신의 토양을 그 어느 때보다 깊고 넓게 만들어 주었습니다.`,
        `앞으로의 한 달도 완벽할 필요는 없습니다. 그저 지금처럼 ${nameStr}의 보폭대로, 때로는 멈춰 서기도 하며 나아가면 충분합니다.`,
        `지난 시간 당신이 견뎌낸 모든 무게와 수고를 온전히 인정하며, 당신의 내일을 조용히 지지합니다.`
      ]
    };
  };

  const renderDynamicIntro = () => {
    const name = formData.name || '당신';
    const topKeywords = analyzeKeywords(emotionDB);
    let pastMemoryIntro = null;
    if (topKeywords && topKeywords.length > 0) {
      const keywordStr = topKeywords.length > 1 ? `'${topKeywords[0]}'와 '${topKeywords[1]}'` : `'${topKeywords[0]}'`;
      pastMemoryIntro = `마음의 서재를 조용히 열어보니, 최근 ${name} 님은 주로 ${keywordStr}라는 감정 곁에 머물고 계셨군요.`;
    }

    if (trackType === '비밀의 방앗간') {
      return {
        title: <>{`오늘, 스스로에게 온전한 휴식을 허락하는`}<br />{`${name} 님의 풍경`}</>,
        content: (
          <>
            {pastMemoryIntro && (
              <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F1AC9D', marginBottom: '22px', fontSize: '0.98rem', color: '#555', lineHeight: '1.6', boxShadow: '0 4px 12px rgba(241,172,157,0.1)' }}>
                <b style={{ color: '#E2725B' }}>{pastMemoryIntro}</b> 지금부터 당신의 이야기에 깊이 귀 기울여 보겠습니다.
              </div>
            )}
            <b style={{ display: 'block', marginBottom: '15px', color: '#D95A40', fontSize: '1.1rem' }}>
              당신을 위한 H.E.R.e의 진심
            </b>
            <div style={{ fontSize: '1.02rem', color: '#4A4A4A', lineHeight: '1.9', wordBreak: 'keep-all', whiteSpace: 'pre-wrap' }}>
              {selfAnalysisResult}
            </div>
          </>
        )
      };
    }

    let energyType = '흐름';
    let energyTone = "";
    if (miniMapResult && miniMapResult.type) {
      if (miniMapResult.type.includes('머무름')) {
        energyTone = `[오늘 고요하게 내면으로 힘을 축적하고 있는 ${name} 님께]`;
        energyType = '머무름';
      } else if (miniMapResult.type.includes('흐름')) {
        energyTone = `[지금 세상과 유연하게 호흡하며 에너지를 순환하고 있는 ${name} 님께]`;
        energyType = '흐름';
      } else if (miniMapResult.type.includes('발산')) {
        energyTone = `[자신의 에너지를 바깥으로 씩씩하게 뻗어내고 있는 ${name} 님께]`;
        energyType = '발산';
      }
    }

    let titleLine1 = `오늘, 더 높은 곳을 향해`;
    let titleLine2 = `치열하게 자신을 벼려내는 ${name} 님의 풍경`;

    let step2Friction = `목표의 크기를 직감하고 있는 자기 완성의 마찰열입니다.`;
    if (energyType === '머무름') step2Friction = `도달할 목표를 위해 내면의 밀도를 극도로 응축시키는 자기 완성의 마찰열입니다.`;
    if (energyType === '발산') step2Friction = `기존의 한계와 틀을 깨고 바깥으로 맹렬히 뻗어나가는 도약의 마찰열입니다.`;

    let contentSteps = {
      step1: `스스로에게 더 높은 기준을 선물하고 싶어 치열하게 자신을 응시하는 ${name} 님의 뜨거운 마음을 먼저 비춥니다.`,
      step2: `지금 느끼는 '부족함'은 결핍의 증거가 아니라, ${step2Friction}`,
      step3: `잘하고 있는지에 대한 의심은, 단 한 걸음도 헛되이 내딛고 싶지 않은 ${name} 님의 치밀한 책임감이 만든 프로페셔널한 정교함입니다.`
    };

    if (trackType === '다정한 식탁') {
      titleLine1 = `오늘, 더 안전한 사랑의 울타리를 짓기 위해`;
      titleLine2 = `치열하게 고민하는 ${name} 님의 풍경`;
      contentSteps.step1 = `가족에게 더 다정하고 온전한 사랑을 주고 싶어 스스로를 날카롭게 응시하는 ${name} 님의 뜨거운 책임감을 먼저 비춥니다.`;

      let parentFriction = `성취가(High Achiever)의 건강한 갈증입니다.`;
      if (energyType === '머무름') parentFriction = `가족을 더 완벽히 품어내기 위해 내면의 사랑을 단단히 응축시키는 보호자의 마찰열입니다.`;
      if (energyType === '발산') parentFriction = `지금의 좁은 울타리를 부수고 더 넓고 안전한 지대를 개척하려는 보호자의 맹렬한 도약입니다.`;

      contentSteps.step2 = `지금 마음 한구석에 피어나는 '미안함'이나 '죄책감'은 결코 당신이 부족해서가 아닙니다. 그것은 내 사람들에게 더 완벽하고 좋은 환경을 제공하고자 하는 숭고한 야망이 빚어낸 ${parentFriction}`;
      contentSteps.step3 = `내가 과연 좋은 사람인지에 대한 의심은, 사랑하는 이들과 단 한 걸음도 엇나가지 않으려는 ${name} 님의 치밀하고 다정한 책임감이 만든 프로페셔널한 정교함입니다.`;
    } else if (trackType === '나를 지키는 울타리') {
      titleLine1 = `오늘, 상처 입지 않을 단단한 경계를 세우며`;
      titleLine2 = `성숙해져 가는 ${name} 님의 풍경`;
      contentSteps.step1 = `소모적인 관계 속에서도 스스로의 존엄을 지켜내고자 치열하게 상황을 응시하는 ${name} 님의 뜨거운 통찰력을 먼저 비춥니다.`;

      let socialFriction = `고도의 공감 지능이 맹렬하게 발휘되고 있다는 증거입니다.`;
      if (energyType === '머무름') socialFriction = `타인의 감정을 섬세하게 읽어내며 나의 중심을 무겁게 다잡는 내면의 마찰열입니다.`;
      if (energyType === '발산') socialFriction = `건강하지 못한 관계의 선을 과감히 잘라내고 주도권을 되찾기 위한 강력한 도약의 마찰열입니다.`;

      contentSteps.step2 = `지금 겪고 있는 대인관계의 '피로감'은 당신의 나약함이 아닙니다. 오히려 ${socialFriction}`;
      contentSteps.step3 = `이 관계를 어떻게 풀어가야 할지에 대한 날 선 의심은, 불필요한 감정 소모를 막아내고 자신의 에너지를 가장 가치 있는 곳에 쓰기 위한 ${name} 님의 정교한 검수 과정입니다.`;
    } else if (trackType === '성장 탐험가') {
      titleLine1 = `오늘, 나만의 우주를 단단히 지어 올리는`;
      titleLine2 = `용감한 성장의 주체, ${name} 님의 풍경`;
      contentSteps.step1 = `정답이 정해진 세상의 속도에 맞추기보다, 나만의 고유한 진정성을 찾기 위해 치열하게 고민하는 ${name} 님의 훌륭한 엔진 소음을 먼저 비춥니다.`;

      let youthFriction = `치열하게 작동 중인 '공사 소음'이자, 건강한 독립을 위한 근육통입니다.`;
      if (energyType === '머무름') youthFriction = `나만의 고유한 내면 능력치를 극도로 응축시키며 내면을 다져가는 거룩한 공사 소음입니다.`;
      if (energyType === '발산') youthFriction = `어른들의 안전지대를 깨고 나와 나만의 넓은 우주를 폭발적으로 개척하려는 위대한 도약의 엔진 소리입니다.`;

      contentSteps.step2 = `지금 마음속의 혼란은 엇나감이 아닙니다. 당신의 뇌가 가장 위대한 자아를 건축하기 위해 ${youthFriction}`;
      contentSteps.step3 = `내가 잘하고 있는 걸까 하는 두려움은, 내 안의 능력치를 최대치로 끌어올리기 위해 스스로를 치밀하게 세팅하는 용감한 플레이어의 정교한 퀘스트 과정입니다.`;
    } else {
      titleLine1 = `오늘, 스스로에게 더 눈부신 기준을 선물하기 위해`;
      titleLine2 = `치열하게 자신을 벼려내는 ${name} 님의 풍경`;
    }

    return {
      title: <>{titleLine1}<br />{titleLine2}</>,
      content: (
        <>
          {pastMemoryIntro && (
            <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F1AC9D', marginBottom: '22px', fontSize: '0.98rem', color: '#555', lineHeight: '1.6', boxShadow: '0 4px 12px rgba(241,172,157,0.1)' }}>
              <b style={{ color: '#E2725B' }}>{pastMemoryIntro}</b> 오늘 그 마음의 온도를 다시 이어가 보겠습니다.
            </div>
          )}
          <b style={{ display: 'block', marginBottom: '15px' }}>
            {energyTone ? <span style={{ color: '#D95A40', display: 'block', marginBottom: '8px' }}>{energyTone}</span> : null}
            "{contentSteps.step1}"
          </b>
          <b>"{contentSteps.step2} {contentSteps.step3}"</b><br /><br />
          이제 깊이 들이마신 호흡으로 긴장된 어깨를 내리고, {trackType === '성장 탐험가' ? '나만의 진심을 더 선명하게 마주할 수 있도록' : '서로의 진심을 더 선명하게 마주하실 수 있도록'} 전문가의 눈으로 깨끗하게 닦아둔 거울을 당당히 마주해 보세요. 당신은 이미 목표를 향해 가장 정확한 궤도 위에 있습니다.
        </>
      )
    };
  };

  return (
    <>
      {/* ── 전역 GNB (Header) ── */}
      {!isSharedMode && (step === 'dashboard' || step === 'category') && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 20px', backgroundColor: '#FDFBF7',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setStep('dashboard')}>
            <svg style={{ width: '26px', height: '26px', marginRight: '6px' }} viewBox="0 0 100 100" fill="none">
              <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="4" />
              <rect x="42" y="52" width="16" height="16" rx="2" fill="#E2725B" />
            </svg>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#E2725B', letterSpacing: '0.5px' }}>H.E.R.e</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setShowKnockBox(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A4A4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button
              onClick={() => {
                setToastMsg('준비 중입니다');
                setTimeout(() => setToastMsg(''), 3000);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A4A4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── 하단 탭 바 (Bottom Tab Bar) ── */}
      {!isSharedMode && (step === 'dashboard' || step === 'category') && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '12px 8px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #EEEEEE',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}>
          {/* 홈 탭 */}
          <button
            onClick={() => { setStep('dashboard'); window.scrollTo(0, 0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={step === 'dashboard' ? "#E2725B" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span style={{ fontSize: '0.65rem', color: step === 'dashboard' ? '#E2725B' : '#A0A0A0', fontWeight: step === 'dashboard' ? '700' : '600', whiteSpace: 'nowrap' }}>홈</span>
          </button>

          {/* 상담실 탭 (구 카테고리/다락방) */}
          <button
            onClick={() => { setStep('attic'); window.scrollTo(0, 0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={step === 'attic' ? "#E2725B" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span style={{ fontSize: '0.65rem', color: step === 'attic' ? '#E2725B' : '#A0A0A0', fontWeight: step === 'attic' ? '700' : '600', whiteSpace: 'nowrap' }}>상담실</span>
          </button>

          {/* 내 마음 창문 (메인 액션 버튼) */}
          <button
            onClick={() => setIsWeatherOpen(true)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
              transform: 'translateY(0px)'
            }}
          >
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#E2725B',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(226, 114, 91, 0.4)',
              lineHeight: '1.2'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#FFFFFF' }}>마음</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#FFFFFF' }}>창문</span>
            </div>
          </button>

          {/* MY 탭 */}
          <button
            onClick={() => goToStep('mypage', { requireLogin: true })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={step === 'mypage' ? "#E2725B" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span style={{ fontSize: '0.65rem', color: step === 'mypage' ? '#E2725B' : '#A0A0A0', fontWeight: step === 'mypage' ? '700' : '600', whiteSpace: 'nowrap' }}>MY</span>
          </button>

          {/* 리포트 탭 */}
          <button
            onClick={() => { setIsEnteringRoom(true); setTimeout(() => { goToStep('monthly_analytics', { requireLogin: true }); setIsEnteringRoom(false); }, 500); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={step === 'monthly_analytics' ? "#E2725B" : "#A0A0A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <span style={{ fontSize: '0.65rem', color: step === 'monthly_analytics' ? '#E2725B' : '#A0A0A0', fontWeight: step === 'monthly_analytics' ? '700' : '600', whiteSpace: 'nowrap' }}>리포트</span>
          </button>
        </div>
      )}

      <div className={isSharedMode ? 'shared-bg' : 'landing-bg'} style={{ ...styles.container, backgroundColor: isSharedMode ? 'transparent' : (step === 'mypage' ? '#FAFAFA' : '#FDFBF7'), opacity: visible ? 1 : 0, transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'opacity, background-color', paddingTop: (!isSharedMode && (step === 'dashboard' || step === 'category')) ? '5px' : '20px', paddingBottom: (!isSharedMode && (step === 'dashboard' || step === 'category')) ? '100px' : '20px' }}>
        <style>
          {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes fadeInSlide { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
          .dynamic-fade-layer { animation: fadeInSlide 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; will-change: opacity, transform; }
          @keyframes skeletonPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
          @keyframes roomEnterScale { 
            0% { opacity: 1; transform: scale(1); filter: blur(0px); } 
            100% { opacity: 0; transform: scale(1.15); filter: blur(4px); } 
          }
          .room-enter-anim { 
            animation: roomEnterScale 0.6s cubic-bezier(0.7, 0, 0.3, 1); 
            pointer-events: none; 
          }
          @keyframes coralGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .shared-bg {
            background: linear-gradient(-45deg, #FDFBF7, #FDF2F0, #FDFBF7, #FDEDEA);
            background-size: 400% 400%;
            animation: coralGlow 8s ease infinite;
          }
          @keyframes screenHugScale {
            0% { transform: scale(0); opacity: 0; }
            50% { opacity: 0.6; }
            100% { transform: scale(3.5); opacity: 0; }
          }
          .screen-hug-ripple {
            position: fixed;
            top: 50vh; left: 50vw;
            width: 100vw; height: 100vw;
            margin-top: -50vw; margin-left: -50vw;
            background: radial-gradient(circle, rgba(255,171,145,0.85) 0%, rgba(253,242,240,0) 70%);
            border-radius: 50%;
            z-index: 10000;
            pointer-events: none;
            animation: screenHugScale 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          @keyframes watercolorSpread {
            0% { background-size: 0% 100%; }
            100% { background-size: 100% 100%; }
          }
          .highlight-text {
            background-image: linear-gradient(transparent 50%, rgba(241, 172, 157, 0.3) 50%);
            background-repeat: no-repeat;
            background-position: left center;
            background-size: 0% 100%;
            border-radius: 2px;
            padding: 0 2px;
            transition: background-color 0.3s ease;
          }
          .highlight-text.active {
            animation: watercolorSpread 0.7s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          }
          @keyframes subtlePulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          .pulse-text {
            animation: subtlePulse 2s infinite ease-in-out;
          }
          @keyframes tooltipFadeInOut {
            0% { opacity: 0; transform: translateY(10px) translateX(-50%); }
            15% { opacity: 1; transform: translateY(0) translateX(-50%); }
            85% { opacity: 1; transform: translateY(0) translateX(-50%); }
            100% { opacity: 0; transform: translateY(-10px) translateX(-50%); }
          }
          }
          .tooltip-fade {
            animation: tooltipFadeInOut 3s forwards;
          }
          @keyframes floatTooltip {
            0% { transform: translate(-50%, 0px); }
            50% { transform: translate(-50%, -6px); }
            100% { transform: translate(-50%, 0px); }
          }
          /* Hide scrollbar for native app feel */
          ::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }

          /* NEW LANDING BG */
          .landing-bg {
            position: relative;
            overflow: hidden;
          }
          .landing-bg::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 120vw; height: 120vh;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(253,242,240,0.1) 35%, transparent 65%);
            pointer-events: none;
            animation: fogBreath 8s ease-in-out infinite alternate;
          }
          .landing-bg::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 30px 30px;
            pointer-events: none;
          }
          @keyframes fogBreath {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
          }
        `}
        </style>

        {/* 전체를 래핑하는 애니메이션 전용 내부 컨테이너 */}
        <div className={isEnteringRoom ? 'room-enter-anim' : ''} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* ── 상담실 (Attic View) ── */}
          {step === 'attic' && (
            <AtticView
              userName={formData.name || '당신'}
              onReset={() => setStep('dashboard')}
              setToastMsg={setToastMsg}
              onChatStateChange={setIsAtticChatting}
            />
          )}

          {/* ── 마이페이지 (My Page) ── */}
          {step === 'mypage' && (
            <MyPage 
              formData={formData} 
              mbtiTrait={userMbtiTrait} 
              onboardingMbti={onboardingMbti}
              emotionDB={emotionDB} 
              onBack={() => setStep('dashboard')}
              onGoToJournal={() => setStep('mind_journal')}
            />
          )}

          {/* ── 마음 저널 (Mind Journal) ── */}
          {step === 'mind_journal' && (
            <MindJournal
              emotionDB={emotionDB}
              onBack={() => setStep('mypage')}
            />
          )}

          {/* ── 로그인 화면 (Login View) ── */}
          {step === 'login' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: '0 auto', maxWidth: '480px', background: 'radial-gradient(circle at center 35%, #FDFBF7 0%, #FDF2F0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '18vh 20px 40px 20px', boxSizing: 'border-box', zIndex: 10000 }}>
              
              {/* 우측 상단 닫기(뒤로 가기) 버튼 */}
              <button 
                onClick={() => setStep('dashboard')}
                style={{ position: 'absolute', top: '28px', right: '28px', background: 'none', border: 'none', cursor: 'pointer', padding: '12px' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B4C3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* 상단 Hero 영역 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <svg style={{ width: '64px', height: '64px', marginBottom: '28px' }} viewBox="0 0 100 100" fill="none">
                  <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
                  <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
                </svg>
                <div style={{ textAlign: 'center', lineHeight: '1.7', fontSize: '1.3rem', color: '#6B4C3B', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  지친 마음이 다정하게 쉬어가는 곳,<br />H.E.R.e에 오신 것을 환영합니다.
                </div>
              </div>
              
              {/* 간편 로그인 버튼 및 툴팁 영역 */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 웰컴 프리 넛지 툴팁 */}
                  <div style={{ position: 'absolute', top: '-52px', left: '50%', backgroundColor: '#E2725B', color: 'white', fontSize: '0.85rem', fontWeight: '700', padding: '10px 16px', borderRadius: '16px', whiteSpace: 'nowrap', boxShadow: '0 6px 16px rgba(226,114,91,0.25)', animation: 'floatTooltip 2.5s infinite ease-in-out', zIndex: 10 }}>
                    🎁 첫 체크인 시, 월간 심리 성장 리포트 1회 무료!
                    <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '12px', height: '12px', backgroundColor: '#E2725B' }}></div>
                  </div>

                  <button onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setStep('onboarding'); setOnboardingStep(1); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); }} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#FEE500', color: '#3C1E1E', fontSize: '1.05rem', fontWeight: '800', cursor: 'pointer', transition: 'opacity 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    카카오로 3초 만에 시작하기
                  </button>
                  <button onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setStep('onboarding'); setOnboardingStep(1); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); }} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#03C75A', color: 'white', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    네이버로 시작하기
                  </button>
                  <button onClick={handleCloudLogin} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid #E5E5E5', backgroundColor: '#FFFFFF', color: '#4A4A4A', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    구글로 시작하기
                  </button>
                </div>
              </div>

              {/* 최하단 서브 링크 */}
              <div style={{ fontSize: '0.85rem', color: '#A3A3A3', textDecoration: 'none', cursor: 'pointer', marginTop: '10px' }} onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                이메일로 다정하게 시작하기
              </div>
            </div>
          )}

          {/* ── 온보딩 화면 (Onboarding View) ── */}
          {step === 'onboarding' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: '0 auto', maxWidth: '480px', background: 'radial-gradient(circle at center 35%, #FDFBF7 0%, #FDF2F0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box', zIndex: 10000 }}>
              
              {onboardingStep === 1 && (
                <div className="dynamic-fade-layer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {!showOnboardingFeedback ? (
                    <>
                      <h2 style={{ fontSize: '1.4rem', color: '#6B4C3B', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>당신을 어떤 이름으로 부르면 좋을까요?</h2>
                      <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '40px', textAlign: 'center' }}>앞으로 H.E.R.e가 다정한 처방전을 적어드릴 때 사용할게요.</p>
                      
                      <input 
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="이름 (또는 닉네임)"
                        style={{ width: '200px', padding: '10px', fontSize: '1.2rem', textAlign: 'center', border: 'none', borderBottom: '2px solid #E2725B', backgroundColor: 'transparent', outline: 'none', color: '#333', marginBottom: '40px' }}
                      />
                      
                      <button 
                        disabled={!formData.name.trim()}
                        onClick={() => {
                          setShowOnboardingFeedback(true);
                          setTimeout(() => {
                            setShowOnboardingFeedback(false);
                            setOnboardingStep(2);
                          }, 1500);
                        }}
                        style={{ width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: formData.name.trim() ? '#E2725B' : '#E5E5E5', color: 'white', fontSize: '1.05rem', fontWeight: '700', cursor: formData.name.trim() ? 'pointer' : 'default', transition: 'background-color 0.3s' }}
                      >
                        다음
                      </button>
                    </>
                  ) : (
                    <div className="dynamic-fade-layer" style={{ textAlign: 'center', fontSize: '1.3rem', color: '#E2725B', fontWeight: '700' }}>
                      {formData.name} 님, 만나서 반가워요.
                    </div>
                  )}
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="dynamic-fade-layer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem', color: '#6B4C3B', fontWeight: '800', marginBottom: '8px', textAlign: 'center', wordBreak: 'keep-all' }}>{formData.name} 님이 태어난 날의 계절을 알려주세요.</h2>
                  <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '40px', textAlign: 'center', wordBreak: 'keep-all' }}>타고난 내면의 기질을 이해하는 첫걸음이 됩니다.<br/>(태어난 시간은 몰라도 괜찮아요.)</p>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', width: '100%', justifyContent: 'center' }}>
                    <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} style={{ flex: 1, maxWidth: '100px', padding: '12px 8px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #DDD', backgroundColor: 'white', outline: 'none', textAlign: 'center', appearance: 'none' }}>
                      <option value="">년도</option>
                      {Array.from({length: 60}, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}년</option>)}
                    </select>
                    <select value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} style={{ flex: 1, maxWidth: '80px', padding: '12px 8px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #DDD', backgroundColor: 'white', outline: 'none', textAlign: 'center', appearance: 'none' }}>
                      <option value="">월</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
                    </select>
                    <select value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})} style={{ flex: 1, maxWidth: '80px', padding: '12px 8px', fontSize: '1rem', borderRadius: '12px', border: '1px solid #DDD', backgroundColor: 'white', outline: 'none', textAlign: 'center', appearance: 'none' }}>
                      <option value="">일</option>
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}일</option>)}
                    </select>
                  </div>

                  {formData.year && formData.month && formData.day && (
                    <div className="dynamic-fade-layer" style={{ marginBottom: '40px', padding: '18px', backgroundColor: '#FDF2F0', borderRadius: '12px', textAlign: 'center', color: '#E2725B', fontSize: '1rem', fontWeight: '700', width: '100%', boxShadow: '0 6px 16px rgba(226,114,91,0.12)' }}>
                      단단하게 뿌리내린 숲의 기운을 가지고 계시네요 🌳
                    </div>
                  )}

                  <button 
                    disabled={!formData.year || !formData.month || !formData.day}
                    onClick={() => setOnboardingStep(3)}
                    style={{ width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: (formData.year && formData.month && formData.day) ? '#E2725B' : '#E5E5E5', color: 'white', fontSize: '1.05rem', fontWeight: '700', cursor: (formData.year && formData.month && formData.day) ? 'pointer' : 'default', transition: 'background-color 0.3s' }}
                  >
                    다음
                  </button>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="dynamic-fade-layer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '20px' }}>
                  <h2 style={{ fontSize: '1.4rem', color: '#6B4C3B', fontWeight: '800', marginBottom: '8px', textAlign: 'center', wordBreak: 'keep-all' }}>지금 세상을 바라보고 있는<br/>{formData.name} 님만의 렌즈는 무엇인가요?</h2>
                  <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '30px', textAlign: 'center', wordBreak: 'keep-all' }}>타고난 기질 위에 덧입혀진 현재의 성향을 선택해 주세요.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginBottom: '24px' }}>
                    {['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'].map(mbti => (
                      <button 
                        key={mbti}
                        onClick={() => setOnboardingMbti(mbti)}
                        style={{ padding: '12px 0', borderRadius: '16px', border: onboardingMbti === mbti ? 'none' : '1px solid #F0F0F0', backgroundColor: onboardingMbti === mbti ? '#E2725B' : '#FAFAFA', color: onboardingMbti === mbti ? 'white' : '#777', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: onboardingMbti === mbti ? 'scale(1.08)' : 'scale(1)', textAlign: 'center', boxShadow: onboardingMbti === mbti ? '0 6px 16px rgba(226,114,91,0.3)' : '0 2px 6px rgba(0,0,0,0.03)' }}
                      >
                        {mbti}
                      </button>
                    ))}
                  </div>

                  <div style={{ minHeight: '60px', marginBottom: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {onboardingMbti && (
                      <div className="dynamic-fade-layer" style={{ padding: '16px', backgroundColor: '#FDF2F0', borderRadius: '12px', textAlign: 'center', color: '#E2725B', fontSize: '0.95rem', fontWeight: '700', width: '100%', boxShadow: '0 4px 12px rgba(226,114,91,0.1)' }}>
                        통찰력 있고 깊이 있는 전략가 렌즈를 끼고 계시군요!
                      </div>
                    )}
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                    <button 
                      disabled={!onboardingMbti}
                      onClick={() => setOnboardingStep(4)}
                      style={{ width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: onboardingMbti ? '#E2725B' : '#E5E5E5', color: 'white', fontSize: '1.05rem', fontWeight: '700', cursor: onboardingMbti ? 'pointer' : 'default', transition: 'background-color 0.3s' }}
                    >
                      다음
                    </button>
                    <button 
                      onClick={() => setOnboardingStep(4)}
                      style={{ background: 'none', border: 'none', color: '#A3A3A3', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}
                    >
                      🤔 아직 잘 모르겠어요
                    </button>
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="dynamic-fade-layer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg style={{ width: '70px', height: '70px', marginBottom: '24px' }} viewBox="0 0 100 100" fill="none">
                    <rect x="20" y="30" width="60" height="45" rx="4" stroke="#E2725B" strokeWidth="3" fill="#FFFACD" />
                    <path d="M20 35L50 55L80 35" stroke="#E2725B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <h2 style={{ fontSize: '1.4rem', color: '#6B4C3B', fontWeight: '800', marginBottom: '16px', textAlign: 'center', wordBreak: 'keep-all', lineHeight: '1.5' }}>
                    준비가 모두 끝났습니다.<br/>{formData.name} 님만을 위한 첫 번째 안부를 열어볼까요?
                  </h2>
                  
                  <button 
                    onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setStep('dashboard'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 800); }}
                    style={{ width: '100%', maxWidth: '300px', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#E2725B', color: 'white', fontSize: '1.1rem', fontWeight: '800', cursor: 'pointer', marginTop: '40px', boxShadow: '0 8px 24px rgba(226,114,91,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    H.E.R.e 입장하기
                  </button>
                </div>
              )}
            </div>
          )}

          {step !== 'dashboard' && step !== 'login' && step !== 'onboarding' && step !== 'daily_forecast' && !isSharedMode && (
            <div style={styles.logoSection}>
              <svg style={styles.logo} viewBox="0 0 100 100" fill="none" onClick={() => {
                if (!isEnteringRoom) {
                  setStep('dashboard');
                  setLogoClickCount(prev => {
                    if (prev + 1 === 5) {
                      setShowMonthlyNudge(true);
                      return 0;
                    }
                    return prev + 1;
                  });
                }
              }}>
                <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
                <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
              </svg>
              <h1 style={{ ...styles.mainTitle, color: '#E2725B' }}>H.E.R.e</h1>
              <p style={{ ...styles.subTitle, fontWeight: 'bold', color: '#555' }}>나를 안아주고, 우리를 연결하는 다정한 공간</p>
            </div>
          )}

          {step === 'daily_forecast' && (
            <HybridPrescriptionView 
              onBack={() => setStep('dashboard')}
              userName={formData.name || '당신'}
            />
          )}

          <div style={{ ...styles.card, paddingTop: (step === 'dashboard' || step === 'category') ? '16px' : styles.card.paddingTop, maxWidth: step === 'result' ? '640px' : '480px', display: (step === 'login' || step === 'onboarding' || step === 'daily_forecast' || step === 'mypage' || step === 'mind_journal' || step === 'attic') ? 'none' : 'flex' }}>
            {step !== 'dashboard' && step !== 'category' && step !== 'shared_flow' && (
              <button style={styles.backButton} onClick={handleBack}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="#D8D8D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <div style={{ ...styles.scrollContent, paddingBottom: ((step === 'dashboard' || step === 'category') && !isSharedMode) ? '120px' : styles.scrollContent.paddingBottom }}>
              {isLoadingResult && (
                <LoadingScreen
                  trackType={trackType}
                  userName={formData.name || ''}
                />
              )}
              {step === 'shared_flow' && sharedStep === 'landing' && (
                <div className="dynamic-fade-layer" style={{ padding: '20px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.45rem', color: '#E2725B', margin: '15px 0 10px 0', lineHeight: '1.4' }}>
                    {formData.name} 님의<br />마음 산책 초대장
                  </h2>
                  <p style={{ fontSize: '1.05rem', color: '#666', lineHeight: '1.8', marginTop: '15px', marginBottom: '35px', wordBreak: 'keep-all' }}>
                    {formData.name} 님이 당신을 위해 자신의 마음 가장 깊고 여린 풍경을 가만히 열어주었습니다.<br /><br />
                    판단하거나 섣불리 평가하지 말고, 그저 고개를 끄덕이며 이 길을 잠시 함께 걸어주시겠어요?
                  </p>
                  <button style={{ ...styles.button, backgroundColor: '#E2725B' }} onClick={() => { setIsEnteringRoom(true); setTimeout(() => { setSharedStep('result'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 600); }}>
                    발소리를 죽이고 조용히 열어보기
                  </button>
                </div>
              )}

              {/* ═══════════════════════════════════════════
                🌤️ 메인 대시보드 및 카테고리 (두 트랙 구조 공용)
            ═══════════════════════════════════════════ */}
              {(step === 'dashboard') && (() => {
                // ── SVG 라인 아이콘 정의 ──
                const SvgForecast = ({ color = 'rgba(255,255,255,0.85)' }) => (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 18C5.8 18 4 16.2 4 14C4 11.8 5.8 10 8 10C8.3 7.7 10.3 6 12.5 6C15.1 6 17.2 8.1 17.2 10.7C17.2 10.8 17.2 10.9 17.2 11C18 11 18.7 11.4 19.2 12C20.2 12.3 21 13.3 21 14.5C21 16 19.7 17.2 18.2 17.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="22" x2="8" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="12" y1="22" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="16" y1="22" x2="16" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                );
                const SvgDinner = ({ color = 'rgba(255,255,255,0.85)' }) => (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="5" y1="16" x2="23" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 16V10C8 10 10 9 10 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M14 16V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M20 16V10C20 10 18 9 18 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="19" x2="19" y2="19" stroke={color} strokeWidth="1" strokeLinecap="round" />
                  </svg>
                );

                const hour = new Date().getHours();
                const isMorning = hour >= 6 && hour < 10;
                const isDay = hour >= 10 && hour < 17;

                // ── 사용자화(Personalization) 변수 ──
                // 실제 로그인(비익명) 상태일 때만 개인화된 이름 표시
                const isLoggedInUser = userSession && !userSession.isAnonymous;
                const userNameDisplay = (isLoggedInUser && formData.name) ? formData.name : '당신';



                // ── 연속 이용일수(Streak) 계산 로직 ──
                const calculateStreak = (db) => {
                  if (!db || db.length === 0) return 0;
                  // Get unique days (at 00:00:00) sorted descending
                  const uniqueDays = [...new Set(db.map(r => new Date(r.timestamp).setHours(0,0,0,0)))].sort((a,b) => b - a);
                  let streak = 1;
                  for (let i = 1; i < uniqueDays.length; i++) {
                    if ((uniqueDays[i-1] - uniqueDays[i]) === 86400000) streak++;
                    else break;
                  }
                  // If the most recent record is older than yesterday, streak is broken
                  const today = new Date().setHours(0,0,0,0);
                  if (today - uniqueDays[0] > 86400000) return 0;
                  return streak;
                };

                let baseBannerConfig;
                
                // ── 로그인/비로그인 공통: buildBriefing 기반 개인화 배너 ──
                {
                  const briefing = buildBriefing(emotionDB, formData.name);
                  const streak = isLoggedInUser ? calculateStreak(emotionDB) : 0;

                  // 헤드라인에서 "이름 님," prefix를 "이름 님의 하늘은,\n"으로 변환
                  // 이름이 없는 비로그인은 prefix가 ''이므로 문장 자체로 자연스럽게 시작됨
                  const namePrefix = formData.name ? `${formData.name} 님, ` : '';
                  let naturalHeadline = briefing.headline
                    .replace(namePrefix, namePrefix ? `${formData.name} 님의 하늘은,\n` : '')
                    .replace('서서히 하늘이 열리고 있어요.', '서서히 열리고 있어요.')
                    .replace('오늘 하늘엔 틈새 햇살이 들어오고 있어요.', '틈새 햇살이 들어오고 있어요.')
                    // 이름이 있을 때만 적용: "이름 님의 하늘은,\n오늘의 하늘이 기다리고 있어요." → "아직 맑아지기를..."
                    // 이름이 없을 때는 buildBriefing 원문("오늘의 하늘이 기다리고 있어요.")을 그대로 사용
                    .replace(namePrefix ? '오늘의 하늘이 기다리고 있어요.' : '__SKIP__', '아직 맑아지기를 기다리고 있어요.');

                  if (!isLoggedInUser) {
                    baseBannerConfig = {
                      isPersonalized: true,
                      theme: 'light',
                      emoji: briefing.emoji,
                      label: '오늘의 하늘',
                      streak: 0,
                      headline: naturalHeadline,
                      sub: '오늘 아침, 당신을 위한 편지가 기다리고 있어요.',
                      gradient: 'linear-gradient(135deg, #FFF5F0 0%, #FDF0E6 50%, #EDF5FA 100%)',
                      hasRead: false,
                      onClick: () => {
                        goToStep('morning_letter', { requireLogin: true });
                      }
                    };
                  } else {
                    // 로그인 유저: 읽음 여부 추가 처리
                    const todayStr = new Date().toLocaleDateString();
                    const hasReadToday = localStorage.getItem('hasReadMorningLetter_' + todayStr) === 'true';
                    baseBannerConfig = {
                      isPersonalized: true,
                      theme: 'light',
                      emoji: briefing.emoji,
                      label: '오늘의 하늘',
                      streak: streak,
                      headline: naturalHeadline,
                      sub: '오늘 아침, 그 결을 편지에 담아뒀어요.',
                      gradient: 'linear-gradient(135deg, #FFF5F0 0%, #FDF0E6 50%, #EDF5FA 100%)',
                      hasRead: hasReadToday,
                      onClick: () => {
                        localStorage.setItem('hasReadMorningLetter_' + todayStr, 'true');
                        setIsEnteringRoom(true);
                        setTimeout(() => { setStep('morning_letter'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500);
                      }
                    };
                  }
                }

                // ── [Proactive] 선제적 예보가 감지된 경우 배너 덮어쓰기 ──
                const bannerConfig = proactiveForecast 
                  ? { theme: 'light', Icon: SvgForecast, ...proactiveForecast, onClick: () => { setIsEnteringRoom(true); setTimeout(() => { setStep('daily_forecast'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } }
                  : baseBannerConfig;

                // ── 서재 SVG 아이콘 ──
                const SvgSelf = ({ color }) => (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="3.5" stroke={color} strokeWidth="1.4" /><path d="M4 19C4 15.7 7.1 13 11 13C14.9 13 18 15.7 18 19" stroke={color} strokeWidth="1.4" strokeLinecap="round" /></svg>
                );
                const SvgFamily = ({ color }) => (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="7" r="3" stroke={color} strokeWidth="1.4" /><circle cx="15" cy="8" r="2.5" stroke={color} strokeWidth="1.3" /><path d="M2 19C2 16.2 4.7 14 8 14C11.3 14 14 16.2 14 19" stroke={color} strokeWidth="1.4" strokeLinecap="round" /><path d="M14 16C14.7 15.4 15.8 15 17 15C19.2 15 21 16.3 21 18" stroke={color} strokeWidth="1.3" strokeLinecap="round" /></svg>
                );
                const SvgRelation = ({ color }) => (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="7" cy="11" r="4.5" stroke={color} strokeWidth="1.4" /><circle cx="15" cy="11" r="4.5" stroke={color} strokeWidth="1.4" /></svg>
                );
                const SvgYouth = ({ color }) => (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3L11 11" stroke={color} strokeWidth="1.4" strokeLinecap="round" /><path d="M11 11C11 11 7 9 5 12C3 15 5 19 11 19C17 19 19 15 17 12C15 9 11 11 11 11Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 11C8 11 6.5 8 8 6C9 4.5 11 4 11 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" /></svg>
                );

                const sanctuaries = [
                  { id: 'my-room', trackType: '비밀의 방앗간', Icon: SvgSelf, title: '나의 방', sub: 'SELF · REFLECTION', desc: userMbtiTrait.roomText, color: '#B85C4A', accentBg: '#FBF1EE', border: '#E8C4BC', onClick: () => { setTrackType('비밀의 방앗간'); setIsEnteringRoom(true); setTimeout(() => { setStep(formData.name ? 'concern' : 'info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                  { id: 'family-room', trackType: '다정한 식탁', Icon: SvgFamily, title: '가족의 방', sub: 'FAMILY · HEALING', desc: '서로의 다름 수용\n다정한 대화 처방전', color: '#7A5C48', accentBg: '#FAF5F0', border: '#D9C9BC', onClick: () => { setTrackType('다정한 식탁'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                  { id: 'relation-room', trackType: '나를 지키는 울타리', Icon: SvgRelation, title: '관계의 방', sub: 'RELATION · BOUNDARY', desc: '건강한 거리 두기\n페르소나 실전 화법', color: '#2E5B7A', accentBg: '#EEF4F9', border: '#B8CEDE', onClick: () => { setTrackType('나를 지키는 울타리'); setIsEnteringRoom(true); setTimeout(() => { setStep('partner_info'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 500); } },
                ];

                // 테마에 따른 동적 색상 설정
                const isLight = bannerConfig.theme === 'light';
                const cTitle = isLight ? '#2D2D2D' : '#FFFFFF';
                const cLabel = isLight ? '#E2725B' : 'rgba(255,255,255,0.45)';
                const cSub = isLight ? '#666666' : 'rgba(255,255,255,0.55)';
                const cPreviewBg = isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.07)';
                const cPreviewBorder = isLight ? '#E2725B' : 'rgba(255,255,255,0.25)';
                const cPreviewLabel = isLight ? '#E2725B' : 'rgba(255,255,255,0.35)';
                const cPreviewText = isLight ? '#444444' : 'rgba(255,255,255,0.72)';
                const cAction = isLight ? '#E2725B' : 'rgba(255,255,255,0.85)';

                return (
                  <div className="dynamic-fade-layer" style={{ width: '100%', padding: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* ── 상단 배너: TodayEmotionTracker ── */}
                    <div
                      onClick={bannerConfig.onClick}
                      style={{ background: bannerConfig.gradient, borderRadius: '20px', padding: '30px 26px 26px 26px', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 36px rgba(0,0,0,0.22)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,0,0,0.22)'; }}
                    >
                      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: '-30px', left: '40%', width: '120px', height: '120px', borderRadius: '50%', background: isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        {bannerConfig.isPersonalized ? (
                          <>
                            {/* 1행: 아이콘 + 라벨 + 배지 — 고정 코랄 팔레트 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', animation: 'floatIcon 4s ease-in-out infinite' }}>
                                  {bannerConfig.emoji}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#993C1D', letterSpacing: '2.5px', fontWeight: '800' }}>
                                  {bannerConfig.label}
                                </span>
                              </div>
                              {bannerConfig.streak > 0 && (
                                <div style={{ backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                  <span style={{ fontSize: '0.75rem' }}>👣</span>
                                  <span style={{ fontSize: '0.65rem', color: '#712B13', fontWeight: '700' }}>{bannerConfig.streak}일째</span>
                                </div>
                              )}
                            </div>
                            
                            {/* 2행: 헤드라인 */}
                            <h2 style={{ fontSize: '1.45rem', color: '#4A3728', fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.4', whiteSpace: 'pre-line', wordBreak: 'keep-all', letterSpacing: '-0.3px' }}>
                              {bannerConfig.headline}
                            </h2>
                            
                            {/* 3행: 서브텍스트 */}
                            <p style={{ fontSize: '0.82rem', color: '#7A6B63', margin: '0 0 18px 0', lineHeight: '1.6', wordBreak: 'keep-all', fontWeight: '500' }}>
                              {bannerConfig.sub}
                            </p>
                            
                            {/* 4행: CTA 버튼 */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px 24px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                              <span style={{ color: '#D85A30', fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {bannerConfig.hasRead ? '다시 읽기' : (
                                  <>편지 열어보기<div style={{ width: '5px', height: '5px', backgroundColor: '#D85A30', borderRadius: '50%', marginBottom: '8px' }} /></>
                                )}
                              </span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                              <bannerConfig.Icon color={cLabel} />
                              <span style={{ fontSize: '0.68rem', color: cLabel, letterSpacing: '2.5px', fontWeight: '800' }}>{bannerConfig.label}</span>
                            </div>
                            <h2 style={{ fontSize: '1.45rem', color: cTitle, fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.4', whiteSpace: 'pre-line', wordBreak: 'keep-all', letterSpacing: '-0.3px' }}>
                              {bannerConfig.title}
                            </h2>
                            <p style={{ fontSize: '0.82rem', color: cSub, margin: '0 0 12px 0', lineHeight: '1.6', wordBreak: 'keep-all', fontWeight: isLight ? '500' : '400' }}>{bannerConfig.sub}</p>
                            {bannerConfig.preview && (
                              <div style={{ margin: '0 0 18px 0', padding: '16px 24px', backgroundColor: cPreviewBg, borderRadius: '10px', borderLeft: `3px solid ${cPreviewBorder}` }}>
                                <span style={{ fontSize: '0.65rem', color: cPreviewLabel, letterSpacing: '1.5px', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>오늘 그대에게 전하고 싶은 말</span>
                                <span style={{ fontSize: '0.85rem', color: cPreviewText, lineHeight: '1.6', fontWeight: isLight ? '600' : '400' }}>{bannerConfig.preview}</span>
                              </div>
                            )}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px 24px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                              <span style={{ color: cAction, fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.5px' }}>열어보기</span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke={cAction} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── 핵심 콘텐츠 리스트: 3개의 방 (1열 세로형) ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                      {sanctuaries.map(s => (
                        <div
                          key={s.id} id={s.id} onClick={s.onClick}
                          style={{ backgroundColor: s.accentBg, border: `1px solid ${s.border}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'; }}
                        >
                          {/* 좌측: 아이콘 */}
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}>
                            <s.Icon color={s.color} />
                          </div>
                          
                          {/* 중앙: 텍스트 */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                            <span style={{ fontSize: '10px', color: '#A3A3A3', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '2px' }}>{s.sub}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: s.color, letterSpacing: '-0.3px', marginBottom: '4px' }}>{s.title}</span>
                            <span style={{ fontSize: '0.8rem', color: '#777', lineHeight: '1.4', whiteSpace: 'nowrap' }}>{s.desc.replace('\n', ' · ')}</span>
                          </div>
                          
                          {/* 우측 끝: 뱃지와 화살표 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
                            {emotionDB.filter(r => r.trackType === s.trackType).length > 0 && (
                              <div
                                onClick={(e) => { e.stopPropagation(); setStep('monthly_report'); window.scrollTo(0, 0); }}
                                style={{ fontSize: '0.68rem', color: s.color, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.8)', padding: '4px 10px', borderRadius: '10px', border: `1px solid ${s.border}` }}
                              >
                                기록 {emotionDB.filter(r => r.trackType === s.trackType).length}개
                              </div>
                            )}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── 프리미엄 배너: 월간 심리 성장 리포트 (캐러셀) ── */}
                    <CarouselBanner
                      userNameDisplay={userNameDisplay}
                      onPremiumClick={() => {
                        setIsEnteringRoom(true);
                        setTimeout(() => { goToStep('monthly_analytics', { requireLogin: true }); setIsEnteringRoom(false); }, 500);
                      }}
                    />



                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════
                🚪 마음 노크함 (임시 준비 화면)
            ═══════════════════════════════════════════ */}
              {step === 'knock' && (
                <div className="dynamic-fade-layer" style={{ padding: '60px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '20px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="2" width="13" height="20" rx="1.5" stroke="#2C3E50" strokeWidth="1.4" />
                    <path d="M16 5L21 7V19L16 21" stroke="#2C3E50" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="14" cy="12" r="1.4" fill="#2C3E50" />
                  </svg>
                  <p style={{ fontSize: '1.1rem', color: '#4A4A4A', fontWeight: '700', margin: 0, letterSpacing: '-0.2px' }}>마음 노크함</p>
                  <p style={{ fontSize: '0.92rem', color: '#AAAAAA', margin: 0, lineHeight: '1.7', wordBreak: 'keep-all', textAlign: 'center' }}>
                    누군가에게 조용히 마음을 건넬 수 있는<br />공간을 준비 중입니다.
                  </p>
                  <button
                    onClick={() => { setStep('dashboard'); window.scrollTo(0, 0); }}
                    style={{ marginTop: '10px', background: 'none', border: 'none', color: '#CCCCCC', fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.5px' }}
                  >
                    대시보드로 돌아가기
                  </button>
                </div>
              )}

              {step === 'morning_letter' && (() => {
                const today = new Date();
                const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;
                const affirmation = morningLetterAI?.affirmation || '';
                // [방어 처리] Gemini가 실수로 <br> 등 HTML 태그를 삽입한 경우 실제 줄바꿈으로 변환
                const letter = (morningLetterAI?.letter || '').replace(/<br\s*\/?>/gi, '\n');
                const isTranscribed = transcriptText.length >= affirmation.length && affirmation.length > 0;

                return (
                  <div className="dynamic-fade-layer" style={{ padding: '20px 4px 30px 4px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <style>{`
                      @keyframes spin { to { transform: rotate(360deg); } }
                      @keyframes mlFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                      .ml-fade { animation: mlFadeIn 0.55s cubic-bezier(0.22,1,0.36,1) both; }
                      .ml-affirmation-input:focus { outline: none; }
                      .ml-start-btn { transition: all 0.35s ease; }
                      .ml-start-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,26,46,0.22); }
                    `}</style>

                    {/* 헤더 */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#BBBBBB', letterSpacing: '3px', fontWeight: '700' }}>MORNING LETTER · {dateStr}</span>
                      <div style={{ width: '24px', height: '1px', backgroundColor: '#DDD', margin: '14px auto 0 auto' }} />
                    </div>

                    {/* ── 로딩 상태 ── */}
                    {isLoadingMorningLetter && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 0' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid #EBD9CE', borderTopColor: '#E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#B0926A', fontWeight: '600', letterSpacing: '0.5px' }}>오늘의 편지를 쓰고 있어요...</p>
                      </div>
                    )}

                    {/* ── 감정 선택 칩 (편지 생성 전) ── */}
                    {!isLoadingMorningLetter && !morningLetterAI && (
                      <div className="ml-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px 0' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#666', fontWeight: '500', letterSpacing: '0px' }}>오늘 느껴지는 감정 카드를 하나 선택해 보세요.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '320px' }}>
                          {['🌱 평온함', '☁️ 불안', '🌧️ 슬픔', '👣 분노', '🫧 무기력', '✨ 설렘'].map(emo => (
                            <button
                              key={emo}
                              onClick={() => handleStartMorningLetter(emo)}
                              style={{
                                background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '20px', padding: '10px 18px',
                                fontSize: '0.9rem', color: '#444', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E2725B'; e.currentTarget.style.color = '#E2725B'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEAEA'; e.currentTarget.style.color = '#444'; }}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleStartMorningLetter(null)}
                          style={{
                            marginTop: '12px', background: 'none', border: 'none', color: '#999', fontSize: '0.85rem', textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer'
                          }}
                        >
                          건너뛰기
                        </button>
                      </div>
                    )}

                    {/* ── 편지 본문 + 필사 영역 (AI 응답 후) ── */}
                    {!isLoadingMorningLetter && morningLetterAI && (
                      <>
                        {/* 편지 본문 */}
                        <div className="ml-fade" style={{ backgroundColor: '#FDFCFA', borderRadius: '0', padding: '32px 24px', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB', marginBottom: '36px' }}>
                          <p style={{ fontSize: '0.78rem', color: '#AAAAAA', lineHeight: '1.4', margin: '0 0 20px 0', fontWeight: '600', letterSpacing: '1px' }}>
                            {dateStr}, {formData.name || '당신'} 님에게.
                          </p>
                          {letter.split('\n').map((line, i) => (
                            <p key={i} style={{ fontSize: '1.02rem', color: '#333333', lineHeight: '2.0', margin: '0 0 12px 0', fontWeight: '400', letterSpacing: '0.2px', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif' }}>
                              {line}
                            </p>
                          ))}
                        </div>

                        {/* T R A N S C R I P T I O N */}
                        <div className="ml-fade" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', animationDelay: '0.1s' }}>
                          <div style={{ letterSpacing: '2px', fontSize: '0.7rem', color: '#999', fontWeight: '700', marginBottom: '12px' }}>
                            T R A N S C R I P T I O N
                          </div>

                          {/* 확언 제시 */}
                          <div style={{ width: '100%', backgroundColor: '#F7F3EF', borderRadius: '14px', padding: '18px 22px', marginBottom: '14px', borderLeft: '3px solid #E2725B' }}>
                            <div style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '2px', fontWeight: '700', marginBottom: '8px' }}>오늘의 긍정 확언</div>
                            <p style={{ margin: 0, fontSize: '1.05rem', color: '#4A3728', fontWeight: '700', lineHeight: '1.6', fontFamily: '"Nanum Myeongjo", serif', wordBreak: 'keep-all' }}>
                              {affirmation}
                            </p>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#AAA', marginBottom: '14px', textAlign: 'center', wordBreak: 'keep-all' }}>
                            위 확언을 천천히 따라 써보세요. 손끝으로 내면화됩니다.
                          </div>

                          {/* 덧입히기 입력창 (트레이싱 방식) */}
                          <div style={{
                            position: 'relative', width: '100%', minHeight: '64px',
                            backgroundColor: '#F8F8F8', borderRadius: '12px',
                            border: `1.5px solid ${isTranscribed ? '#B8D9C5' : '#E8E8E8'}`,
                            transition: 'border-color 0.4s ease', overflow: 'hidden'
                          }}>
                            {/* 가이드 텍스트 (트레이싱 배경) */}
                            <div style={{
                              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                              padding: '20px 45px 20px 22px',
                              fontSize: '0.97rem', fontWeight: '500', lineHeight: '1.5',
                              fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '0px', wordSpacing: '0px', margin: 0, border: 'none',
                              pointerEvents: 'none', userSelect: 'none',
                              whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
                              boxSizing: 'border-box', display: 'block'
                            }}>
                              {affirmation.split('').map((char, idx) => {
                                const activeLen = isComposing ? Math.max(0, transcriptText.length - 1) : transcriptText.length;
                                const isNextChar = idx === activeLen && !isTranscribed;
                                return (
                                  <span key={idx} style={{
                                    color: idx < activeLen ? (isTranscribed ? '#2A6644' : '#E2725B') : '#D8D8D8',
                                    textDecoration: isNextChar ? 'underline' : 'none',
                                    textDecorationColor: isNextChar ? '#E2725B' : 'transparent',
                                    textDecorationThickness: '2.5px',
                                    textUnderlineOffset: '4px',
                                    transition: 'color 0.2s ease, text-decoration-color 0.2s ease'
                                  }}>
                                    {char}
                                  </span>
                                );
                              })}
                            </div>
                            {/* 실제 입력창 */}
                            <textarea
                              className="ml-affirmation-input"
                              value={transcriptText}
                              onCompositionStart={() => setIsComposing(true)}
                              onCompositionEnd={(e) => {
                                setIsComposing(false);
                                const val = e.target.value.replace(/\n/g, '');
                                if (val.length <= affirmation.length) setTranscriptText(val);
                              }}
                              onChange={e => { 
                                const val = e.target.value.replace(/\n/g, ''); 
                                if (val.length <= affirmation.length) setTranscriptText(val); 
                              }}
                              style={{
                                display: 'block', width: '100%', minHeight: '64px', height: '100%',
                                backgroundColor: 'transparent', outline: 'none',
                                color: 'transparent',
                                fontSize: '0.97rem', fontWeight: '500', lineHeight: '1.5',
                                fontFamily: '"Nanum Myeongjo", serif', letterSpacing: '0px', wordSpacing: '0px', margin: 0, border: 'none',
                                caretColor: 'transparent', boxSizing: 'border-box',
                                padding: '20px 45px 20px 22px',
                                whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
                                resize: 'none', overflow: 'hidden'
                              }}
                              placeholder=""
                              rows={2}
                            />
                            {isTranscribed && (
                              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none' }}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#2A6644" strokeWidth="1.2" /><path d="M5.5 9L7.8 11.5L12.5 6.5" stroke="#2A6644" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                            )}
                          </div>

                          {/* 버튼 영역 */}
                          <div style={{ marginTop: '32px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                            {/* 하루 시작하기 버튼 */}
                            <button
                              className="ml-start-btn"
                              disabled={!isTranscribed}
                              onClick={() => {
                                if (!isTranscribed) return;
                                const newRecord = {
                                  id: Date.now().toString(),
                                  timestamp: Date.now(),
                                  date: new Date().toLocaleDateString(),
                                  trackType: '모닝 확언',
                                  text: affirmation,
                                };
                                setEmotionDB(db => {
                                  const updated = [...db, newRecord];
                                  localStorage.setItem('Personal_Emotion_DB', JSON.stringify(updated));
                                  return updated;
                                });
                                setToastMsg('오늘의 확언이 마음 아카이브에 새겨졌습니다.');
                                setTimeout(() => setToastMsg(''), 3500);
                                setTranscriptText('');
                                setMorningLetterAI(null);
                                setStep('dashboard');
                              }}
                              style={{
                                width: '100%', padding: '16px',
                                backgroundColor: isTranscribed ? '#1A1A2E' : '#F0F0F0',
                                color: isTranscribed ? '#FFFFFF' : '#CCCCCC',
                                border: 'none', borderRadius: '14px',
                                fontSize: '0.92rem', fontWeight: '700', letterSpacing: '1.5px',
                                cursor: isTranscribed ? 'pointer' : 'not-allowed',
                              }}
                            >
                              하루 시작하기
                            </button>

                            {/* 건너뛰기 */}
                            <button
                              onClick={() => { setTranscriptText(''); setMorningLetterAI(null); setStep('dashboard'); }}
                              style={{ background: 'none', border: 'none', color: '#CCCCCC', fontSize: '0.78rem', cursor: 'pointer', padding: '4px', letterSpacing: '0.5px' }}
                            >
                              오늘은 그냥 읽기만 할게요
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}




























              {/* ☁️ 행동 예보 시스템 (daily_forecast)는 최상단에서 렌더링됨 */}


              {step === 'monthly_report' && (() => {
                const name = formData.name || '당신';
                const recordCount = emotionDB.length;
                const today = new Date();
                const monthStr = `${today.getMonth() + 1}월`;

                // 이달의 기질별 인사이트 문장
                const ilgan = formData.year ? calculateIlgan(formData.year, formData.month, formData.day) : { element: 0 };
                const insightsByElement = [
                  `이번 달 ${name} 님은 '더 잘해야 한다'는 내면의 목소리에 치이면서도, 그 압박을 성장의 연료로 묵묵히 전환시키셨습니다. 스스로 속도를 조절하고 뿌리를 내리는 긍정적인 변화가 나타났습니다.`,
                  `이번 달 ${name} 님은 인정받고 싶은 마음이 들 때마다 그 열정을 바깥이 아닌 자신에게 먼저 돌리는 연습을 해오셨습니다. 내면의 불꽃을 온화하게 다루는 성숙한 변화가 나타났습니다.`,
                  `이번 달 ${name} 님은 '도망치고 싶은 마음'이 들 때마다 스스로 공간을 분리하며 훌륭하게 자신을 보호했습니다. 스스로 호흡을 가다듬고 통제권을 쥐는 긍정적인 변화가 나타났습니다.`,
                  `이번 달 ${name} 님은 불필요한 것들을 잘라내고 정말 중요한 것에 집중하는 능력이 한층 선명해졌습니다. 자신만의 기준을 지키면서도 타인에게 다정해지는 균형을 찾아가고 있습니다.`,
                  `이번 달 ${name} 님은 억지로 결론을 내리지 않고 상황을 자연스럽게 흘려보내는 용기를 발휘하셨습니다. 저항하지 않고도 중심을 잃지 않는 유연한 지혜가 깊어지고 있습니다.`,
                ];
                const insight = insightsByElement[ilgan.element] || insightsByElement[0];

                const sentencesByElement = [
                  '나는 타인의 속도에 흔들리지 않고, 나만의 단단한 뿌리 위에 선다.',
                  '나는 세상의 인정보다 내 안의 불꽃을 먼저 믿는다.',
                  '나는 타인의 시선보다 내 마음의 온도를 먼저 돌본다.',
                  '나는 완벽하지 않아도, 지금 이 모습으로 이미 충분하다.',
                  '나는 억지로 거스르지 않고도, 나의 길을 유연하게 흘러간다.',
                ];
                const monthSentence = sentencesByElement[ilgan.element] || sentencesByElement[0];

                return (
                  <div className="dynamic-fade-layer" style={{ padding: '20px 4px 50px 4px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* 헤더 */}
                    <div style={{ textAlign: 'center', marginBottom: '44px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#BBBBBB', letterSpacing: '3px', fontWeight: '700' }}>MONTHLY MIND REPORT</span>
                      <h2 style={{ fontSize: '1.3rem', color: '#4A4A4A', margin: '16px 0 10px 0', fontWeight: '800', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                        {monthStr}, 마음의 궤적
                      </h2>
                      <p style={{ fontSize: '0.88rem', color: '#AAAAAA', margin: 0, lineHeight: '1.7', wordBreak: 'keep-all' }}>
                        한 달 동안 차곡차곡 쌓인<br />{name} 님의 단단한 방패들을 펼쳐봅니다.
                      </p>
                    </div>

                    {/* 기록 요약 */}
                    {recordCount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '32px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#E2725B' }}>{recordCount}</div>
                          <div style={{ fontSize: '0.72rem', color: '#BBBBBB', letterSpacing: '1px', marginTop: '4px' }}>이번 달 기록</div>
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#EBEBEB' }} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#4A4A4A' }}>{monthStr}</div>
                          <div style={{ fontSize: '0.72rem', color: '#BBBBBB', letterSpacing: '1px', marginTop: '4px' }}>기간</div>
                        </div>
                      </div>
                    )}

                    {/* 핵심 인사이트 */}
                    <div style={{ backgroundColor: '#FDFCFA', padding: '32px 24px', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB', marginBottom: '36px' }}>
                      <h3 style={{ fontSize: '0.75rem', color: '#BBBBBB', fontWeight: '700', letterSpacing: '2px', margin: '0 0 16px 0' }}>CORE INSIGHT</h3>
                      <p style={{ fontSize: '1.03rem', color: '#333', lineHeight: '1.9', margin: 0, wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif' }}>
                        {insight}
                      </p>
                    </div>

                    {/* 이달의 문장 */}
                    <div style={{ padding: '0 10px', marginBottom: '44px' }}>
                      <h3 style={{ fontSize: '0.75rem', color: '#BBBBBB', fontWeight: '700', letterSpacing: '2px', margin: '0 0 20px 0' }}>THIS MONTH'S SENTENCE</h3>
                      <div style={{ borderLeft: '2px solid #E2725B', paddingLeft: '20px' }}>
                        <p style={{ fontSize: '1.1rem', color: '#4A4A4A', fontWeight: '700', lineHeight: '1.8', margin: 0, fontStyle: 'italic', fontFamily: '"Nanum Myeongjo", serif', wordBreak: 'keep-all' }}>
                          "{monthSentence}"
                        </p>
                      </div>
                    </div>

                    {/* 맺음말 */}
                    <div style={{ padding: '0 10px', marginBottom: '40px' }}>
                      <p style={{ fontSize: '0.92rem', color: '#888', lineHeight: '1.9', margin: 0, wordBreak: 'keep-all' }}>
                        {name} 님, 이 기록들은 당신이 매 순간 무너지지 않고 자신을 단단히 붙들어온 흔적입니다. 다음 달에도 여기, 언제든 돌아오세요.
                      </p>
                    </div>

                    {/* 돌아가기 */}
                    <button
                      onClick={() => { setStep('dashboard'); window.scrollTo(0, 0); }}
                      style={{ background: 'none', border: '1px solid #E0E0E0', color: '#888', fontSize: '0.88rem', cursor: 'pointer', padding: '14px 28px', borderRadius: '12px', letterSpacing: '0.5px', alignSelf: 'center' }}
                    >
                      대시보드로 돌아가기
                    </button>
                  </div>
                );
              })()}


              {step === 'monthlyLetter' && (
                <div className="dynamic-fade-layer" style={{ padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {isLoadingLetter ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '60%', height: '32px', backgroundColor: '#EAEAEA', borderRadius: '4px', marginBottom: '60px', animation: 'skeletonPulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ width: '100%', padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '35px' }}>
                        <div style={{ width: '100%', height: '80px', backgroundColor: '#EAEAEA', borderRadius: '4px', animation: 'skeletonPulse 1.5s infinite ease-in-out', animationDelay: '0.1s' }}></div>
                        <div style={{ width: '100%', height: '60px', backgroundColor: '#EAEAEA', borderRadius: '4px', animation: 'skeletonPulse 1.5s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                        <div style={{ width: '100%', height: '100px', backgroundColor: '#EAEAEA', borderRadius: '4px', animation: 'skeletonPulse 1.5s infinite ease-in-out', animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: '1.4rem', color: '#4A4A4A', margin: '15px 0 60px 0', fontWeight: 'bold', letterSpacing: '0.5px', textAlign: 'center', lineHeight: '1.5' }}>
                        5월의 기록:<br />{formData.name || '재희'} 님의 시선이 닿아 머문 자리
                      </h2>
                      <div style={{ textAlign: 'left', width: '100%', padding: '0 15px' }}>
                        {generateMonthlyLetter().paragraphs.map((p, idx) => (
                          <p key={idx} style={{
                            fontSize: '1.05rem',
                            color: p.startsWith('"') ? '#222222' : '#555555',
                            lineHeight: '2.0',
                            marginBottom: '35px',
                            wordBreak: 'keep-all',
                            fontWeight: p.startsWith('"') ? 'bold' : 'normal',
                            paddingLeft: p.startsWith('"') ? '15px' : '0',
                            borderLeft: p.startsWith('"') ? '2px solid #DDDDDD' : 'none'
                          }}>
                            {p}
                          </p>
                        ))}
                      </div>
                      <div style={{ height: '50px' }} />
                    </>
                  )}
                </div>
              )}

              {step === 'type_selection' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' }}>
                  <h2 style={{ fontSize: '1.15rem', color: '#E2725B', marginBottom: '15px', fontWeight: 'bold' }}>어느 곳의 마음지도를 먼저 펼쳐볼까요?</h2>

                  <button style={{ ...styles.optionBtn, padding: '32px 20px', fontSize: '1.15rem', borderRadius: '20px', lineHeight: '1.6' }} onClick={() => handleTrackSelect('비밀의 방앗간')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#E2725B' }}>나만의 방 (내면의 회복)</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#888', marginTop: '12px', display: 'inline-block' }}>(번아웃, 완벽주의, 나를 향한 자책)</span>
                  </button>

                  <button style={{ ...styles.optionBtn, padding: '32px 20px', fontSize: '1.15rem', borderRadius: '20px', lineHeight: '1.6' }} onClick={() => handleTrackSelect('다정한 식탁')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#E2725B' }}>다정한 식탁 (가족과 관계)</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#888', marginTop: '12px', display: 'inline-block' }}>(부부 갈등, 육아 고민, 애착의 엇갈림)</span>
                  </button>

                  <button style={{ ...styles.optionBtn, padding: '32px 20px', fontSize: '1.15rem', borderRadius: '20px', lineHeight: '1.6' }} onClick={() => handleTrackSelect('나를 지키는 울타리')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#E2725B' }}>세상의 울타리 (일터와 사회)</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#888', marginTop: '12px', display: 'inline-block' }}>(직장 스트레스, 대인관계, 건강한 경계)</span>
                  </button>

                  <button style={{ ...styles.optionBtn, padding: '32px 20px', fontSize: '1.15rem', borderRadius: '20px', lineHeight: '1.6' }} onClick={() => handleTrackSelect('성장 탐험가')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#E2725B' }}>성장 탐험가</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#D95A40', backgroundColor: '#FFF0ED', padding: '4px 10px', borderRadius: '12px', marginLeft: '10px', verticalAlign: 'middle' }}>청소년 전용</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#888', marginTop: '12px', display: 'inline-block' }}>(학업 엔진 소음, 독립의 근육통, 내면 능력치 탐구)</span>
                  </button>
                </div>
              )}

              {step === 'info' && (() => {
                const ampmOptions = [
                  { val: '오전', icon: '☀️', label: '오전' },
                  { val: '오후', icon: '🌙', label: '오후' },
                  { val: '모름', icon: '❓', label: '잘 모르겠어요' },
                ];
                return (
                  <div className="dynamic-fade-layer" style={{
                    marginTop: '20px',
                    paddingBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}>
                    <style>{`
                    .onb-card {
                      background: #FFFFFF;
                      border-radius: 28px;
                      padding: 32px 28px 28px 28px;
                      box-shadow: 0 8px 32px rgba(160,110,80,0.09), 0 1.5px 6px rgba(0,0,0,0.04);
                      display: flex;
                      flex-direction: column;
                      gap: 28px;
                    }
                    .onb-label {
                      font-size: 0.8rem;
                      font-weight: 700;
                      color: #B08070;
                      letter-spacing: 1.5px;
                      text-transform: uppercase;
                      margin-bottom: 8px;
                      display: block;
                    }
                    .onb-input {
                      width: 100%;
                      padding: 13px 16px;
                      border-radius: 14px;
                      border: none;
                      background: #F9F4EF;
                      font-size: 1rem;
                      color: #4A3728;
                      font-family: inherit;
                      outline: none;
                      box-sizing: border-box;
                      transition: background 0.2s;
                    }
                    .onb-input:focus { background: #F3EBE3; }
                    .onb-input::placeholder { color: #C8B8A8; }
                    .ampm-pill {
                      flex: 1;
                      padding: 11px 6px;
                      border-radius: 12px;
                      border: 1.5px solid #E8DDD5;
                      background: #F9F4EF;
                      color: #9A8070;
                      font-size: 0.88rem;
                      font-weight: 600;
                      cursor: pointer;
                      font-family: inherit;
                      transition: all 0.2s ease;
                      text-align: center;
                      line-height: 1.5;
                    }
                    .ampm-pill:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
                    .ampm-pill.active {
                      background: #E2725B;
                      border-color: #E2725B;
                      color: white;
                      box-shadow: 0 3px 10px rgba(226,114,91,0.22);
                    }
                    .onb-enter-btn {
                      width: 100%;
                      padding: 18px;
                      border-radius: 16px;
                      border: none;
                      background: linear-gradient(135deg, #E8855A 0%, #D05A42 100%);
                      color: white;
                      font-size: 1.05rem;
                      font-weight: 700;
                      cursor: pointer;
                      font-family: inherit;
                      letter-spacing: 0.5px;
                      box-shadow: 0 6px 20px rgba(208,90,66,0.25);
                      transition: all 0.3s ease;
                      margin-top: 4px;
                    }
                    .onb-enter-btn:hover { box-shadow: 0 8px 24px rgba(208,90,66,0.35); transform: translateY(-1px); }
                  `}</style>

                    {/* 안내 메시지 */}
                    <div style={{ textAlign: 'center', padding: '4px 0 20px 0' }}>
                      <p style={{ fontSize: '1.05rem', color: '#6B4C3B', fontWeight: '700', lineHeight: '1.75', margin: 0, wordBreak: 'keep-all' }}>
                        반가워요. 당신을<br />더 깊이 이해하기 위해<br />몇 가지만 여쭤볼게요.
                      </p>
                    </div>

                    {/* 흰 컨테이너 카드 */}
                    <div className="onb-card">

                      {/* 이름 */}
                      <div>
                        <span className="onb-label">이름</span>
                        <input
                          className="onb-input"
                          placeholder="어떻게 불러드릴까요?"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      {/* 생년월일 */}
                      <div>
                        <span className="onb-label">태어난 날</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            className="onb-input"
                            style={{ flex: 2, textAlign: 'center' }}
                            placeholder="연도 (예: 1990)"
                            maxLength="4"
                            value={formData.year}
                            onChange={(e) => { const v = e.target.value; setFormData({ ...formData, year: v }); if (v.length === 4) monthRef.current.focus(); }}
                          />
                          <input
                            ref={monthRef}
                            className="onb-input"
                            style={{ flex: 1, textAlign: 'center' }}
                            placeholder="월"
                            maxLength="2"
                            value={formData.month}
                            onChange={(e) => { const v = e.target.value; setFormData({ ...formData, month: v }); if (v.length === 2) dayRef.current.focus(); }}
                          />
                          <input
                            ref={dayRef}
                            className="onb-input"
                            style={{ flex: 1, textAlign: 'center' }}
                            placeholder="일"
                            maxLength="2"
                            value={formData.day}
                            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* 태어난 시간 — Pill Toggle */}
                      <div>
                        <span className="onb-label">태어난 시간</span>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          {ampmOptions.map(opt => (
                            <button
                              key={opt.val}
                              className={`ampm-pill${formData.ampm === opt.val ? ' active' : ''}`}
                              onClick={() => setFormData({ ...formData, ampm: opt.val })}
                            >
                              <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: '2px' }}>{opt.icon}</span>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {/* 시제 선택 (ampm이 오전/오후일 때만 표시) */}
                        {(formData.ampm === '오전' || formData.ampm === '오후') && (
                          <select
                            style={{
                              width: '100%', padding: '12px 16px', borderRadius: '14px',
                              border: 'none', background: '#F9F4EF', fontSize: '0.95rem',
                              color: '#4A3728', fontFamily: 'inherit', outline: 'none',
                              appearance: 'none', cursor: 'pointer'
                            }}
                            value={formData.hour}
                            onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                          >
                            <option value="">시각을 선택하세요</option>
                            {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}시</option>)}
                          </select>
                        )}
                        <p style={{ fontSize: '0.78rem', color: '#BBA898', lineHeight: '1.65', margin: '10px 0 0 0', wordBreak: 'keep-all' }}>
                          정확한 시간을 모른다면 비워두셔도 좋습니다.<br />그 자체로도 충분히 아늑한 당신만의 공간이 열릴 거에요.
                        </p>
                      </div>

                      {/* 진입 버튼 */}
                      <button
                        className="onb-enter-btn"
                        onClick={() => {
                          setIsEnteringRoom(true);
                          setTimeout(() => {
                            if (trackType === '비밀의 방앗간' || trackType === '성장 탐험가') {
                              setStep('concern');
                            } else if (trackType === '다정한 식탁') {
                              setStep('partner_info');
                            } else if (trackType === '나를 지키는 울타리') {
                              setStep('concern');
                            } else {
                              setStep('type_selection');
                            }
                            setIsEnteringRoom(false);
                            window.scrollTo(0, 0);
                          }, 600);
                        }}
                      >
                        나의 공간으로 들어가기
                      </button>

                    </div>{/* /onb-card */}
                  </div>
                );
              })()}

              {step === 'partner_info' && (() => {
                const isFamilyRoom = trackType === '다정한 식탁';
                const isValidInfo = (val) => val && val.trim() !== '' && val !== '연도' && val !== '월' && val !== '일';
                const hasMyInfo = Boolean(isValidInfo(formData.name) && isValidInfo(formData.year) && isValidInfo(formData.month) && isValidInfo(formData.day));
                const showMyInfoForm = !hasMyInfo || isEditingMyInfo;



                const handleEnterRoom = () => {
                  if (showMyInfoForm) {
                    if (!isValidInfo(formData.name) || !isValidInfo(formData.year) || !isValidInfo(formData.month) || !isValidInfo(formData.day)) {
                      setToastMsg('나의 기본 정보를 모두 입력해주세요.');
                      setTimeout(() => setToastMsg(''), 3000);
                      return;
                    }
                    localStorage.setItem('here_my_info', JSON.stringify({
                      name: formData.name, year: formData.year, month: formData.month, day: formData.day,
                      ampm: formData.ampm, hour: formData.hour
                    }));
                    setIsEditingMyInfo(false);
                  }

                  if (isFamilyRoom) {
                    if (!formData.partnerName || !formData.partnerYear) {
                      setToastMsg('가족 정보를 모두 입력해주세요.');
                      setTimeout(() => setToastMsg(''), 3000);
                      return;
                    }
                  } else {
                    if (!formData.partnerName || !formData.partnerRelation) {
                      setToastMsg('대상자 정보를 모두 입력해주세요.');
                      setTimeout(() => setToastMsg(''), 3000);
                      return;
                    }
                  }



                  setIsEnteringRoom(true);
                  setTimeout(() => { setStep('concern'); setIsEnteringRoom(false); window.scrollTo(0, 0); }, 600);
                };

                return (
                  <div className="dynamic-fade-layer" style={{ ...styles.inputGroup, gap: '25px', marginTop: '40px', paddingBottom: '30px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <svg viewBox="0 0 100 100" fill="none" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto', display: 'block' }}>
                        <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
                        <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
                      </svg>
                      <span style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '3px', fontWeight: '700', display: 'block', marginBottom: '12px' }}>
                        {isFamilyRoom ? 'FAMILY ROOM · HEALING' : 'RELATIONSHIP ROOM · BOUNDARY'}
                      </span>
                      <h2 style={{ fontSize: '1.3rem', color: '#6B4C3B', marginBottom: '12px', lineHeight: '1.4', fontWeight: 'bold', wordBreak: 'keep-all' }}>
                        {isFamilyRoom ? '서로의 마음을 더 깊이 이해하는 시간' : '나를 지키고 건강한 거리를 찾는 시간'}
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: '#6B4C3B', margin: '0', lineHeight: '1.6', wordBreak: 'keep-all' }}>
                        {isFamilyRoom ? (
                          <>오해 너머에 숨겨진 진짜 진심을 마주하기 위해,<br />오늘 이야기를 나눌 분에 대해 먼저 알려주세요.</>
                        ) : (
                          <>단단한 마음의 선을 긋기 위해,<br />오늘 나를 힘들게 했던 그 사람에 대해 조금만 알려주세요.</>
                        )}
                      </p>
                    </div>

                    {/* 나의 정보 섹션 */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: '24px 20px', borderRadius: '16px', border: '1px solid #EAE0D8', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showMyInfoForm ? '16px' : '0' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#6B4C3B' }}>나의 정보</span>
                        {!showMyInfoForm && (
                          <button onClick={() => setIsEditingMyInfo(true)} style={{ background: 'none', border: 'none', color: '#E2725B', fontSize: '0.85rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#FFF0ED' }}>수정</button>
                        )}
                      </div>

                      {!showMyInfoForm ? (
                        <div style={{ fontSize: '1.05rem', color: '#4A3728', marginTop: '8px' }}>
                          <b style={{ color: '#E2725B' }}>{formData.name}</b> 님 ({formData.year}년생)
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={styles.inputItem}>
                            <label style={{ ...styles.label, fontSize: '0.85rem' }}>이름</label>
                            <input style={{ ...styles.nameInput, backgroundColor: '#FDFBF7' }} placeholder="이름 또는 호칭" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                          </div>
                          <div style={styles.inputItem}>
                            <label style={{ ...styles.label, fontSize: '0.85rem' }}>생년월일</label>
                            <div style={styles.dateInputGroup}>
                              <input style={{ ...styles.splitInput, flex: 2, backgroundColor: '#FDFBF7' }} placeholder="연도(예:1980)" maxLength="4" value={formData.year} onChange={(e) => { const val = e.target.value; setFormData({ ...formData, year: val }); }} />
                              <input style={{ ...styles.splitInput, flex: 1, backgroundColor: '#FDFBF7' }} placeholder="월" maxLength="2" value={formData.month} onChange={(e) => { const val = e.target.value; setFormData({ ...formData, month: val }); }} />
                              <input style={{ ...styles.splitInput, flex: 1, backgroundColor: '#FDFBF7' }} placeholder="일" maxLength="2" value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 가족/대상자 정보 섹션 */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: '24px 20px', borderRadius: '16px', border: '1px solid #EAE0D8', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#6B4C3B', display: 'block', marginBottom: '16px' }}>
                        {isFamilyRoom ? '가족 정보' : '대상자 정보'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={styles.inputItem}>
                          <label style={{ ...styles.label, fontSize: '0.85rem' }}>이름 (또는 호칭)</label>
                          <input style={{ ...styles.nameInput, backgroundColor: '#FDFBF7' }} placeholder="이름 또는 호칭" value={formData.partnerName} onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })} />
                        </div>
                        {isFamilyRoom ? (
                          <div style={styles.inputItem}>
                            <label style={{ ...styles.label, fontSize: '0.85rem' }}>생년월일</label>
                            <div style={styles.dateInputGroup}>
                              <input style={{ ...styles.splitInput, flex: 2, backgroundColor: '#FDFBF7' }} placeholder="연도(예:1980)" maxLength="4" value={formData.partnerYear} onChange={(e) => { const val = e.target.value; setFormData({ ...formData, partnerYear: val }); if (val.length === 4 && pMonthRef.current) pMonthRef.current.focus(); }} />
                              <input ref={pMonthRef} style={{ ...styles.splitInput, flex: 1, backgroundColor: '#FDFBF7' }} placeholder="월" maxLength="2" value={formData.partnerMonth} onChange={(e) => { const val = e.target.value; setFormData({ ...formData, partnerMonth: val }); if (val.length === 2 && pDayRef.current) pDayRef.current.focus(); }} />
                              <input ref={pDayRef} style={{ ...styles.splitInput, flex: 1, backgroundColor: '#FDFBF7' }} placeholder="일" maxLength="2" value={formData.partnerDay} onChange={(e) => setFormData({ ...formData, partnerDay: e.target.value })} />
                            </div>
                          </div>
                        ) : (
                          <div style={styles.inputItem}>
                            <label style={{ ...styles.label, fontSize: '0.85rem' }}>나와의 관계 (선택)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                              {['직장 상사/동료', '학부모 모임/동네 지인', '연인 (커플/연애)', '애매하게 선 넘는 친구'].map((rel) => {
                                const isSelected = formData.partnerRelation === rel && !formData.isCustomRelation;
                                return (
                                  <button
                                    key={rel}
                                    onClick={() => setFormData({ ...formData, partnerRelation: rel, isCustomRelation: false })}
                                    style={{
                                      padding: '10px 16px', borderRadius: '20px', border: `1px solid ${isSelected ? '#E2725B' : '#E0E0E0'}`,
                                      backgroundColor: isSelected ? '#E2725B' : '#FFF', color: isSelected ? '#FFF' : '#6A5B53',
                                      fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                  >
                                    {rel}
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => {
                                  setFormData({ ...formData, partnerRelation: '', isCustomRelation: true });
                                  setTimeout(() => document.getElementById('direct-relation-input')?.focus(), 50);
                                }}
                                style={{
                                  padding: '10px 16px', borderRadius: '20px', border: `1px solid ${formData.isCustomRelation ? '#E2725B' : '#E0E0E0'}`,
                                  backgroundColor: formData.isCustomRelation ? '#E2725B' : '#FFF',
                                  color: formData.isCustomRelation ? '#FFF' : '#6A5B53',
                                  fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >
                                직접 입력
                              </button>
                            </div>
                            {formData.isCustomRelation && (
                              <input
                                id="direct-relation-input"
                                style={{ ...styles.nameInput, backgroundColor: '#FDFBF7', marginTop: '12px' }}
                                placeholder="직접 입력 예시: 시댁/처가, 형제/자매, 층간소음 이웃 등"
                                value={formData.partnerRelation}
                                onChange={(e) => setFormData({ ...formData, partnerRelation: e.target.value })}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>



                    <button style={styles.button} onClick={handleEnterRoom}>
                      {isFamilyRoom ? '대화의 식탁 차리기' : '다음 단계로'}
                    </button>
                  </div>
                );
              })()}

              {step === 'concern' && (trackType === '비밀의 방앗간' || trackType === '성장 탐험가') && (() => {
                const isMyRoom = trackType === '비밀의 방앗간';
                const concernLen = currentConcernData.text.length;
                // 뺄란 버튼이 활성화되는 조건: '다 적었어요' 버튼이 클릭된 후
                const showDoneButton = isMyRoom && concernLen >= 10 && !currentConcernData.isWritingDone;
                const showChips = isMyRoom && currentConcernData.isWritingDone;
                const isActive = isMyRoom
                  ? (currentConcernData.isWritingDone && currentConcernData.emotions.length >= 1)
                  : (concernLen >= 30);

                const toggleChip = (chip) => {
                  setCurrentConcernData(prev => ({
                    ...prev,
                    emotions: prev.emotions.includes(chip)
                      ? prev.emotions.filter(c => c !== chip)
                      : prev.emotions.length < 2 ? [...prev.emotions, chip] : [prev.emotions[1], chip]
                  }));
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '32px' }}>

                    {/* ── CSS: 카드 & 칩 스타일 ── */}
                    <style>{`
                    .emotion-chip {
                      padding: 8px 16px;
                      border-radius: 999px;
                      border: 1.5px solid #DDD3CB;
                      background: #FBF8F5;
                      color: #7A5C48;
                      font-size: 0.88rem;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.22s ease;
                      font-family: inherit;
                      line-height: 1.4;
                    }
                    .emotion-chip:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
                    .emotion-chip.active {
                      background: #E2725B;
                      border-color: #E2725B;
                      color: white;
                      box-shadow: 0 3px 10px rgba(226,114,91,0.25);
                    }
                    .chip-panel {
                      overflow: hidden;
                      transition: max-height 0.45s ease-in-out, opacity 0.45s ease-in-out, transform 0.45s ease-in-out;
                    }
                    .chip-panel.open  { max-height: 400px; opacity: 1; transform: translateY(0); }
                    .chip-panel.closed { max-height: 0; opacity: 0; transform: translateY(-10px); }
                    .done-btn {
                      display: inline-flex;
                      align-items: center;
                      gap: 6px;
                      padding: 7px 16px 7px 18px;
                      border-radius: 999px;
                      border: 1.5px solid #D4BFB4;
                      background: #FBF8F5;
                      color: #9A7060;
                      font-size: 0.82rem;
                      font-weight: 600;
                      cursor: pointer;
                      font-family: inherit;
                      transition: all 0.22s ease;
                      letter-spacing: 0.2px;
                    }
                    .done-btn:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
                    .done-btn-wrap {
                      overflow: hidden;
                      transition: max-height 0.35s ease, opacity 0.35s ease;
                    }
                    .done-btn-wrap.visible { max-height: 60px; opacity: 1; }
                    .done-btn-wrap.hidden  { max-height: 0;   opacity: 0; pointer-events: none; }
                  `}</style>

                    {/* ── 상단 헤더 ── */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      {isMyRoom ? (
                        <>
                          <svg viewBox="0 0 100 100" fill="none" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto', display: 'block' }}>
                            <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
                            <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
                          </svg>
                          <span style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '3px', fontWeight: '700', display: 'block', marginBottom: '12px' }}>MIND ROOM &middot; SELF</span>
                          <h2 style={{ fontSize: '1.25rem', color: '#6B4C3B', margin: '0', lineHeight: '1.7', textAlign: 'center', fontWeight: '700', wordBreak: 'keep-all' }}>
                            온전히 나에게 집중하는 시간
                          </h2>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 100 100" fill="none" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto', display: 'block' }}>
                            <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
                            <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
                          </svg>
                          <span style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '3px', fontWeight: '700', display: 'block', marginBottom: '12px' }}>TEEN ROOM &middot; GROWTH</span>
                          <h2 style={{ fontSize: '1.3rem', color: '#6B4C3B', margin: '0', lineHeight: '1.5', textAlign: 'center', fontWeight: 'bold' }}>
                            현재의 고민이나 감정을<br />자유롭게 작성해주세요.
                          </h2>
                        </>
                      )}
                    </div>

                    {/* UX Tip: 복원된 상태 알림 */}
                    {savedConcernData && savedConcernData.text && currentConcernData.text === '' && (
                      <div style={{ backgroundColor: '#FDF7F3', color: '#B5614F', fontSize: '0.85rem', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>💡 아까 적어주신 마음이 임시 저장되어 있어요.</span>
                        <button
                          onClick={() => setCurrentConcernData(savedConcernData)}
                          style={{
                            backgroundColor: '#E2725B', color: '#FFF', border: 'none', borderRadius: '6px',
                            padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(226,114,91,0.2)'
                          }}
                        >
                          다시 불러오기
                        </button>
                      </div>
                    )}

                    {/* ── 텍스트에리어 ── */}
                    <textarea
                      style={{
                        width: '100%', minHeight: isMyRoom ? '160px' : '220px',
                        padding: '20px', borderRadius: '16px',
                        border: isMyRoom ? '1.5px solid #EAE0D8' : '2px solid #E2725B',
                        fontSize: '1rem', backgroundColor: isMyRoom ? '#FDFAF7' : '#FAFAFA',
                        resize: 'none', fontFamily: 'inherit', lineHeight: '1.8',
                        outline: 'none', color: '#4A3728', boxSizing: 'border-box',
                        boxShadow: isMyRoom ? '0 2px 12px rgba(180,140,110,0.07)' : 'inset 0 4px 15px rgba(0,0,0,0.03)'
                      }}
                      placeholder={isMyRoom
                        ? '오늘 가장 마음에 걸리는 것을 천천히 적어주세요. 어떤 이야기도 괜찮아요.'
                        : '고민이나 감정 상태를 상세히 적어주시면, 더 정확한 분석이 가능합니다.'}
                      value={currentConcernData.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentConcernData(prev => ({
                          ...prev,
                          text: val,
                          // 10자 미만으로 되돌리면 칩 상태 리셋
                          ...(val.length < 10 ? { emotions: [], isWritingDone: false } : {})
                        }));
                        if (showWarning && val.length >= 30) setShowWarning(false);
                      }}
                    />

                    {/* ── '다 적었어요' 버튼: 10자 이상 & 아직 칩 미표시 시에만 노출 ── */}
                    <div className={`done-btn-wrap ${showDoneButton ? 'visible' : 'hidden'}`}
                      style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="done-btn"
                        onClick={async () => {
                          setCurrentConcernData(prev => ({ ...prev, isWritingDone: true }));
                          setIsAnalyzingEmotion(true);

                          const text = currentConcernData.text;
                          // 기본값 (API 실패 시 폴백)
                          let qNormal = '이렇게 밖으로 꺼내어 적는 것만으로도 큰 용기랍니다.';
                          let qBold = '지금 나를 가장 지치게 하는 감정을 골라볼까요?';
                          let dChips = FALLBACK_EMOTION_CHIPS;

                          try {
                            const aiResult = await fetchGeminiFollowUp(text);
                            if (aiResult && aiResult.question) {
                              qNormal = '';
                              qBold = aiResult.question;
                            }
                            if (aiResult && Array.isArray(aiResult.chips) && aiResult.chips.length > 0) {
                              // API가 반환한 감정 8개를 동적 칩으로 설정
                              dChips = aiResult.chips.slice(0, 8);
                            }
                          } catch (err) {
                            // API 실패(429 등) 시 키워드 기반 꼬리 질문 + 넓은 범위 폴백 칩
                            if (/아이|남편|가족|엄마/.test(text)) {
                              qNormal = '가족을 챙기느라 정작 자신을 돌볼 틈이 없으셨군요.';
                              qBold = '이 복잡한 마음속에 어떤 감정이 숨어 있을까요?';
                            } else if (/회사|일|퇴근|출근/.test(text)) {
                              qNormal = '오늘 하루도 책임감을 다하느라 참 애쓰셨어요.';
                              qBold = '지금 가장 크게 다가오는 감정은 무엇인가요?';
                            }
                            console.warn('[Gemini] Fallback chips applied:', err.message);
                          }

                          setCurrentConcernData(prev => ({
                            ...prev,
                            dynamicQuestion: { normal: qNormal, bold: qBold },
                            dynamicChips: dChips
                          }));
                          setIsAnalyzingEmotion(false);
                        }}
                      >
                        다 적었어요
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {/* ── 감정 칩 패널: '다 적었어요' 클릭 후 스르르큭 등장 ── */}
                    <div className={`chip-panel ${showChips ? 'open' : 'closed'}`} style={{ marginTop: '8px' }}>
                      {isAnalyzingEmotion ? (
                        <div className="dynamic-fade-layer" style={{
                          backgroundColor: '#FBF3EE',
                          border: '1px solid #EBD9CE',
                          borderRadius: '14px',
                          padding: '30px 18px',
                          marginBottom: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{ width: '28px', height: '28px', border: '3px solid #EBD9CE', borderTopColor: '#E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          <p style={{ margin: 0, fontSize: '0.92rem', color: '#A67C52', fontWeight: '700', letterSpacing: '0.5px', animation: 'skeletonPulse 1.8s infinite ease-in-out' }}>
                            마음을 읽고 있어요...
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* 공감 메시지 */}
                          <div className="dynamic-fade-layer" style={{
                            backgroundColor: '#FBF3EE',
                            border: '1px solid #EBD9CE',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            marginBottom: '16px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ fontSize: '1.05rem', flexShrink: 0, marginTop: '2px' }}>🌿</span>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#7A5040', lineHeight: '1.75', wordBreak: 'keep-all' }}>
                              {typeof currentConcernData.dynamicQuestion === 'string' ? currentConcernData.dynamicQuestion : currentConcernData.dynamicQuestion?.normal}<br />
                              <strong>{typeof currentConcernData.dynamicQuestion === 'object' ? currentConcernData.dynamicQuestion?.bold : ''}</strong>
                            </p>
                          </div>

                          {/* 감정 칩 리스트 */}
                          <div className="dynamic-fade-layer" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                            {currentConcernData.dynamicChips.map((chip, idx) => (
                              <button
                                key={chip}
                                className={`emotion-chip${currentConcernData.emotions.includes(chip) ? ' active' : ''}`}
                                onClick={() => toggleChip(chip)}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                          <p className="dynamic-fade-layer" style={{ textAlign: 'center', fontSize: '0.72rem', color: '#C4B0A4', marginTop: '10px', letterSpacing: '0.3px' }}>
                            가장 가까운 감정을 1~2개 고를 수 있어요.
                          </p>
                        </>
                      )}
                    </div>

                    {/* ── 경고 보조 텍스트 (다른 방 전용) ── */}
                    {!isMyRoom && (
                      <div style={{ minHeight: '24px', marginTop: '14px', textAlign: 'center' }}>
                        {showWarning && (
                          <span className="dynamic-fade-layer" style={{ color: '#E2725B', fontSize: '0.88rem', fontWeight: 'bold' }}>
                            30자 이상 입력 시 정확한 분석이 가능합니다.
                          </span>
                        )}
                      </div>
                    )}

                    {/* ── 제출 버튼 ── */}
                    <button
                      style={{
                        ...styles.button, marginTop: '18px',
                        backgroundColor: isActive ? '#E2725B' : '#EDE5DF',
                        color: isActive ? 'white' : '#B8A49A',
                        cursor: isActive ? 'pointer' : 'not-allowed',
                        boxShadow: isActive ? '0 4px 18px rgba(226,114,91,0.22)' : 'none',
                        letterSpacing: '0.5px',
                        transition: 'background-color 0.4s ease, color 0.4s ease, box-shadow 0.4s ease'
                      }}
                      onClick={isActive ? handleConcernSubmit : undefined}
                    >
                      {isMyRoom ? '마음의 무게 덜어내기' : `${trackType} 지도 열기`}
                    </button>
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════
                🍽️ 다정한 식탁 고민 입력 (White Screen 수정)
                concernText 상태를 부모에서 관리하여 안전하게 전달
            ═══════════════════════════════════════════ */}
              {step === 'concern' && (trackType === '다정한 식탁' || trackType === '나를 지키는 울타리') && (
                <FamilyConcernInputView
                  partnerName={formData?.partnerName || '상대방'}
                  partnerRelation={formData?.partnerRelation || '지인'}
                  trackType={trackType}
                  currentConcernData={currentConcernData}
                  setCurrentConcernData={setCurrentConcernData}
                  savedConcernData={savedConcernData}
                  onNext={() => {
                    if (getDailyUsageCount() >= MAX_DAILY_LIMIT) {
                      setShowLimitPopup(true);
                      return;
                    }
                    setIsLoadingResult(true);
                    setTimeout(() => {
                      setIsLoadingResult(false);
                                            sessionStorage.removeItem(`here_concern_data_${trackType}`);
                      setSavedConcernData(null);
                      setStep('result');
                    }, 500); // 최소 전환 딜레이만 유지 (화면 깜빡임 방지)
                  }}
                />
              )}

              {step === 'monthly_analytics' && (
                <MonthlyAnalyticsView
                  userName={formData?.name || '당신'}
                  onReset={() => setStep('dashboard')}
                />
              )}

              {/* ═══════════════════════════════════════════
                📍 공명의 사분면 결과 화면 (가족/관계의 방)
            ═══════════════════════════════════════════ */}
              {(step === 'result' || (step === 'shared_flow' && sharedStep === 'result')) &&
                (trackType === '다정한 식탁' || trackType === '나를 지키는 울타리') && (
                  <FamilyRelationshipView
                    partnerName={formData?.partnerName || '상대방'}
                    userConcern={currentConcernData.text}
                    partnerAction={currentConcernData.partnerAction}
                    selectedEmotions={currentConcernData.emotions}
                    defenseStyle={currentConcernData.defenseStyle}
                    coreNeed={currentConcernData.coreNeed}
                    trackType={trackType}
                    formData={formData}
                    onAnalysisSuccess={() => {
                      const newCount = incrementDailyUsageCount();
                      setToastMsg(`오늘 3회 중 ${newCount}회 사용했어요 (${MAX_DAILY_LIMIT - newCount}회 남음) 🌿`);
                      setTimeout(() => setToastMsg(''), 4000);
                    }}
                    onReset={() => {
                      setCurrentConcernData({ text: '', partnerAction: '', emotions: [], dynamicChips: FALLBACK_EMOTION_CHIPS, dynamicQuestion: null, isWritingDone: false });
                                            sessionStorage.removeItem(`here_concern_data_${trackType}`);
                      setStep('dashboard');
                    }}
                    onGoToMyRoom={() => {
                      setCurrentConcernData({ text: '', partnerAction: '', emotions: [], dynamicChips: FALLBACK_EMOTION_CHIPS, dynamicQuestion: null, isWritingDone: false });
                                            sessionStorage.removeItem(`here_concern_data_${trackType}`);
                      setTrackType('비밀의 방앗간');
                      setStep(formData?.name ? 'concern' : 'info');
                      window.scrollTo(0, 0);
                    }}
                    executeWithAuth={executeWithAuth}
                  />
                )}

              {/* ═══════════════════════════════════════════
                📋 나의 방 / 청소년의 방 결과 화면 (기존 어코디언 리포트)
            ═══════════════════════════════════════════ */}
              {(step === 'result' || (step === 'shared_flow' && sharedStep === 'result')) &&
                (trackType === '비밀의 방앗간' || trackType === '성장 탐험가') && (
                  <div style={{ paddingRight: '5px' }}>
                    {aiSections?.statusCode && aiSections.statusCode !== 'NORMAL' ? (
                      <div style={{ backgroundColor: '#FDFCFA', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', borderRadius: '24px', marginTop: '20px' }}>
                        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: aiSections.statusCode === 'DANGER' ? '#FFF5F5' : '#FFF', padding: '40px 30px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: aiSections.statusCode === 'DANGER' ? '1px solid #FFD1D1' : '1px solid #F0EAE1' }}>
                          <h2 style={{ color: aiSections.statusCode === 'DANGER' ? '#D32F2F' : '#E2725B', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4' }}>
                            {aiSections.statusCode === 'DANGER' ? '잠시 멈추어 주세요' : '마음을 온전히 전하기 위해'}
                          </h2>
                          <p style={{ fontSize: '1rem', color: '#555', lineHeight: '1.8', marginBottom: '35px', wordBreak: 'keep-all' }}>
                            {selfAnalysisResult}
                          </p>

                          {aiSections.statusCode === 'DANGER' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <a href="tel:1366" style={{ display: 'block', backgroundColor: '#1A2A4E', color: '#FFF', textDecoration: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(26,42,78,0.2)' }}>여성긴급전화 1366</a>
                              <a href="tel:1393" style={{ display: 'block', backgroundColor: '#1A2A4E', color: '#FFF', textDecoration: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(26,42,78,0.2)' }}>자살예방상담전화 1393</a>
                              <button onClick={() => {
                                setCurrentConcernData({ text: '', partnerAction: '', emotions: [], dynamicChips: FALLBACK_EMOTION_CHIPS, dynamicQuestion: null, isWritingDone: false });
                                                      sessionStorage.removeItem(`here_concern_data_${trackType}`);
                                setStep('dashboard');
                              }} style={{ background: 'none', border: 'none', color: '#888', marginTop: '15px', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}>처음으로 돌아가기</button>
                            </div>
                          ) : (
                            <button onClick={() => setStep(formData?.name ? 'concern' : 'info')} style={{ width: '100%', backgroundColor: '#E2725B', color: '#FFF', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(226,114,91,0.2)' }}>
                              다시 입력하기
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const introData = renderDynamicIntro();
                          return (
                            <div style={{ padding: '0 5px', marginTop: '40px' }}>
                              <p style={{ fontSize: '0.95rem', lineHeight: '1.8', color: '#555', backgroundColor: '#FDF2F0', padding: '22px', borderRadius: '14px', textAlign: 'left', margin: '0', borderLeft: '4px solid #E2725B', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                {introData.content}
                              </p>
                            </div>
                          );
                        })()}
                        <div style={{ marginTop: '30px' }}>
                          {(() => {
                        let foundFirstKeySentence = false;
                        return getHolisticReportPoints().map((point, index) => (
                          <div key={index} ref={el => accordionRefs.current[index] = el} style={{ ...styles.keyPointItem, borderBottom: index === 3 ? 'none' : '1px solid #F0E6D2' }} onClick={() => setOpenIndex(index === openIndex ? -1 : index)}>
                            <div style={styles.keyTitleRow}>
                              <span style={{ ...styles.keyTitle, color: openIndex === index ? '#E2725B' : '#4A4A4A' }}>
                                {point.title}
                              </span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>
                                <path d="M6 9L12 15L18 9" stroke={openIndex === index ? '#E2725B' : '#BCBCBC'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            {openIndex === index && (
                              <div className="dynamic-fade-layer" style={{ marginTop: '12px', backgroundColor: '#FAF9F6', padding: '22px', borderRadius: '12px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.01)', border: 'none' }}>
                                {point.desc.split('\n\n').map((paragraph, i) => (
                                  <p key={i} style={{ fontSize: '0.98rem', color: '#666', lineHeight: '1.85', margin: 0, marginBottom: i !== point.desc.split('\n\n').length - 1 ? '18px' : 0 }}>
                                    {paragraph.split('**').map((part, j) => {
                                      if (j % 2 === 1) {
                                        const isFirst = !foundFirstKeySentence;
                                        if (isFirst) foundFirstKeySentence = true;
                                        const pointId = `${index}-${i}-${j}`;
                                        const isHighlighted = mirroredPoints[pointId];

                                        return (
                                          <span key={j} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setMirroredPoints(prev => {
                                                const newPoints = { ...prev };
                                                if (newPoints[pointId]) {
                                                  delete newPoints[pointId];
                                                  setEmotionDB(db => {
                                                    const updated = db.filter(record => record.text !== part);
                                                    localStorage.setItem('Personal_Emotion_DB', JSON.stringify(updated));
                                                    return updated;
                                                  });
                                                } else {
                                                  newPoints[pointId] = part;
                                                  setToastMsg('마음에 닿은 문장을 수집했어요.');
                                                  setTimeout(() => setToastMsg(''), 3000);

                                                  const newRecord = {
                                                    id: Date.now().toString() + Math.random(),
                                                    timestamp: Date.now(),
                                                    date: new Date().toLocaleDateString(),
                                                    trackType: trackType,
                                                    ilgan: calculateIlgan(formData.year, formData.month, formData.day).name,
                                                    text: part
                                                  };
                                                  setEmotionDB(db => {
                                                    const updated = [...db, newRecord];
                                                    localStorage.setItem('Personal_Emotion_DB', JSON.stringify(updated));
                                                    return updated;
                                                  });
                                                }
                                                return newPoints;
                                              });
                                            }}
                                          >
                                            <b className={`highlight-text ${isHighlighted || (isFirst && showHighlightTooltip) ? 'active' : ''} ${isFirst && !isHighlighted ? 'pulse-text' : ''}`}
                                              style={{ color: '#E2725B', zIndex: 1, position: 'relative' }}>
                                              {part}
                                            </b>
                                            {isFirst && showHighlightTooltip && (
                                              <div className="tooltip-fade" style={{
                                                position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                                                backgroundColor: '#F1AC9D', color: 'white', padding: '8px 14px', borderRadius: '8px',
                                                fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 10,
                                                boxShadow: '0 4px 12px rgba(241, 172, 157, 0.4)'
                                              }}>
                                                마음에 닿는 문장을 터치해 보세요
                                                <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '8px', height: '8px', backgroundColor: '#F1AC9D' }} />
                                              </div>
                                            )}
                                          </span>
                                        );
                                      }
                                      return <span key={j}>{part}</span>;
                                    })}
                                  </p>
                                ))}
                                {index === 0 && (
                                  <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #EAEAEA' }} onClick={(e) => e.stopPropagation()}>
                                    <MinimalMindMap coords={
                                      (aiSections && aiSections.coordinate && typeof aiSections.coordinate === 'object' && typeof aiSections.coordinate.x === 'number')
                                        ? { x: aiSections.coordinate.x, y: aiSections.coordinate.y }
                                        : calculateCoordinates(formData, `${currentConcernData.text || ''} ${(currentConcernData.emotions || []).join(' ')}`)
                                    } />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>

                    {Object.keys(mirroredPoints).length > 0 && (
                      <div className="dynamic-fade-layer" style={{ marginTop: '40px', padding: '30px', backgroundColor: '#FFFDFB', borderRadius: '20px', border: '1px solid #F5EAE1', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '1.15rem', color: '#B5614F', margin: '0 0 20px 0', textAlign: 'center', letterSpacing: '0.5px' }}>
                          [오늘 내가 발견한 소중한 마음들]
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {Object.values(mirroredPoints).map((text, idx) => (
                            <div key={idx} style={{ padding: '16px 20px', backgroundColor: '#FDFBF7', borderRadius: '12px', color: '#555', fontSize: '0.98rem', lineHeight: '1.7', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '1.2rem', color: '#E2725B', opacity: 0.2 }}>"</span>
                              <span style={{ position: 'relative', zIndex: 1, color: '#4A4A4A' }}>{text}</span>
                              <span style={{ position: 'absolute', right: '10px', bottom: '5px', fontSize: '1.2rem', color: '#E2725B', opacity: 0.2 }}>"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isSharedMode ? (
                      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button style={{ ...styles.button, backgroundColor: '#E2725B', boxShadow: '0 4px 15px rgba(226, 114, 91, 0.3)' }} onClick={handleShare}>
                          나의 기운이 머무는 '마음의 지도' 건네기
                        </button>
                        <button style={{ ...styles.button, backgroundColor: '#AAA' }} onClick={() => {
                          setCurrentConcernData({ text: '', emotions: [], dynamicChips: FALLBACK_EMOTION_CHIPS, dynamicQuestion: null, isWritingDone: false });
                                                sessionStorage.removeItem(`here_concern_data_${trackType}`);
                          setStep('dashboard');
                          setMockFeedbackReceived(false);
                        }}>
                          메인 홈으로 돌아가기
                        </button>
                      </div>
                    ) : (
                      <div className="dynamic-fade-layer" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ backgroundColor: '#FAF9F6', borderRadius: '16px', padding: '24px', borderLeft: '5px solid #A8D8EA', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', textAlign: 'left' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#5C8A9E', fontSize: '1.05rem', fontWeight: 'bold' }}>[이 지도를 보는 분께 드리는 팁]</h4>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: '1.7', wordBreak: 'keep-all' }}>
                            지도를 다 보셨다면, 오늘 밤엔 아무 말 없이 손을 한 번 꼭 잡아주세요. 말 없는 당신의 체온 한 번이 훨씬 더 강력한 해독제가 된답니다.
                          </p>
                        </div>
                        <button
                          style={{ ...styles.button, backgroundColor: '#FFAB91', color: '#FFF' }}
                          onClick={() => {
                            setShowHug(true);
                            setTimeout(() => {
                              setToastMsg(`${formData.name} 님에게 따뜻한 공감이 아름답게 전달되었습니다!`);
                              setTimeout(() => setToastMsg(''), 5000);
                              setShowHug(false);
                            }, 1800);
                          }}
                        >
                          응, 네 마음 이제 잘 알겠어 (꼭 안아주기)
                        </button>
                      </div>
                    )}
                  </>
                  )}
                  </div>
                )}














            </div>
          </div>
        </div>


        {showHug && <div className="screen-hug-ripple" />}

        {/* Cloud Nudge Modal */}
        {showCloudNudge && (
          <div className="dynamic-fade-layer" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(253, 251, 247, 0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#FFF', padding: '35px 25px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#E2725B', fontSize: '1.25rem', fontWeight: 'bold' }}>당신의 어제를 기억할게요</h3>
              <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.7', marginBottom: '25px', wordBreak: 'keep-all' }}>
                당신의 소중한 진심들이 흩어지지 않게,<br />그리고 언제든 다시 꺼내볼 수 있도록<br /><b>다정한 금고에 담아드릴까요?</b>
              </p>
              <button style={{ ...styles.button, backgroundColor: '#FFAB91', padding: '15px', marginBottom: '10px', boxShadow: '0 4px 15px rgba(255,171,145,0.3)' }} onClick={handleCloudLogin}>
                카카오로 조용히 입장하기
              </button>
              <button style={{ ...styles.button, backgroundColor: '#E2725B', padding: '15px', marginBottom: '15px', marginTop: '0' }} onClick={handleCloudLogin}>
                구글로 조용히 입장하기
              </button>
              <button style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.9rem', textDecoration: 'underline', cursor: 'pointer', padding: '10px' }} onClick={() => { setShowCloudNudge(false); localStorage.setItem('hasSeenCloudNudge', 'true'); }}>
                지금은 이대로 둘게요
              </button>
            </div>
          </div>
        )}

        {/* Vault Password Modal */}
        {showVaultPrompt && (
          <div className="dynamic-fade-layer" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(253, 251, 247, 0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#FFF', padding: '35px 25px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1A2A4E', fontSize: '1.2rem', fontWeight: 'bold' }}>금고를 잠글 다정한 열쇠</h3>
              <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: '1.6', marginBottom: '20px', wordBreak: 'keep-all' }}>
                서버 관리자조차 읽을 수 없도록, 당신의 진심은 기기에서 <b>즉시 암호화</b>됩니다. 암호화에 사용할 4자리 이상의 비밀번호를 입력해 주세요.
              </p>
              <input
                type="password"
                style={{ ...styles.nameInput, textAlign: 'center', marginBottom: '20px', letterSpacing: '4px', fontSize: '1.2rem' }}
                placeholder="****"
                value={vaultKey}
                onChange={(e) => setVaultKey(e.target.value)}
              />
              <button style={{ ...styles.button, backgroundColor: '#1A2A4E', padding: '15px', marginTop: 0 }} onClick={handleVaultSubmit}>
                가장 안전하게 잠그기
              </button>
            </div>
          </div>
        )}

        {/* Syncing Overlay */}
        {isSyncing && (
          <div className="dynamic-fade-layer" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(253, 251, 247, 0.95)', zIndex: 10050, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #FDF2F0', borderTopColor: '#E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#E2725B', fontSize: '1.1rem', fontWeight: 'bold', animation: 'subtlePulse 2s infinite' }}>당신의 진심을 완벽하게 암호화 중입니다...</p>
          </div>
        )}

        {toastMsg && (
          <div style={{ position: 'fixed', bottom: '40px', left: 0, right: 0, margin: '0 auto', maxWidth: '480px', display: 'flex', justifyContent: 'center', zIndex: 10001, pointerEvents: 'none', padding: '0 20px' }}>
            <div className="dynamic-fade-layer" style={{ backgroundColor: 'rgba(50, 50, 50, 0.95)', color: 'white', padding: '14px 24px', borderRadius: '30px', fontSize: '0.95rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'opacity 0.4s ease', whiteSpace: 'pre-wrap', textAlign: 'center', wordBreak: 'keep-all' }}>
              {toastMsg}
            </div>
          </div>
        )}
      </div>

      {showKnockBox && (
        <MindKnockBox
          onClose={() => setShowKnockBox(false)}
          onToast={(msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 4000); }}
        />
      )}

      {isWeatherOpen && (
        <WeatherDashboard
          onClose={() => setIsWeatherOpen(false)}
          emotionDB={emotionDB}
          formData={formData}
        />
      )}

      {isBreathingOpen && (
        <BreathingModal onClose={() => setIsBreathingOpen(false)} />
      )}

      {/* ── CRM 알림톡 시뮬레이션 버튼 ── */}
      {(() => {
        const NEG_KEYWORDS = ['시간 부족', '우울', '지침', '체력 방전', '잠 못', '비교하는', '인정받지', '답답', '번아웃', '무기력', '분노', '불안'];
        const recent3 = emotionDB.slice(-3);
        const isTargeted = recent3.length >= 1 && recent3.every(r =>
          NEG_KEYWORDS.some(kw => (r.text || '').includes(kw))
        );
        return false && (
          <>
            <button
              id="crm-sim-btn"
              onClick={() => setShowCrmDialog(true)}
              title={isTargeted ? '폭풍우 경보 그룹 — 발송 대상' : '조건 미충족 (최근 3개 기록에 부정 키워드 없음)'}
              style={{
                position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
                padding: '6px 12px', borderRadius: '20px', border: '1px solid',
                fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.5px',
                cursor: 'pointer', fontFamily: 'inherit',
                backgroundColor: isTargeted ? '#FEF3C7' : '#F0F0F0',
                borderColor: isTargeted ? '#F6D860' : '#DCDCDC',
                color: isTargeted ? '#92722A' : '#AAAAAA',
                transition: 'all 0.2s',
              }}
            >
              {isTargeted ? '⚠ 알림톡 시뮬레이션' : '○ 알림톡 (조건 미충족)'}
            </button>

            {showCrmDialog && (
              <div
                style={{
                  position: 'fixed', inset: 0, zIndex: 10100,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '20px',
                }}
                onClick={e => { if (e.target === e.currentTarget) setShowCrmDialog(false); }}
              >
                <div style={{
                  backgroundColor: '#FDFBF7', borderRadius: '20px',
                  padding: '28px 24px', width: '100%', maxWidth: '340px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                  fontFamily: 'inherit',
                }}>
                  {/* 카카오 스타일 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FAE100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🌤</div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#999', letterSpacing: '0.5px' }}>카카오 알림톡 · H.E.R.e</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#3A2E2A' }}>폭풍우 경보 알림</div>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#F8F5F0', borderRadius: '14px',
                    padding: '18px 16px', marginBottom: '20px',
                    fontSize: '0.88rem', color: '#4A3A30', lineHeight: '1.8',
                    wordBreak: 'keep-all',
                  }}>
                    <b style={{ color: '#C17A6B' }}>{formData.name || '당신'} 님,</b><br />
                    요즘 마음의 날씨가 꽤 흐렸던 것 같아요.<br />
                    혼자 감당하느라 고생 많으셨어요.<br />
                    잠시 함께 숨을 고를 수 있도록<br />
                    H.E.R.e가 조용히 문을 두드렸어요. 🚪
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => { setShowCrmDialog(false); setIsWeatherOpen(true); }}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        border: '1.5px solid #E0D8CE', backgroundColor: '#FFFFFF',
                        fontSize: '0.88rem', fontWeight: '700', color: '#5A4A42',
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FAF5EE'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                    >
                      🪟 잠시 비 피하러 가기
                    </button>
                    <button
                      onClick={() => { setShowCrmDialog(false); setIsBreathingOpen(true); }}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        border: 'none', backgroundColor: '#1A2340',
                        fontSize: '0.88rem', fontWeight: '700', color: 'rgba(200,220,255,0.85)',
                        cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#243060'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1A2340'; }}
                    >
                      🌙 마음을 뉘이는 3분 호흡
                    </button>
                    <button
                      onClick={() => setShowCrmDialog(false)}
                      style={{ background: 'none', border: 'none', color: '#CCCCCC', fontSize: '0.78rem', cursor: 'pointer', padding: '4px', fontFamily: 'inherit' }}
                    >
                      지금은 괜찮아요
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Email Auth Modal */}
      {showAuthModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAuthModal(false); setAuthError(''); } }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '20px', boxSizing: 'border-box',
          }}
        >
          <div style={{
            width: '100%', maxWidth: '400px', backgroundColor: '#FDFBF7',
            borderRadius: '24px', padding: '32px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
          }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#3A2E2A', fontWeight: '800' }}>
                {authMode === 'register' ? '🌱 새로운 계정 만들기' : '🔑 로그인하기'}
              </h2>
              <button
                onClick={() => { setShowAuthModal(false); setAuthError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 기존 기록 유지 안내 (익명 유저인 경우) */}
            {userSession?.isAnonymous && (
              <div style={{
                padding: '12px 16px', backgroundColor: '#FDF2F0', borderRadius: '12px',
                marginBottom: '20px', fontSize: '0.85rem', color: '#C2604A', lineHeight: '1.5',
                border: '1px solid #F5C4BB',
              }}>
                ✅ 지금까지 쌓인 <strong>감정 기록이 그대로 유지</strong>됩니다.<br />
                계정을 만들면 안전하게 클라우드에 보관할 수 있어요.
              </div>
            )}

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="email"
                placeholder="이메일 주소"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1.5px solid #E5E0DA', fontSize: '0.95rem',
                  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', color: '#3A2E2A',
                  transition: 'border-color 0.2s',
                }}
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1.5px solid #E5E0DA', fontSize: '0.95rem',
                  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', color: '#3A2E2A',
                }}
              />

              {authError && (
                <div style={{ fontSize: '0.85rem', color: '#D05A42', padding: '10px 14px', backgroundColor: '#FDF2F0', borderRadius: '10px', border: '1px solid #F5C4BB' }}>
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                  backgroundColor: '#E2725B', color: 'white', fontSize: '1rem', fontWeight: '700',
                  cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '4px',
                }}
              >
                {authMode === 'register' ? '계정 만들기 & 기록 연결' : '로그인'}
              </button>
            </form>

            {/* 구글 로그인 구분선 */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E0DA' }} />
              <span style={{ fontSize: '0.8rem', color: '#A0968E' }}>또는</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E0DA' }} />
            </div>

            <button
              onClick={() => { setShowAuthModal(false); handleCloudLogin(); }}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '14px',
                border: '1.5px solid #E5E0DA', backgroundColor: 'white',
                color: '#4A4A4A', fontSize: '0.95rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google 계정으로 계속하기
            </button>

            {/* 로그인 ↔ 회원가입 전환 */}
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: '#A0968E' }}>
              {authMode === 'register' ? (
                <>이미 계정이 있으신가요?{' '}
                  <span
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    style={{ color: '#E2725B', fontWeight: '700', cursor: 'pointer' }}
                  >로그인</span>
                </>
              ) : (
                <>아직 계정이 없으신가요?{' '}
                  <span
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    style={{ color: '#E2725B', fontWeight: '700', cursor: 'pointer' }}
                  >회원가입</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
// 텍스트 포맷터 (단락 분리 및 볼드 처리)
const renderFormattedText = (text) => {
  if (!text) return null;
  const paragraphs = text.split('\n\n');
  return paragraphs.map((p, i) => (
    <span key={i} style={{ display: 'block', marginBottom: i < paragraphs.length - 1 ? '16px' : 0 }}>
      {p.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} style={{ color: '#E2725B', fontWeight: '800', backgroundColor: 'rgba(226,114,91,0.08)', padding: '2px 4px', borderRadius: '4px' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      })}
    </span>
  ));
};

// 월간 심리 성장 리포트 뷰 컴포넌트
function MonthlyAnalyticsView({ userName = "당신", onReset }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const mockMonthlyData = "평온 40%, 불안 30%, 분노 15%, 슬픔 15% (최근 1주일간 평온 증가 추세)";
        const data = await fetchGeminiMonthlyAnalytics(userName, mockMonthlyData);
        if (!ignore) {
          setAnalysisData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Monthly analytics error:", err);
        if (!ignore) {
          setAnalysisData({
            premium_monthly_analytics: {
              monthly_theme_title: "파도를 견디며 나만의 항로를 찾아간 한 달",
              highlight_badges: ["📉 불안 지수 30%", "📈 회복 탄력성 20% 증가"],
              growth_evidence_data: "이번 달은 불안(30%)과 분노(15%) 칩이 존재했지만, 점차 평온(40%)의 비중이 늘어났습니다.\n\n갈등 상황에서도 스스로 통제권을 되찾는 **회복 탄력성이 지난달보다 약 20% 증가**한 건강한 신호입니다.",
              trigger_pattern_insight: "기록을 보면 특정 요일에 '불안'이 반복되는 궤적이 보입니다.\n\n이는 피로가 누적될 때 **타인의 시선에 더 예민해지는 방어기제가 작동**하기 때문일 수 있습니다.",
              next_month_mission: "다가오는 달에는 타인의 감정은 그 사람의 몫으로 두고, '나만의 한계선 지키기'에 집중해 보시길 권합니다."
            }
          });
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [userName]);

  const report = analysisData?.premium_monthly_analytics || {};
  const badges = report.highlight_badges || ["📉 불안 지수 30%", "📈 회복 탄력성 20% 증가"];

  return (
    <>
      <style>{`
        @keyframes floatWave {
          0% { transform: translateY(0) scaleY(1); opacity: 0.8; }
          50% { transform: translateY(-5px) scaleY(1.05); opacity: 1; }
          100% { transform: translateY(0) scaleY(1); opacity: 0.8; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div style={{
        maxWidth: '480px', margin: '0 auto', backgroundColor: '#FDFBF7',
        minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', backgroundColor: '#FDFBF7', zIndex: 10
        }}>
          <button onClick={onReset} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#5A4A42', padding: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A2E2A', letterSpacing: '-0.5px' }}>Premium Monthly Report</div>
          <div style={{ width: '24px' }} />
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div style={{ width: '50px', height: '50px', border: '3px solid rgba(226,114,91,0.2)', borderTop: '3px solid #E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#4A3728', fontWeight: '800', margin: '0 0 12px 0', textAlign: 'center' }}>
              마음의 궤적을<br />추적하고 있습니다
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#8A7A72', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
              한 달간의 감정 날씨를 모아<br />{userName} 님만의 심리 성장 리포트를 작성 중이에요...
            </p>
          </div>
        ) : (
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.6s ease-out' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#E2725B', color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', padding: '6px 12px', borderRadius: '20px', marginBottom: '16px', letterSpacing: '1px' }}>
                H.E.R.e MONTHLY INSIGHT
              </div>
              <h2 style={{ fontSize: '1.5rem', color: '#3A2E2A', fontWeight: '800', lineHeight: '1.4', wordBreak: 'keep-all', margin: 0 }}>
                "{report.monthly_theme_title || '파도를 견디며 나만의 항로를 찾아간 한 달'}"
              </h2>
            </div>

            <div style={{
              background: 'linear-gradient(270deg, #FDF0E6, #EDF5FA, #FFF5F0)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 10s ease infinite',
              borderRadius: '24px',
              padding: '30px 24px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', bottom: '-10px', left: 0, right: 0, height: '60px', opacity: 0.6, animation: 'floatWave 4s ease-in-out infinite' }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}><path d="M-5.36,65.63 C182.56,-36.01 279.06,140.63 505.36,44.90 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#FFFFFF' }}></path></svg>
              </div>
              <div style={{ position: 'absolute', bottom: '-5px', left: 0, right: 0, height: '40px', opacity: 0.4, animation: 'floatWave 5s ease-in-out infinite reverse' }}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}><path d="M0.00,49.98 C149.99,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#FFF' }}></path></svg>
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', color: '#D96A53', fontWeight: '800', margin: '0 0 16px 0' }}>🌤️ 이달의 마음 기후</h3>
                
                {/* Visual Data Ratio Chart */}
                <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '40%', backgroundColor: '#A8D8EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A2A4E', fontSize: '0.7rem', fontWeight: 'bold' }}>평온 40%</div>
                  <div style={{ width: '30%', backgroundColor: '#F1AC9D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold' }}>불안 30%</div>
                  <div style={{ width: '15%', backgroundColor: '#E2725B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.7rem', fontWeight: 'bold' }}>분노 15%</div>
                  <div style={{ width: '15%', backgroundColor: '#B8CEDE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A2A4E', fontSize: '0.7rem', fontWeight: 'bold' }}>슬픔 15%</div>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#5A4A42', lineHeight: '1.6', margin: 0, fontWeight: '700', wordBreak: 'keep-all' }}>
                  이번 달 {userName} 님의 마음에 가장 오래 머문 계절은 '잔잔한 바람(평온)'이었습니다.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#4A3728', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔍</span> 데이터가 증명하는 '나의 성장'
                </h3>
                
                {badges.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {badges.map((b, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(226,114,91,0.08)', color: '#E2725B', fontSize: '0.8rem', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(226,114,91,0.15)' }}>
                        {b}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ fontSize: '0.95rem', color: '#5A4A42', lineHeight: '1.7', margin: 0, wordBreak: 'keep-all', backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAEAEA', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  {renderFormattedText(report.growth_evidence_data)}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#4A3728', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛡️</span> 무의식의 트리거 찾기
                </h3>
                <div style={{ fontSize: '0.95rem', color: '#5A4A42', lineHeight: '1.7', margin: 0, wordBreak: 'keep-all', backgroundColor: '#FFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAEAEA', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  {renderFormattedText(report.trigger_pattern_insight)}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#4A3728', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🧭</span> 다음 달의 방향성
                </h3>
                <div style={{ backgroundColor: '#2A3B66', padding: '20px', borderRadius: '16px', color: '#FFF', boxShadow: '0 8px 24px rgba(42,59,102,0.15)' }}>
                  <p style={{ fontSize: '0.95rem', color: '#FDF0E6', lineHeight: '1.7', margin: 0, wordBreak: 'keep-all', fontWeight: '700' }}>
                    {report.next_month_mission}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onReset}
              style={{
                width: '100%', padding: '18px', borderRadius: '16px',
                border: 'none', backgroundColor: '#E2725B',
                fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.2px',
                boxShadow: '0 10px 25px rgba(226,114,91,0.2)', marginTop: '16px'
              }}
            >
              홈으로 돌아가기
            </button>

          </div>
        )}
      </div>

      {showLimitPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
          <div style={{ width: '85%', maxWidth: '320px', backgroundColor: '#FDFBF7', borderRadius: '24px', padding: '30px 24px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌙</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 12px 0', color: '#3A2E2A' }}>
              오늘은 준비된 이야기 나누기를<br/>다 이용하셨어요
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#6B4C3B', margin: '0 0 24px 0', lineHeight: '1.6', wordBreak: 'keep-all' }}>
              내일 다시 찾아와 주세요!<br/><br/>
              더 깊은 이야기가 궁금하시다면 딥다이브 리포트도 준비되어 있어요.
            </p>
            <button
              onClick={() => setShowLimitPopup(false)}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', backgroundColor: '#E2725B', color: '#FFF', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// H.E.R.e 다정한 식탁 (가족의 방) 결과 뷰 컴포넌트 - 5단계 전면 개편안
function FamilyRelationshipView({ partnerName = "미미", userConcern, partnerAction, selectedEmotions = [], defenseStyle, coreNeed, trackType, formData, onReset, onGoToMyRoom, executeWithAuth, onAnalysisSuccess }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let data;
        const text = userConcern || '';
        const action = partnerAction || '';
        const emotionStr = selectedEmotions.join(', ');
        const goal = formData?.selectedGoal === 'custom' ? formData?.customGoal : formData?.selectedGoal;
        const isCouple = text.includes('남편') || text.includes('아내') || text.includes('부부') || text.includes('여보') || text.includes('배우자');
        const userName = formData?.name || '당신';
        
        console.log('[DEBUG-FETCH] trackType:', trackType, 'isCouple:', isCouple, 'userName:', userName);

        if (trackType === '나를 지키는 울타리') {
          const relationType = formData?.partnerRelation || '지인';
          console.log('[DEBUG-FETCH] Calling fetchGeminiRelationshipAnalysis');
          data = await fetchGeminiRelationshipAnalysis(text, action, partnerName, relationType, defenseStyle, userName);
        } else if (isCouple) {
          console.log('[DEBUG-FETCH] Calling fetchGeminiCoupleAnalysis');
          data = await fetchGeminiCoupleAnalysis(text, action, partnerName, emotionStr, goal, coreNeed, userName);
        } else {
          console.log('[DEBUG-FETCH] Calling fetchGeminiFamilyAnalysis');
          data = await fetchGeminiFamilyAnalysis(text, action, partnerName, emotionStr, goal, coreNeed, userName);
        }
        
        if (!ignore) {
          setAnalysisData(data);
          if (onAnalysisSuccess && data && data.statusCode !== 'ERROR') {
            onAnalysisSuccess();
          }
        }
      } catch (err) {
        console.warn(`[DEBUG-FETCH] API Failed (trackType: ${trackType}):`, err);
        if (!ignore) {
          setFetchError(true);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [userConcern, partnerName]);

  if (isLoading) {
    return (
      <div style={{ position: 'relative', minHeight: '60vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingScreen trackType={trackType} userName={formData?.name} />
      </div>
    );
  }

  if (fetchError || !analysisData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.2rem', color: '#FDF0E6', marginBottom: '8px', fontWeight: 'bold' }}>분석에 실패했어요</h2>
        <p style={{ fontSize: '0.95rem', color: '#B0A098', marginBottom: '24px', lineHeight: '1.6' }}>
          입력하신 내용이 너무 복잡하거나 서버가 잠시 혼잡할 수 있습니다.<br />
          다시 한번 시도해 주세요.
        </p>
        <button 
          onClick={onReset}
          style={{ padding: '12px 24px', borderRadius: '24px', border: 'none', backgroundColor: '#E2725B', color: '#FFF', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(226,114,91,0.3)' }}
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  const mockData = analysisData;

  if (mockData?.statusCode && mockData.statusCode !== 'NORMAL') {
    return (
      <div style={{ backgroundColor: '#FDFCFA', minHeight: '100vh', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: mockData.statusCode === 'DANGER' ? '#FFF5F5' : '#FFF', padding: '40px 30px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', border: mockData.statusCode === 'DANGER' ? '1px solid #FFD1D1' : '1px solid #F0EAE1' }}>
          <h2 style={{ color: mockData.statusCode === 'DANGER' ? '#D32F2F' : '#E2725B', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4' }}>
            {mockData.statusCode === 'DANGER' ? '잠시 멈추어 주세요' : '마음을 온전히 전하기 위해'}
          </h2>
          <p style={{ fontSize: '1rem', color: '#555', lineHeight: '1.8', marginBottom: '35px', wordBreak: 'keep-all' }}>
            {mockData.systemMessage}
          </p>

          {mockData.statusCode === 'DANGER' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a href="tel:1366" style={{ display: 'block', backgroundColor: '#1A2A4E', color: '#FFF', textDecoration: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(26,42,78,0.2)' }}>여성긴급전화 1366</a>
              <a href="tel:1393" style={{ display: 'block', backgroundColor: '#1A2A4E', color: '#FFF', textDecoration: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(26,42,78,0.2)' }}>자살예방상담전화 1393</a>
              <button onClick={onReset} style={{ background: 'none', border: 'none', color: '#888', marginTop: '15px', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}>처음으로 돌아가기</button>
            </div>
          ) : (
            <button onClick={onReset} style={{ width: '100%', backgroundColor: '#E2725B', color: '#FFF', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(226,114,91,0.2)' }}>
              다시 입력하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#FDFCFA', // 완전한 미니멀 화이트/베이지
      minHeight: '100vh',
      padding: '40px 20px',
      color: '#333'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* 1단계: 브랜드 타이틀 (미니멀 로고, 이모지 제거) */}
        <div style={{ textAlign: 'center', marginBottom: '60px', marginTop: '20px' }}>
          {(formData?.selectedGoal || formData?.customGoal) && (
            <div style={{ display: 'inline-block', backgroundColor: '#FFF0ED', color: '#D95A40', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '20px', border: '1px solid #F1AC9D' }}>
              오늘의 목적: {formData.selectedGoal === 'custom' ? formData.customGoal : formData.selectedGoal}
            </div>
          )}
          <br />
          <svg viewBox="0 0 100 100" fill="none" style={{ width: '36px', height: '36px', marginBottom: '12px' }}>
            <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
            <rect x="42" y="52" width="16" height="16" rx="2" fill="#E2725B" />
          </svg>
          <span style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '3px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
            {trackType === '다정한 식탁' ? 'FAMILY ROOM · HEALING' : 'RELATIONSHIP ROOM · BOUNDARY'}
          </span>
        </div>

        {/* 2단계: 공명의 사분면 지도 or 경계선 그래픽 */}
        <div style={{ marginBottom: '40px' }}>
          {trackType === '나를 지키는 울타리' ? (
            <div style={{ padding: '30px 20px', backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #EAEAEA', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center' }}>
              {/* 마음의 이름표 (감정 해시태그) */}
              <div style={{ marginBottom: '30px' }}>
                <span style={{ fontSize: '0.8rem', color: '#A0A0A0', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>오늘 발견한 내 마음의 이름</span>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(mockData.extracted_emotions || ['답답함', '서운함']).map((emo, i) => (
                    <span key={i} style={{ backgroundColor: '#F3ECE8', color: '#6B4C3B', padding: '6px 14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 'bold' }}>#{emo}</span>
                  ))}
                </div>
              </div>

              {/* 방패/선 메타포 시각화 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '40px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#2C3E50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: (formData?.name || '나').length > 3 ? '0.75rem' : (formData?.name || '나').length > 2 ? '0.9rem' : '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(44,62,80,0.2)', whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box', textAlign: 'center', lineHeight: '1.2', wordBreak: 'keep-all' }}>{formData?.name || '나'}</div>
                </div>
                <div style={{ height: '90px', width: '2.5px', backgroundColor: '#E2725B', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#FFF', padding: '4px 10px', border: '1.5px solid #E2725B', borderRadius: '12px', fontSize: '0.75rem', color: '#E2725B', fontWeight: 'bold', whiteSpace: 'nowrap' }}>경계선</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#8B4513', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: partnerName.length > 3 ? '0.75rem' : partnerName.length > 2 ? '0.9rem' : '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(139,69,19,0.2)', whiteSpace: 'nowrap', padding: '0 4px', boxSizing: 'border-box', textAlign: 'center', lineHeight: '1.2', wordBreak: 'keep-all' }}>{partnerName}</div>
                </div>
              </div>

              {/* 현재 관계 상태 정의 */}
              <p style={{ fontSize: '1.15rem', color: '#E2725B', margin: 0, wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', fontWeight: 'bold', lineHeight: '1.5' }}>
                "{mockData.statusStatement || '존중이 결여된 일방적인 심리적 침투 상태'}"
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px', margin: '0 auto', aspectRatio: '1', backgroundColor: '#FFF', borderRadius: '50%', border: '1px solid #EAEAEA', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              {/* 십자축 */}
              <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', backgroundColor: '#F0F0F0' }} />
              <div style={{ position: 'absolute', top: '0', bottom: '0', left: '50%', width: '1px', backgroundColor: '#F0F0F0' }} />

              {/* 축 라벨 — 감성적 키워드 */}
              <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#A0A0A0', letterSpacing: '1px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>다시 연결되고 싶어</span>
              <span style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', color: '#A0A0A0', letterSpacing: '1px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>나를 보호하고 싶어</span>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '0.62rem', color: '#A0A0A0', letterSpacing: '1px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>혼자 삼키는 중</span>
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.62rem', color: '#A0A0A0', letterSpacing: '1px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>알아달라 외치는 중</span>

              {/* 점선 연결선 (SVG) */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <line
                  x1={`${50 + ((mockData.map_data?.user?.x || 0) / 2)}%`}
                  y1={`${50 - ((mockData.map_data?.user?.y || 0) / 2)}%`}
                  x2={`${50 + ((mockData.map_data?.partner?.x || 0) / 2)}%`}
                  y2={`${50 - ((mockData.map_data?.partner?.y || 0) / 2)}%`}
                  stroke="#D8D8D8" strokeWidth="1.5" strokeDasharray="4 4"
                />
              </svg>

              {/* 다정한 첫 마디 배지 (중앙) */}
              <div style={{
                position: 'absolute',
                left: `${50 + ((mockData.map_data?.user?.x || 0) / 2 + (mockData.map_data?.partner?.x || 0) / 2) / 2}%`,
                top: `${50 - ((mockData.map_data?.user?.y || 0) / 2 + (mockData.map_data?.partner?.y || 0) / 2) / 2}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2725B',
                borderRadius: '20px',
                padding: '6px 12px',
                boxShadow: '0 4px 12px rgba(226,114,91,0.15)',
                fontSize: '0.75rem',
                color: '#E2725B',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                {mockData.statusStatement || '각자의 동굴 속에서 잠시 숨을 고르고 있네요.'}
              </div>

              {/* User Dot */}
              <div style={{ position: 'absolute', left: `${50 + ((mockData.map_data?.user?.x || 0) / 2)}%`, top: `${50 - ((mockData.map_data?.user?.y || 0) / 2)}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: '#2C3E50', boxShadow: '0 0 0 4px rgba(44,62,80,0.15)' }} />
                <span style={{ marginTop: '6px', fontSize: '0.65rem', color: '#FFF', backgroundColor: '#2C3E50', padding: '2px 7px', borderRadius: '10px', fontFamily: 'sans-serif', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {formData?.name || '나'}
                </span>
              </div>

              {/* Partner Dot */}
              <div style={{ position: 'absolute', left: `${50 + ((mockData.map_data?.partner?.x || 0) / 2)}%`, top: `${50 - ((mockData.map_data?.partner?.y || 0) / 2)}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: '#8B4513', boxShadow: '0 0 0 4px rgba(139,69,19,0.15)' }} />
                <span style={{ marginTop: '6px', fontSize: '0.65rem', color: '#FFF', backgroundColor: '#8B4513', padding: '2px 7px', borderRadius: '10px', fontFamily: 'sans-serif', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {partnerName}
                </span>
              </div>
            </div>
          )}
        </div>

        {trackType === '나를 지키는 울타리' ? (
          <>
            <div style={{ marginBottom: '50px' }}>
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '24px', padding: '36px 28px', border: '1px solid #FDE8E0', boxShadow: '0 8px 30px rgba(226,114,91,0.08)' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#E2725B', fontWeight: '800', margin: '0 0 20px 0', textAlign: 'center' }}>🛡️ 관계 처방전</h3>
                <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: '1.6', margin: '0 0 30px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center' }}>
                  {mockData.boundary_report}
                </p>

                <h4 style={{ fontSize: '1.05rem', color: '#6B4C3B', fontWeight: '800', margin: '0 0 16px 0', textAlign: 'center' }}>💬 페르소나 실전 화법</h4>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '32px', position: 'relative', border: '1px solid #EAEAEA' }}>
                  <div style={{ fontSize: '1.5rem', color: '#E2725B', lineHeight: '1', marginBottom: '8px', opacity: 0.6 }}>❝</div>
                  <p style={{ fontSize: '1.1rem', color: '#333', fontWeight: 'bold', lineHeight: '1.6', margin: '0 0 8px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center' }}>
                    {mockData.persona_script}
                  </p>
                  <div style={{ fontSize: '1.5rem', color: '#E2725B', lineHeight: '1', textAlign: 'right', opacity: 0.6 }}>❞</div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mockData.persona_script);
                    alert('실전 화법이 복사되었습니다!');
                  }}
                  style={{ width: '100%', backgroundColor: '#E2725B', color: '#FFF', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(226,114,91,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  복사해서 바로 쓰기
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <span style={{ fontSize: '0.85rem', color: '#A0A0A0', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>나를 지키는 오늘의 방패 문장</span>
              <p style={{ fontSize: '1.25rem', color: '#2C3E50', fontWeight: '900', margin: 0, wordBreak: 'keep-all' }}>
                {mockData.shield_affirmation}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* 공감형 상태 문구 (지도 중앙으로 이동됨) */}

            {/* 💌 다정한 대화 처방전 카드 */}
            <div style={{ marginBottom: '70px' }}>
              <div style={{ backgroundColor: '#FFF5F0', borderRadius: '24px', padding: '36px 28px', border: '1px solid #FDE8E0', boxShadow: '0 8px 30px rgba(226,114,91,0.08)' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#E2725B', fontWeight: '800', margin: '0 0 20px 0', textAlign: 'center' }}>💌 다정한 대화 처방전</h3>

                <p style={{ fontSize: '1.0rem', color: '#555', lineHeight: '1.8', margin: '0 0 24px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
                  {mockData.relationship_dynamics || (typeof mockData.mind_prescription === 'string' ? mockData.mind_prescription : `${mockData.mind_prescription?.partner_understanding || ''}\n\n${mockData.mind_prescription?.my_boundary || ''}`)}
                </p>

                {/* 스크립트 강조 블록 */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px 22px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '24px', position: 'relative' }}>
                  <div style={{ fontSize: '1.5rem', color: '#E2725B', lineHeight: '1', marginBottom: '8px', opacity: 0.6 }}>❝</div>
                  <p style={{ fontSize: '1.15rem', color: '#333', fontWeight: 'bold', lineHeight: '1.6', margin: '0 0 8px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center' }}>
                    {mockData.transcription_sentence || mockData.share_main_sentence || (typeof mockData.mind_prescription === 'object' ? mockData.mind_prescription?.bridge_action : '')}
                  </p>
                  <div style={{ fontSize: '1.5rem', color: '#E2725B', lineHeight: '1', textAlign: 'right', opacity: 0.6 }}>❞</div>
                </div>

                <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.75', margin: '0 0 30px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center' }}>
                  {mockData.prescription?.content || mockData.share_sub_sentence || ''}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mockData.transcription_sentence || mockData.share_main_sentence);
                      alert('문구가 복사되었습니다!');
                    }}
                    style={{ backgroundColor: '#FFFFFF', color: '#E2725B', border: '1px solid #E2725B', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(226,114,91,0.1)' }}
                  >
                    문구 복사하기
                  </button>
                  <button
                    onClick={() => setShowSharePreview(true)}
                    style={{ backgroundColor: '#E2725B', color: '#FFF', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(226,114,91,0.25)' }}
                  >
                    진심을 건네는 다리 놓기
                  </button>
                </div>
              </div>

              {/* 💎 프리미엄 딥다이브 리포트 페이월 */}
              <div style={{
                backgroundColor: isPremiumUnlocked ? '#1A2A4E' : '#FFFFFF',
                borderRadius: '24px',
                padding: isPremiumUnlocked ? '40px 28px' : '36px 28px',
                marginTop: '40px',
                border: isPremiumUnlocked ? '1px solid #101B33' : '1px solid #EAEAEA',
                boxShadow: isPremiumUnlocked ? '0 12px 40px rgba(26,42,78,0.2)' : '0 8px 30px rgba(0,0,0,0.04)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {!isPremiumUnlocked ? (
                  <>
                    <h3 style={{ fontSize: '1.15rem', color: '#4A3728', fontWeight: '800', margin: '0 0 20px 0', textAlign: 'center' }}>
                      🔒 우리 관계의 무의식적 패턴 딥다이브 분석하기
                    </h3>

                    <p style={{ fontSize: '1.05rem', color: '#E2725B', fontWeight: 'bold', lineHeight: '1.6', margin: '0 0 24px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center' }}>
                      {mockData.premium_teaser || `${partnerName}님과의 갈등 상황에 숨겨진 무의식적 방어기제를 심층 분석합니다.`}
                    </p>

                    <div style={{ position: 'relative' }}>
                      <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.8', margin: '0 0 10px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center', filter: 'blur(3px)' }}>
                        {mockData.premium_deepdive_report?.core_conflict_mechanism || "두 사람의 기질적 차이가 어떻게 반복되는 방어기제의 충돌을 만들어내는지 심층 분석한 내용이 이곳에 표시됩니다."}
                      </p>
                      <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.8', margin: '0 0 10px 0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', textAlign: 'center', filter: 'blur(4px)', opacity: 0.7 }}>
                        {mockData.premium_deepdive_report?.unconscious_projection || "상대방의 행동 아래 숨겨진 결핍이나 불안, 그리고 나의 투사에 대한 다세대적 관점의 해석이 이어집니다."}
                      </p>

                      {/* 그라데이션 오버레이 & 버튼 */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,1) 100%)', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
                        <button
                          onClick={() => {
                            executeWithAuth(() => {
                              setIsUnlocking(true);
                              setTimeout(() => {
                                setIsUnlocking(false);
                                setIsPremiumUnlocked(true);
                              }, 1000);
                            });
                          }}
                          disabled={isUnlocking}
                          style={{ backgroundColor: '#1A2A4E', color: '#FFF', border: 'none', borderRadius: '12px', padding: '16px 24px', fontSize: '1.05rem', fontWeight: 'bold', cursor: isUnlocking ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(26,42,78,0.3)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, opacity: isUnlocking ? 0.8 : 1 }}
                        >
                          {isUnlocking ? (
                            <>
                              <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              잠금 해제 중...
                            </>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              프리미엄 리포트 열람하기
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ animation: 'fadeInUp 0.6s ease-out forwards', opacity: 0 }}>
                    <style>{`
                      @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                      .scenario-accordion {
                        transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease, margin-top 0.6s ease;
                        overflow: hidden;
                        max-height: 0;
                        opacity: 0;
                        margin-top: 0;
                      }
                      .scenario-accordion.open {
                        max-height: 400px;
                        opacity: 1;
                        margin-top: 16px;
                      }
                    `}</style>
                    <h3 style={{ fontSize: '1.25rem', color: '#FDF0E6', fontWeight: '800', margin: '0 0 30px 0', textAlign: 'center', letterSpacing: '1px', borderBottom: '1px solid rgba(253,240,230,0.2)', paddingBottom: '16px' }}>
                      🗝️ H.E.R.e 프리미엄 심층 분석
                    </h3>

                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{ fontSize: '1.0rem', color: '#E2725B', margin: '0 0 12px 0', fontWeight: 'bold' }}>🧩 우리를 옭아맨 갈등의 톱니바퀴</h4>
                      <p style={{ fontSize: '0.95rem', color: '#FDF0E6', lineHeight: '1.8', margin: 0, wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', opacity: 0.9 }}>
                        {mockData.premium_deepdive_report?.core_conflict_mechanism || "두 사람의 기질적 차이가 어떻게 반복되는 방어기제의 충돌을 만들어내는지 심층 분석한 내용이 이곳에 표시됩니다."}
                      </p>
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{ fontSize: '1.0rem', color: '#E2725B', margin: '0 0 12px 0', fontWeight: 'bold' }}>🌑 무의식의 그림자와 내면 아이</h4>
                      <p style={{ fontSize: '0.95rem', color: '#FDF0E6', lineHeight: '1.8', margin: 0, wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', opacity: 0.9 }}>
                        {mockData.premium_deepdive_report?.unconscious_projection || "상대방의 행동 아래 숨겨진 결핍이나 불안, 그리고 나의 투사에 대한 다세대적 관점의 해석이 이어집니다."}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.0rem', color: '#E2725B', margin: '0 0 12px 0', fontWeight: 'bold' }}>🕯️ 치유를 향한 관계의 재구성</h4>
                      <p style={{ fontSize: '0.95rem', color: '#FDF0E6', lineHeight: '1.8', margin: 0, wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', opacity: 0.9 }}>
                        {mockData.premium_deepdive_report?.healing_insight || "누구의 잘못도 아닌 '관계의 역동' 자체를 객관적으로 조망하게 돕고, 서로의 내면 아이를 안아주기 위한 심리학적 통찰이 제시됩니다."}
                      </p>
                    </div>

                    {/* 실전 핑퐁 대화 시나리오 (3단계 확장판) */}
                    <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px dashed rgba(253,240,230,0.2)' }}>
                      <h4 style={{ fontSize: '1.1rem', color: '#FDF0E6', margin: '0 0 24px 0', fontWeight: '800', textAlign: 'center', letterSpacing: '0.5px' }}>💬 실전 핑퐁 대화 시나리오</h4>
                      
                      {/* 1단계 부드러운 선긋기 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#E2725B', fontWeight: 'bold', marginLeft: '12px' }}>[1단계: 부드럽게 경계선 긋기]</div>
                        <div style={{ backgroundColor: '#2A3B66', padding: '16px 20px', borderRadius: '20px 20px 20px 4px', color: '#FFF', fontSize: '0.95rem', lineHeight: '1.65', letterSpacing: '0.2px', wordBreak: 'keep-all', whiteSpace: 'pre-wrap', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative' }}>
                          {mockData.premium_scenario_expansion?.stage_1_soft_boundary || "지금은 제가 마음의 여유가 없어서, 조금 이따가 이야기하면 좋겠어요."}
                        </div>
                      </div>

                      {/* 예상 반응 선택 버튼 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#A9B4D0', textAlign: 'center', marginBottom: '4px' }}>상대방의 예상 반응을 선택해 보세요 👇</div>
                        <button 
                          onClick={() => setSelectedScenario(selectedScenario === 'A' ? null : 'A')}
                          style={{ padding: '14px 16px', borderRadius: '12px', border: selectedScenario === 'A' ? '1.5px solid #E2725B' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedScenario === 'A' ? 'rgba(226,114,91,0.1)' : 'rgba(255,255,255,0.05)', color: '#FDF0E6', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>🤔</span> 
                          <span style={{ flex: 1, lineHeight: '1.4' }}>{mockData.premium_scenario_expansion?.expected_reaction_A || "상대가 수긍하지 않고 핑계를 댈 때"}</span>
                        </button>
                        
                        <button 
                          onClick={() => setSelectedScenario(selectedScenario === 'B' ? null : 'B')}
                          style={{ padding: '14px 16px', borderRadius: '12px', border: selectedScenario === 'B' ? '1.5px solid #E2725B' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedScenario === 'B' ? 'rgba(226,114,91,0.1)' : 'rgba(255,255,255,0.05)', color: '#FDF0E6', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>😠</span> 
                          <span style={{ flex: 1, lineHeight: '1.4' }}>{mockData.premium_scenario_expansion?.expected_reaction_B || "상대가 오히려 화를 내거나 비난할 때"}</span>
                        </button>
                      </div>

                      {/* 시나리오 A 결과 */}
                      <div className={`scenario-accordion ${selectedScenario === 'A' ? 'open' : ''}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.8rem', color: '#E2725B', fontWeight: 'bold', marginLeft: '12px' }}>[2단계: 쿠션어 대처]</div>
                          <div style={{ backgroundColor: '#3A4C7A', padding: '16px 20px', borderRadius: '20px 20px 20px 4px', color: '#FFF', fontSize: '0.95rem', lineHeight: '1.65', letterSpacing: '0.2px', wordBreak: 'keep-all', whiteSpace: 'pre-wrap', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative' }}>
                            {mockData.premium_scenario_expansion?.stage_2_cushion_response || "그렇게 생각할 수 있다는 건 알아요. 하지만 지금은 제 마음을 추스르는 게 먼저라서요."}
                          </div>
                        </div>
                      </div>

                      {/* 시나리오 B 결과 */}
                      <div className={`scenario-accordion ${selectedScenario === 'B' ? 'open' : ''}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.8rem', color: '#E2725B', fontWeight: 'bold', marginLeft: '12px' }}>[3단계: 단호한 I-Message]</div>
                          <div style={{ backgroundColor: '#E2725B', padding: '16px 20px', borderRadius: '20px 20px 20px 4px', color: '#FFF', fontSize: '0.95rem', lineHeight: '1.65', letterSpacing: '0.2px', wordBreak: 'keep-all', whiteSpace: 'pre-wrap', boxShadow: '0 4px 15px rgba(226,114,91,0.3)', position: 'relative' }}>
                            {mockData.premium_scenario_expansion?.stage_3_firm_timeout || "그렇게 큰 소리로 말씀하시면 대화하기 어렵습니다. 진정되시면 다시 이야기해요."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 카톡 공유 프리뷰 모달 */}
              {showSharePreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ backgroundColor: '#FFF', borderRadius: '24px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                    {/* 헤더 */}
                    <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: '24px' }}></div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333', fontWeight: '800' }}>{partnerName}에게 전할 마음 레시피</h3>
                      <button onClick={() => setShowSharePreview(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#999', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>

                    {/* 카드 프리뷰 영역 */}
                    <div style={{ padding: '24px' }}>
                      <div style={{ background: 'linear-gradient(135deg, #FFF5F0 0%, #FDF0E6 50%, #EDF5FA 100%)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 8px 24px rgba(226,114,91,0.15)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ fontSize: '1.6rem', color: '#E2725B', opacity: 0.4, lineHeight: 1 }}>❝</div>
                        <div style={{ fontSize: '1.3rem', color: '#4A3728', lineHeight: '1.6', fontFamily: '"Nanum Myeongjo", serif', fontWeight: '800', wordBreak: 'keep-all' }}>
                          {mockData.transcription_sentence || mockData.share_main_sentence}
                        </div>
                        <div style={{ fontSize: '1.6rem', color: '#E2725B', opacity: 0.4, lineHeight: 1 }}>❞</div>
                        <div style={{ marginTop: '20px', fontSize: '0.75rem', color: '#9A7060', letterSpacing: '1px', fontWeight: 'bold' }}>
                          H.E.R.e가 당신의 진심을 응원합니다
                        </div>
                      </div>
                    </div>

                    {/* 하단 액션 */}
                    <div style={{ padding: '0 24px 24px 24px' }}>
                      <button
                        onClick={() => {
                          if (window.Kakao && window.Kakao.isInitialized()) {
                            alert('카카오톡 공유 API 호출 (연동 대기중)');
                          } else {
                            alert('카카오톡 공유가 준비중입니다. 현재 화면을 캡처해서 보내보세요!');
                          }
                        }}
                        style={{ width: '100%', backgroundColor: '#FEE500', color: '#3C1E1E', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.8 1.8 5.3 4.5 6.6l-1 3.7c-.1.4.3.7.6.5l4.3-2.9c.5.1 1.1.1 1.6.1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z" /></svg>
                        카카오톡으로 전하기
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 상대방을 향한 작은 창문 */}
              <div style={{ backgroundColor: '#FAF7F5', borderRadius: '20px', padding: '32px 26px 26px 26px', marginTop: '30px', border: '1px solid #F3ECE8', position: 'relative', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.01)' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#F3ECE8', color: '#9E8071', fontSize: '0.8rem', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  {partnerName}님의 마음 창문
                </div>
                <p style={{ fontSize: '0.98rem', color: '#6A5B53', lineHeight: '1.8', margin: '0', wordBreak: 'keep-all', fontFamily: '"Nanum Myeongjo", serif', fontStyle: 'italic', textAlign: 'center' }}>
                  {mockData.partnerWindow || "상대방도 사실은 관계가 끊어질까 봐 두려워 웅크리고 있는 것일지도 모릅니다. 지금의 침묵은 서툰 보호막일 뿐이에요."}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 나의 방으로 라우팅되는 CTA 배너 */}
        <div style={{ margin: '40px auto 20px auto', maxWidth: '380px' }}>
          <div style={{ backgroundColor: '#FAF7F5', borderRadius: '16px', padding: '24px', border: '1px solid #F3ECE8', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <p style={{ fontSize: '0.95rem', color: '#6A5B53', fontWeight: 'bold', margin: '0 0 16px 0', wordBreak: 'keep-all', lineHeight: '1.5' }}>
              ✨ 이 감정을 조금 더 들여다보고 싶다면, 나의 방에서 이어가 보세요
            </p>
            <button
              onClick={onGoToMyRoom}
              style={{ width: '100%', backgroundColor: '#E2725B', color: '#FFF', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(226,114,91,0.2)' }}
            >
              나의 방에서 이어가기
            </button>
          </div>
        </div>

        <button
          onClick={onReset}
          style={{ display: 'block', margin: '20px auto 40px auto', background: 'none', border: 'none', color: '#6A5B53', fontSize: '0.95rem', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', letterSpacing: '0.5px' }}
        >
          메인 홈으로 돌아가기
        </button>

      </div>
    </div>
  );
}

// H.E.R.e 다정한 식탁 - 고민 입력 화면 컴포넌트 (감정 칩 기능 추가)
function FamilyConcernInputView({ partnerName, partnerRelation, trackType, onNext, currentConcernData, setCurrentConcernData, savedConcernData }) {
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);

  const handleDoneClick = async () => {
    setCurrentConcernData(prev => ({ ...prev, isWritingDone: true }));
    setIsAnalyzingEmotion(true);
    try {
      const data = await fetchGeminiFollowUp(currentConcernData.text);
      if (data && data.question && data.chips && data.chips.length > 0) {
        setCurrentConcernData(prev => ({ ...prev, dynamicQuestion: { normal: data.question, bold: '' }, dynamicChips: data.chips }));
      } else {
        setCurrentConcernData(prev => ({ ...prev, dynamicQuestion: { normal: '이 마음과 가장 가까운 단어는 무엇인가요?', bold: '' }, dynamicChips: ['막막함', '답답함', '서운함', '미안함', '외로움', '지침'] }));
      }
    } catch (err) {
      console.error('FollowUp API Failed:', err);
      setCurrentConcernData(prev => ({ ...prev, dynamicQuestion: { normal: '지금 이 순간, 당신의 마음을 가장 잘 표현하는 단어를 골라주세요.', bold: '' }, dynamicChips: ['막막함', '답답함', '서운함', '미안함', '외로움', '지침'] }));
    } finally {
      setIsAnalyzingEmotion(false);
    }
  };

  const toggleChip = (chip) => {
    setCurrentConcernData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(chip)
        ? prev.emotions.filter(c => c !== chip)
        : prev.emotions.length < 2 ? [...prev.emotions, chip] : [prev.emotions[1], chip]
    }));
  };

  const textLen = (currentConcernData.text || '').replace(/\s/g, '').length;
  const actionLen = (currentConcernData.partnerAction || '').replace(/\s/g, '').length;
  const isDoneBtnEnabled = textLen >= 2 && actionLen >= 2;
  const isDoneBtnVisible = !currentConcernData.isWritingDone;
  const isNextBtnVisible = trackType === '나를 지키는 울타리'
    ? currentConcernData.isWritingDone && currentConcernData.emotions.length >= 1 && currentConcernData.defenseStyle
    : currentConcernData.isWritingDone && currentConcernData.emotions.length >= 1 && currentConcernData.coreNeed;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '20px 0 40px 0', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', zIndex: 1, backgroundColor: '#FFFFFF', width: '100%', maxWidth: '560px', borderRadius: '24px', padding: '50px 40px', boxSizing: 'border-box', border: '1px solid #EAEAEA', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* CSS for Chips & Buttons */}
        <style>{`
          .emotion-chip {
            padding: 8px 16px;
            border-radius: 999px;
            border: 1.5px solid #DDD3CB;
            background: #FBF8F5;
            color: #7A5C48;
            font-size: 0.88rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.22s ease;
            font-family: inherit;
            line-height: 1.4;
          }
          .emotion-chip:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
          .emotion-chip.active {
            background: #E2725B;
            border-color: #E2725B;
            color: white;
            box-shadow: 0 3px 10px rgba(226,114,91,0.25);
          }
          .chip-panel {
            overflow: hidden;
            transition: max-height 0.45s ease-in-out, opacity 0.45s ease-in-out, transform 0.45s ease-in-out;
          }
          .chip-panel.open  { max-height: 400px; opacity: 1; transform: translateY(0); }
          .chip-panel.closed { max-height: 0; opacity: 0; transform: translateY(-10px); pointer-events: none; }
          .done-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 20px;
            border-radius: 999px;
            border: 1.5px solid #D4BFB4;
            background: #FBF8F5;
            color: #9A7060;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.22s ease;
            width: 100%;
          }
          .done-btn:hover { border-color: #C4895A; color: #C4895A; background: #FFF5EE; }
          .done-btn-wrap {
            overflow: hidden;
            transition: max-height 0.35s ease, opacity 0.35s ease;
          }
          .done-btn-wrap.visible { max-height: 60px; opacity: 1; margin-top: 10px; }
          .done-btn-wrap.hidden  { max-height: 0; opacity: 0; pointer-events: none; margin: 0; }
        `}</style>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <svg viewBox="0 0 100 100" fill="none" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto', display: 'block' }}>
              <path d="M20 45L50 20L80 45V80H20V45Z" stroke="#E2725B" strokeWidth="3" />
              <rect x="42" y="52" width="16" height="16" rx="2" fill="#FFFACD" />
            </svg>
            <span style={{ fontSize: '0.65rem', color: '#C4A99A', letterSpacing: '3px', fontWeight: '700', display: 'block', marginBottom: '4px', textAlign: 'center' }}>
              {trackType === '다정한 식탁' ? 'FAMILY ROOM · HEALING' : 'RELATIONSHIP ROOM · BOUNDARY'}
            </span>
            <h2 style={{ fontSize: '1.25rem', color: '#6B4C3B', margin: '0', lineHeight: '1.7', textAlign: 'center', fontWeight: '700', wordBreak: 'keep-all' }}>
              {getJosa(partnerName, '와/과')} 이야기하다 보면,<br />문득 마음이 무거워지는 순간이 있죠.<br />언제인가요?
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: '#777', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' }}>
            {trackType === '나를 지키는 울타리' ? (
              <>정리가 되지 않은 감정이어도 괜찮습니다. <br />내 마음의 단단한 선을 긋기 위해, 불편했던 그 순간을 솔직하게 남겨주세요.</>
            ) : (
              <>단어 하나, 문장 한 줄이라도 좋습니다. <br />식탁 위에 올려두고 싶은 솔직한 고민을 적어주세요.</>
            )}
          </p>
        </div>

        {/* UX Tip: 복원된 상태 알림 */}
        {savedConcernData && savedConcernData.text && currentConcernData.text === '' && (
          <div style={{ position: 'relative', zIndex: 2, backgroundColor: '#FDF7F3', color: '#B5614F', fontSize: '0.85rem', padding: '12px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>💡 아까 적어주신 마음이 임시 저장되어 있어요.</span>
            <button
              onClick={() => setCurrentConcernData(savedConcernData)}
              style={{
                backgroundColor: '#E2725B', color: '#FFF', border: 'none', borderRadius: '6px',
                padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(226,114,91,0.2)'
              }}
            >
              다시 불러오기
            </button>
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {trackType === '나를 지키는 울타리' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#6B4C3B', marginBottom: '8px' }}>👤 어떤 상황이었나요? 상대방의 선 넘은 말이나 행동을 적어주세요.</label>
                <textarea
                  value={currentConcernData.partnerAction || ''}
                  onChange={(e) => setCurrentConcernData(prev => ({ ...prev, partnerAction: e.target.value, ...(e.target.value.length < 2 || (prev.text && prev.text.length < 2) ? { emotions: [], isWritingDone: false } : {}) }))}
                  disabled={currentConcernData.isWritingDone}
                  placeholder="(예: 내 업무가 아닌데도 퇴근 직전에 당연하다는 듯이 일을 넘겼어요. / 무례한 농담을 툭 던져서 불쾌했어요.)"
                  style={{ width: '100%', minHeight: '100px', backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px', boxSizing: 'border-box', fontSize: '15px', lineHeight: '1.6', color: '#333', resize: 'none', fontFamily: 'sans-serif' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#6B4C3B', marginBottom: '8px' }}>🙋‍♀️ 그 순간, 가장 피곤하고 힘들었던 감정은 무엇인가요?</label>
                <textarea
                  value={currentConcernData.text}
                  onChange={(e) => setCurrentConcernData(prev => ({ ...prev, text: e.target.value, ...(e.target.value.length < 2 || (prev.partnerAction && prev.partnerAction.length < 2) ? { emotions: [], isWritingDone: false } : {}) }))}
                  disabled={currentConcernData.isWritingDone}
                  placeholder="(예: 화가 났지만 관계가 껄끄러워질까 봐 아무 말도 못 하고 웃어넘긴 내 자신이 답답해요.)"
                  style={{ width: '100%', minHeight: '100px', backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px', boxSizing: 'border-box', fontSize: '15px', lineHeight: '1.6', color: '#333', resize: 'none', fontFamily: 'sans-serif' }}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#6B4C3B', marginBottom: '8px' }}>👤 그때, 상대방은 어떤 행동이나 말을 했나요?</label>
                <textarea
                  value={currentConcernData.partnerAction || ''}
                  onChange={(e) => setCurrentConcernData(prev => ({ ...prev, partnerAction: e.target.value, ...(e.target.value.length < 2 || (prev.text && prev.text.length < 2) ? { emotions: [], isWritingDone: false } : {}) }))}
                  disabled={currentConcernData.isWritingDone}
                  placeholder="(예: 내 말을 끝까지 듣지 않고 논리적으로만 따지려고 했어요.)"
                  style={{ width: '100%', minHeight: '100px', backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px', boxSizing: 'border-box', fontSize: '15px', lineHeight: '1.6', color: '#333', resize: 'none', fontFamily: 'sans-serif' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#6B4C3B', marginBottom: '8px' }}>🙋‍♀️ 그 순간, 내 마음은 어땠나요?</label>
                <textarea
                  value={currentConcernData.text}
                  onChange={(e) => setCurrentConcernData(prev => ({ ...prev, text: e.target.value, ...(e.target.value.length < 2 || (prev.partnerAction && prev.partnerAction.length < 2) ? { emotions: [], isWritingDone: false } : {}) }))}
                  disabled={currentConcernData.isWritingDone}
                  placeholder="(예: 내 노력을 인정받지 못한 것 같아 왈칵 서운해졌어요.)"
                  style={{ width: '100%', minHeight: '100px', backgroundColor: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: '12px', padding: '16px', boxSizing: 'border-box', fontSize: '15px', lineHeight: '1.6', color: '#333', resize: 'none', fontFamily: 'sans-serif' }}
                />
              </div>
            </>
          )}
        </div>

        {/* 다 적었어요 버튼 */}
        <div className={`done-btn-wrap ${isDoneBtnVisible ? 'visible' : 'hidden'}`}>
          <button 
             className="done-btn" 
             onClick={handleDoneClick}
             disabled={!isDoneBtnEnabled}
             style={{ opacity: isDoneBtnEnabled ? 1 : 0.4, cursor: isDoneBtnEnabled ? 'pointer' : 'not-allowed' }}
          >
            마음 들여다보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* 감정 칩 영역 */}
        <div className={`chip-panel ${currentConcernData.isWritingDone ? 'open' : 'closed'}`} style={{ position: 'relative', zIndex: 2 }}>
          {isAnalyzingEmotion ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px', border: '3px solid #F1E5DA', borderTop: '3px solid #E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#B39A8B', letterSpacing: '0.5px' }}>
                문장 너머의 진짜 마음을<br />가만히 들여다보고 있습니다...
              </p>
            </div>
          ) : (
            <div style={{ padding: '24px 0 0 0', borderTop: '1px solid #F3ECE6', marginTop: '15px' }}>
              <p style={{ fontSize: '0.95rem', color: '#6B4C3B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5', fontWeight: 'bold' }}>
                {typeof currentConcernData.dynamicQuestion === 'object' ? currentConcernData.dynamicQuestion.bold : currentConcernData.dynamicQuestion}
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#A38B7D', fontWeight: 'normal', marginTop: '4px' }}>(최대 2개 선택)</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {currentConcernData.dynamicChips.map((chip, idx) => (
                  <button
                    key={idx}
                    className={`emotion-chip ${currentConcernData.emotions.includes(chip) ? 'active' : ''}`}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* 방어 태세 칩 영역 (관계의 방 전용) */}
        {trackType === '나를 지키는 울타리' && currentConcernData.isWritingDone && currentConcernData.emotions.length >= 1 && !isAnalyzingEmotion && (
          <div className="chip-panel open" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '24px 0 0 0', borderTop: '1px solid #F3ECE6', marginTop: '15px' }}>
              <p style={{ fontSize: '0.95rem', color: '#6B4C3B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5', fontWeight: 'bold' }}>
                🛡️ 어떤 처방을 원하시나요?
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#A38B7D', fontWeight: 'normal', marginTop: '4px' }}>(원하는 대처 방식을 하나 선택해주세요)</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                {(() => {
                  const isCloseRelation = partnerRelation && (partnerRelation.includes('연인') || partnerRelation.includes('가족') || partnerRelation.includes('부부') || partnerRelation.includes('배우자'));
                  const options = isCloseRelation 
                    ? ['솔직하게 서운함을 표현하는 대화', '서로의 입장을 조율하는 대화', '단호하게 내 시간을 지키는 대화']
                    : ['건조하고 차분한 철벽', '부드럽고 우아한 화제 전환', '예의 바르지만 단호한 거절'];
                  
                  return options.map((style) => (
                    <button
                      key={style}
                      onClick={() => setCurrentConcernData(prev => ({ ...prev, defenseStyle: style }))}
                      style={{
                        width: '100%', maxWidth: '300px', padding: '12px 16px', borderRadius: '12px',
                        border: `1.5px solid ${currentConcernData.defenseStyle === style ? '#E2725B' : '#DDD3CB'}`,
                        backgroundColor: currentConcernData.defenseStyle === style ? '#E2725B' : '#FBF8F5',
                        color: currentConcernData.defenseStyle === style ? 'white' : '#7A5C48',
                        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
                        boxShadow: currentConcernData.defenseStyle === style ? '0 3px 10px rgba(226,114,91,0.25)' : 'none'
                      }}
                    >
                      {style}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 핵심 욕구 칩 영역 (가족의 방 전용) */}
        {trackType === '다정한 식탁' && currentConcernData.isWritingDone && currentConcernData.emotions.length >= 1 && !isAnalyzingEmotion && (
          <div className="chip-panel open" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ padding: '24px 0 0 0', borderTop: '1px solid #F3ECE6', marginTop: '15px' }}>
              <p style={{ fontSize: '0.95rem', color: '#6B4C3B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5', fontWeight: 'bold' }}>
                🧊 그 순간, 내가 진짜로 원했던 것은 무엇인가요?
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#A38B7D', fontWeight: 'normal', marginTop: '4px' }}>(가장 핵심적인 욕구를 하나 선택해주세요)</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                {['따뜻한 공감과 위로', '내 노력에 대한 진심 어린 인정', '나를 향한 믿음과 기다림', '함께 고민하고 해결책 찾기'].map((need) => (
                  <button
                    key={need}
                    onClick={() => setCurrentConcernData(prev => ({ ...prev, coreNeed: need }))}
                    style={{
                      width: '100%', maxWidth: '300px', padding: '12px 16px', borderRadius: '12px',
                      border: `1.5px solid ${currentConcernData.coreNeed === need ? '#E2725B' : '#DDD3CB'}`,
                      backgroundColor: currentConcernData.coreNeed === need ? '#E2725B' : '#FBF8F5',
                      color: currentConcernData.coreNeed === need ? 'white' : '#7A5C48',
                      fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: currentConcernData.coreNeed === need ? '0 3px 10px rgba(226,114,91,0.25)' : 'none'
                    }}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 관계의 지도 열기 / 처방전 받기 버튼 */}
        <div className={`done-btn-wrap ${isNextBtnVisible && !isAnalyzingEmotion ? 'visible' : 'hidden'}`}>
          <button
            onClick={onNext}
            style={{ position: 'relative', zIndex: 2, width: '100%', padding: '18px', backgroundColor: '#E2725B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
          >
            {trackType === '나를 지키는 울타리' ? '나를 지키는 처방전 받기' : '관계의 지도 열기'}
          </button>
        </div>
      </div>
    </div>

  );
}
