/**
 * EventScheduler.js
 * 
 * 유저 세션 기반 구글 캘린더 API 연동 및 긴장도(Tension Weight >= 70) 가중치 필터링 엔진.
 */

// 유저의 성향별 스트레스 유발 고유 스케줄 키워드 맵
const STRESS_KEYWORDS_BY_MBTI = {
  // INTJ: 비효율적인 모임, 성과 평가, 통제하기 어려운 변수가 있는 일정에 취약
  INTJ: { keywords: ['회식', '동창회', '중간점검', '임원진 보고', '자유 발표', '모임'], weightBoost: 25 },
  // ENFP: 구조화되고 타이트한 일상 관리, 세무/보고 마감, 반복 업무에 갇히는 상황에 취약
  ENFP: { keywords: ['세무 신고', '마감', '보고서 작성', '정기 회의', '반복 검수', '정산'], weightBoost: 20 },
  // ISFJ: 관계의 갈등 우려 상황, 대면 평가, 갑작스러운 주목을 받는 자리에 취약
  ISFJ: { keywords: ['평가 면담', '발표', '조율 회의', '대표 연설', '갈등 중재'], weightBoost: 22 }
};

export const filterUpcomingEvents = (events, userMbti = 'INTJ') => {
  if (!events || events.length === 0) return [];

  const mbtiRule = STRESS_KEYWORDS_BY_MBTI[userMbti] || { keywords: [], weightBoost: 0 };

  return events.map(event => {
    let finalWeight = event.tensionWeight || 50;

    // 1. 성향 특화 스트레스 키워드 매칭 시 가중치 부스트 적용
    const matchesMbtiStress = event.title && mbtiRule.keywords.some(kw => event.title.includes(kw));
    if (matchesMbtiStress) {
      finalWeight += mbtiRule.weightBoost;
    }

    // 2. 범용 고긴장도 키워드 매칭
    if (event.title && /(발표|면접|평가|회의|임원)/i.test(event.title)) {
      finalWeight += 15;
    }

    return {
      ...event,
      tensionWeight: Math.min(100, finalWeight) // 최대 가중치 100 제한
    };
  }).filter(event => event.tensionWeight >= 70); // 가중치 70 이상인 것만 선제적 경보 필터링
};

export class EventScheduler {
  constructor() {
    this.events = [];
    this.subscribers = [];
  }

  // ✨ 긴장도(Tension Weight 0~100) 산출 헬퍼
  calculateTensionWeight(title) {
    if (!title) return 30;
    const highTensionKeywords = ['발표', '면접', '평가', '회의', '미팅', '발표회', '면담', '보고', '데모', 'interview', 'presentation', 'meeting', 'deadline'];
    const mediumTensionKeywords = ['점검', '조율', '상담', '식사', '약속', '일정'];

    if (highTensionKeywords.some(kw => title.includes(kw))) {
      return 85; // Tension Weight >= 70
    }
    if (mediumTensionKeywords.some(kw => title.includes(kw))) {
      return 50;
    }
    return 30;
  }

  calculateImportance(title) {
    if (!title) return 'normal';
    const highKeywords = ['발표', '면접', '평가', '회의', '데모', 'interview', 'presentation'];
    return highKeywords.some(kw => title.includes(kw)) ? 'high' : 'normal';
  }

