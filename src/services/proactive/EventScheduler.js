/**
 * EventScheduler.js
 * 
 * [Architecture Stub]
 * 이 클래스는 유저의 다가오는 외부 캘린더 일정(회의, 미팅, 육아 등)을 감지하고,
 * 이벤트 가중치(긴장도/중요도) 필터링 엔진을 통해 예보를 띄울지 결정하는 핵심 비즈니스 로직 뼈대입니다.
 */

export class EventScheduler {
  constructor() {
    this.events = [];
    this.subscribers = [];
  }

  // 외부 캘린더 데이터를 패치해온다고 가정하는 헬퍼 메서드
  async fetchUpcomingEvents(userId) {
    // TODO: 백엔드 API 연동 후 실제 일정 데이터를 가져옴
    // 현재는 시뮬레이션을 위해 하드코딩된 '중요 회의' 데이터를 반환합니다.
    return []; // 임시로 기본 배너 확인을 위해 일정을 비워둡니다.
    /*
    return [
      {
        id: 'evt-001',
        title: 'Q3 전략 발표 및 임원진 회의',
        type: 'work_meeting',
        startTime: new Date(Date.now() + 1000 * 60 * 30), // 30분 뒤
        tensionWeight: 90, // 긴장도 (0~100)
        importance: 'high'
      }
    ];
    */
  }

  // ✨ 이벤트 가중치 필터링 엔진
  // 모든 일정을 예보하는 것이 아니라, 유저에게 심리적 부담/긴장을 유발하는 이벤트를 선별합니다.
  filterHighTensionEvents(events) {
    // 마이페이지 환경 설정에서 저장된 긴장도 임계값 불러오기 (기본값 70)
    const savedThreshold = localStorage.getItem('here_tension_threshold');
    const tensionThreshold = savedThreshold !== null ? Number(savedThreshold) : 70;

    return events.filter(event => {
      // 규칙 1: 중요도가 높고 긴장도가 사용자 설정 임계값 이상인 이벤트
      if (event.importance === 'high' && event.tensionWeight >= tensionThreshold) return true;
      // 규칙 2: 특정 키워드(발표, 평가, 면접 등)가 포함된 이벤트
      if (['발표', '평가', '면접'].some(keyword => event.title.includes(keyword))) return true;
      return false;
    });
  }

  // 앱 마운트 시 주기적으로 이벤트를 폴링(Polling)하거나 분석하는 진입점
  async analyzeUpcomingContext(userId) {
    const rawEvents = await this.fetchUpcomingEvents(userId);
    const criticalEvents = this.filterHighTensionEvents(rawEvents);

    if (criticalEvents.length > 0) {
      const targetEvent = criticalEvents[0]; // 가장 시급한 이벤트
      
      // 상태 변경 알림
      this.notifySubscribers({
        hasActiveForecast: true,
        type: 'meeting_prep', // 회의 준비 템플릿
        eventData: targetEvent
      });
      return targetEvent;
    }

    return null;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(data) {
    this.subscribers.forEach(cb => cb(data));
  }
}

// 싱글톤 인스턴스 반환
export const eventScheduler = new EventScheduler();
