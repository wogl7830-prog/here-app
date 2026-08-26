import React, { useState, useEffect, useMemo } from 'react';

/* ─── 상수 데이터 ─────────────────────────────────────────────── */
const RAINY_CHIPS = [
  { text: '시간 부족', icon: '⏰' },
  { text: '체력 방전', icon: '🪫' },
  { text: '비교하는 마음', icon: '👀' },
  { text: '답답한 소통', icon: '🗣️' },
  { text: '완벽주의 압박', icon: '⚖️' },
  { text: '잠 못 이룬 밤', icon: '🌙' },
  { text: '인정받지 못한 느낌', icon: '💔' },
];

const SUNNY_CHIPS = [
  { text: '아이의 웃음', icon: '👶' },
  { text: '새벽의 고요', icon: '☕' },
  { text: '따뜻한 커피 한 잔', icon: '🍵' },
  { text: '작은 성취감', icon: '🏆' },
  { text: '혼자만의 산책', icon: '🚶‍♀️' },
  { text: '누군가의 다정한 말', icon: '💬' },
];

const BADGES = [
  { icon: '🌂', label: '평온 배지', desc: '감정의 소나기를 피하지 않고 마주했어요', earned: true, accentColor: '#E2725B', bgColor: '#FFF0ED', borderColor: '#F1AC9D' },
  { icon: '☂️', label: '울타리 배지', desc: '처방 문장을 3번 이상 필사했어요', earned: true, accentColor: '#2E5B7A', bgColor: '#EEF4F9', borderColor: '#B8CEDE' },
  { icon: '⛱️', label: '식탁 배지', desc: '5회 이상 마음을 기록했어요', earned: true, accentColor: '#7A5C48', bgColor: '#FAF5F0', borderColor: '#D9C9BC' },
  { icon: '🪟', label: '마음 창문', desc: '한 달 꾸준히 관측소를 방문했어요', earned: false },
  { icon: '⛵', label: '작은 항해', desc: '감정 좌표를 10회 이상 찍었어요', earned: false },
  { icon: '🌤', label: '개인 기상청', desc: '행동 예보를 매주 확인했어요', earned: false },
];

