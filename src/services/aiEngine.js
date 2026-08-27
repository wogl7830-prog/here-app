/**
 * H.E.R.e AI Coaching Engine (Gemini API Integration)
 * - 모든 Gemini AI 호출은 반드시 이 모듈을 통해서만 이루어집니다.
 * - 실제 Gemini 호출은 Render 클라우드 백엔드(server.js)에서 수행합니다.
 * - 프론트엔드는 백엔드 프록시에 요청만 보냅니다 (API 키 노출 없음).
 * - 모든 요청에는 Firebase ID 토큰이 Authorization 헤더로 포함됩니다.
 */

import { getAuthToken } from '../firebase';

const BASE_URL = 'https://here-backend-pt4t.onrender.com/api/chat';

// 공통 Fetch 헬퍼 함수 (중복되는 fetch 및 JSON 파싱 에러 방어 처리)
// export해서 AtticView, HybridPrescriptionView 등 어디서든 직접 사용 가능
export const sendPromptToGemini = async (prompt, payloadInfo = null, options = {}) => {
  if (payloadInfo) {
    console.log('[DEBUG] Analysis Input:', payloadInfo);
  }
  try {
    // Firebase ID 토큰을 가져와 Authorization 헤더에 포함
    const idToken = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const requestBody = { prompt };
    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // API 에러 응답(토큰 만료, 권한 오류 등) 처리
    if (data.error) {
      console.error('[DEBUG] Gemini API Error Response:', data.error);
      throw new Error(`API Error: ${data.error.message || 'Unknown API Error'}`);
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!raw) {
      console.error('[DEBUG] Empty or invalid response from Gemini. Data:', data);
      throw new Error('Empty response from Gemini');
    }

    // 마크다운 백틱 및 코드블록 제거 처리 정교화
    let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      console.log('[DEBUG] Analysis Output:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('[DEBUG] JSON Parsing Error. Raw Text:', raw);
      console.error('[DEBUG] Cleaned Text:', cleaned);
      throw new Error('Failed to parse Gemini response as JSON');
    }
  } catch (error) {
    console.error('[DEBUG] Analysis Output Error (aiEngine):', error);
    throw error;
  }
};

/**
 * 채팅형 자유 텍스트 응답 헬퍼 (JSON 파싱 없이 raw text 반환)
 * AtticView의 AI 메이트 채팅에서 사용
 */
export const sendChatPromptToGemini = async (prompt) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(`API Error: ${data.error.message || 'Unknown API Error'}`);
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return raw.trim();
  } catch (error) {
    console.error('[DEBUG] Chat Output Error (aiEngine):', error);
    throw error;
  }
};

/**
 * 1. 아침 모닝레터 생성 엔진
 */
export const fetchGeminiMorningLetter = async ({ name, ampm, elementName, moodWeather, dateStr, recentLog, fallbackTopic, recentKeywords = [], selectedEmotion }) => {
  const recentLogStr = recentLog 
    ? recentLog 
    : '';
    
  const recentKeywordsStr = recentKeywords.length > 0 
    ? recentKeywords.join(', ') 
    : '없음';

  const prompt = `당신은 유저의 내면이 매일 조금씩 단단해지고 있음을 발견하고 지지해주는 따뜻한 동반자입니다. 차갑게 분석하는 상담가가 아니라, 다정한 에세이스트처럼 편지를 써주세요.

[호칭 및 문체 규칙]
- '유저', '사용자', '당신 님' 같은 어색한 표현은 절대 쓰지 마세요. 이름(${name || '당신'}) 또는 자연스러운 구어체 존댓말을 사용하세요.
- '~수 있습니다', '~일 것입니다' 같은 단조로운 어미를 반복하지 말고, 다양한 종결 어미로 문학적이고 따뜻한 문장을 구사하세요.

[오늘의 상황]
- 이름: ${name || '당신'}
- 오전/오후: ${ampm || ''}
- 사주 오행: ${elementName || ''}
- 마음 날씨: ${moodWeather || '맑음'} (사용자의 최근 감정 기록을 기반으로 관측된 마음의 날씨 상태)
- 오늘 날짜: ${dateStr}

[감정 반영 규칙]
${selectedEmotion
  ? `사용자가 오늘 아침 직접 선택한 감정은 "${selectedEmotion}"입니다. 이 감정을 교정하려 하거나 다른 감정으로 유도하지 말고, 있는 그대로 온전히 수용하며 그 감정에 맞는 구체적인 위로를 건네주세요.`
  : `사용자가 오늘 감정을 직접 선택하지 않았습니다. 아래 최근 기록이 있다면 그 안에서 감정을 조심스럽게 유추해 공감하고, 없다면 일반적인 아침의 다정한 안부로 시작하세요.`}

[최근 기록 처리 규칙 — 매우 중요]
${recentLogStr
  ? `최근 마음 기록이 있습니다: "${recentLogStr}"
→ 이 기록 속 과거의 아픔이나 갈등 상황 자체를 다시 부정적으로 끄집어내지 마세요. 대신 그 안에서 사용자가 버텨낸 힘, 시도했던 노력, 태도의 변화를 찾아내어 성장으로 따뜻하게 인정하고 칭찬해주세요.`
  : `오늘은 특별한 기록이 없습니다. 아래 영감 소재를 활용해 다정한 편지를 열어주세요: ${fallbackTopic || ''}`}

[반드시 피해야 할 것 — 반복 방지]
최근 며칠간 이미 다룬 주제: ${recentKeywordsStr || '없음'}
→ 위 주제와 겹치는 소재, 비유, 표현은 절대 사용하지 말고 완전히 다른 관점으로 써주세요. 또한 편지의 도입부 구조도 매번 똑같이 반복하지 말고(예: 항상 날씨 은유로 시작 등), 질문형/직접 인사형/날씨 은유형 등으로 다양하게 시작해주세요.

[출력 형식]
아래 JSON 형식으로만 응답해줘. 다른 설명은 붙이지 마세요.
{
  "letter": "...(오늘의 편지 본문, 4~5문장. 반드시 순수 텍스트만 사용할 것. <br>, <p>, <b> 등 HTML 태그를 절대 삽입하지 마세요. 문단 구분이 필요하면 줄바꿈 문자(\\n\\n)만 사용하세요.)...",
  "affirmation": "...(오늘의 확언, 한 문장. 반드시 1인칭으로 작성. '나는 ~', '나에게는 ~' 처럼 사용자 본인이 스스로에게 되뇌는 다짐 형태로. '${name || '당신'}님은 ~' 같은 3인칭 서술 절대 금지)...",
  "keywords": ["이번 편지에서 다룬 핵심 주제를 2~3개의 짧은 한글 키워드나 짧은 구로. 완성된 문장이 아니라 단어/짧은 구 형태로."]
}`;

  return sendPromptToGemini(prompt, null, { temperature: 0.95 });
};


