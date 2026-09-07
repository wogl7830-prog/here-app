/**
 * H.E.R.e Firebase SDK 초기화 및 인증 헬퍼
 *
 * ▶ 인증 흐름:
 *   1. 앱 첫 실행 → signInAnonymously() → 익명 UID 발급 (데이터 연속성 보장)
 *   2. 사용자가 계정 연결 선택 시 → linkWithCredential()로 UID 유지하며 승격
 *      (기존 감정 기록 / 다락방 채팅 데이터 보존)
 *   3. 이미 계정이 있는 경우 → signInWithPopup / signInWithEmailAndPassword
 *
 * ▶ 백엔드 인증:
 *   - API 호출 시 getAuthToken()으로 ID 토큰을 가져와 Authorization 헤더에 포함
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithRedirect,
  linkWithRedirect,
  getRedirectResult,
  signInWithPopup,
  linkWithPopup,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ── Firebase 초기화 ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── 1. 익명 로그인 (앱 시작 시 자동 호출) ────────────────────────────────────
/**
 * 현재 비로그인 상태일 때만 익명 로그인을 수행합니다.
 * 이미 로그인된 경우(익명 포함) 아무 작업도 하지 않습니다.
 */
export const startAnonymousSession = async () => {
  if (auth.currentUser) return auth.currentUser;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('[Auth] 익명 로그인 실패:', error.code, error.message);
    return null;
  }
};

// ── 2. Google 계정 연결 / 로그인 ─────────────────────────────────────────────
/**
 * DEV(localhost): 팝업 방식 — 결과를 즉시 반환합니다.
 *   서드파티 쿠키 차단 정책으로 인해 리다이렉트 방식에서 getRedirectResult()가
 *   null을 반환하는 문제를 우회합니다. COOP 헤더(same-origin-allow-popups)가
 *   vite.config.js에 설정되어 있어야 팝업이 무한 대기 없이 동작합니다.
 *
 * PROD(배포): 리다이렉트 방식 — 호출 즉시 페이지를 이동시키므로 결과를 반환하지 않습니다.
 *   결과는 App.jsx의 useEffect에서 checkRedirectAuthResult()로 수신합니다.
 *
 * @returns {Promise<UserCredential|null>} DEV에서는 결과 객체, PROD에서는 null
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  // ── DEV: 팝업 방식 (localhost 서드파티 쿠키 차단 우회) ──────────────────────
  if (import.meta.env.DEV) {
    if (currentUser && currentUser.isAnonymous) {
      try {
        console.log('[Auth] DEV 환경: linkWithPopup 사용');
        const result = await linkWithPopup(currentUser, provider);
        return { ...result, hadConflict: false };
      } catch (linkError) {
        // 이 구글 계정이 이미 다른 UID에 연결되어 있는 경우 → 일반 로그인으로 재시도
        if (
          linkError.code === 'auth/credential-already-in-use' ||
          linkError.code === 'auth/email-already-in-use'
        ) {
          console.log('[Auth] DEV: linkWithPopup 충돌 → signInWithPopup으로 재시도');
          try {
            const result = await signInWithPopup(auth, provider);
            return { ...result, hadConflict: true };
          } catch (signInError) {
            console.error('[Auth] DEV: signInWithPopup 재시도 실패:', signInError);
            throw signInError;
          }
        }
        console.error('[Auth] Google 팝업 로그인 실패:', linkError);
        throw linkError;
      }
    } else {
      try {
        console.log('[Auth] DEV 환경: signInWithPopup 사용');
        const result = await signInWithPopup(auth, provider);
        return { ...result, hadConflict: false };
      } catch (error) {
        console.error('[Auth] Google 팝업 로그인 실패:', error);
        throw error;
      }
    }
  }

  // ── PROD: 리다이렉트 방식 ────────────────────────────────────────────────────
  try {
    if (currentUser && currentUser.isAnonymous) {
      await linkWithRedirect(currentUser, provider);
    } else {
      await signInWithRedirect(auth, provider);
    }
    return null;
  } catch (error) {
    console.error('[Auth] Google 리다이렉트 로그인 시작 실패:', error);
    throw error;
  }
};

/**
 * 리다이렉트 로그인에서 돌아왔을 때 결과를 파싱합니다. (App.jsx의 useEffect에서 사용)
 * @returns {Promise<{ user: any, isNewLink: boolean, hadConflict: boolean } | null>}
 */
