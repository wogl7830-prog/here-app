const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add global state in App()
const appStartStr = "export default function App() {";
const appStartIdx = content.indexOf(appStartStr);
if (appStartIdx !== -1) {
  const insertIdx = content.indexOf("const [step, setStep] = useState('dashboard');", appStartIdx);
  if (insertIdx !== -1) {
    const newStates = `const [step, setStep] = useState('dashboard');
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [latestAnalysisResult, setLatestAnalysisResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem('here_latest_analysis');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (latestAnalysisResult) {
      sessionStorage.setItem('here_latest_analysis', JSON.stringify(latestAnalysisResult));
    }
  }, [latestAnalysisResult]);`;
    content = content.substring(0, insertIdx) + newStates + content.substring(insertIdx + "const [step, setStep] = useState('dashboard');".length);
  }
}

// 2. Remove states from FamilyRelationshipView and add onAnalysisComplete prop
const familyViewStr = "function FamilyRelationshipView({ partnerName = \"미미\", userConcern, partnerAction, selectedEmotions = [], defenseStyle, coreNeed, trackType, formData, onReset, onGoToMyRoom }) {";
const familyViewReplacement = "function FamilyRelationshipView({ partnerName = \"미미\", userConcern, partnerAction, selectedEmotions = [], defenseStyle, coreNeed, trackType, formData, onReset, onGoToMyRoom, onAnalysisComplete }) {";
content = content.replace(familyViewStr, familyViewReplacement);

// Remove specific states from FamilyRelationshipView
const statesToRemove = [
  "const [showSharePreview, setShowSharePreview] = useState(false);",
  "const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);",
  "const [isUnlocking, setIsUnlocking] = useState(false);",
  "const [selectedScenario, setSelectedScenario] = useState(null);",
  "const [chatToast, setChatToast] = useState('');"
];
statesToRemove.forEach(state => {
  content = content.replace(state, "");
});

// 3. Call onAnalysisComplete inside FamilyRelationshipView API call success
const setAnalysisDataStr = "setAnalysisData(data);";
if (content.indexOf(setAnalysisDataStr) !== -1) {
  // Replace the first occurrence of setAnalysisData(data); inside FamilyRelationshipView
  // which is in the try block
  content = content.replace(
    /if \(!ignore\) {\s*setAnalysisData\(data\);\s*}/,
    `if (!ignore) {
          setAnalysisData(data);
          if (onAnalysisComplete) onAnalysisComplete(data);
        }`
  );
}

// 4. Update the FamilyRelationshipView instantiation in App render
const renderFamilyViewRegex = /<FamilyRelationshipView\s+partnerName=\{formData\?.partnerName \|\| '미미'\}/;
if (renderFamilyViewRegex.test(content)) {
  content = content.replace(
    /<FamilyRelationshipView\s+partnerName=\{formData\?.partnerName \|\| '미미'\}/,
    "<FamilyRelationshipView onAnalysisComplete={setLatestAnalysisResult} partnerName={formData?.partnerName || '미미'}"
  );
}

// 5. Remove Premium Wall and Ping Pong UI from FamilyRelationshipView
const premiumStartStr = "{/* 💎 프리미엄 딥다이브 리포트 페이월 */}";
const premiumIdx = content.indexOf(premiumStartStr);
if (premiumIdx !== -1) {
  // We need to carefully remove everything from premiumStartStr up to the end of FamilyRelationshipView but keeping the buttons at the very bottom maybe?
  // Let's find the end of the premium block. It ends around the "홈으로 가기" buttons.
  // I will just use regex to remove everything between {/* 💎 프리미엄 딥다이브 리포트 페이월 */} and {/* ── 하단 공통 플로팅 버튼 영역 ── */}
  const premiumEndStr = "{/* ── 하단 공통 플로팅 버튼 영역 ── */}";
  const premiumEndIdx = content.indexOf(premiumEndStr, premiumIdx);
  if (premiumEndIdx !== -1) {
    content = content.substring(0, premiumIdx) + content.substring(premiumEndIdx);
  }
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Step 1 modifications applied');
