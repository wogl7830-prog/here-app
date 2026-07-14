// Mocking E2EE crypto logic without external dependencies to prevent build crashes.
// Replace with 'crypto-js' or Web Crypto API in production.

export const encryptData = (data, vaultKey) => {
  if (!vaultKey) throw new Error("Vault key is required for E2EE");
  const jsonStr = JSON.stringify(data);
  // Basic mock encryption using Base64 + shifting
  return btoa(encodeURIComponent(jsonStr)) + "===ENCRYPTED:" + vaultKey.substring(0,2);
};

export const decryptData = (cipherText, vaultKey) => {
  if (!vaultKey) throw new Error("Vault key is required for E2EE");
  try {
    const base64 = cipherText.split("===ENCRYPTED:")[0];
    const jsonStr = decodeURIComponent(atob(base64));
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("복호화 실패: 잘못된 금고 열쇠이거나 데이터가 손상되었습니다.", error);
    return null;
  }
};
