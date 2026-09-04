/**
 * Phase 1 Route Declaration Script
 * Converts the {step === '...'} blocks for login, onboarding, and mypage
 * into declarative <Routes> and <Route> elements as requested.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');
const originalLength = content.split('\n').length;

// Ensure Navigate is imported
if (!content.includes('Navigate, ')) {
  content = content.replace("import { useNavigate, useLocation } from 'react-router-dom';", "import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';");
}

// ─── Extract and Replace Blocks ─────────────────────────────────────────────

// Helper function to extract a block enclosed in {step === 'name' && ( ... )}
function extractBlock(content, stepName) {
  const startPattern = `{step === '${stepName}' && (`;
  const startIndex = content.indexOf(startPattern);
  if (startIndex === -1) return null;

  // Find the closing brace of this block
  let depth = 0;
  let inBlock = false;
  let endIndex = -1;

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const fullBlock = content.substring(startIndex, endIndex + 1);
    const innerContent = content.substring(startIndex + startPattern.length, endIndex).trim();
    // Remove the trailing ')' from innerContent if present
    const cleanInner = innerContent.endsWith(')') ? innerContent.slice(0, -1).trim() : innerContent;
    return { fullBlock, cleanInner };
  }
  return null;
}

const mypage = extractBlock(content, 'mypage');
const login = extractBlock(content, 'login');
const onboarding = extractBlock(content, 'onboarding');

if (mypage && login && onboarding) {
  console.log('✅ Successfully extracted MyPage, Login, and Onboarding blocks.');

  // Create the <Routes> block
  const routesBlock = `          {/* ─── Phase 1: 선언적 메인 라우트 ─── */}
          <Routes>
            {/* 기본 경로 접속 시 대시보드 */}
            <Route path="/" element={<></>} />
            
            <Route path="/mypage" element={
              ${mypage.cleanInner}
            } />
            
            <Route path="/login" element={
              ${login.cleanInner}
            } />
            
            <Route path="/onboarding" element={
              ${onboarding.cleanInner}
            } />
          </Routes>
          {/* ──────────────────────────────────── */}`;

  // Replace the extracted blocks with empty strings
  content = content.replace(mypage.fullBlock, '');
  content = content.replace(login.fullBlock, '');
  content = content.replace(onboarding.fullBlock, '');

  // Insert the <Routes> block right after `<div className={isEnteringRoom ? 'room-enter-anim' : ''} ...>`
  const insertTarget = `<div className={isEnteringRoom ? 'room-enter-anim' : ''} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>`;
  
  if (content.includes(insertTarget)) {
    content = content.replace(insertTarget, `${insertTarget}\n${routesBlock}`);
    console.log('✅ Successfully inserted <Routes> block.');
  } else {
    console.log('⚠️ Could not find insertion point for <Routes> block.');
  }
} else {
  console.log('⚠️ Could not extract all blocks.');
  if (!mypage) console.log('  Missing: mypage');
  if (!login) console.log('  Missing: login');
  if (!onboarding) console.log('  Missing: onboarding');
}

fs.writeFileSync(filePath, content, 'utf8');
const newLength = content.split('\n').length;
console.log(`\n✅ Route transformation complete.`);
console.log(`   Original: ${originalLength} lines → New: ${newLength} lines`);
