const fs = require('fs');

let code = fs.readFileSync('src/services/aiEngine.js', 'utf8');

const lines = code.split('\n');

const schemas = {
  // 1
  morningLetter: `{\n    type: 'OBJECT',\n    properties: {\n      letter: { type: 'STRING' },\n      affirmation: { type: 'STRING' },\n      keywords: { type: 'ARRAY', items: { type: 'STRING' } }\n    },\n    required: ['letter', 'affirmation', 'keywords']\n  }`,
  // 2
  followUp: `{\n    type: 'OBJECT',\n    properties: {\n      question: { type: 'STRING' },\n      chips: { type: 'ARRAY', items: { type: 'STRING' } }\n    },\n    required: ['question', 'chips']\n  }`,
  // 3
  v2: `{\n    type: 'OBJECT',\n    properties: {\n      statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] },\n      systemMessage: { type: 'STRING' },\n      map_data: {\n        type: 'OBJECT',\n        properties: {\n          user: { type: 'OBJECT', properties: { x: { type: 'NUMBER' }, y: { type: 'NUMBER' } }, required: ['x', 'y'] },\n          partner: { type: 'OBJECT', properties: { x: { type: 'NUMBER' }, y: { type: 'NUMBER' } }, required: ['x', 'y'] }\n        },\n        required: ['user', 'partner']\n      },\n      firstWord: { type: 'STRING' },\n      statusStatement: { type: 'STRING' },\n      mind_prescription: { type: 'STRING' },\n      share_main_sentence: { type: 'STRING' },\n      share_sub_sentence: { type: 'STRING' },\n      extracted_emotions: { type: 'ARRAY', items: { type: 'STRING' } },\n      partnerWindow: { type: 'STRING' },\n      premium_teaser: { type: 'STRING' }\n    },\n    required: ['statusCode', 'systemMessage', 'map_data', 'firstWord', 'statusStatement', 'mind_prescription', 'share_main_sentence', 'share_sub_sentence', 'extracted_emotions', 'partnerWindow', 'premium_teaser']\n  }`,
  // 4
  self: `{\n    type: 'OBJECT',\n    properties: {\n      statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] },\n      systemMessage: { type: 'STRING' },\n      empathy_acceptance: { type: 'STRING' },\n      deep_analysis_1_voice: { type: 'STRING' },\n      deep_analysis_2_inner_child: { type: 'STRING' },\n      deep_analysis_3_action: { type: 'STRING' }\n    },\n    required: ['statusCode', 'systemMessage', 'empathy_acceptance', 'deep_analysis_1_voice', 'deep_analysis_2_inner_child', 'deep_analysis_3_action']\n  }`,
  // 5
  monthly: `{\n    type: 'OBJECT',\n    properties: {\n      premium_monthly_analytics: {\n        type: 'OBJECT',\n        properties: {\n          monthly_theme_title: { type: 'STRING' },\n          highlight_badges: { type: 'ARRAY', items: { type: 'STRING' } },\n          growth_evidence_data: { type: 'STRING' },\n          trigger_pattern_insight: { type: 'STRING' },\n          next_month_mission: { type: 'STRING' }\n        },\n        required: ['monthly_theme_title', 'highlight_badges', 'growth_evidence_data', 'trigger_pattern_insight', 'next_month_mission']\n      }\n    },\n    required: ['premium_monthly_analytics']\n  }`,
  // 6
  preview: `{\n    type: 'OBJECT',\n    properties: {\n      preview_sentence: { type: 'STRING' }\n    },\n    required: ['preview_sentence']\n  }`,
  // 7
  boundary: `{\n    type: 'OBJECT',\n    properties: {\n      statusCode: { type: 'STRING', enum: ['NORMAL', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] },\n      systemMessage: { type: 'STRING' },\n      extracted_emotions: { type: 'ARRAY', items: { type: 'STRING' } },\n      statusStatement: { type: 'STRING' },\n      boundary_report: { type: 'STRING' },\n      persona_script: { type: 'STRING' },\n      shield_affirmation: { type: 'STRING' },\n      premium_teaser: { type: 'STRING' }\n    },\n    required: ['statusCode', 'systemMessage', 'extracted_emotions', 'statusStatement', 'boundary_report', 'persona_script', 'shield_affirmation', 'premium_teaser']\n  }`,
  // 8
  counseling: `{\n    type: 'OBJECT',\n    properties: {\n      statusCode: { type: 'STRING', enum: ['OK', 'DANGER', 'PROFANITY', 'INSUFFICIENT'] },\n      reply: { type: 'STRING' },\n      systemMessage: { type: 'STRING' }\n    },\n    required: ['statusCode', 'reply', 'systemMessage']\n  }`,
  // 9
  deepDiveRelationship: `{\n    type: 'OBJECT',\n    properties: {\n      core_conflict_mechanism: { type: 'STRING' },\n      unconscious_projection: { type: 'STRING' },\n      healing_insight: { type: 'STRING' },\n      premium_scenario_expansion: {\n        type: 'OBJECT',\n        properties: {\n          stage_1_soft_boundary: { type: 'STRING' },\n          stage_2_cushion_response: {\n            type: 'OBJECT',\n            properties: {\n              expected_reaction_A: { type: 'STRING' },\n              response: { type: 'STRING' }\n            },\n            required: ['expected_reaction_A', 'response']\n          },\n          stage_3_firm_timeout: {\n            type: 'OBJECT',\n            properties: {\n              expected_reaction_B: { type: 'STRING' },\n              response: { type: 'STRING' }\n            },\n            required: ['expected_reaction_B', 'response']\n          }\n        },\n        required: ['stage_1_soft_boundary', 'stage_2_cushion_response', 'stage_3_firm_timeout']\n      }\n    },\n    required: ['core_conflict_mechanism', 'unconscious_projection', 'healing_insight', 'premium_scenario_expansion']\n  }`,
  // 10
  deepDiveSelf: `{\n    type: 'OBJECT',\n    properties: {\n      inner_pattern_mechanism: { type: 'STRING' },\n      inner_child_origin: { type: 'STRING' },\n      healing_insight: { type: 'STRING' }\n    },\n    required: ['inner_pattern_mechanism', 'inner_child_origin', 'healing_insight']\n  }`
};

