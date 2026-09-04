import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

const sendPromptToGemini = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

const fetchGeminiDeepDiveRelationship = async ({
  userName = '당신',
  partnerName = '상대방',
  relationshipType = '가족',
  userConcern = '',
  partnerAction = '',
  selectedEmotions = [],
  coreNeed = '',
  defenseStyle = ''
}) => {
  const isCloseRelation = relationshipType && (relationshipType.includes('부부') || relationshipType.includes('연인') || relationshipType.includes('가족') || relationshipType.includes('배우자'));
  const partnerRef = isCloseRelation ? partnerName : `${partnerName}님`;
  const emotionStr = Array.isArray(selectedEmotions) ? selectedEmotions.join(', ') : selectedEmotions;

  const prompt = `### [Role]
당신은 명리학적 자연 기질론과 서양 심리학의 EFT(정서중심 부부치료), 이마고(Imago) 부부/가족 치료, 사티어(Satir) 의사소통 유형을 결합한 세계 최고의 하이브리드 관계 코칭 전문가입니다.

### [Context Input]
- 내담자 이름: ${userName}
- 상대방 이름: ${partnerRef} (관계: ${relationshipType})
- 내담자 고민: "${userConcern}"
- 상대의 행동: "${partnerAction}"
- 선택한 감정: ${emotionStr || '없음'}
- 내담자의 핵심 욕구: "${coreNeed}"
- 원하는 대화 방식: "${defenseStyle}"

### [Task]
위 상황을 EFT/이마고 치료 관점에서 깊이 분석하여, 두 사람의 무의식적 패턴과 치유를 향한 통찰을 담은 심층 딥다이브 리포트를 생성하세요. 이 리포트는 기본 진단과 분리된 별도 심층 분석으로, 가장 깊은 수준의 통찰을 제공해야 합니다.

### [Generation Rules]

**1. 갈등의 톱니바퀴 분석 (core_conflict_mechanism)**
- 두 사람의 기질적 차이가 이번 상황("${partnerAction}")에서 어떻게 반복적 방어기제 충돌로 이어지는지 구조적으로 묘사
- 상대방의 날 선 행동 뒤에 숨겨진 애착 불안과 무력감의 실체를 번역
- 동시에 ${userName}이 왜 그 행동에 깊이 상처받았는지 심리학적으로 공감하고 수용
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

**2. 무의식의 그림자와 내면 아이 (unconscious_projection)**
- 상대방의 행동 이면에 있는 결핍과 ${userName}의 무의식적 투사, 과거 상처를 다세대 관점에서 조명
- 이마고 이론의 '유년기 상처가 현재 갈등을 촉발하는 방식' 적용
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

**3. 치유를 향한 관계의 재구성 (healing_insight)**
- 누구의 잘못도 아닌 '관계의 역동' 자체를 객관화
- 서로의 내면 아이를 안아주기 위한 심리학적 통찰과 재연결 방향 제시
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

**4. 실전 핑퐁 대화 시나리오 3단계 (premium_scenario_expansion)**
- JSON 형식의 배열로 반환
- "방어기제를 내려놓는 오프닝" -> "핵심 욕구(coreNeed) 전달" -> "재연결을 위한 제안" 3단계 구성

### [Tone & Manner Rules]
1. **호칭 규칙**: '유저', '사용자', '당신', '당신님' 등의 단어는 절대 사용 금지. 반드시 입력된 이름(${userName}, ${partnerRef})을 사용.
2. **존칭 그룹 구분**:
   - 상대방(${partnerRef})이 '부부/연인/가족/배우자' 등 매우 가까운 관계일 때는 이름 자체만 사용 (예: "미미가", "철수와"). 
   - 그 외의 지인/동료일 때는 이름에 '님'을 붙임. (프롬프트 내 입력된 ${partnerRef}을 그대로 활용).
3. **구체성**: "${userConcern}" 및 "${partnerAction}" 상황을 추상적으로 얼버무리지 말고 구체적인 정황을 직접 언급.
4. **스타일 & 방패문장**: 따뜻하고 쉬운 구어체 사용. 단, "~~일 수 있습니다", "~~수도 있습니다" 같은 추측성 방패문장은 지양하고 "~입니다", "~해요" 등 단단하고 확신 있는 평서문으로 문장을 완성.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "core_conflict_mechanism": "...",
  "unconscious_projection": "...",
  "healing_insight": "...",
  "premium_scenario_expansion": {
    "stage_1_soft_boundary": "1단계 대사",
    "expected_reaction_A": "상대의 반응 A",
    "expected_reaction_B": "상대의 반응 B",
    "stage_2_cushion_response": "2단계 대사",
    "stage_3_firm_timeout": "3단계 대사"
  }
}
`;
  return sendPromptToGemini(prompt);
};

