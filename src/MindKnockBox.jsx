import React, { useState, useEffect } from 'react';

const BODY_REGIONS = [
  {
    id: 'head', label: '머리', color: '#D97B6A', bg: '#FDF2F0', border: '#F0C4BC',
    desc: '생각이 멈추지 않거나 머리가 뜨거울 때',
    chips: ['머리에 열이 훅 오름', '안개가 낀 듯 멍함', '지끈지끈 두통이 옴'],
  },
  {
    id: 'shoulder', label: '어깨·목', color: '#A0836B', bg: '#FAF5F0', border: '#D9C9BC',
    desc: '무언가를 짊어지고 있는 듯한 느낌',
    chips: ['무거운 짐을 진 듯 뻐근함', '어깨가 귀까지 올라가 있음', '목이 뻣뻣하게 굳음'],
  },
  {
    id: 'chest', label: '가슴', color: '#C17A6B', bg: '#FDF2F0', border: '#E8C4BC',
    desc: '감정이 올라오거나 심장이 두근거릴 때',
    chips: ['무거운 돌덩이가 얹힌 듯함', '심장이 쿵쾅거림', '숨이 잘 안 쉬어짐'],
  },
  {
    id: 'body', label: '전신', color: '#7A8C9B', bg: '#EEF4F9', border: '#B8CEDE',
    desc: '온몸이 무겁고 기운이 빠질 때',
    chips: ['물먹은 솜처럼 무거움', '손가락 까딱할 힘이 없음', '기운이 없이 축 늘어짐'],
  },
];

const EMOTION_MAP = {
  '머리에 열이 훅 오름': [
    { id: 'e_anxiety', text: '잘 해내지 못할까 봐 두려운 마음', sub: '긴장 / 불안', need: '잠깐의 숨 고르기' },
    { id: 'e_unfair', text: '억울하게 오해받은 것 같은 마음', sub: '분노 / 서운함', need: '내 진심을 알아주는 한마디' },
  ],
  '안개가 낀 듯 멍함': [
    { id: 'e_overload', text: '더 이상 생각하기 벅찬 마음', sub: '과부하 / 소진', need: '아무것도 하지 않는 시간' },
    { id: 'e_lost', text: '어디로 가야 할지 모르는 막막함', sub: '혼란 / 방향 상실', need: '잠깐의 멈춤과 안심' },
  ],
  '지끈지끈 두통이 옴': [
    { id: 'e_anxiety', text: '잘 해내지 못할까 봐 두려운 마음', sub: '긴장 / 불안', need: '잠깐의 숨 고르기' },
    { id: 'e_guilt', text: '모든 것이 내 탓인 것 같은 마음', sub: '자책 / 죄책감', need: '나를 향한 다정한 말 한마디' },
  ],
  '무거운 짐을 진 듯 뻐근함': [
    { id: 'e_alone', text: '혼자 너무 많이 짊어진 것 같은 마음', sub: '고립 / 고독', need: '누군가 함께 나눠지는 느낌' },
    { id: 'e_worthless', text: '내 노력을 알아주지 않아 서운한 마음', sub: '무가치함 / 외로움', need: '진심 어린 공감 한마디' },
  ],
  '어깨가 귀까지 올라가 있음': [
    { id: 'e_anxiety', text: '잘 해내지 못할까 봐 두려운 마음', sub: '긴장 / 불안', need: '잠깐의 숨 고르기' },
    { id: 'e_suppress', text: '억눌린 감정이 터질 것 같은 마음', sub: '억압 / 폭발 직전', need: '안전하게 감정을 꺼낼 공간' },
  ],
  '목이 뻣뻣하게 굳음': [
    { id: 'e_alone', text: '혼자 너무 많이 짊어진 것 같은 마음', sub: '고립 / 고독', need: '누군가 함께 나눠지는 느낌' },
    { id: 'e_overload', text: '더 이상 감당하기 벅찬 마음', sub: '과부하 / 소진', need: '아무것도 하지 않는 시간' },
  ],
  '무거운 돌덩이가 얹힌 듯함': [
    { id: 'e_worthless', text: '내 노력을 알아주지 않아 서운한 마음', sub: '무가치함 / 외로움', need: '진심 어린 공감 한마디' },
    { id: 'e_overload', text: '더 이상 감당하기 벅찬 마음', sub: '과부하 / 소진', need: '아무것도 하지 않는 시간' },
  ],
  '심장이 쿵쾅거림': [
    { id: 'e_anxiety', text: '잘 해내지 못할까 봐 두려운 마음', sub: '긴장 / 불안', need: '잠깐의 숨 고르기' },
    { id: 'e_attach', text: '상대가 나를 떠날까 봐 불안한 마음', sub: '애착 불안 / 두려움', need: '당신 곁에 있다는 확신' },
  ],
  '숨이 잘 안 쉬어짐': [
    { id: 'e_suppress', text: '억눌린 감정이 터질 것 같은 마음', sub: '억압 / 폭발 직전', need: '안전하게 감정을 꺼낼 공간' },
    { id: 'e_overload', text: '더 이상 감당하기 벅찬 마음', sub: '과부하 / 소진', need: '아무것도 하지 않는 시간' },
  ],
  '물먹은 솜처럼 무거움': [
    { id: 'e_burnout', text: '아무것도 하고 싶지 않을 만큼 지친 마음', sub: '번아웃 / 무기력', need: '충분히 쉬어도 된다는 허락' },
    { id: 'e_alone', text: '혼자 너무 많이 짊어진 것 같은 마음', sub: '고립 / 고독', need: '누군가 함께 나눠지는 느낌' },
  ],
  '손가락 까딱할 힘이 없음': [
    { id: 'e_burnout', text: '아무것도 하고 싶지 않을 만큼 지친 마음', sub: '번아웃 / 무기력', need: '충분히 쉬어도 된다는 허락' },
    { id: 'e_overload', text: '더 이상 감당하기 벅찬 마음', sub: '과부하 / 소진', need: '아무것도 하지 않는 시간' },
  ],
  '기운이 없이 축 늘어짐': [
    { id: 'e_burnout', text: '아무것도 하고 싶지 않을 만큼 지친 마음', sub: '번아웃 / 무기력', need: '충분히 쉬어도 된다는 허락' },
    { id: 'e_worthless', text: '내 노력을 알아주지 않아 서운한 마음', sub: '무가치함 / 외로움', need: '진심 어린 공감 한마디' },
  ],
};

