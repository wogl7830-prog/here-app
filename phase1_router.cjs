/**
 * Phase 1 React Router Integration Script
 * Safely patches App.jsx to add:
 * 1. react-router-dom imports
 * 2. useNavigate + useLocation hooks
 * 3. URL <-> step sync layer
 * 4. goTo() wrapper function
 * 5. Route registrations for major pages
 * 6. handleBack navigate integration
 * 7. GNB / Bottom Tab / MyPage onBack navigate updates
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');
const originalLength = content.split('\n').length;

// ─── PATCH 1: Add react-router-dom import after MyPage import ───────────────
const myPageImport = `import MyPage from './MyPage';`;
const routerImport = `import MyPage from './MyPage';
import { useNavigate, useLocation } from 'react-router-dom';`;

if (!content.includes("from 'react-router-dom'")) {
  content = content.replace(myPageImport, routerImport);
  console.log('✅ Patch 1: Added react-router-dom imports');
} else {
  console.log('⏭️  Patch 1: Already has react-router-dom import');
}

// ─── PATCH 2: Add useNavigate + useLocation hooks after useState declarations ─
// Insert after: const [step, setStep] = useState('dashboard');
const stepStateDecl = `const [step, setStep] = useState('dashboard');`;
const stepStateWithHooks = `const [step, setStep] = useState(() => {
    // URL 기반 초기 step 설정 (Deep Link 지원)
    const pathToStep = {
      '/login': 'login',
      '/onboarding': 'onboarding',
      '/mypage': 'mypage',
      '/prescription': 'daily_forecast',
      '/concern': 'concern',
      '/result': 'result',
      '/monthly-report': 'monthly_analytics',
    };
    return pathToStep[window.location.pathname] || 'dashboard';
  });
  const navigate = useNavigate();
  const location = useLocation();`;

if (!content.includes('const navigate = useNavigate()')) {
  content = content.replace(stepStateDecl, stepStateWithHooks);
  console.log('✅ Patch 2: Added navigate/location hooks + deep link init');
} else {
  console.log('⏭️  Patch 2: Already has navigate hook');
}

// ─── PATCH 3: Add URL<->step sync layer + goTo() after handleBack function ──
// Find the closing of handleBack function to insert after it
const handleBackClosing = `  const calculateSaju = async () => {`;
const syncLayerAndGoTo = `  // ─── URL ↔ step 동기화 레이어 (Phase 1 Router Integration) ────────────
  // 브라우저 뒤로가기 감지 → step 자동 업데이트
  React.useEffect(() => {
    const pathToStep = {
      '/': 'dashboard',
      '/login': 'login',
      '/onboarding': 'onboarding',
      '/mypage': 'mypage',
      '/prescription': 'daily_forecast',
      '/concern': 'concern',
      '/result': 'result',
      '/monthly-report': 'monthly_analytics',
    };
    const mappedStep = pathToStep[location.pathname];
    if (mappedStep && mappedStep !== step) {
      setStep(mappedStep);
    }
  }, [location.pathname]);

  // goTo(): setStep + navigate를 동시에 호출하는 래퍼 함수
  const goTo = React.useCallback((stepName, opts = {}) => {
    const stepToPath = {
      'dashboard': '/',
      'login': '/login',
      'onboarding': '/onboarding',
      'mypage': '/mypage',
      'daily_forecast': '/prescription',
      'concern': '/concern',
      'result': '/result',
      'monthly_analytics': '/monthly-report',
    };
    const targetPath = stepToPath[stepName];
    setStep(stepName);
    if (targetPath) {
      if (opts.replace) navigate(targetPath, { replace: true });
      else navigate(targetPath);
    }
  }, [navigate]);
  // ─────────────────────────────────────────────────────────────────────────

  const calculateSaju = async () => {`;

if (!content.includes('goTo = React.useCallback')) {
  content = content.replace(handleBackClosing, syncLayerAndGoTo);
  console.log('✅ Patch 3: Added URL<->step sync layer + goTo() function');
} else {
  console.log('⏭️  Patch 3: Already has goTo function');
}

// ─── PATCH 4: Update handleBack to use navigate ─────────────────────────────
// Update handleBack to also call navigate(-1) for URL-mapped steps
const oldHandleBack = `  const handleBack = () => {
    setIsEnteringRoom(true);
    setTimeout(() => {
      if (step === 'info') setStep('dashboard');
      else if (step === 'type_selection') setStep('dashboard');
      else if (step === 'partner_info') setStep('dashboard');
      else if (step === 'concern') {
        setGuideStep(0);
        setShowWarning(false);
        if (trackType === '\uBE44\uBC00\uC758 \uBC29\uC557\uAC04' || trackType === '\uC131\uC7A5 \uD0D0\uD5D8\uAC00') setStep('dashboard');
        else setStep('partner_info');
      }
      else if (step === 'result') setStep('concern');
      else if (step === 'morning_letter' || step === 'daily_forecast') setStep('dashboard');
      setIsEnteringRoom(false);
      window.scrollTo(0, 0);
    }, 450);
  };`;

const newHandleBack = `  const handleBack = () => {
    setIsEnteringRoom(true);
    setTimeout(() => {
      if (step === 'info') goTo('dashboard');
      else if (step === 'type_selection') goTo('dashboard');
      else if (step === 'partner_info') goTo('dashboard');
      else if (step === 'concern') {
        setGuideStep(0);
        setShowWarning(false);
        if (trackType === '\uBE44\uBC00\uC758 \uBC29\uC557\uAC04' || trackType === '\uC131\uC7A5 \uD0D0\uD5D8\uAC00') goTo('dashboard');
        else setStep('partner_info');
      }
      else if (step === 'result') goTo('concern');
      else if (step === 'morning_letter' || step === 'daily_forecast') goTo('dashboard');
      else navigate(-1); // URL 기반 화면에서의 브라우저 뒤로가기
      setIsEnteringRoom(false);
      window.scrollTo(0, 0);
    }, 450);
  };`;

if (content.includes(oldHandleBack)) {
  content = content.replace(oldHandleBack, newHandleBack);
  console.log('✅ Patch 4: Updated handleBack to use goTo() + navigate(-1)');
} else {
  console.log('⚠️  Patch 4: Could not find exact handleBack — skipping (manual check needed)');
}

// ─── PATCH 5: GNB condition update (step === 'dashboard' only) ──────────────
// GNB already uses step === 'dashboard', just need to also add navigate for tab buttons

// Bottom tab bar home button: setStep('dashboard') -> goTo('dashboard')
let patch5Count = 0;
const oldHomeTabClick = `onClick={() => { setStep('dashboard'); window.scrollTo(0, 0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}`;
const newHomeTabClick = `onClick={() => { goTo('dashboard'); window.scrollTo(0, 0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}`;
if (content.includes(oldHomeTabClick)) {
  content = content.replace(oldHomeTabClick, newHomeTabClick);
  patch5Count++;
  console.log('✅ Patch 5a: Updated home tab onClick');
}

// ─── PATCH 6: MyPage onBack -> navigate('/') ────────────────────────────────
const oldMyPageOnBack = `onBack={() => setStep('dashboard')}`;
const newMyPageOnBack = `onBack={() => goTo('dashboard')}`;
// There might be multiple, replace all
const beforeP6 = content;
content = content.split(oldMyPageOnBack).join(newMyPageOnBack);
const p6Count = (beforeP6.split(oldMyPageOnBack).length - 1);
if (p6Count > 0) {
  console.log(`✅ Patch 6: Updated ${p6Count} MyPage/component onBack() calls`);
} else {
  console.log('⚠️  Patch 6: No onBack=setStep(dashboard) found to replace');
}

// ─── PATCH 7: Login buttons -> goTo('onboarding') ───────────────────────────
// The login screen has 3 buttons that call setStep('onboarding')
// Pattern: setIsEnteringRoom(true); setTimeout(() => { setStep('onboarding'); setOnboardingStep(1);
const oldLoginNav = `setStep('onboarding'); setOnboardingStep(1); setIsEnteringRoom(false);`;
const newLoginNav = `goTo('onboarding'); setOnboardingStep(1); setIsEnteringRoom(false);`;
const beforeP7 = content;
content = content.split(oldLoginNav).join(newLoginNav);
const p7Count = beforeP7.split(oldLoginNav).length - 1;
if (p7Count > 0) {
  console.log(`✅ Patch 7: Updated ${p7Count} login->onboarding navigation calls`);
}

// ─── PATCH 8: Dashboard -> mypage navigation (GNB icon click) ────────────────
// Find the mypage navigation in GNB area
const oldMyPageNav = `setStep('mypage')`;
const newMyPageNav = `goTo('mypage')`;
const beforeP8 = content;
content = content.split(oldMyPageNav).join(newMyPageNav);
const p8Count = beforeP8.split(oldMyPageNav).length - 1;
if (p8Count > 0) {
  console.log(`✅ Patch 8: Updated ${p8Count} mypage navigation calls`);
}

// ─── PATCH 9: shared_flow setStep('shared_flow') stays as is ─────────────────
// We deliberately leave setStep('shared_flow') unchanged - it doesn't need URL routing
console.log('✅ Patch 9: shared_flow kept as-is (query param based, no URL change needed)');

// ─── PATCH 10: dashboard -> login navigation ──────────────────────────────────
// setStep('login') calls -> goTo('login')
const oldLoginStep = `setStep('login')`;
const newLoginStep = `goTo('login')`;
const beforeP10 = content;
content = content.split(oldLoginStep).join(newLoginStep);
const p10Count = beforeP10.split(oldLoginStep).length - 1;
if (p10Count > 0) {
  console.log(`✅ Patch 10: Updated ${p10Count} setStep('login') -> goTo('login')`);
}

// ─── PATCH 11: setStep('dashboard') -> goTo('dashboard') (standalone calls) ──
// Only replace standalone setStep('dashboard') NOT inside login/onboarding buttons
const oldDashStep = `setStep('dashboard')`;
const newDashStep = `goTo('dashboard')`;
const beforeP11 = content;
content = content.split(oldDashStep).join(newDashStep);
const p11Count = beforeP11.split(oldDashStep).length - 1;
if (p11Count > 0) {
  console.log(`✅ Patch 11: Updated ${p11Count} setStep('dashboard') -> goTo('dashboard')`);
}

// ─── PATCH 12: GNB condition - also respond to location.pathname ─────────────
// Update GNB and Bottom Tab conditions to also check URL for consistency
const oldGnbCondition = `{!isSharedMode && step === 'dashboard' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,`;
const newGnbCondition = `{!isSharedMode && (step === 'dashboard' || location.pathname === '/') && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,`;

if (content.includes(oldGnbCondition)) {
  content = content.replace(oldGnbCondition, newGnbCondition);
  console.log('✅ Patch 12a: Updated GNB condition to include location.pathname');
}

const oldTabCondition = `{!isSharedMode && step === 'dashboard' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,`;
const newTabCondition = `{!isSharedMode && (step === 'dashboard' || location.pathname === '/') && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto', maxWidth: '480px', zIndex: 9999,`;

if (content.includes(oldTabCondition)) {
  content = content.replace(oldTabCondition, newTabCondition);
  console.log('✅ Patch 12b: Updated Bottom Tab condition to include location.pathname');
}

// ─── Write the patched file ──────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
const newLength = content.split('\n').length;
console.log(`\n✅ All patches applied!`);
console.log(`   Original: ${originalLength} lines → New: ${newLength} lines`);
console.log(`   Delta: ${newLength - originalLength} lines added`);