/**
 * 2. 동적 꼬리 질문 및 감정 칩 추천 엔진
 */
export const fetchGeminiFollowUp = async (userText) => {
  const prompt = `다음은 한 사람이 털어놓은 고민이야: "${userText}"
이 글을 읽고 그 사람의 가장 밑바닥에 있는 감정을 파악해.

[감정칩(chips) 생성 가이드라인]
1. "답답함, 지침, 막막함, 불안함, 무기력함, 서운함" 같은 뻔하고 관성적인 감정어는 가급적 피할 것.
2. 사용자가 입력한 구체적 상황과 표현에서 뽑아낼 수 있는 '더 정확하고 뾰족한 감정 단어'를 우선적으로 제시할 것. 
   (예: "완벽하지 않으면 안 된다" -> "압박감", "강박감" / "겉으론 괜찮은 척" -> "가면 쓴 기분", "억눌림" 등)
3. 5개의 감정칩 중 2~3개는 위처럼 사용자의 상황에 딱 맞는 구체적이고 날카로운 단어로 채우고, 나머지 2~3개는 사용자가 직관적으로 고르기 쉽도록 보편적인 감정어를 섞어서 균형을 맞출 것.

'question' 작성 시 호칭 규칙: '유저', '유저님', '사용자'라는 단어를 절대 쓰지 말 것. 질문 안에서 상대를 가리킬 때는 '당신'으로만 표현하거나, 주어를 생략해 자연스럽게 작성할 것.
[중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현할 것.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "question": "마음을 다독이는 다정한 질문 (예: '이 마음과 가장 가까운 감정은 무엇인가요?')",
  "chips": ["감정단어1", "감정단어2", "감정단어3", "감정단어4", "감정단어5"]
}`;

  return sendPromptToGemini(prompt);
};

/**
 * 3. [V2] 동적 변수 기반 통합 관계 분석 엔진 (부부/가족/대인관계 전체 커버)
 */
