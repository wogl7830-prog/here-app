const fs = require('fs');

let code = fs.readFileSync('src/services/aiEngine.js', 'utf8');

// 1. sendPromptToGemini config
code = code.replace(
  "if (options.maxOutputTokens !== undefined) {\n      requestBody.maxOutputTokens = options.maxOutputTokens;\n    }",
  "if (options.maxOutputTokens !== undefined) {\n      requestBody.maxOutputTokens = options.maxOutputTokens;\n    }\n    if (options.responseSchema) {\n      requestBody.responseSchema = options.responseSchema;\n      requestBody.responseMimeType = 'application/json';\n    }"
);

// We define schemas directly as JS strings of object literals so they evaluate nicely.
const schemas = {
  morningLetter: "{ type: 'OBJECT', properties: { letter: { type: 'STRING' }, affirmation: { type: 'STRING' }, keywords: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['letter', 'affirmation', 'keywords'] }",
  followUp: "{ type: 'OBJECT', properties: { question: { type: 'STRING' }, chips: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['question', 'chips'] }",
  v2: "{ type: 'OBJECT', properties: { statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] }, systemMessage: { type: 'STRING' }, map_data: { type: 'OBJECT', properties: { user: { type: 'OBJECT', properties: { x: { type: 'NUMBER' }, y: { type: 'NUMBER' } }, required: ['x', 'y'] }, partner: { type: 'OBJECT', properties: { x: { type: 'NUMBER' }, y: { type: 'NUMBER' } }, required: ['x', 'y'] } }, required: ['user', 'partner'] }, firstWord: { type: 'STRING' }, statusStatement: { type: 'STRING' }, mind_prescription: { type: 'STRING' }, share_main_sentence: { type: 'STRING' }, share_sub_sentence: { type: 'STRING' }, extracted_emotions: { type: 'ARRAY', items: { type: 'STRING' } }, partnerWindow: { type: 'STRING' }, premium_teaser: { type: 'STRING' } }, required: ['statusCode', 'systemMessage', 'map_data', 'firstWord', 'statusStatement', 'mind_prescription', 'share_main_sentence', 'share_sub_sentence', 'extracted_emotions', 'partnerWindow', 'premium_teaser'] }",
  self: "{ type: 'OBJECT', properties: { statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] }, systemMessage: { type: 'STRING' }, empathy_acceptance: { type: 'STRING' }, deep_analysis_1_voice: { type: 'STRING' }, deep_analysis_2_inner_child: { type: 'STRING' }, deep_analysis_3_action: { type: 'STRING' } }, required: ['statusCode', 'systemMessage', 'empathy_acceptance', 'deep_analysis_1_voice', 'deep_analysis_2_inner_child', 'deep_analysis_3_action'] }",
  monthly: "{ type: 'OBJECT', properties: { premium_monthly_analytics: { type: 'OBJECT', properties: { monthly_theme_title: { type: 'STRING' }, highlight_badges: { type: 'ARRAY', items: { type: 'STRING' } }, growth_evidence_data: { type: 'STRING' }, trigger_pattern_insight: { type: 'STRING' }, next_month_mission: { type: 'STRING' } }, required: ['monthly_theme_title', 'highlight_badges', 'growth_evidence_data', 'trigger_pattern_insight', 'next_month_mission'] } }, required: ['premium_monthly_analytics'] }",
  preview: "{ type: 'OBJECT', properties: { preview_sentence: { type: 'STRING' } }, required: ['preview_sentence'] }",
  boundary: "{ type: 'OBJECT', properties: { statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] }, systemMessage: { type: 'STRING' }, extracted_emotions: { type: 'ARRAY', items: { type: 'STRING' } }, statusStatement: { type: 'STRING' }, boundary_report: { type: 'STRING' }, persona_script: { type: 'STRING' }, shield_affirmation: { type: 'STRING' }, premium_teaser: { type: 'STRING' } }, required: ['statusCode', 'systemMessage', 'extracted_emotions', 'statusStatement', 'boundary_report', 'persona_script', 'shield_affirmation', 'premium_teaser'] }",
  counseling: "{ type: 'OBJECT', properties: { statusCode: { type: 'STRING', enum: ['OK', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] }, reply: { type: 'STRING' }, systemMessage: { type: 'STRING' } }, required: ['statusCode', 'reply', 'systemMessage'] }",
  deepDiveRelationship: "{ type: 'OBJECT', properties: { core_conflict_mechanism: { type: 'STRING' }, unconscious_projection: { type: 'STRING' }, healing_insight: { type: 'STRING' }, premium_scenario_expansion: { type: 'OBJECT', properties: { stage_1_soft_boundary: { type: 'STRING' }, stage_2_cushion_response: { type: 'OBJECT', properties: { expected_reaction_A: { type: 'STRING' }, response: { type: 'STRING' } }, required: ['expected_reaction_A', 'response'] }, stage_3_firm_timeout: { type: 'OBJECT', properties: { expected_reaction_B: { type: 'STRING' }, response: { type: 'STRING' } }, required: ['expected_reaction_B', 'response'] } }, required: ['stage_1_soft_boundary', 'stage_2_cushion_response', 'stage_3_firm_timeout'] } }, required: ['core_conflict_mechanism', 'unconscious_projection', 'healing_insight', 'premium_scenario_expansion'] }",
  deepDiveSelf: "{ type: 'OBJECT', properties: { inner_pattern_mechanism: { type: 'STRING' }, inner_child_origin: { type: 'STRING' }, healing_insight: { type: 'STRING' } }, required: ['inner_pattern_mechanism', 'inner_child_origin', 'healing_insight'] }"
};

