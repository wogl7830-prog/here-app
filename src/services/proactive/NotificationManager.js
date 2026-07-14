/**
 * NotificationManager.js
 * 
 * [Architecture Stub]
 * 이 클래스는 EventScheduler가 파악한 임박 이벤트를 외부 채널(알림톡, 푸시 알림)로 
 * 발송하는 책임을 지는 모듈입니다.
 */

export class NotificationManager {
  constructor() {
    this.pushToken = null;
    this.kakaoAlimtalkEnabled = false;
  }

  initialize(userData) {
    this.pushToken = userData.pushToken || null;
    this.kakaoAlimtalkEnabled = userData.phoneNumber ? true : false;
    console.log('[NotificationManager] Initialized with push capability:', !!this.pushToken);
  }

  /**
   * 외부 API(카카오 비즈메시지 등)로 알림톡을 트리거하는 함수 (백엔드 연동 전 스터빙)
   */
  async triggerKakaoAlimtalk(userId, templateCode, templateData) {
    if (!this.kakaoAlimtalkEnabled) return;
    
    // TODO: 백엔드 노드 서버(server.js)의 알림 전송 API를 호출합니다.
    console.log(`[NotificationManager] Sending Alimtalk to ${userId}...`);
    console.log(`Template: ${templateCode}`, templateData);
    
    // 시뮬레이션 지연
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * 일정 임박 시(예: 10분 전) 앱 자체 로컬 푸시 또는 백그라운드 푸시 알림을 예약합니다.
   */
  scheduleLocalPush(eventData, targetDate) {
    const timeUntilEvent = targetDate.getTime() - Date.now();
    const triggerTime = timeUntilEvent - (10 * 60 * 1000); // 10분 전 알림

    if (triggerTime > 0) {
      console.log(`[NotificationManager] 푸시 예약됨: ${Math.round(triggerTime/60000)}분 뒤 발송 (${eventData.title})`);
      // 실제 환경에서는 Service Worker 또는 React Native Push Notification 모듈에 등록
    }
  }
}

export const notificationManager = new NotificationManager();
