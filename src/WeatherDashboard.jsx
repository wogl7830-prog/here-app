import React, { useState, useEffect, useMemo } from 'react';

/* ─── 상수 데이터 ─────────────────────────────────────────────── */
const CLOUD_CHIPS = [
  { text: '시간 부족', type: 'dark' }, { text: '체력 방전', type: 'dark' },
  { text: '비교하는 마음', type: 'dark' }, { text: '답답한 소통', type: 'dark' },
  { text: '완벽해야 한다는 압박', type: 'dark' }, { text: '잠 못 이룬 밤', type: 'dark' },
  { text: '인정받지 못한 느낌', type: 'dark' },
];
const SUN_CHIPS = [
  { text: '아이의 웃음', type: 'light' }, { text: '새벽의 고요', type: 'light' },
  { text: '따뜻한 커피 한 잔', type: 'light' }, { text: '작은 성취감', type: 'light' },
  { text: '혼자만의 산책', type: 'light' }, { text: '누군가의 다정한 말', type: 'light' },
];

const BADGES = [
  { icon: '☂', label: '단단한 우산', desc: '감정의 소나기를 피하지 않고 마주했어요', earned: true },
  { icon: '🌱', label: '내면의 새싹', desc: '처방 문장을 3번 이상 필사했어요', earned: true },
  { icon: '📔', label: '날씨 일기', desc: '5회 이상 마음을 기록했어요', earned: true },
  { icon: '🪟', label: '마음 창문', desc: '한 달 꾸준히 관측소를 방문했어요', earned: false },
  { icon: '⛵', label: '작은 항해', desc: '감정 좌표를 10회 이상 찍었어요', earned: false },
  { icon: '🌤', label: '개인 기상청', desc: '행동 예보를 매주 확인했어요', earned: false },
];

/* ─── 브리핑 텍스트 생성 (emotionDB 기반) ────────────────────── */
function buildBriefing(emotionDB, name) {
  const n = name || '당신';
  const count = emotionDB.length;
  if (count === 0) return {
    headline: `${n} 님, 오늘의 하늘이 기다리고 있어요.`,
    summary: '아직 기록된 날씨가 없어요. 마음의 첫 번째 구름을 꺼내보는 건 어떨까요? 작은 한 줄이면 충분합니다.',
    emoji: '🌫',
  };
  if (count < 3) return {
    headline: `${n} 님, 서서히 하늘이 열리고 있어요.`,
    summary: '막 기록을 시작하셨네요. 날씨는 매일 달라지니까요. 오늘 하루의 구름 한 조각을 더 꺼내보세요.',
    emoji: '🌥',
  };
  if (count < 7) return {
    headline: `${n} 님, 비 온 뒤 맑아지는 중이에요.`,
    summary: '이번 주는 감정의 날씨가 꽤 분주했네요. 비를 피하지 않고 맞서 주셨어요. 그 용기가 내일의 맑음을 만들어 갑니다.',
    emoji: '⛅',
  };
  return {
    headline: `${n} 님, 오늘 하늘엔 틈새 햇살이 들어오고 있어요.`,
    summary: `${count}번의 기록이 쌓였습니다. 감정의 구름을 피하지 않고 꾸준히 들여다봐 주셨어요. 그 성실함 자체가 이미 가장 맑은 날씨입니다.`,
    emoji: '🌤',
  };
}