export const fetchGeminiRelationshipAnalysisV2 = async ({
  userName,
  userMbti,
  userElement,
  partnerName,
  partnerMbti,
  partnerElement,
  relationshipType,
  userConcern,
  partnerAction,
  coreNeed
}) => {
  const prompt = `### [Role]
당신은 '자연 기질론'과 서양 심리학의 'EFT(정서중심 부부치료)', '이마고(Imago) 부부/가족 치료', '사티어(Satir) 의사소통 유형'을 결합한 세계 최고의 하이브리드 관계 코칭 전문가입니다.

### [Context Input]
- 내담자(유저) 정보: 성향(${userMbti}), 타고난 기질(${userElement})
- 대상자(상대방) 정보: 관계(${relationshipType}), 성향(${partnerMbti}), 타고난 기질(${partnerElement})
- 현재 상황: 내담자 고민(${userConcern}) / 상대의 행동(${partnerAction})
- 내담자의 핵심 욕구: "${coreNeed}"

### [Task]
주어진 컨텍스트를 분석하여, 이 상황이 단순한 성격 차이가 아닌 '서로 다른 기질과 애착 손상이 충돌하여 발생한 관계의 엇갈림(Cycle)'임을 객관화하여 해부하는 리포트를 작성하세요.

### [Core Generation Rules]
1. 관계의 역동 해부 (EFT & 이마고 관점)
   - 내담자의 기질(${userElement}, ${userMbti})과 상대방의 기질(${partnerElement}, ${partnerMbti})이 갈등 상황(${partnerAction})에서 어떻게 충돌하는지 구조적으로 묘사하세요.
   - 상대방의 날 선 방어기제 뒤에 숨겨진 '애착 불안'과 '책임감/무력감'의 실체를 번역해 주어, 내담자가 상대를 이해할 수 있게 하세요.
   - 동시에 내담자가 왜 그 행동에 유독 깊은 상처를 받았는지(치열한 노력, 자립심, 혹은 존재 가치의 훼손 등)를 깊이 공감하고 수용해 주세요.

2. 문체 및 호칭 (Crucial!)
   - 절대 '유저', '유저님', '사용자'라는 단어를 사용하지 마세요. 내담자를 지칭할 때는 2인칭 주어인 '당신' 또는 '그대'로 우아하게 대체해 주세요.
   - 차가운 진단서 톤(~로 해석됩니다)은 배제하고, 내 상처를 어루만지는 베스트셀러 심리 에세이 작가의 부드럽고 우아한 어조(~였을지도 모릅니다, ~아녔을까요?)로 작성하세요.
   - [중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현하세요.

3. [실전 핑퐁 시나리오 생성 (premium_scenario_expansion)]
   - step1_action: 내담자가 상대에게 비난 없이 자신의 구체적 상처(\${userConcern} 요약)와 경계선을 솔직하게 전하는 1차 화법. [최소 3~4문장 필수 / 평소 유저가 쓰는 반말 구어체 말투 유지]
   - expected_reactions: 상대방이 보일 수 있는 예상 반응 배열 (반드시 객체 배열 형태로 생성). 예: [{"type":"A","text":"상대방 핑계 대사"},{"type":"B","text":"상대가 화를 내는 대사"}]
   - step2_cushion: 상대의 반응을 수용하면서도 내 진짜 의도와 구체적 상황을 짚는 단단한 쿠션어 방어 멘트. [최소 3~4문장 필수]
   - step3_timeout: 감정을 배제하고 행동 팩트를 지적하며 단호하게 대화를 중단하는 타임아웃 선언 멘트. [최소 3~4문장 필수]

4. [statusStatement 생성 절대 규칙]
   - 감정 공감/위로/인사말 절대 금지: "속상했겠다", "힘들었죠" 등 유저의 감정을 위로하는 문장은 무조건 제외할 것.
   - 좌표축 키워드 강제 활용: AI가 계산한 두 사람의 위치를 바탕으로, 지도 축에 적힌 단어('혼자 삼키는', '알아달라 외치는', '나를 보호하고 싶은', '연결되고 싶은')의 의미를 반드시 차용해서 문장을 구성할 것.
   - 관계 역학 묘사: 두 사람이 어떤 궤도에서 부딪히고 있는지 팩트만 은유적으로 묘사할 것.
     [좌표별 출력 예시]
     * 둘 다 우측 하단일 때: ❝서로 상처받지 않으려 방어벽을 치고, 내 마음만 알아달라 외치며 부딪히고 있어요.❞
     * 한 명은 좌측, 한 명은 우측일 때: ❝한 사람은 동굴로 숨고, 한 사람은 문을 두드리며 엇갈리는 중이네요.❞
   - 반드시 이 톤앤매너와 구조를 지켜서 20자 내외의 짧고 통찰력 있는 한 문장으로만 출력할 것.

5. [안전성 및 예외 처리(Edge Case) 규칙] - 가장 중요!
   - 유저 입력(상황과 감정)을 분석하여 아래 기준에 따라 'statusCode'와 'systemMessage' 판별할 것.
   * DANGER: 가정폭력, 자해, 극단적 선택 등 생명과 안전에 직결된 고위험 상황 암시 시. (systemMessage: "남겨주신 글을 읽고 너무나 마음이 무겁고 걱정됩니다. 지금 겪고 계신 상황은 H.E.R.e의 공간에서 나누는 위로만으로는 부족할 수 있는 깊은 아픔이자 위기입니다. 당신의 안전과 생명보다 중요한 것은 없습니다. 혼자 견디지 마시고, 꼭 지금 당장 전문 기관의 도움을 받으시기를 간곡히 부탁드립니다.")
   * PROFANITY: 상황 설명 없이 상대를 향한 원색적인 비난과 욕설로만 가득 찬 경우. (systemMessage: "적어주신 거친 문장들 속에서, 역설적으로 그동안 얼마나 많이 참고 상처받아 오셨는지가 느껴져 마음이 아픕니다. 마음이 조금 진정되신다면, 언제든 다시 오셔서 진짜 아팠던 속마음을 차분히 들려주세요.")
   * INSUFFICIENT: "아 짜증나" 등 상황 맥락이 없이 의미 없는 단어만 반복되거나 분석이 불가능할 정도로 짧은 경우. (systemMessage: "지금 얼마나 화가 나고 답답하신지 그 감정의 크기는 온전히 전해져요. 하지만 상황에 대한 조각이 조금 부족하네요. 어떤 상황이었는지 조금만 더 구체적으로 들려주시겠어요?")
   * NORMAL: 위 세 가지에 해당하지 않는 정상적인 분석 가능 상태.
   * statusCode가 NORMAL이 아닐 경우 다른 모든 항목(map_data, mind_prescription 등)은 기본값이나 빈 문자열로 반환하고 오직 statusCode와 systemMessage만 정확히 반환할 것.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "statusCode": "NORMAL",
  "systemMessage": "",
  "map_data": {
    "user": { "x": 0.0, "y": 0.0 },
    "partner": { "x": 0.0, "y": 0.0 }
  },
  "firstWord": "유저의 마음을 다독이는 다정하고 짧은 첫 마디",
  "statusStatement": "현재 두 사람의 물리적, 심리적 엇갈림을 묘사하는 1문장 (감정 위로 절대 금지)",
  "mind_prescription": "EFT/이마고 치료 기반으로 두 사람의 부정적 고리를 설명하고 위로하는 본문 (3~4문장)",
  "share_main_sentence": "카톡 공유 카드 중앙에 들어갈 핵심 진심 문구 (1~2문장)",
  "share_sub_sentence": "핵심 문구 아래 들어갈 부드럽게 대화를 여는 덧붙이는 말 (1문장)",
  "extracted_emotions": ["감정1", "감정2"],
  "premium_teaser": "심층 분석에 대한 호기심을 극대화하는 한 줄의 훅(Hook) 문구",
  "premium_deepdive_report": {
    "core_conflict_mechanism": "두 사람의 기질적 차이가 어떻게 반복되는 방어기제의 충돌을 만들어내는지 심층 분석 (3~4문장)",
    "unconscious_projection": "상대방의 행동 아래 숨겨진 결핍이나 불안이 무엇이며, 유저가 왜 이 행동에 아프게 반응(투사)하는지 다세대적 관점에서 해석 (3~4문장)",
    "healing_insight": "서로의 내면 아이를 안아주기 위한 심리학적 통찰 제시 (2~3문장)"
  },
  "premium_scenario_expansion": {
    "stage_1_soft_boundary": "[3~4문장] 부드럽게 경계선 긋기 (반말 구어체)",
    "expected_reaction_A": "[직접 인용구(\"\")] 상대의 억울함/서운함 핑계 대사",
    "expected_reaction_B": "[직접 인용구(\"\")] 상대가 더 크게 폭발하거나 무례하게 선을 넘는 대사",
    "stage_2_cushion_response": "[3~4문장] 예상 반응에 대한 쿠션어 대처",
    "stage_3_firm_timeout": "[3~4문장] 단호한 타임아웃 선언"
  }
}`;

  return sendPromptToGemini(prompt);
};

