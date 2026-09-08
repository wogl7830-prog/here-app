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
  signInWithPopup,
  linkWithPopup,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  signOut,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
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
 * 항상 팝업 방식으로 Google 로그인/연결을 수행합니다.
 * DEV/PROD 모두 팝업 방식을 사용하여 서드파티 쿠키 차단 + 리다이렉트 세션 증발
 * 문제를 완전히 회피합니다.
 *
 * @returns {Promise<{ user, operationType, hadConflict, isNewUser }>}
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.isAnonymous) {
    try {
      console.log('[Auth] linkWithPopup 시도');
      const result = await linkWithPopup(currentUser, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
      return { ...result, hadConflict: false, isNewUser };
    } catch (linkError) {
      if (
        linkError.code === 'auth/credential-already-in-use' ||
        linkError.code === 'auth/email-already-in-use'
      ) {
        console.log('[Auth] linkWithPopup 충돌 → signInWithPopup으로 재시도');
        try {
          const result = await signInWithPopup(auth, provider);
          const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
          return { ...result, hadConflict: true, isNewUser };
        } catch (signInError) {
          console.error('[Auth] signInWithPopup 재시도 실패:', signInError);
          throw signInError;
        }
      }
      console.error('[Auth] Google 팝업 로그인 실패:', linkError);
      throw linkError;
    }
  } else {
    try {
      console.log('[Auth] signInWithPopup 시도');
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
      return { ...result, hadConflict: false, isNewUser };
    } catch (error) {
      console.error('[Auth] Google 팝업 로그인 실패:', error);
      throw error;
    }
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
      return { user: result.user, isNewLink: true, isNewUser: true };
    }

    // 비로그인 상태 → 새 계정 생성
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, isNewLink: false, isNewUser: true };
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
    return { user: result.user, isNewLink: false, isNewUser: false };
  } catch (error) {
    console.error('[Auth] 이메일 로그인 실패:', error.code, error.message);
    throw error;
  }
};

// ── 5. 이메일 비밀번호 재설정 ──────────────────────────────────────────────────
export const resetEmailPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('[Auth] 비밀번호 재설정 메일 발송 실패:', error.code, error.message);
    throw error;
  }
};

// ── 6. 로그아웃 ───────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    await signOut(auth);
    // 로그아웃 후 새 익명 세션 시작 (앱이 항상 UID를 갖도록)
    await startAnonymousSession();
  } catch (error) {
    console.error('[Auth] 로그아웃 실패:', error);
  }
};

// ── 7. Auth 상태 변화 구독 ────────────────────────────────────────────────────
/**
 * App.jsx의 useEffect에서 호출하여 인증 상태를 실시간으로 구독합니다.
 * @param {Function} callback - (user | null) => void
 * @returns {Function} unsubscribe 함수
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ── 8. ID 토큰 가져오기 (백엔드 API 인증용) ──────────────────────────────────
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

// ── 9. Firestore 감정 DB 동기화 ───────────────────────────────────────────────
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