const fetchGeminiDeepDiveSelf = async ({
  userName = '당신',
  userConcern = '',
  userEmotion = '',
  mbti = '',
  sajuElement = ''
}) => {
  const prompt = `### [Role]
당신은 상처받은 내면 아이(Inner Child)를 깊이 이해하고, 반복되는 심리 패턴의 기원을 따뜻하게 짚어주는 심층 심리 상담사입니다.

### [Context Input]
- 내담자 이름: ${userName}
- 내담자 고민/상황: "${userConcern}"
- 선택한 감정: "${userEmotion}"
- MBTI: ${mbti || '미입력'}
- 명리학적 기질: ${sajuElement || '미입력'}

### [Task]
위 상황에서 반복되는 내면의 심리 패턴, 그 기원이 된 과거 장면, 그리고 지금의 나를 다시 안아주는 치유 통찰을 생성하세요. 이 리포트는 기본 자가진단과 분리된 더 깊은 내면 탐구로, 상대방 없이 오직 내 내면에만 집중합니다.

### [Generation Rules]

**1. 내 안에서 반복되는 패턴 (inner_pattern_mechanism)**
- "${userConcern}" 상황에서 드러나는 자기방어/자기비판 패턴을 구체적으로 짚기
- ${mbti}와 ${sajuElement}의 성질을 개념어 직접 노출 없이 자연스럽게 녹여서 분석 ("MBTI", "명리학" 단어 자체는 쓰지 말 것)
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

**2. 그 시절의 나를 만나기 (inner_child_origin)**
- 위 패턴이 처음 만들어진 구체적인 장면 또는 시기를 내면 아이 관점에서 조명
- 상처받은 어린 시절의 자아가 어떤 결정을 내렸는지(믿음/규칙 형성)를 따뜻하게 서술
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

**3. 지금의 나를 다시 안아주기 (healing_insight)**
- 그 아이가 과거에 내린 결정을 어떻게 지금의 자원으로 바꿀 수 있는지 제시
- 내면에 보내는 따뜻한 메시지로 마무리
- 반드시 4~5문장, 줄바꿈(\\n\\n) 포함

### [Tone & Manner Rules]
1. **호칭 규칙**: '유저', '사용자', '당신', '당신님' 등의 단어는 절대 사용 금지. 반드시 입력된 이름(${userName})을 자연스럽게 사용 (예: "${userName}의 마음속", "${userName}이 느낀").
2. **구체성**: 입력된 고민 "${userConcern}"과 선택된 감정 "${userEmotion}"을 피상적으로 얼버무리지 말고 구체적 정황과 감정을 직접 언급.
3. **스타일 & 방패문장**: 따뜻하고 쉬운 구어체를 유지. "~~일 수 있습니다", "~~일지도 모릅니다" 같은 추측성 방패문장은 쓰지 말고 "~입니다", "~해요" 처럼 단단하고 확신 있는 평서문으로 문장을 맺을 것.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "inner_pattern_mechanism": "...",
  "inner_child_origin": "...",
  "healing_insight": "..."
}
`;
  return sendPromptToGemini(prompt);
};

async function runTest() {
  console.log("=== 1. 가족의 방 (Relationship) 딥다이브 테스트 ===");
  try {
    const relResult = await fetchGeminiDeepDiveRelationship({
      userName: '정현',
      partnerName: '미미',
      relationshipType: '부부',
      userConcern: '퇴근 후 피곤해서 혼자 쉬고 싶은데, 미미가 자꾸 오늘 있었던 일을 다 말하려 해서 짜증이 났어요.',
      partnerAction: '내 피곤함은 몰라주고 자기 이야기만 1시간 동안 늘어놓았어요.',
      selectedEmotions: '피곤함, 귀찮음, 답답함',
      coreNeed: '혼자만의 시간과 에너지 충전',
      defenseStyle: '부드러운 대화 단절 및 타임아웃 요구'
    });
    console.log(JSON.stringify(relResult, null, 2));
  } catch (err) {
    console.error("Relationship DeepDive Error:", err);
  }

  console.log("\\n=== 2. 나의 방 (Self) 딥다이브 테스트 ===");
  try {
    const selfResult = await fetchGeminiDeepDiveSelf({
      userName: '정현',
      userConcern: '회사에서 중요한 발표를 망쳤다. 모두가 나를 비웃는 것 같고 다시는 회복할 수 없을 것 같다.',
      userEmotion: '부끄러움, 자책감, 불안, 도망치고 싶음',
      mbti: 'INTJ',
      sajuElement: '목(木)'
    });
    console.log(JSON.stringify(selfResult, null, 2));
  } catch (err) {
    console.error("Self DeepDive Error:", err);
  }
}

runTest();
