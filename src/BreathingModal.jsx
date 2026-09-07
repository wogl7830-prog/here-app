import React, { useState, useEffect, useRef } from 'react';

const CYCLE_SEC = 8;   // 들이마시기 4s + 내쉬기 4s
const TOTAL_SEC = 180; // 3분

function pad(n) { return String(n).padStart(2, '0'); }

export default function BreathingModal({ onClose }) {
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState(TOTAL_SEC);
  const [phase, setPhase] = useState('in'); // 'in' | 'out'
  const intervalRef = useRef(null);
  const phaseRef = useRef('in');
  const phaseTimer = useRef(null);

  /* ── 등장 애니메이션 트리거 ── */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  /* ── 카운트다운 ── */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  /* ── 호흡 단계 교번 (4s 간격) ── */
  useEffect(() => {
    const tick = () => {
      phaseRef.current = phaseRef.current === 'in' ? 'out' : 'in';
      setPhase(phaseRef.current);
    };
    phaseTimer.current = setInterval(tick, 4000);
    return () => clearInterval(phaseTimer.current);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isDone = remaining === 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9200,
      backgroundColor: visible ? '#0A0E1A' : 'transparent',
      transition: 'background-color 0.4s ease',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>
      <style>{`
        @keyframes breatheIn {
          0%   { transform: scale(0.62); opacity: 0.55; }
          100% { transform: scale(1);    opacity: 0.9;  }
        }
        @keyframes breatheOut {
          0%   { transform: scale(1);    opacity: 0.9;  }
          100% { transform: scale(0.62); opacity: 0.55; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 60px 20px rgba(140,180,255,0.12); }
          50%       { box-shadow: 0 0 100px 40px rgba(140,180,255,0.22); }
        }
        @keyframes bmFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bm-orb {
          animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
          animation-duration: 4s;
          animation-fill-mode: both;
        }
        .bm-orb.phase-in  { animation-name: breatheIn; }
        .bm-orb.phase-out { animation-name: breatheOut; }
      `}</style>

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '50%', width: '40px', height: '40px',
          cursor: 'pointer', color: 'rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* 타이머 */}
      <div style={{
        position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)',
        fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
        letterSpacing: '3px', fontWeight: '600',
        opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.4s',
      }}>
        {isDone ? 'DONE' : `${pad(mins)} : ${pad(secs)}`}
      </div>

      {/* 배경 별빛 — 순수 CSS dot */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? '2px' : '1px',
            height: i % 3 === 0 ? '2px' : '1px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.18)',
            top: `${(i * 37 + 11) % 100}%`,
            left: `${(i * 53 + 7) % 100}%`,
            opacity: visible ? 1 : 0,
            transition: `opacity ${0.6 + i * 0.04}s ease ${i * 0.05}s`,
          }} />
        ))}
      </div>

      {/* 호흡 Orb 영역 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
        animation: visible ? 'bmFadeIn 0.8s ease 0.2s both' : 'none',
      }}>
        {/* 위상 텍스트 */}
        <div style={{
          fontSize: '0.7rem', letterSpacing: '4px', fontWeight: '700',
          color: isDone ? 'rgba(180,220,180,0.6)' : 'rgba(180,200,255,0.45)',
          marginBottom: '48px',
          transition: 'color 1s ease',
        }}>
          {isDone ? '수 고 하 셨 어 요' : phase === 'in' ? '들 이 마 시 기' : '내 쉬  기'}
        </div>

        {/* Orb */}
        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 외부 글로우 링 */}
          <div style={{
            position: 'absolute', inset: '-20px',
            borderRadius: '50%',
            animation: 'glowPulse 8s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* 메인 Orb */}
          <div
            key={phase}
            className={`bm-orb phase-${phase}`}
            style={{
              width: '220px', height: '220px',
              borderRadius: '50%',
              background: isDone
                ? 'radial-gradient(circle at 38% 35%, rgba(140,220,140,0.9) 0%, rgba(60,120,80,0.7) 60%, rgba(20,40,30,0.5) 100%)'
                : 'radial-gradient(circle at 38% 35%, rgba(200,220,255,0.95) 0%, rgba(100,140,230,0.75) 45%, rgba(30,50,120,0.55) 100%)',
              boxShadow: isDone
                ? '0 0 60px 20px rgba(100,200,120,0.18)'
                : '0 0 60px 20px rgba(100,140,255,0.18)',
              transition: 'background 1.5s ease, box-shadow 1.5s ease',
            }}
          />
        </div>

        {/* 위로 문구 */}
        <p style={{
          marginTop: '56px',
          fontSize: '0.88rem',
          color: 'rgba(255,255,255,0.28)',
          lineHeight: '1.9',
          textAlign: 'center',
          maxWidth: '280px',
          wordBreak: 'keep-all',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
          letterSpacing: '0.3px',
        }}>
          {isDone
            ? '3분을 온전히 나를 위해 써주셨어요.\n이 고요함이 오늘 하루를 부드럽게 감싸줄 거예요.'
            : '오늘 하루도 애쓰셨습니다.\n잠시 모든 짐을 내려놓고\n빛의 크기에 맞춰 숨을 쉬어보세요.'}
        </p>

        {/* 완료 시 닫기 버튼 */}
        {isDone && (
          <button
            onClick={handleClose}
            style={{
              marginTop: '32px', padding: '12px 32px',
              borderRadius: '24px', border: '1px solid rgba(140,220,140,0.4)',
              background: 'rgba(80,160,100,0.15)', color: 'rgba(180,240,180,0.8)',
              fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.5px',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(80,160,100,0.28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(80,160,100,0.15)'; }}
          >
            메인으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