/**
 * 4. 나의 방(비밀의 방앗간) 내면 성찰 분석 엔진
 */
export const fetchGeminiSelfAnalysis = async (inputEvent, inputThoughtEmotion, userName = '당신', mbti = '', sajuElement = '', coordsDesc = '') => {
  const prompt = `Role: 너는 상처받은 내면 아이(Inner Child)를 무조건적으로 수용하고 안아주는 다정한 심리 상담사이자 명리/성격 분석가야.
Task: 유저가 입력한 사건("${inputEvent}")과 생각/감정("${inputThoughtEmotion}")을 분석하여 내면 아이를 치유하는 다정한 위로 리포트를 3단계 심층 분석으로 생성하라.
유저 정보: 이름(${userName}), MBTI(${mbti}), 명리학적 기질(${sajuElement}), 현재 마음의 좌표(${coordsDesc}).

Guideline:
1. 무조건적 수용: 유저가 어떤 감정이나 파괴적인 생각을 적었더라도 절대로 비난하거나 교정하려 하지 말고, "그 상황에서는 충분히 그렇게 느낄 수 있었다"고 온전히 공감하고 수용할 것.
2. 내면 아이 위로: 어른의 잣대로 상황을 재단하지 말고, 그 이면에 상처받고 웅크린 내면 아이의 진짜 욕구를 찾아 다정하게 안아줄 것.
3. 톤앤매너: 따뜻하고 부드러운 어조를 유지하며, 지시하거나 훈계하는 말투를 절대 피하고 따뜻한 위로의 문장으로 작성할 것.
4. [중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현할 것.
5. [안전성 및 예외 처리(Edge Case) 규칙] - 가장 중요!
- 유저 입력(사건과 감정)을 분석하여 아래 기준에 따라 'statusCode'와 'systemMessage'를 판별할 것.
* DANGER: 가정폭력, 자해, 극단적 선택 등 생명과 안전에 직결된 고위험 상황 암시 시.
* PROFANITY: 상황 설명 없이 상대를 향한 원색적인 비난과 욕설로만 가득 찬 경우.
* INSUFFICIENT: "아 짜증나" 등 상황 맥락이 없이 의미 없는 단어만 반복되거나 분석이 불가능할 정도로 짧은 경우.
* NORMAL: 위 세 가지에 해당하지 않는 정상적인 분석 가능 상태.
* statusCode가 NORMAL이 아닐 경우 다른 모든 항목은 기본값이나 빈 문자열로 반환하고 오직 statusCode와 systemMessage만 정확히 반환할 것.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "statusCode": "NORMAL",
  "systemMessage": "",
  "empathy_acceptance": "유저의 감정을 100% 수용하는 공감 텍스트 (단락을 두 문장 단위로 나누어 줄바꿈(\\n\\n) 포함) (4~5문장). [주의] '당신을 위한 H.E.R.e의 진심' 같은 소제목을 절대 출력하지 말고 바로 본문부터 시작할 것.",
  "deep_analysis_1_voice": "현재 마음의 좌표(${coordsDesc})를 한 문장으로 언급하며 시작할 것. 이후 유저가 입력한 상황에 대해 왜 이런 반응이나 패턴이 생겼는지 밑에 깔린 믿음과 두려움을 파고들어 짚어줄 것. 유저의 기질(${sajuElement}의 성질)과 MBTI 성향(${mbti})의 특징(예: 완벽주의, 통제감 등)을 바탕으로 분석하되, '명리학적 기질', '수(水)', 'MBTI' 같은 개념어를 직접 노출하지 말고 오직 그 성질(예: 물처럼 깊이 있게 사고하고 섬세하게 감각하는 특성 등)만 자연스러운 문장으로 녹여서 표면 감정 너머의 원인을 분석할 것 (4~5문장).",
  "deep_analysis_2_inner_child": "위에서 분석한 원인(인정 욕구, 결핍 등)을 상처받은 '내면 아이' 관점에서 조명할 것. 겉으로는 괜찮은 척 어른스럽게 굴지만 속으로 힘든 그 간극이 왜 생기는지 짧게 짚고, 그 내면 아이를 따뜻하게 안아주는 치유의 텍스트로 마무리할 것 (4~5문장).",
  "deep_analysis_3_action": "일반적인 힐링 팁(호흡, 휴식 등) 하나와, 사용자가 입력한 구체적 상황에 실제로 적용 가능한 행동 제안 하나를 반드시 포함하여 작성할 것 (3~4문장)."
}`;

  return sendPromptToGemini(prompt);
};

