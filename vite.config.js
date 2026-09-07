import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // 팝업 방식 Google 로그인이 무한 대기에 빠지지 않도록
      // Chrome의 COOP 정책에 맞춰 팝업과의 postMessage 통신을 허용
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