/* ─── 브리핑 텍스트 생성 (emotionDB 기반) ────────────────────── */
export function buildBriefing(emotionDB, name) {
  // 이름이 없을 때는 "당신 님," prefix 자체를 생략하여 어색한 표현 방지
  const prefix = name ? `${name} 님, ` : '';
  const count = emotionDB.length;
  if (count === 0) return {
    headline: `${prefix}오늘의 하늘이 기다리고 있어요.`,
    summary: '아직 기록된 날씨가 없어요. 마음의 첫 번째 구름을 꺼내보는 건 어떨까요? 작은 한 줄이면 충분합니다.',
    emoji: '🌫',
  };
  if (count < 3) return {
    headline: `${prefix}서서히 하늘이 열리고 있어요.`,
    summary: '막 기록을 시작하셨네요. 날씨는 매일 달라지니까요. 오늘 하루의 구름 한 조각을 더 꺼내보세요.',
    emoji: '🌥',
  };
  if (count < 7) return {
    headline: `${prefix}비 온 뒤 맑아지는 중이에요.`,
    summary: '이번 주는 감정의 날씨가 꽤 분주했네요. 비를 피하지 않고 맞서 주셨어요. 그 용기가 내일의 맑음을 만들어 갑니다.',
    emoji: '⛅',
  };
  return {
    headline: `${prefix}오늘 하늘엔 틈새 햇살이 들어오고 있어요.`,
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

  const earnedBadges = BADGES.filter(b => b.earned).length;

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
        @keyframes chipPop {
          from { opacity: 0; transform: scale(0.88) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 4px 10px rgba(226,114,91,0.12); }
          50%       { box-shadow: 0 6px 20px rgba(226,114,91,0.26); }
        }
        .wd-chip-rainy { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .wd-chip-rainy:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(46,91,122,0.15); }
        .wd-chip-sunny { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .wd-chip-sunny:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(122,92,72,0.15); }
        .wd-badge-earned { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .wd-badge-earned:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10) !important; }
        .wd-scroll::-webkit-scrollbar { width: 4px; }
        .wd-scroll::-webkit-scrollbar-track { background: transparent; }
        .wd-scroll::-webkit-scrollbar-thumb { background: #DDD8D0; border-radius: 2px; }

        /* 파티션 카드 내부 구분선 */
        .wd-partition-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, #E0D8D0 30%, #E0D8D0 70%, transparent);
          align-self: stretch;
          flex-shrink: 0;
        }
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

        {/* ── 헤더: 창문 감성 타이틀 ── */}
        <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.58rem', color: '#C0A898', letterSpacing: '2.5px', fontWeight: '700', marginBottom: '4px' }}>
              오늘, 내 마음의 창문 열기 🪟
            </div>
            <div style={{ fontSize: '1.08rem', fontWeight: '800', color: '#3A2E2A', letterSpacing: '-0.3px', lineHeight: '1.3' }}>
              나의 마음 날씨 관측소 🌿
            </div>
            <div style={{ fontSize: '0.74rem', color: '#A09088', marginTop: '5px', lineHeight: '1.6', wordBreak: 'keep-all', maxWidth: '300px' }}>
              창문을 가만히 열어, 최근 내 마음에 머문 날씨와 바람의 결을 들여다봅니다.
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0A898', padding: '8px', marginTop: '2px' }}>
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
              marginBottom: '20px',
              animation: 'wdFadeUp 0.5s ease forwards',
              border: '1px solid rgba(200,210,220,0.3)',
            }}
          >
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
            }}>
              {briefing.summary}{' '}
              지금까지 {emotionDB.length}번 마음의 날씨를 들여다보고,{' '}
              {earnedBadges}개의 단단한 우산을 펼쳐냈어요.
            </p>
          </section>

          {/* ════ 2. 먹구름 vs 햇살 — 공간적 파티션 ════ */}
          <section style={{ marginBottom: '20px' }}>
            {/* 섹션 헤더 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px', padding: '0 2px' }}>
              <span style={{ fontSize: '1rem', filter: 'grayscale(0.4) opacity(0.8)' }}>🌤</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3A2E2A' }}>먹구름 해부학</div>
                <div style={{ fontSize: '0.72rem', color: '#B0A098', marginTop: '1px' }}>이번 주 나를 무겁게 한 것들과 가볍게 한 것들</div>
              </div>
            </div>

            {/* ── 파티션 카드 컨테이너 ── */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #F0EDE8',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>

              {/* 상단: 먹구름 영역 */}
              <div style={{
                padding: '18px 18px 16px',
                background: 'linear-gradient(135deg, #F0F5FA 0%, #E8EFF6 100%)',
                borderBottom: '1px solid #E5EBF0',
              }}>
                {/* 소제목 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1rem' }}>🌧️</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2E5B7A', letterSpacing: '-0.2px' }}>
                    이번 주 나를 무겁게 한 것들
                  </span>
                  <div style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem', fontWeight: '700',
                    color: '#5B8AAA', backgroundColor: '#DDE9F2',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>
                    먹구름 요인
                  </div>
                </div>
                {/* 칩 목록 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {RAINY_CHIPS.map((chip, i) => (
                    <span
                      key={i}
                      className="wd-chip-rainy"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        backgroundColor: '#EEF4F9', color: '#2E5B7A',
                        padding: '6px 12px', borderRadius: '12px',
                        fontSize: '0.8rem', fontWeight: '700',
                        border: '1px solid #C8DBEA',
                        cursor: 'default',
                        animation: `chipPop 0.3s ease ${i * 0.04}s both`,
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{chip.icon}</span>
                      {chip.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* 하단: 햇살 영역 */}
              <div style={{
                padding: '18px 18px 16px',
                background: 'linear-gradient(135deg, #FFFBF5 0%, #FDF5EA 100%)',
              }}>
                {/* 소제목 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1rem' }}>☀️</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#7A5C48', letterSpacing: '-0.2px' }}>
                    나를 다정하게 지켜준 것들
                  </span>
                  <div style={{
                    marginLeft: 'auto',
                    fontSize: '0.65rem', fontWeight: '700',
                    color: '#9B6F4A', backgroundColor: '#F6E8D5',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>
                    햇살 요인
                  </div>
                </div>
                {/* 칩 목록 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {SUNNY_CHIPS.map((chip, i) => (
                    <span
                      key={i}
                      className="wd-chip-sunny"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        backgroundColor: '#FAF5F0', color: '#7A5C48',
                        padding: '6px 12px', borderRadius: '12px',
                        fontSize: '0.8rem', fontWeight: '700',
                        border: '1px solid #E9DCD0',
                        cursor: 'default',
                        animation: `chipPop 0.3s ease ${i * 0.04 + 0.28}s both`,
                      }}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{chip.icon}</span>
                      {chip.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 균형감 메시지 */}
            <div style={{
              marginTop: '10px', padding: '10px 14px',
              backgroundColor: '#F7F4F0',
              borderRadius: '12px',
              fontSize: '0.73rem', color: '#9A8A7E',
              lineHeight: '1.6', wordBreak: 'keep-all',
              border: '1px solid #EDE8E2',
            }}>
              💡 비가 내렸지만, 내 안에는 이만큼 따뜻한 햇살 자원들이 나를 든든히 지켜주고 있었어요.
            </div>
          </section>

          {/* ════ 3. 내가 만든 우산 — 감성 아카이브 배지 그리드 ════ */}
          <section>
            {/* 섹션 헤더 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px', padding: '0 2px' }}>
              <span style={{ fontSize: '1rem' }}>☂️</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3A2E2A' }}>내가 만든 우산</div>
                <div style={{ fontSize: '0.72rem', color: '#B0A098', marginTop: '1px' }}>{earnedBadges}개의 단단한 마음 방패를 모았어요</div>
              </div>
            </div>

            {/* ── 배지 그리드 ── */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #F0EDE8',
              padding: '18px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            }}>
              {/* 획득 배지 행 — 가로 스크롤 아카이브 */}
              <div style={{ fontSize: '0.68rem', color: '#C0B8B0', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.5px' }}>
                ☂️ 내가 완성한 단단한 마음 방패들
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {BADGES.map((badge, i) =>
                  badge.earned ? (
                    /* 획득 배지 */
                    <div
                      key={badge.label}
                      className="wd-badge-earned"
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                        animation: `chipPop 0.35s ease ${i * 0.07}s both`,
                      }}
                    >
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        backgroundColor: badge.bgColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem',
                        border: `1.5px solid ${badge.borderColor}`,
                        boxShadow: `0 4px 12px rgba(0,0,0,0.08)`,
                        cursor: 'default',
                      }}>
                        {badge.icon}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: badge.accentColor, fontWeight: '800', textAlign: 'center', maxWidth: '56px', lineHeight: '1.3' }}>
                        {badge.label}
                      </span>
                    </div>
                  ) : (
                    /* 미획득 점선 슬롯 */
                    <div
                      key={badge.label}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                        opacity: 0.45,
                      }}
                    >
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        border: '1.5px dashed #C8C2BC',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', color: '#B8B0A8',
                        cursor: 'default',
                      }}>
                        🔐
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#B0A098', fontWeight: '700', textAlign: 'center', maxWidth: '56px', lineHeight: '1.3' }}>
                        미달성
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* 구분선 */}
              <div style={{ height: '1px', backgroundColor: '#F0EDE8', margin: '16px 0' }} />

              {/* 배지 상세 목록 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                {BADGES.map((badge) => (
                  <div
                    key={badge.label}
                    style={{
                      backgroundColor: badge.earned ? (badge.bgColor || '#FFFAF5') : '#F8F8F8',
                      borderRadius: '14px',
                      padding: '14px 12px',
                      border: `1px solid ${badge.earned ? (badge.borderColor || '#F0E6D8') : '#EBEBEB'}`,
                      opacity: badge.earned ? 1 : 0.42,
                      display: 'flex', flexDirection: 'column', gap: '6px',
                    }}
                  >
                    <span style={{
                      fontSize: '1.6rem', display: 'block',
                      filter: badge.earned ? 'grayscale(0.15) opacity(0.92)' : 'grayscale(1) opacity(0.4)',
                    }}>
                      {badge.icon}
                    </span>
                    <div style={{ fontSize: '0.84rem', fontWeight: '800', color: badge.earned ? '#3A2E2A' : '#AAA' }}>
                      {badge.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: badge.earned ? '#8A7A72' : '#BBB', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                      {badge.desc}
                    </div>
                    {badge.earned && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badge.accentColor || '#C17A6B' }} />
                        <span style={{ fontSize: '0.6rem', color: badge.accentColor || '#C17A6B', fontWeight: '700', letterSpacing: '0.5px' }}>획득 완료</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 리텐션 유도 문구 */}
            <p style={{ fontSize: '0.76rem', color: '#C0B8B0', textAlign: 'center', marginTop: '14px', lineHeight: '1.7', wordBreak: 'keep-all' }}>
              흐릿한 배지는 아직 발견 중이에요 🔐<br />
              기록이 쌓이면 저절로 빛이 납니다.
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