/**
 * 5. 프리미엄 월간 심리 성장 리포트 분석 엔진
 */
export const fetchGeminiMonthlyAnalytics = async (userName, monthlyMockData) => {
  const prompt = `Role: 너는 데이터를 기반으로 내담자가 모르는 무의식적 패턴과 성장을 예리하게 짚어주는 따뜻하고 전문적인 심리 상담사야.
Task: 유저의 가상의 한 달 치 감정 데이터 통계("${monthlyMockData}")를 분석하여 월간 심리 성장 리포트를 생성하라.
Guideline:
1. 톤앤매너: 단호하지만 따뜻한 어른의 목소리. 존댓말('~습니다', '~군요') 사용. 과도한 이모티콘 금지.
2. [중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현할 것.
3. [안전성 규칙]
- DANGER: 가정폭력, 자해, 극단적 선택 암시 시 statusCode: DANGER 반환
- PROFANITY: 단순 욕설만 가득한 경우 statusCode: PROFANITY 반환
- NORMAL: 정상적인 분석 가능 상태인 경우.
- INSUFFICIENT: "아 짜증나" 등 상황 맥락이 없이 의미 없는 단어만 반복되거나 분석이 불가능할 정도로 짧은 경우.
- statusCode가 NORMAL이 아닐 경우 다른 모든 항목은 기본값이나 빈 문자열로 반환하고 오직 statusCode와 systemMessage만 정확히 반환할 것.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "premium_monthly_analytics": {
    "monthly_theme_title": "한 달간의 심리적 변화를 은유적이고 통찰력 있게 요약한 제목.",
    "highlight_badges": ["📉 불안 지수 30%", "📈 회복 탄력성 20% 증가"], // 데이터 기반 핵심 성장 및 감정 수치 뱃지 텍스트 2개
    "growth_evidence_data": "[필수: 2문장 단위로 줄바꿈(\\n\\n) 할 것. 유저의 단순 감정 증감뿐만 아니라, 앱에서 제공한 대화법 등을 사용하기 전후의 '감정 온도 변화(Pre-Post)'를 분석하여 기재할 것. (예: 실전 대화 시나리오를 사용한 날, 대화 전 80점이었던 분노 지수가 대화 후 30점으로 안정되는 패턴을 보였습니다.)",
    "trigger_pattern_insight": "[필수: 2문장 단위로 줄바꿈(\\n\\n) 할 것. 특정 감정의 반복 패턴을 객관적으로 분석하여 알려줄 것.",
    "next_month_mission": "[1~2문장] 단순한 방향성 제시가 아니라, 전문 심리 코치가 내어주는 '다음 달의 마음 PT 훈련 과제' 형태로 구체적인 실천 미션을 출력할 것."
  }
}`;

  return sendPromptToGemini(prompt);
};