const SCRIPTS = {
  e_anxiety: '나 지금 화가 난 게 아니라, 사실은 [ 잘 해낼 수 있을지 걱정되는 마음 ] 때문에 예민했나 봐.',
  e_unfair: '나 지금 화난 게 아니라, 사실은 [ 내 진심이 오해받은 것 같아 속상한 마음 ]이어서 그랬나 봐.',
  e_overload: '나 지금 쉬어야 할 것 같아. 사실은 [ 더 이상 감당하기 벅찬 마음 ]이 가득 차 있었나 봐.',
  e_lost: '나 지금 막막한 거야. 사실은 [ 어디로 가야 할지 모르는 마음 ]이어서 멍하게 있었나 봐.',
  e_guilt: '나 지금 나를 너무 탓하고 있는 것 같아. 사실은 [ 잘 해내고 싶은 마음 ]이 너무 커서 그랬나 봐.',
  e_worthless: '나 지금 외로웠던 것 같아. 사실은 [ 내가 애쓰고 있다는 걸 알아줬으면 하는 마음 ]이어서 그랬나 봐.',
  e_attach: '나 지금 불안한 거야. 사실은 [ 당신이 내 곁에 있어줬으면 하는 마음 ]이 간절했나 봐.',
  e_suppress: '나 솔직히 말하면, [ 안전하게 감정을 꺼낼 공간 ]이 필요했나 봐. 터뜨리려던 게 아니야.',
  e_alone: '나 지금 혼자인 것 같아서 힘들었어. 사실은 [ 누군가 함께 짐을 나눠줬으면 하는 마음 ]이었나 봐.',
  e_burnout: '나 지금 쉬어도 된다는 말이 필요했나 봐. 사실은 [ 충분히 지쳐있는 마음 ]인데 억지로 버티고 있었어.',
};