// Update sendPromptToGemini body
lines[34] = "    if (options.maxOutputTokens !== undefined) {\n      requestBody.maxOutputTokens = options.maxOutputTokens;\n    }\n    if (options.responseSchema) {\n      requestBody.responseSchema = options.responseSchema;\n      requestBody.responseMimeType = 'application/json';\n    }";

// Replacements by line numbers we found earlier (0-indexed)
lines[155] = `  return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.morningLetter} });`;
lines[185] = `  return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.followUp} });`;
lines[278] = `  return sendPromptToGemini(prompt, null, { maxOutputTokens: 2048, responseSchema: ${schemas.v2} });`;
lines[312] = `  return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.self} });`;
lines[342] = `  return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.monthly} });`;
lines[363] = `    const data = await sendPromptToGemini(prompt, null, { responseSchema: ${schemas.preview} });`;
lines[474] = `  return sendPromptToGemini(prompt, { userConcern, partnerAction, partnerName, relationType, defenseStyle, userName }, { maxOutputTokens: 2048, responseSchema: ${schemas.boundary} });`;
lines[556] = `  return sendPromptToGemini(prompt, null, { responseSchema: ${schemas.counseling} });`;
lines[649] = `  return sendPromptToGemini(prompt, { userName, partnerName, userConcern }, { maxOutputTokens: 3000, responseSchema: ${schemas.deepDiveRelationship} });`;
lines[723] = `  return sendPromptToGemini(prompt, { userName, userConcern, userEmotion }, { maxOutputTokens: 2500, responseSchema: ${schemas.deepDiveSelf} });`;

fs.writeFileSync('src/services/aiEngine.js', lines.join('\n'));
console.log('Patch complete.');
