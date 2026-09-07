import CryptoJS from 'crypto-js';

/**
 * 데이터를 AES-256 방식으로 암호화합니다.
 * @param {any} data - 암호화할 데이터 객체
 * @param {string} vaultKey - 암호화 키 (금고 열쇠)
 * @returns {string} 암호화된 문자열
 */
export const encryptData = (data, vaultKey) => {
  if (!vaultKey) throw new Error("Vault key is required for E2EE");
  const jsonStr = JSON.stringify(data);
  // AES 알고리즘을 사용해 암호화 후 문자열(Base64)로 반환
  const cipherText = CryptoJS.AES.encrypt(jsonStr, vaultKey).toString();
  return cipherText;
};

/**
 * AES-256 방식으로 암호화된 문자열을 복호화합니다.
 * @param {string} cipherText - 암호화된 데이터
 * @param {string} vaultKey - 복호화 키 (금고 열쇠)
 * @returns {any|null} 복호화된 원본 데이터 객체, 실패 시 null
 */
export const decryptData = (cipherText, vaultKey) => {
  if (!vaultKey) throw new Error("Vault key is required for E2EE");
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, vaultKey);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    
    // 만약 잘못된 키를 입력했다면 복호화된 문자열이 비어있게 됩니다.
    if (!decryptedStr) throw new Error("Decryption failed (wrong key or corrupted data)");
    
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error("복호화 실패: 잘못된 금고 열쇠이거나 데이터가 손상되었습니다.", error);
    return null;
  }
};
