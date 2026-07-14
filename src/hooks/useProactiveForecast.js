import { useState, useEffect } from 'react';
import { eventScheduler } from '../services/proactive/EventScheduler';

/**
 * useProactiveForecast
 * 
 * 컴포넌트 마운트 시 EventScheduler를 폴링/구독하여,
 * 현재 유저에게 임박한 중요 이벤트가 있다면 그에 맞는 예보 데이터(배너 UI 재정의용)를 반환합니다.
 */
export function useProactiveForecast(userId, userName, mbtiTrait) {
  const [activeForecast, setActiveForecast] = useState(null);

  useEffect(() => {
    // 1. 초기 로드 시 이벤트 분석
    const analyzeEvents = async () => {
      const event = await eventScheduler.analyzeUpcomingContext(userId);
      if (event) {
        // 이벤트 타입에 따라 UI 설정 반환
        if (event.type === 'work_meeting') {
          setActiveForecast({
            type: 'proactive_meeting',
            title: `곧 다가오는 회의,\n긴장을 풀고 준비해 볼까요?`,
            sub: `${mbtiTrait?.name || '당신'} 성향을 띠는 ${userName || '당신'} 님에게 꼭 맞는 ${event.title} 직전 마인드셋`,
            preview: '오늘은 완벽한 결론보다, 유연하게 의견을 조율하는 과정 자체에 집중해 보세요.',
            gradient: 'linear-gradient(135deg, #F3F1F8 0%, #E8E5F2 50%, #E2DEED 100%)',
            label: 'PROACTIVE FORECAST',
            color: '#6B5B95'
          });
        }
      }
    };
    
    analyzeEvents();

    // 2. 실시간 상태 변경 구독 (Webhook/Socket 대응)
    const unsubscribe = eventScheduler.subscribe((data) => {
      if (data.hasActiveForecast && data.eventData.type === 'work_meeting') {
        setActiveForecast({
            type: 'proactive_meeting',
            title: `곧 다가오는 회의,\n긴장을 풀고 준비해 볼까요?`,
            sub: `${mbtiTrait?.name || '당신'} 성향을 띠는 ${userName || '당신'} 님에게 꼭 맞는 ${data.eventData.title} 직전 마인드셋`,
            preview: '오늘은 완벽한 결론보다, 유연하게 의견을 조율하는 과정 자체에 집중해 보세요.',
            gradient: 'linear-gradient(135deg, #F3F1F8 0%, #E8E5F2 50%, #E2DEED 100%)',
            label: 'PROACTIVE FORECAST',
            color: '#6B5B95'
        });
      }
    });

    return () => unsubscribe();
  }, [userId, userName, mbtiTrait]);

  return activeForecast;
}