/* ─── 메인 컴포넌트 ───────────────────────────────────────────── */
export default function WeatherDashboard({ onClose, emotionDB = [], formData = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t); }, []);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 350); };

  const briefing = useMemo(() => buildBriefing(emotionDB, formData.name), [emotionDB, formData.name]);

  // emotionDB에서 동적으로 칩 보완
  const earnedBadges = BADGES.filter(b => b.earned).length;
  const totalBadges = BADGES.length;

  // 태그 클라우드: 어긋나게 배치하기 위한 margin 변형 배열
  const allChips = [
    ...CLOUD_CHIPS.map((c, i) => ({ ...c, mt: [0, 8, -4, 12, -8, 4, 0][i % 7] })),
    ...SUN_CHIPS.map((c, i) => ({ ...c, mt: [4, -4, 8, 0, -8, 6][i % 6] })),
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backgroundColor: visible ? 'rgba(20,20,30,0.42)' : 'rgba(20,20,30,0)',
        transition: 'background-color 0.38s ease',
      }}
    >
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wdFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wd-chip { transition: transform 0.18s ease; }
        .wd-chip:hover { transform: translateY(-2px); }
        .wd-badge { transition: box-shadow 0.18s ease; }
        .wd-badge:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.07) !important; }
        .wd-scroll::-webkit-scrollbar { width: 4px; }
        .wd-scroll::-webkit-scrollbar-track { background: transparent; }
        .wd-scroll::-webkit-scrollbar-thumb { background: #DDD8D0; border-radius: 2px; }
      `}</style>

      {/* ── 패널 ── */}
      <div
        className="wd-scroll"
        style={{
          width: '100%', maxWidth: '480px',
          backgroundColor: '#FDFBF7',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -10px 48px rgba(0,0,0,0.13)',
          maxHeight: '92vh', overflowY: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* 드래그 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#E0DDD8' }} />
        </div>

        {/* 헤더 */}
        <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.58rem', color: '#C0A898', letterSpacing: '2.5px', fontWeight: '700', marginBottom: '3px' }}>
              MY WEATHER STATION
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#3A2E2A', letterSpacing: '-0.3px' }}>
              나의 날씨 관측소
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0A898', padding: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 20px 52px' }}>

          {/* ════ 1. 다정한 기상 브리핑 ════ */}
          <section
            style={{
              background: 'linear-gradient(145deg, #FDF8F2 0%, #EEF4F8 55%, #E8F0F5 100%)',
              borderRadius: '20px', padding: '28px 24px',
              marginBottom: '18px',
              animation: 'wdFadeUp 0.5s ease forwards',
              border: '1px solid rgba(200,210,220,0.3)',
            }}
          >
            {/* 이모지 아이콘 */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{
                fontSize: '3rem', display: 'inline-block',
                filter: 'grayscale(0.3) opacity(0.85)',
                animation: 'floatIcon 4s ease-in-out infinite',
              }}>
                {briefing.emoji}
              </span>
            </div>

            <h2 style={{
              fontSize: '1.1rem', fontWeight: '800', color: '#3A2E2A',
              margin: '0 0 12px', lineHeight: '1.5', textAlign: 'center',
              letterSpacing: '-0.3px', wordBreak: 'keep-all',
            }}>
              {briefing.headline}
            </h2>

            <p style={{
              fontSize: '0.9rem', color: '#6A6058', lineHeight: '1.85',
              margin: 0, textAlign: 'center', wordBreak: 'keep-all',
              fontFamily: '"Nanum Myeongjo", serif',
            }}>
              {briefing.summary}{' '}
              지금까지 {emotionDB.length}번 마음의 날씨를 들여다보고,{' '}
              {earnedBadges}개의 단단한 우산을 펼쳐냈어요.
            </p>
          </section>

          {/* ════ 2. 먹구름 해부학 — 태그 클라우드 ════ */}
          <section style={{ marginBottom: '18px' }}>
            <SectionHeader emoji="☁" title="먹구름 해부학" sub="이번 주 나를 무겁게 한 것들과 가볍게 한 것들" />

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              padding: '20px', backgroundColor: '#FFFFFF',
              borderRadius: '18px', border: '1px solid #F0EDE8',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
              alignItems: 'flex-start',
            }}>
              {allChips.map((chip, i) => (
                <span
                  key={i}
                  className="wd-chip"
                  style={{
                    marginTop: chip.mt + 'px',
                    display: 'inline-block',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    letterSpacing: '-0.2px',
                    cursor: 'default',
                    ...(chip.type === 'dark'
                      ? { backgroundColor: '#E8EDF2', color: '#4A5568', border: '1px solid #D8DFE8' }
                      : { backgroundColor: '#FEF3C7', color: '#92722A', border: '1px solid #F6E0A0' }),
                  }}
                >
                  {chip.text}
                </span>
              ))}
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingLeft: '4px' }}>
              <LegendDot color="#CBD5E0" text="먹구름 요인" />
              <LegendDot color="#F6D860" text="햇살 요인" />
            </div>
          </section>

          {/* ════ 3. 내가 만든 우산 — 뱃지 콜렉션 ════ */}
          <section>
            <SectionHeader emoji="☂" title="내가 만든 우산" sub={`${earnedBadges}개의 뱃지를 모았어요`} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="wd-badge"
                  style={{
                    backgroundColor: badge.earned ? '#FFFAF5' : '#F8F8F8',
                    borderRadius: '16px',
                    padding: '18px 14px',
                    border: `1px solid ${badge.earned ? '#F0E6D8' : '#EBEBEB'}`,
                    boxShadow: badge.earned ? '0 2px 10px rgba(193,122,107,0.07)' : 'none',
                    opacity: badge.earned ? 1 : 0.45,
                    display: 'flex', flexDirection: 'column', gap: '8px',
                  }}
                >
                  <span style={{
                    fontSize: '1.8rem', display: 'block',
                    filter: badge.earned ? 'grayscale(0.2) opacity(0.9)' : 'grayscale(1) opacity(0.4)',
                  }}>
                    {badge.icon}
                  </span>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: badge.earned ? '#3A2E2A' : '#AAA' }}>
                    {badge.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: badge.earned ? '#8A7A72' : '#BBB', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                    {badge.desc}
                  </div>
                  {badge.earned && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#C17A6B' }} />
                      <span style={{ fontSize: '0.62rem', color: '#C17A6B', fontWeight: '700', letterSpacing: '0.5px' }}>획득 완료</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 미취득 안내 */}
            <p style={{ fontSize: '0.78rem', color: '#C0B8B0', textAlign: 'center', marginTop: '16px', lineHeight: '1.6', wordBreak: 'keep-all' }}>
              흐릿한 뱃지는 아직 발견 중이에요. 기록이 쌓이면 저절로 빛이 납니다.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

/* ─── 서브 컴포넌트 ───────────────────────────────────────────── */
function SectionHeader({ emoji, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px', padding: '0 2px' }}>
      <span style={{ fontSize: '1rem', filter: 'grayscale(0.4) opacity(0.8)' }}>{emoji}</span>
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3A2E2A' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#B0A098', marginTop: '1px' }}>{sub}</div>
      </div>
    </div>
  );
}

function LegendDot({ color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
      <span style={{ fontSize: '0.7rem', color: '#B0A098' }}>{text}</span>
    </div>
  );
}
