// engine.js

// -----------------------------
// Data loading
// -----------------------------

let QUESTIONS = [];
let OUTCOMES = [];
let RULES = [];

// Load all JSON files in parallel
async function loadEngineData() {
  const [questionsRes, outcomesRes, rulesRes] = await Promise.all([
    fetch('questions.json'),
    fetch('outcomes.json'),
    fetch('rules.json')
  ]);

  QUESTIONS = await questionsRes.json();
  OUTCOMES = await outcomesRes.json();
  RULES = await rulesRes.json();

  // Sort rules by priority (lowest number = highest priority)
  RULES.sort((a, b) => a.priority - b.priority);
}

// -----------------------------
// Core evaluation logic
// -----------------------------

/**
 * answers: an object like { "1": "yes", "2": "no", ... }
 * returns: { outcome, matchedRule } or null if nothing matched
 */
function evaluateAnswers(answers) {
  for (const rule of RULES) {
    if (ruleMatches(rule, answers)) {
      const outcome = OUTCOMES.find(o => o.id === rule.outcome) || null;
      return {
        outcome,
        matchedRule: rule
      };
    }
  }

  // Should never hit this because of fallback rule, but just in case:
  return null;
}

/**
 * Check if a single rule matches the given answers.
 */
function ruleMatches(rule, answers) {
  // Fallback rule: no conditions means always match
  if (!rule.conditions || rule.conditions.length === 0) {
    return true;
  }

  return rule.conditions.every(cond => {
    const qId = String(cond.question);
    const expected = String(cond.equals).toLowerCase();
    const actual = (answers[qId] ?? '').toString().toLowerCase();
    return actual === expected;
  });
}

// -----------------------------
// Helper accessors
// -----------------------------

function getQuestionById(id) {
  return QUESTIONS.find(q => String(q.id) === String(id)) || null;
}

function getOutcomeById(id) {
  return OUTCOMES.find(o => o.id === id) || null;
}

// -----------------------------
// Example wiring hook (for UI)
// -----------------------------
//
// You’ll call loadEngineData() once on page load,
// then use evaluateAnswers() when the user finishes a session.
//

async function initEngine() {
  await loadEngineData();
  console.log('Engine data loaded:', {
    questions: QUESTIONS.length,
    outcomes: OUTCOMES.length,
    rules: RULES.length
  });
}

// Expose functions to the global scope for now
window.declutterEngine = {
  initEngine,
  evaluateAnswers,
  getQuestionById,
  getOutcomeById
};
