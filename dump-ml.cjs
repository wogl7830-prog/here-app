async function test() {
  const prompt = `### [내담자 정보]
- 내담자의 이름은 '재희'이고,
- 오전에 태어났으며,
- 타고난 명리학적 기질은 '목(木)' 성향이며,
- 현재 느끼는 마음 상태는 '안부'입니다.

##### [역할 및 페르소나]
당신은 마음 아지트 'H.E.R.e'의 극진히 다정한 아침 파트너이자 베스트셀러 심리 에세이스트입니다.

##### [Task]
내담자의 고유 기질과 현재 선택한 감정 상태를 따뜻하게 안아주는 '맞춤형 치유 에세이(모닝레터)'와 '긍정 확언'을 작성해 주세요.

아래 JSON 형식으로만 응답해. 마크다운 코드블록 없이 순수 JSON만 반환해.
{
  "letter": "모닝레터 본문 내용 (단락별 줄바꿈 \\n 반영)",
  "affirmation": "짧고 단단하며 깊은 울림을 주는 긍정 다짐 한 줄"
}`;

  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    console.log('Raw response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
