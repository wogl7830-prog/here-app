const fs = require('fs');

let code = fs.readFileSync('src/services/aiEngine.js', 'utf8');

// 1. Update maxOutputTokens in aiEngine.js
code = code.replace(/maxOutputTokens:\s*\d+/g, 'maxOutputTokens: 8192');

// 2. Add retry logic to sendPromptToGemini
// Look for export const sendPromptToGemini = async (prompt, dummyData = null, options = {}) => {
code = code.replace(
  "export const sendPromptToGemini = async (prompt, dummyData = null, options = {}) => {",
  "export const sendPromptToGemini = async (prompt, dummyData = null, options = {}, retries = 1) => {"
);

// We need to replace the try/catch around JSON.parse
const oldParseBlock = `    try {
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
  }`;

const newParseBlock = `    try {
      const parsed = JSON.parse(cleaned);
      console.log('[DEBUG] Analysis Output:', parsed);
      return parsed;
    } catch (parseError) {
      console.error('[DEBUG] JSON Parsing Error. Raw Text:', raw);
      console.error('[DEBUG] Cleaned Text:', cleaned);
      if (retries > 0) {
        console.warn(\`[WARN] JSON Parsing failed. Retrying... (\${retries} retries left)\`);
        return await sendPromptToGemini(prompt, dummyData, options, retries - 1);
      }
      throw new Error('Failed to parse Gemini response as JSON');
    }
  } catch (error) {
    if (retries > 0) {
      console.warn(\`[WARN] API Request failed (\${error.message}). Retrying... (\${retries} retries left)\`);
      return await sendPromptToGemini(prompt, dummyData, options, retries - 1);
    }
    console.error('[DEBUG] Analysis Output Error (aiEngine):', error);
    throw error;
  }`;

if (code.includes('const parsed = JSON.parse(cleaned);')) {
  code = code.replace(oldParseBlock, newParseBlock);
} else {
  console.error("Could not find the parse block to replace.");
}

fs.writeFileSync('src/services/aiEngine.js', code);
console.log('Update complete!');