export default function MindKnockBox({ onClose, onToast }) {
  const [ks, setKs] = useState({ step: 1, bodyPart: null, sensation: null, emotion: null });
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const advance = (updates) => {
    setFading(true);
    setTimeout(() => { setKs(p => ({ ...p, ...updates })); setFading(false); }, 300);
  };

  const handleClose = () => { setVisible(false); setTimeout(onClose, 350); };

  const currentRegion = BODY_REGIONS.find(r => r.id === ks.bodyPart);
  const emotions = ks.sensation ? (EMOTION_MAP[ks.sensation] || []) : [];
  const selectedEmotion = emotions.find(e => e.id === ks.emotion);
  const script = ks.emotion ? SCRIPTS[ks.emotion] : null;

  const stepTitles = ['내 몸이 보내는 신호', '감정워치 번역', '정제된 언어로 노크하기'];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backgroundColor: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.35s ease',
      }}
    >
      <style>{`
        @keyframes chipPop {
          0% { opacity: 0; transform: scale(0.88) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .knock-chip { animation: chipPop 0.25s ease forwards; }
        .knock-region:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.09) !important; }
        .knock-emotion:hover { border-color: #D97B6A !important; background: #FDF2F0 !important; }
      `}</style>

      {/* Panel */}
      <div style={{
        width: '100%', maxWidth: '480px',
        backgroundColor: '#FDFBF7',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
        maxHeight: '88vh', overflowY: 'auto',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#E0DDD8' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#C0A898', letterSpacing: '2.5px', fontWeight: '700', marginBottom: '4px' }}>
              MIND KNOCK-BOX · STEP {ks.step} / 3
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#3A2E2A', letterSpacing: '-0.3px' }}>
              {stepTitles[ks.step - 1]}
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#C0A898' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '14px 24px 0', height: '3px', backgroundColor: '#F0EDE8', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(ks.step / 3) * 100}%`, backgroundColor: '#D97B6A', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>

        {/* Content */}
        <div style={{ padding: '24px 24px 44px', opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease' }}>

          {/* ── STEP 1: Body Map ── */}
          {ks.step === 1 && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#8A7A72', lineHeight: '1.65', margin: '0 0 22px 0', wordBreak: 'keep-all' }}>
                지금 가장 불편하게 느껴지는 부위를 눌러보세요.
              </p>

              {/* Body silhouette + region buttons */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                {/* SVG silhouette */}
                <svg width="72" height="180" viewBox="0 0 72 180" fill="none" style={{ flexShrink: 0, marginTop: '4px' }}>
                  {/* Head */}
                  <circle cx="36" cy="18" r="15" fill={ks.bodyPart === 'head' ? '#F0C4BC' : '#EDE8E2'} stroke={ks.bodyPart === 'head' ? '#D97B6A' : '#D9D4CE'} strokeWidth="1.5" />
                  {/* Neck */}
                  <rect x="30" y="32" width="12" height="12" rx="4" fill={ks.bodyPart === 'shoulder' ? '#D9C9BC' : '#EDE8E2'} stroke={ks.bodyPart === 'shoulder' ? '#A0836B' : '#D9D4CE'} strokeWidth="1.5" />
                  {/* Shoulders */}
                  <path d="M10 55 Q10 42 36 44 Q62 42 62 55 L58 90 L14 90 Z" fill={ks.bodyPart === 'shoulder' ? '#D9C9BC' : '#EDE8E2'} stroke={ks.bodyPart === 'shoulder' ? '#A0836B' : '#D9D4CE'} strokeWidth="1.5" />
                  {/* Chest */}
                  <rect x="17" y="90" width="38" height="38" rx="4" fill={ks.bodyPart === 'chest' ? '#F0C4BC' : '#EDE8E2'} stroke={ks.bodyPart === 'chest' ? '#C17A6B' : '#D9D4CE'} strokeWidth="1.5" />
                  {/* Body */}
                  <rect x="17" y="130" width="38" height="44" rx="4" fill={ks.bodyPart === 'body' ? '#B8CEDE' : '#EDE8E2'} stroke={ks.bodyPart === 'body' ? '#7A8C9B' : '#D9D4CE'} strokeWidth="1.5" />
                  {/* Heart dot */}
                  <circle cx="36" cy="110" r="3" fill={ks.bodyPart === 'chest' ? '#C17A6B' : '#C0B8B0'} opacity="0.7" />
                </svg>

                {/* Region buttons */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {BODY_REGIONS.map(r => (
                    <button
                      key={r.id}
                      className="knock-region"
                      onClick={() => advance({ bodyPart: r.id, sensation: null })}
                      style={{
                        textAlign: 'left', background: ks.bodyPart === r.id ? r.bg : '#F8F5F0',
                        border: `1.5px solid ${ks.bodyPart === r.id ? r.border : '#E8E2DC'}`,
                        borderRadius: '14px', padding: '12px 14px', cursor: 'pointer',
                        transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: ks.bodyPart === r.id ? r.color : '#5A4A42' }}>{r.label}</div>
                      <div style={{ fontSize: '0.76rem', color: '#9A8A82', marginTop: '2px', lineHeight: '1.4' }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensation chips */}
              {currentRegion && (
                <div style={{ marginTop: '22px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#B0A098', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '12px' }}>
                    어떤 감각인가요?
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentRegion.chips.map((chip, i) => (
                      <button
                        key={chip}
                        className="knock-chip"
                        onClick={() => advance({ sensation: chip, step: 2 })}
                        style={{
                          animationDelay: `${i * 60}ms`,
                          padding: '9px 16px', borderRadius: '20px', border: `1.5px solid ${currentRegion.border}`,
                          backgroundColor: ks.sensation === chip ? currentRegion.bg : '#FFFFFF',
                          color: currentRegion.color, fontSize: '0.85rem', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.18s ease',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Emotion Translator ── */}
          {ks.step === 2 && (
            <div>
              {/* Selected sensation badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0EDE8', borderRadius: '20px', padding: '6px 14px', marginBottom: '20px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: currentRegion?.color || '#D97B6A' }} />
                <span style={{ fontSize: '0.8rem', color: '#6A5A52', fontWeight: '600' }}>{ks.sensation}</span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#8A7A72', lineHeight: '1.7', margin: '0 0 20px 0', wordBreak: 'keep-all' }}>
                이런 감각은 표면적인 짜증이나 분노 아래,
                보통 이런 마음이 숨어있을 때 나타나요.<br />
                <b style={{ color: '#5A4A42' }}>지금 어떤 마음에 가장 가깝나요?</b>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {emotions.map(em => (
                  <button
                    key={em.id}
                    className="knock-emotion"
                    onClick={() => advance({ emotion: em.id, step: 3 })}
                    style={{
                      textAlign: 'left', padding: '16px 18px', borderRadius: '16px',
                      border: `1.5px solid ${ks.emotion === em.id ? '#D97B6A' : '#E8E2DC'}`,
                      backgroundColor: ks.emotion === em.id ? '#FDF2F0' : '#FFFFFF',
                      cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#3A2E2A', marginBottom: '4px', wordBreak: 'keep-all', lineHeight: '1.4' }}>{em.text}</div>
                    <div style={{ fontSize: '0.75rem', color: '#D97B6A', fontWeight: '600', letterSpacing: '0.5px' }}>{em.sub}</div>
                    <div style={{ fontSize: '0.75rem', color: '#B0A098', marginTop: '4px' }}>필요한 것: {em.need}</div>
                  </button>
                ))}
              </div>

              <button onClick={() => advance({ step: 1 })} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#C0A898', fontSize: '0.8rem', cursor: 'pointer', padding: '4px' }}>
                ← 다시 고르기
              </button>
            </div>
          )}

          {/* ── STEP 3: I-Message Script ── */}
          {ks.step === 3 && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#8A7A72', lineHeight: '1.65', margin: '0 0 22px 0', wordBreak: 'keep-all' }}>
                선택한 감정을 바탕으로, 상대방이 상처받지 않고
                나를 이해할 수 있는 문장을 완성했어요.
              </p>

              {/* Emotion badge */}
              {selectedEmotion && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FDF2F0', border: '1px solid #F0C4BC', borderRadius: '20px', padding: '6px 14px', marginBottom: '20px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97B6A' }} />
                  <span style={{ fontSize: '0.8rem', color: '#D97B6A', fontWeight: '700' }}>{selectedEmotion.sub}</span>
                </div>
              )}

              {/* I-Message card */}
              <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '18px',
                border: '1.5px solid #F0EDE8',
                padding: '24px 22px', marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '14px', left: '16px', fontSize: '2.4rem', color: '#E2725B', opacity: 0.08, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
                <p style={{
                  fontSize: '1.05rem', color: '#3A2E2A', lineHeight: '1.85',
                  margin: 0, fontFamily: '"Nanum Myeongjo", serif',
                  wordBreak: 'keep-all', position: 'relative', zIndex: 1,
                  padding: '8px 0 0 10px',
                }}>
                  {script}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => {
                  onToast('누군가 조심스럽게 마음을 노크했어요. 🚪');
                  setTimeout(handleClose, 300);
                }}
                style={{
                  width: '100%', padding: '17px', borderRadius: '16px', border: 'none',
                  backgroundColor: '#2C3E50', color: '#FFFFFF',
                  fontSize: '0.95rem', fontWeight: '700', letterSpacing: '0.5px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(44,62,80,0.22)',
                  marginBottom: '12px',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3D5166'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2C3E50'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                이 마음으로 노크하기
              </button>

              <button onClick={() => advance({ step: 2 })} style={{ width: '100%', background: 'none', border: 'none', color: '#C0A898', fontSize: '0.8rem', cursor: 'pointer', padding: '4px' }}>
                ← 감정 다시 고르기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