// 1. morningLetter
code = code.replace("return sendPromptToGemini(prompt, null, {});", `return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.morningLetter} });`);
// 2. followUp
code = code.replace("return sendPromptToGemini(prompt);", `return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.followUp} });`);
// 3. v2
code = code.replace("return sendPromptToGemini(prompt, null, { maxOutputTokens: 2048 });", `return sendPromptToGemini(prompt, null, { maxOutputTokens: 2048, responseSchema: ${schemas.v2} });`);
// 4. self
code = code.replace("return sendPromptToGemini(prompt);", `return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.self} });`);
// 5. monthly
code = code.replace("return sendPromptToGemini(prompt);", `return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.monthly} });`);
// 6. preview
code = code.replace("const data = await sendPromptToGemini(prompt);", `const data = await sendPromptToGemini(prompt, null, { responseSchema: ${schemas.preview} });`);
// 7. boundary
code = code.replace("return sendPromptToGemini(prompt, { userConcern, partnerAction, partnerName, relationType, defenseStyle, userName }, { maxOutputTokens: 2048 });", `return sendPromptToGemini(prompt, { userConcern, partnerAction, partnerName, relationType, defenseStyle, userName }, { maxOutputTokens: 2048, responseSchema: ${schemas.boundary} });`);
// 8. counseling
code = code.replace("return sendPromptToGemini(prompt);", `return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.counseling} });`);
// 9. deepDiveRelationship
code = code.replace("return sendPromptToGemini(prompt, { userName, partnerName, userConcern }, { maxOutputTokens: 3000 });", `return sendPromptToGemini(prompt, { userName, partnerName, userConcern }, { maxOutputTokens: 3000, responseSchema: ${schemas.deepDiveRelationship} });`);
// 10. deepDiveSelf
code = code.replace("return sendPromptToGemini(prompt, { userName, userConcern, userEmotion }, { maxOutputTokens: 2500 });", `return sendPromptToGemini(prompt, { userName, userConcern, userEmotion }, { maxOutputTokens: 2500, responseSchema: ${schemas.deepDiveSelf} });`);

fs.writeFileSync('src/services/aiEngine.js', code);
console.log('Done!');