/**
 * 6. 일정(Event) 맥락 기반 오늘의 지지 포인트 예고 문구 생성
 */
export const fetchGeminiProactivePreview = async (eventTitle, eventType) => {
  const prompt = `Role: 당신은 내담자의 상황과 일정을 파악하고, 그에 맞는 따뜻한 지지와 예보를 건네는 심리 상담가야.
Task: 유저의 오늘 일정(제목: "${eventTitle}", 타입: "${eventType}")을 분석하여, 유저가 하루를 준비하며 마인드셋을 가다듬을 수 있는 1문장의 지지 포인트(예고 문구)를 생성하라.
Guideline:
1. 일정의 특성(예: 중요한 회의, 발표 등)을 파악하여, 긴장감을 풀어주거나 자연스러운 과정을 중시하는 방향으로 조언할 것.
2. 부드러운 구어체('~해 보세요', '~어떨까요?')를 사용할 것.
3. 딱 1문장으로 짧고 명료하게 작성할 것.
4. [중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현할 것.

아래 JSON 형식으로만 응답할 것 (마크다운 코드블록 없이 순수 JSON만 반환):
{
  "preview_sentence": "생성된 1문장"
}`;

  try {
    const data = await sendPromptToGemini(prompt);
    return data?.preview_sentence || '오늘은 조급함을 내려놓고 당신만의 속도를 존중하는 법을 알려줄게요.';
  } catch (error) {
    console.error('Proactive Preview Generation Error:', error);
    return '오늘은 조급함을 내려놓고 당신만의 속도를 존중하는 법을 알려줄게요.';
  }
};

/**
 * 7. 부부 관계 분석 (App.jsx 호환용 - positional args)
 * 호출: fetchGeminiCoupleAnalysis(text, action, partnerName, emotionStr, goal, coreNeed, userName)
 */
export const fetchGeminiCoupleAnalysis = async (
  userConcern, partnerAction, partnerName,
  emotionStr = '', goal = '', coreNeed = '', userName = '당신'
) => {
  return fetchGeminiRelationshipAnalysisV2({
    userName,
    userMbti: '',
    userElement: emotionStr,
    partnerName,
    partnerMbti: '',
    partnerElement: '',
    relationshipType: '부부',
    userConcern,
    partnerAction,
    coreNeed
  });
};

/**
 * 8. 가족 관계 분석 (App.jsx 호환용 - positional args)
 * 호출: fetchGeminiFamilyAnalysis(text, action, partnerName, emotionStr, goal, coreNeed, userName)
 */
export const fetchGeminiFamilyAnalysis = async (
  userConcern, partnerAction, partnerName,
  emotionStr = '', goal = '', coreNeed = '', userName = '당신'
) => {
  return fetchGeminiRelationshipAnalysisV2({
    userName,
    userMbti: '',
    userElement: emotionStr,
    partnerName,
    partnerMbti: '',
    partnerElement: '',
    relationshipType: '가족',
    userConcern,
    partnerAction,
    coreNeed
  });
};

/**
 * 9. 대인관계 분석 (경계선/대인관계 심리학 기반)
 * 호출: fetchGeminiRelationshipAnalysis(text, action, partnerName, relationType, defenseStyle, userName)
 */