export const checkRedirectAuthResult = async () => {
  try {
    console.log('[Auth Debug] checkRedirectAuthResult 호출됨. auth.currentUser:', auth.currentUser?.uid, 'isAnonymous:', auth.currentUser?.isAnonymous);
    const result = await getRedirectResult(auth);
    console.log('[Auth Debug] getRedirectResult 반환값:', result);
    
    if (!result) return null;

    const operationType = result.operationType; // 'signIn' or 'link'
    const isNewLink = operationType === 'link';
    console.log(`[Auth Debug] 파싱 성공! operationType: ${operationType}, isNewLink: ${isNewLink}`);
    return { user: result.user, isNewLink, hadConflict: false };
  } catch (error) {
    console.log('[Auth Debug] getRedirectResult 에러 발생:', error.code, error.message);
    if (
      error.code === 'auth/credential-already-in-use' ||
      error.code === 'auth/email-already-in-use'
    ) {
      // 이미 연결된 계정이면 일반 로그인(signInWithRedirect)으로 다시 시도
      await signInWithRedirect(auth, new GoogleAuthProvider());
      return { user: null, isNewLink: false, hadConflict: true };
    }
    console.error('[Auth] Google 리다이렉트 결과 처리 에러:', error);
    throw error;
  }
};

// ── 3. 이메일 회원가입 (익명 → 이메일 계정 승격) ─────────────────────────────
/**
 * 새 이메일 계정 생성. 익명 사용자인 경우 linkWithCredential로 UID 유지.
 *
 * @param {string} email
 * @param {string} password
 */
export const registerWithEmail = async (email, password) => {
  const currentUser = auth.currentUser;

  try {
    // 익명 사용자인 경우 → 계정 연결 (UID 유지, 데이터 보존)
    if (currentUser && currentUser.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(currentUser, credential);
      return { user: result.user, isNewLink: true };
    }

    // 비로그인 상태 → 새 계정 생성
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, isNewLink: false };
  } catch (error) {
    console.error('[Auth] 이메일 회원가입 실패:', error.code, error.message);
    throw error;
  }
};

// ── 4. 이메일 로그인 ──────────────────────────────────────────────────────────
/**
 * 기존 이메일 계정으로 로그인합니다.
 * @param {string} email
 * @param {string} password
 */
export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, isNewLink: false };
  } catch (error) {
    console.error('[Auth] 이메일 로그인 실패:', error.code, error.message);
    throw error;
  }
};

// ── 5. 로그아웃 ───────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    await signOut(auth);
    // 로그아웃 후 새 익명 세션 시작 (앱이 항상 UID를 갖도록)
    await startAnonymousSession();
  } catch (error) {
    console.error('[Auth] 로그아웃 실패:', error);
  }
};

// ── 6. Auth 상태 변화 구독 ────────────────────────────────────────────────────
/**
 * App.jsx의 useEffect에서 호출하여 인증 상태를 실시간으로 구독합니다.
 * @param {Function} callback - (user | null) => void
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ── 7. ID 토큰 가져오기 (백엔드 API 인증용) ──────────────────────────────────
/**
 * 현재 로그인된 사용자의 Firebase ID 토큰을 반환합니다.
 * 이 토큰을 API 요청의 Authorization 헤더에 포함시켜야 합니다.
 * 토큰은 1시간 후 만료되며, getIdToken(true)를 호출하면 강제 갱신됩니다.
 *
 * @param {boolean} forceRefresh - true이면 토큰 강제 갱신
 * @returns {string|null} ID 토큰 문자열 또는 null
 */
export const getAuthToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('[Auth] 토큰 가져오기 실패:', error);
    return null;
  }
};

// ── 8. Firestore 감정 DB 동기화 ───────────────────────────────────────────────
/**
 * 암호화된 감정 DB를 Firestore에 저장합니다.
 * @param {string} userId - Firebase UID
 * @param {string} encryptedDB - 암호화된 데이터 문자열
 */
export const syncEmotionDBToCloud = async (userId, encryptedDB) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), 12000)
    );

    await Promise.race([
      setDoc(doc(db, 'users', userId, 'data', 'emotionVault'), {
        encryptedData: encryptedDB,
        updatedAt: serverTimestamp(),
      }),
      timeoutPromise
    ]);
    return true;
  } catch (error) {
    console.error('[Firestore] 감정 DB 저장 실패 또는 타임아웃:', error);
    throw error;
  }
};

/**
 * Firestore에서 암호화된 감정 DB를 불러옵니다.
 * @param {string} userId - Firebase UID
 * @returns {string|null} 암호화된 데이터 문자열 또는 null
 */
export const fetchEmotionDBFromCloud = async (userId) => {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'data', 'emotionVault'));
    if (snap.exists()) {
      return snap.data().encryptedData || null;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] 감정 DB 불러오기 실패:', error);
    return null;
  }
};
