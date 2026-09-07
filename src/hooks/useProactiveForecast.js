import { useState, useEffect } from 'react';
import { detectImminentHighTensionEvent } from '../services/proactive/EventScheduler';
import { fetchGeminiProactivePreview } from '../services/aiEngine';

/**
 * useProactiveForecast
 * 
 * 로그인된 유저 세션(userSession)이 유효할 때만 EventScheduler의 고긴장도 일정을 감지하여,
 * 임박한 일정에 부합하는 선제적 행동 예보(Proactive Forecast) 배너 UI 데이터를 반환합니다.
 */
export const useProactiveForecast = (userSession, userName, userMbti) => {
  const [forecast, setForecast] = useState(null);

  const updateForecast = async () => {
    if (!userSession) {
      setForecast(null);
      return;
    }
    const imminentEvent = detectImminentHighTensionEvent();
    if (!imminentEvent) {
      setForecast(null);
      return;
    }

    // 일정 맞춤형 페르소나 및 배너 데이터 생성
    const isWork = imminentEvent.category === 'work' || (imminentEvent.title && imminentEvent.title.match(/회의|발표|업무|팀장/));

    let previewText = isWork
      ? "회의와 성과 압박 속에서 나만의 단단한 경계를 지킬 수 있도록 마인드셋을 설계해 두었어요."
      : "가족과의 관계 속에서 온전한 나로 서 있으면서도 유연하게 흐를 수 있는 온기를 건넬게요.";

    try {
      if (typeof fetchGeminiProactivePreview === 'function') {
        const cacheKey = `here_proactive_preview_${imminentEvent.title}_${new Date().toDateString()}`;
        const cachedPreview = localStorage.getItem(cacheKey);
        
        if (cachedPreview) {
          previewText = cachedPreview;
        } else {
          const aiPreview = await fetchGeminiProactivePreview(imminentEvent.title, imminentEvent.category || (isWork ? 'work_meeting' : 'family'));
          if (aiPreview) {
            previewText = aiPreview;
            localStorage.setItem(cacheKey, aiPreview);
          }
        }
      }
    } catch (e) {
      // fallback
    }

    setForecast(prev => {
      // 이미 같은 이벤트에 대해 같은 텍스트가 세팅되어 있다면 업데이트하지 않음 (리렌더링 방지)
      if (prev && prev.eventData?.title === imminentEvent.title && prev.preview === previewText) {
        return prev;
      }
      return {
        theme: 'light',
        label: 'PROACTIVE FORECAST',
        title: `${userName || '당신'} 님, 곧 긴장되는 일정이 예정되어 있어요 🛡️`,
        sub: `[${imminentEvent.title}] 시작 전, 마음의 방패를 씌워드릴게요.`,
        preview: previewText,
        gradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #FAE8FF 100%)', // 우아한 보랏빛 스카이 라인
        eventData: imminentEvent
      };
    });
  };

  useEffect(() => {
    updateForecast();
    // 캘린더 상태 변경이나 탭 전환 시 동기화되도록 풀링 가동
    const interval = setInterval(updateForecast, 2500);
    return () => clearInterval(interval);
  }, [userSession, userName, userMbti]);

  return forecast;
};