export const fetchGeminiRelationshipAnalysis = async (
  userConcern, partnerAction, partnerName,
  relationType = '지인', defenseStyle = '부드럽고 우아한 화제 전환', userName = '당신'
) => {
  const prompt = `### [Role]
당신은 대인관계 심리학(Interpersonal Psychology)과 경계선 이론(Boundary Theory)을 마스터한 예리하고 단단한 심리 코치이자 소셜 가이드입니다.

### [Task]
유저가 입력한 상황("${userConcern}")과 상대방의 행동("${partnerAction}")을 분석하여, 나를 보호하고 건강한 심리적 거리를 확보할 수 있는 심층 관계 처방전과 실전 페르소나 화법을 생성하라.

### [Input Context]
- 대상 호칭: "${partnerName}"
- 나와의 관계: "${relationType}"
- 내담자 이름: "${userName}"
- 유저가 원하는 방어 태세: "${defenseStyle}"

### [Guideline]
1. 경계선 침범 패턴: 관계 패턴과 기질, 심리적 거리를 분석하여 갈등 원인을 확립할 것.
2. 페르소나 화법 제안: 방어 스타일("${defenseStyle}")을 적용한 이성적이고 단호한 실전 스크립트를 제공할 것.
3. 마인드셋 문장: 당신이 통제권을 쥐고 있다는 2~3단어 길이의 강렬한 자기 확언.
4. [중요] 응답에 별표(**)나 마크다운 문법을 절대 사용하지 말고, 강조하고 싶은 부분은 그냥 자연스러운 문장으로 표현할 것.
5. [안전성 예외 처리] DANGER/PROFANITY/INSUFFICIENT/NORMAL 판별.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "statusCode": "NORMAL",
  "systemMessage": "",
  "extracted_emotions": ["감정1", "감정2"],
  "statusStatement": "관계 상태를 명확히 진단하는 한 줄 정의",
  "boundary_report": "대인관계 심리학 기반 분석 리포트 (3~4문장)",
  "persona_script": "선택한 방어 태세에 맞춘 실전 대화 스크립트 (1~2문장)",
  "shield_affirmation": "오늘의 방패 문장 (1문장)",
  "premium_teaser": "심층 분석 훅 문구",
  "premium_deepdive_report": {
    "core_conflict_mechanism": "심층 분석 (3~4문장)",
    "unconscious_projection": "무의식 투사 해석 (3~4문장)",
    "healing_insight": "치유 통찰 (2~3문장)"
  },
  "premium_scenario_expansion": {
    "stage_1_soft_boundary": "1단계 부드러운 경계",
    "expected_reaction_A": "\"상대방 반응 예시 A\"",
    "stage_2_cushion_response": "2단계 쿠션 응답",
    "expected_reaction_B": "\"상대방 반응 예시 B\"",
    "stage_3_firm_timeout": "3단계 단호한 타임아웃"
  }
}`;
  return sendPromptToGemini(prompt, { userConcern, partnerAction, partnerName, relationType, defenseStyle, userName });
};

/**
 * 10. 다정한 상담소 채팅 응답 엔진 (안전 가드레일 포함)
 */
