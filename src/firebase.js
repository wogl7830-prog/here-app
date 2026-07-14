// Mocking Firebase to prevent build crash without 'npm install firebase'
// Replace with actual 'firebase/app', 'firebase/auth', 'firebase/firestore' imports later.

export const loginWithGoogle = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ uid: 'mock-oauth-user-id-777', displayName: 'Mock User' });
    }, 1200);
  });
};

export const logout = () => {
  console.log("Logged out");
};

export const syncEmotionDBToCloud = async (userId, encryptedDB) => {
  return new Promise(resolve => {
    setTimeout(() => {
      localStorage.setItem('MOCK_CLOUD_FIRESTORE', encryptedDB);
      resolve(true);
    }, 1500);
  });
};

export const fetchEmotionDBFromCloud = async (userId) => {
  const data = localStorage.getItem('MOCK_CLOUD_FIRESTORE');
  return data ? data : null;
};
