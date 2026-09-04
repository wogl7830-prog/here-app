import React, { useState, useMemo } from 'react';

const TRACK_META = {
  '비밀의 방앗간': {
    label: '나의 방',
    color: '#B85C4A',
    bg: '#FBF1EE',
    border: '#E8C4BC',
    dot: '#E2725B',
  },
  '다정한 식탁': {
    label: '가족의 방',
    color: '#7A5C48',
    bg: '#FAF5F0',
    border: '#D9C9BC',
    dot: '#C4895A',
  },
  '나를 지키는 울타리': {
    label: '관계의 방',
    color: '#2E5B7A',
    bg: '#EEF4F9',
    border: '#B8CEDE',
    dot: '#4A8BAD',
  },
  '모닝 확언': {
    label: '모닝 확언',
    color: '#B38B22',
    bg: '#FFF7D6',
    border: '#E8D499',
    dot: '#D6A629',
  },
};

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: '모닝 확언', label: '모닝 확언' },
  { id: '비밀의 방앗간', label: '나의 방' },
  { id: '다정한 식탁', label: '가족의 방' },
  { id: '나를 지키는 울타리', label: '관계의 방' },
];

export default function MindJournal({ emotionDB = [], onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const sorted = useMemo(() => {
    const safe = Array.isArray(emotionDB) ? emotionDB : [];
    return [...safe].sort((a, b) => {
      const ta = a.timestamp || 0;
      const tb = b.timestamp || 0;
      return tb - ta;
    });
  }, [emotionDB]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return sorted;
    return sorted.filter(r => r.trackType === activeFilter);
  }, [sorted, activeFilter]);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#FDFBF7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '0 auto',
      zIndex: 10200,
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '20px 20px 16px 20px',
        borderBottom: '1px solid #F0EDE8', backgroundColor: '#FDFBF7',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 8px 8px 0', marginRight: '12px', display: 'flex' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3A2E2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#3A2E2A', fontWeight: '800', letterSpacing: '-0.5px' }}>
            마음 저널
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#A0958C' }}>
            {sorted.length}개의 마음 조각이 담겨있어요
          </p>
        </div>
      </div>

      {/* 필터 칩 */}
      <div style={{
        display: 'flex', gap: '8px', padding: '14px 20px',
        overflowX: 'auto', flexShrink: 0,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {FILTERS.map(f => {
          const isActive = activeFilter === f.id;
          const meta = f.id !== 'all' ? TRACK_META[f.id] : null;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: '20px',
                border: isActive
                  ? `1.5px solid ${meta?.dot || '#E2725B'}`
                  : '1.5px solid #E8E3DC',
                backgroundColor: isActive
                  ? (meta?.bg || '#FDF2F0')
                  : '#FFFFFF',
                color: isActive
                  ? (meta?.color || '#B85C4A')
                  : '#8A8078',
                fontSize: '0.82rem',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* 기록 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 80px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '40vh', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🌿</div>
            <p style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 8px 0', color: '#8A7A72' }}>
              아직 수집된 마음 조각이 없어요
            </p>
            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: '1.6', color: '#B8ABA2' }}>
              분석 결과 화면에서 마음에 닿은<br />문장을 클릭해서 담아보세요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
            {filtered.map((record, idx) => {
              const meta = TRACK_META[record.trackType] || TRACK_META['비밀의 방앗간'];
              const dateStr = record.timestamp
                ? new Date(record.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                : record.date || '';
              const prevRecord = filtered[idx - 1];
              const prevDateKey = prevRecord
                ? (prevRecord.timestamp
                    ? new Date(prevRecord.timestamp).toLocaleDateString('ko-KR')
                    : prevRecord.date)
                : null;
              const curDateKey = record.timestamp
                ? new Date(record.timestamp).toLocaleDateString('ko-KR')
                : record.date;
              const showDateSep = idx === 0 || prevDateKey !== curDateKey;

              return (
                <React.Fragment key={record.id || idx}>
                  {showDateSep && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      margin: idx === 0 ? '0 0 4px 0' : '8px 0 4px 0',
                    }}>
                      <span style={{ fontSize: '0.72rem', color: '#B8ABA2', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#EDE8E1' }} />
                    </div>
                  )}

                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${meta.border}`,
                    borderRadius: '16px',
                    padding: '16px 18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: '4px', backgroundColor: meta.dot,
                      borderRadius: '16px 0 0 16px',
                    }} />
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          backgroundColor: meta.dot, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: meta.color, letterSpacing: '1px' }}>
                          {meta.label}
                        </span>
                        {record.ilgan && (
                          <span style={{ fontSize: '0.65rem', color: '#B8ABA2', fontWeight: '600', marginLeft: '4px' }}>
                            · {record.ilgan}일간
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: 0, fontSize: '0.95rem', color: '#3A2E2A',
                        lineHeight: '1.7', wordBreak: 'keep-all',
                        fontFamily: '"Nanum Myeongjo", serif',
                      }}>
                        <span style={{ color: meta.dot, fontSize: '1.1rem', marginRight: '4px', opacity: 0.4 }}>"</span>
                        {record.text}
                        <span style={{ color: meta.dot, fontSize: '1.1rem', marginLeft: '4px', opacity: 0.4 }}>"</span>
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