export const fetchCounselingReply = async (counselorId, userName, userText, options = {}) => {
  const { isSuggestWrapUp, isForceWrapUp, chatHistory } = options;
  let roleSpecificGuideline = '';
  if (counselorId === 'inner') {
    roleSpecificGuideline = `[페르소나: 나의 마음 상담사]
- 이론적 배경: 내면 아이 치료, 자아 존중감 이론, 인지행동치료(CBT)/감정 명명하기
- 역할: 개인의 번아웃, 완벽주의, 불안, 자존감 문제를 다정하게 수용하고 위로합니다. 내담자의 감정 기저에 있는 어린 시절의 상처나 왜곡된 생각 패턴을 부드럽게 짚어줍니다.`;
  } else if (counselorId === 'family') {
    roleSpecificGuideline = `[페르소나: 가족 코치]
- 이론적 배경: 사티어의 5대 의사소통 유형 분석, 이야기 치료의 '문제의 외재화', 다세대 가족 체계 이론
- 역할: 가족 갈등을 개인의 잘못이 아닌 기질과 세대 차이, 얽힌 시스템으로 풀어내어 내담자의 죄책감을 덜어주고 부드러운 코칭을 제공합니다.`;
  } else if (counselorId === 'relation') {
    roleSpecificGuideline = `[페르소나: 관계 & 부부 멘토]
- 이론적 배경: 이마고 부부치료(반영-인정-공감), 정서중심치료(EFT)/애착 이론, 비폭력대화(NVC)/I-Message
- 역할: 표면적인 분노나 갈등 아래 숨겨진 애착 욕구와 두려움을 짚어주고, 평가나 판단 없이 건강한 경계선과 연결 대화법을 제안합니다.`;
  }

  const prompt = `### [Role]
당신은 H.E.R.e 마음 상담실의 전문 심리 상담사입니다. 
${roleSpecificGuideline}

### [Input Context]
- 내담자 이름: "${userName}"
${chatHistory ? `- 이전 대화 내역 (최근 6개 메시지):\n${chatHistory}\n` : ''}- 내담자의 최신 입력 메시지: "${userText}"

### [Guideline: 일반 톤앤매너 및 소크라테스식 대화법]
1. 내담자의 이름을 다정하게 부르며, "유저", "사용자", "내담자" 같은 기계적 호칭을 절대 사용하지 마세요.
2. "~로 해석됩니다", "~라고 보여집니다" 같은 차갑고 기계적인 진단서 어투를 절대 금지합니다. 마주 앉아 따뜻한 차를 내어주듯 다정하고 포근하게 2~3문장으로 작성하세요.
3. 응답에 마크다운 별표(**)를 남발하지 말고 자연스럽게 위로를 건네세요.
4. 답변은 공감과 통찰을 전한 뒤, 마지막 문장을 부드러운 열린 질문으로 마무리하세요.
   - 예/아니오로 답할 수 있는 폐쇄형 질문("~하셨나요?")보다는, 사용자가 스스로 생각해보게 만드는 열린 질문("~은 어떠셨어요?", "그럴 때 어떤 마음이 드셨어요?")을 사용하세요.
   - 매 응답마다 기계적으로 똑같은 패턴의 질문을 반복하지 말고, 대화 맥락에 맞게 자연스럽게 다른 질문을 던지세요.
   - 통찰 없이 질문만 던지지 말고, 반드시 공감/통찰 먼저 전한 후 질문으로 마무리하세요.

### [대화 맥락 추적 규칙]
- 질문을 던지기 전에, 지금까지의 대화(이전 대화 내역)에서 이미 물어봤던 질문의 '종류'를 확인하세요. 표현만 다르고 실질적으로 같은 내용을 다시 묻지 마세요. (예: "어떤 마음이 드셨어요?"와 "어떤 생각이 느껴지세요?"는 다른 문장이지만 같은 종류의 질문입니다.)
- 사용자가 이미 감정/생각을 답변했다면, 그 답변 내용을 반드시 반영해서 다음 질문을 만드세요. 답변을 무시하고 이전과 같은 범주의 질문으로 되돌아가지 마세요.
- 만약 직전 상담사 응답에서 스스로 어떤 가설이나 추측(예: 과거 경험, 특정 패턴)을 제시했다면, 다음 질문은 반드시 그 가설을 확인하거나 더 파고드는 방향이어야 합니다. 가설을 던져놓고 무관한 일반 질문으로 돌아가지 마세요.

${isForceWrapUp ? `### [특별 지시: 대화 마무리 (사용자 요청)]
- 사용자가 명시적으로 대화 마무리를 요청했습니다.
- 앞선 4번 규칙(질문으로 마무리)은 무시하세요.
- 오늘 나눈 대화를 짧게 요약하고, 따뜻한 응원 한마디로 부드럽게 작별 인사를 건네며 대화를 종료하세요. (절대 질문으로 끝내지 마세요)` : ''}
${isSuggestWrapUp && !isForceWrapUp ? `### [특별 지시: 대화 마무리 제안]
- 대화가 어느 정도 길어졌습니다.
- 앞선 4번 규칙(일반적인 질문으로 마무리) 대신, 이번 응답의 마지막에는 딱 1번만 대화 마무리를 제안하는 질문을 던지세요.
- 예: "...오늘은 여기까지 이야기 나눠볼까요? 아니면 조금 더 나누고 싶으신 부분이 있으실까요?"
- 한 응답에 질문이 두 개 겹치지 않도록 주의하세요.` : ''}

### [안전 가드레일 (Safety Guardrails) - 최우선 평가]
사용자의 메시지를 분석하여 아래 4가지 상태 중 하나를 'statusCode'로 분류하세요.
- DANGER: 자해, 자살, 폭력, 가정폭력 등 생명과 안전을 위협하는 심각한 위기 상황. 
  -> AI 분석과 상담을 즉시 중단합니다. 'reply'는 빈 문자열로 두고, 'statusCode'를 "DANGER"로 설정하세요. 'systemMessage'에 반드시 다음 문구를 반환하세요: "${userName} 님, 남겨주신 글을 읽고 너무나 마음이 무겁고 걱정됩니다. 지금 겪고 계신 상황은 H.E.R.e의 공간에서 나누는 위로만으로는 부족할 수 있는 깊은 아픔이자 위기입니다. ${userName} 님의 안전과 생명보다 중요한 것은 없습니다. 혼자 견디지 마시고, 꼭 지금 당장 전문 기관의 도움을 받으시기를 간곡히 부탁드립니다."
- PROFANITY: 심한 욕설이나 원색적 비난.
  -> 훈계하거나 차단하지 말고, 분노 이면에 숨겨진 상처와 답답함을 부드럽게 짚어주며 톤다운을 유도하는 응답을 'reply'에 작성하세요.
- INSUFFICIENT: 단어 하나("응", "아니", "몰라") 등 맥락을 파악할 수 없을 정도로 짧은 단답.
  -> 다정하게 상황이나 감정을 조금 더 자세히 들려달라고 재요청하는 응답을 'reply'에 작성하세요.
- OK: 위 세 가지에 해당하지 않는 일반적인 고민이나 대화.
  -> 'reply'에 페르소나와 톤앤매너에 맞춘 다정한 상담 응답을 작성하세요.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "statusCode": "DANGER" | "PROFANITY" | "INSUFFICIENT" | "OK",
  "reply": "AI 상담사의 응답 (DANGER일 경우 빈 문자열)",
  "systemMessage": "DANGER 상태일 때만 출력할 시스템 위기 안내 메시지. 그 외에는 빈 문자열"
}`;

  return sendPromptToGemini(prompt);
};

