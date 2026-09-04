import React, { useState, useEffect } from 'react';
import { fetchGeminiMonthlyAnalytics } from './services/aiEngine';

export default function MonthlyAnalyticsView({ userName = '재희', onReset }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const mockStats = "평온 40%, 불안 30%, 회복탄력성 20% 상승 등 가상의 데이터";
        const result = await fetchGeminiMonthlyAnalytics(userName, mockStats);
        console.log('[DEBUG] MonthlyAnalytics Data:', result);
        // fetchGeminiMonthlyAnalytics in aiEngine returns either the whole JSON or extracts premium_monthly_analytics
        if (!ignore) {
          setData(result.premium_monthly_analytics || result);
        }
      } catch (err) {
        console.error("fetchGeminiMonthlyAnalytics error:", err);
        if (!ignore) {
          setData({
            monthly_theme_title: "불안의 이면에서 나만의 중심을 세워간 한 달",
            highlight_badges: ["📉 불안 지수 30% 감소", "📈 회복 탄력성 20% 증가"],
            growth_evidence_data: "이번 달 기록을 살펴보면 흥미로운 궤적이 관찰됩니다. 표면적으로는 '불안' 칩이 많았지만, 그 이면을 보면 타인의 평가가 아닌 **'나의 기준'을 지키기 위해 고군분투한 건강한 방어 과정**이었음을 알 수 있습니다.\n\n특히, 실전 대화 시나리오(I-Message)를 사용한 날, 대화 전 80점이었던 분노 지수가 대화 후 30점으로 안정되는 패턴을 보였습니다.",
            trigger_pattern_insight: "특정 감정의 반복 패턴을 분석해 본 결과, 주로 화요일과 목요일 늦은 오후에 피로감과 무기력이 상승하는 경향이 있습니다. **이는 주중의 심리적 에너지가 방전되는 지점**으로 해석할 수 있습니다.\n\n이 시간대에 유독 외부의 자극에 예민해지는 것은 자연스러운 현상입니다.",
            next_month_mission: "[마음 PT 미션] 다음 달에는 '불안' 감정이 느껴질 때마다 즉각적인 반응을 10분간 보류하고, 온전한 멈춤 호흡을 통해 감정 온도를 스스로 낮추는 훈련을 주 3회 실천해 보세요."
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadData();
    return () => { ignore = true; };
  }, [userName]);

  const renderBoldText = (text) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');
    return paragraphs.map((p, idx) => (
      <p key={idx} style={{ marginBottom: '16px', lineHeight: '1.7', color: '#5A5A5A', wordBreak: 'keep-all', fontSize: '0.95rem' }}>
        {p.split('**').map((part, i) => 
          i % 2 === 1 ? <strong key={i} style={{ color: '#E2725B', fontWeight: '800' }}>{part}</strong> : part
        )}
      </p>
    ));
  };

  return (
    <div style={{ backgroundColor: '#FDFBF7', minHeight: '100vh', padding: '40px 20px', fontFamily: 'inherit', color: '#333' }}>
      <button onClick={onReset} style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '1rem', color: '#A0A0A0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        홈으로 돌아가기
      </button>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.7rem', color: '#E2725B', letterSpacing: '2px', fontWeight: '800', backgroundColor: '#FDF2F0', padding: '6px 14px', borderRadius: '20px' }}>PREMIUM REPORT</span>
          <h2 style={{ fontSize: '1.5rem', color: '#3A2E2A', fontWeight: '800', marginTop: '20px', lineHeight: '1.4', wordBreak: 'keep-all', letterSpacing: '-0.5px' }}>
            {userName} 님의<br />월간 심리 성장 리포트
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #FDF2F0', borderTopColor: '#E2725B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '20px', color: '#A0A0A0', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px' }}>마음의 궤적을 엮어내는 중...</p>
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
            {/* Wave & Title */}
            <div style={{ background: 'linear-gradient(135deg, #FFF0ED 0%, #FDFBF7 100%)', borderRadius: '24px', padding: '36px 24px', boxShadow: '0 10px 30px rgba(226,114,91,0.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #E2725B, #F6C8A4)' }} />
              
              {/* Highlight Badges (Chip style) - Moved to very top */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {data.highlight_badges?.map((badge, idx) => (
                  <span key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #F0DFD8', color: '#B85C4A', padding: '8px 16px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    {badge}
                  </span>
                ))}
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#E2725B', fontWeight: '800', margin: '0', lineHeight: '1.5', wordBreak: 'keep-all', letterSpacing: '-0.3px' }}>
                "{data.monthly_theme_title}"
              </h3>
            </div>

            {/* Growth Evidence */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h4 style={{ fontSize: '1rem', color: '#3A2E2A', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🌱</span> 
                <span style={{ borderBottom: '2px solid #EAE0D8', paddingBottom: '2px' }}>성장 증명</span>
              </h4>
              {renderBoldText(data.growth_evidence_data)}
            </div>

            {/* Trigger Pattern Insight */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h4 style={{ fontSize: '1rem', color: '#3A2E2A', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🔍</span> 
                <span style={{ borderBottom: '2px solid #EAE0D8', paddingBottom: '2px' }}>트리거 패턴 분석</span>
              </h4>
              {renderBoldText(data.trigger_pattern_insight)}
            </div>

            {/* Next Month Mission */}
            <div style={{ background: 'linear-gradient(135deg, #F0F4EC 0%, #FDFBF7 100%)', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E8EEDF' }}>
              <h4 style={{ fontSize: '1rem', color: '#5B7A56', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>✉️</span> 
                <span style={{ borderBottom: '2px solid #D8E5D8', paddingBottom: '2px' }}>다음 달을 위한 처방전</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#748C70', margin: '0 0 20px 0', fontWeight: '600', letterSpacing: '-0.3px' }}>리포트를 읽고 끝이 아니에요. 매일의 마음 근육을 훈련하세요.</p>
              <p style={{ fontSize: '1rem', color: '#4A5A46', lineHeight: '1.7', wordBreak: 'keep-all', margin: 0, fontWeight: '700' }}>
                {data.next_month_mission}
              </p>
            </div>

          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#A0A0A0', fontWeight: '600' }}>데이터를 불러올 수 없습니다.</p>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
