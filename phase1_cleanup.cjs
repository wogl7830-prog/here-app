/**
 * Phase 1 Cleanup: Fix remaining setStep calls
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

let changes = 0;

// Fix: setStep('concern') -> goTo('concern') in handleBack result case
const old1 = `else if (step === 'result') setStep('concern');`;
const new1 = `else if (step === 'result') goTo('concern');`;
if (content.includes(old1)) {
  content = content.replace(old1, new1);
  changes++;
  console.log('✅ Fixed: result -> goTo(concern) in handleBack');
}

// Fix: setStep('partner_info') in handleBack concern case (keeps internal step)
// Leave as is since partner_info doesn't have a URL route

// Fix: handleTrackSelect: setStep('concern') -> goTo('concern')
const old2 = `        setStep('concern');\n      } else {\n        setStep('partner_info');`;
const new2 = `        goTo('concern');\n      } else {\n        setStep('partner_info');`;
if (content.includes(old2)) {
  content = content.replace(old2, new2);
  changes++;
  console.log('✅ Fixed: handleTrackSelect -> goTo(concern)');
}

// Fix: setStep('concern') -> goTo('concern') in partner_info next step
const beforeConcernFix = content;
// Find all remaining setStep('concern') and replace with goTo
content = content.split(`setStep('concern')`).join(`goTo('concern')`);
const concernCount = beforeConcernFix.split(`setStep('concern')`).length - 1;
if (concernCount > 0) {
  changes += concernCount;
  console.log(`✅ Fixed: ${concernCount} remaining setStep('concern') -> goTo('concern')`);
}

// Fix setStep('result') -> goTo('result')
const beforeResultFix = content;
content = content.split(`setStep('result')`).join(`goTo('result')`);
const resultCount = beforeResultFix.split(`setStep('result')`).length - 1;
if (resultCount > 0) {
  changes += resultCount;
  console.log(`✅ Fixed: ${resultCount} setStep('result') -> goTo('result')`);
}

// Fix setStep('monthly_analytics') -> goTo('monthly_analytics')
const beforeMonthly = content;
content = content.split(`setStep('monthly_analytics')`).join(`goTo('monthly_analytics')`);
const monthlyCount = beforeMonthly.split(`setStep('monthly_analytics')`).length - 1;
if (monthlyCount > 0) {
  changes += monthlyCount;
  console.log(`✅ Fixed: ${monthlyCount} setStep('monthly_analytics') -> goTo('monthly_analytics')`);
}

// Fix setStep('daily_forecast') -> goTo('daily_forecast')
const beforeForecast = content;
content = content.split(`setStep('daily_forecast')`).join(`goTo('daily_forecast')`);
const forecastCount = beforeForecast.split(`setStep('daily_forecast')`).length - 1;
if (forecastCount > 0) {
  changes += forecastCount;
  console.log(`✅ Fixed: ${forecastCount} setStep('daily_forecast') -> goTo('daily_forecast')`);
}

// Check remaining setStep calls (should only be internal steps without URL routes)
const remainingSetStep = [];
content.split('\n').forEach((line, idx) => {
  if (line.includes('setStep(') && !line.includes('//')) {
    remainingSetStep.push(`  Line ${idx+1}: ${line.trim()}`);
  }
});

console.log(`\n📋 Remaining setStep() calls (internal steps, no URL routes):`);
remainingSetStep.forEach(l => console.log(l));

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Cleanup complete. ${changes} changes applied.`);