  // 로그인된 유저 세션의 캘린더 데이터를 불러오는 인터페이스
  async fetchUpcomingEvents(userSession) {
    if (!userSession) return [];

    // 1. 유저 세션에 구글 액세스 토큰이 활성화되어 있는 경우 실제 구글 캘린더 API 연동
    const token = userSession.accessToken || userSession.googleAccessToken || (userSession.stsTokenManager && userSession.stsTokenManager.accessToken);
    if (token) {
      try {
        const timeMin = new Date().toISOString();
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            return data.items.map(item => {
              const summary = item.summary || '일정';
              return {
                id: item.id,
                title: summary,
                type: 'work_meeting',
                startTime: new Date(item.start?.dateTime || item.start?.date),
                tensionWeight: this.calculateTensionWeight(summary),
                importance: this.calculateImportance(summary)
              };
            });
          }
        }
      } catch (err) {
        console.warn('[EventScheduler] Google Calendar API fetch bypass, using session event:', err);
      }
    }

    // 2. 로그인 유저용 실시간 테스트 데모 일정 (긴장도 85, Tension Weight 70 이상 검증용)
    return [
      {
        id: 'evt-001',
        title: 'Q3 핵심 전략 발표 및 프로젝트 회의',
        type: 'work_meeting',
        startTime: new Date(Date.now() + 1000 * 60 * 30),
        tensionWeight: 85,
        importance: 'high'
      }
    ];
  }

  // ✨ 이벤트 가중치 필터링 엔진 (Tension Weight 70 이상 및 긴장도 키워드 선별)
  filterHighTensionEvents(events, userMbti = 'INTJ') {
    const mbtiFiltered = filterUpcomingEvents(events, userMbti);
    if (mbtiFiltered.length > 0) return mbtiFiltered;

    const savedThreshold = localStorage.getItem('here_tension_threshold');
    const tensionThreshold = savedThreshold !== null ? Number(savedThreshold) : 70;

    return events.filter(event => {
      const weight = event.tensionWeight !== undefined ? event.tensionWeight : this.calculateTensionWeight(event.title);
      if (weight >= tensionThreshold) return true;
      if (['발표', '평가', '면접', '회의', '데모', 'interview', 'presentation'].some(keyword => event.title && event.title.includes(keyword))) return true;
      return false;
    });
  }

  // 앱 마운트 시 유저 세션을 받아 이벤트를 분석하는 진입점
  async analyzeUpcomingContext(userSession, userMbti = 'INTJ') {
    if (!userSession) return null;

    const rawEvents = await this.fetchUpcomingEvents(userSession);
    const criticalEvents = this.filterHighTensionEvents(rawEvents, userMbti);

    if (criticalEvents.length > 0) {
      const targetEvent = criticalEvents[0];
      
      this.notifySubscribers({
        hasActiveForecast: true,
        type: 'meeting_prep',
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

export const eventScheduler = new EventScheduler();

// ── 가상 일정 시뮬레이션 및 필터링 엔진 (Proactive Forecast QA) ──
const DEFAULT_MOCK_EVENTS = [
  { id: 'ev-1', title: 'Q3 전략 마케팅 발표 및 임원진 회의', time: '14:00', tensionWeight: 85, category: 'work' },
  { id: 'ev-2', title: '시부모님과의 주말 저녁 식사 약속', time: '19:00', tensionWeight: 75, category: 'family' },
  { id: 'ev-3', title: '동네 학부모 모임 커피 타임', time: '11:00', tensionWeight: 45, category: 'social' } // 70 미만이라 예보 생략됨
];

export const getCalendarEvents = () => {
  const saved = localStorage.getItem('here_mock_events');
  if (!saved) {
    localStorage.setItem('here_mock_events', JSON.stringify(DEFAULT_MOCK_EVENTS));
    return DEFAULT_MOCK_EVENTS;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return DEFAULT_MOCK_EVENTS;
  }
};

export const saveCalendarEvent = (newEvent) => {
  const current = getCalendarEvents();
  const updated = [...current, { ...newEvent, id: `ev-${Date.now()}` }];
  localStorage.setItem('here_mock_events', JSON.stringify(updated));
  return updated;
};

export const deleteCalendarEvent = (id) => {
  const current = getCalendarEvents();
  const updated = current.filter(ev => ev.id !== id);
  localStorage.setItem('here_mock_events', JSON.stringify(updated));
  return updated;
};

// 70점 이상의 임박한 고긴장도 일정을 솎아내는 필터링 엔진
export const detectImminentHighTensionEvent = () => {
  const isConnected = localStorage.getItem('here_calendar_connected') === 'true';
  if (!isConnected) return null;

  const events = getCalendarEvents();

  // 긴장도 70 이상인 일정 중 가장 높은 일정을 감지
  const highTensionEvents = events
    .filter(ev => ev.tensionWeight >= 70)
    .sort((a, b) => b.tensionWeight - a.tensionWeight);

  return highTensionEvents.length > 0 ? highTensionEvents[0] : null;
};


