// engine.js

// -----------------------------
// Data loading
// -----------------------------

let QUESTIONS = [];
let OUTCOMES = [];
let RULES = [];

// Branch placeholders — now with consumable branch filled
const BRANCHES = {
  clothing: [],
  paperwork: [],
  tools: [],
  decor: [],
  hobby: [],
  sentimental: [],
  consumable: [76, 79, 47],
  electronics: [],
  collection: [],
  seasonal: [],
  living: []
};

// Map item-type question IDs → branch names
const ITEM_TYPE_ROUTING = {
  33: "clothing",
  34: "paperwork",
  35: "tools",
  36: "decor",
  37: "hobby",
  38: "sentimental",
  39: "consumable",
  40: "electronics",
  41: "collection",
  42: "seasonal",
  43: "living"
};

// Track branch state
window.currentBranch = null;
window.branchIndex = 0;

async function loadEngineData() {
  const [questionsRes, outcomesRes, rulesRes] = await Promise.all([
    fetch('questions.json'),
    fetch('outcomes.json'),
    fetch('rules.json')
  ]);

  QUESTIONS = await questionsRes.json();
  OUTCOMES = await outcomesRes.json();
  RULES = await rulesRes.json();

  RULES.sort((a, b) => a.priority - b.priority);
}

// -----------------------------
// Core evaluation logic
// -----------------------------

function evaluateAnswers(answers) {
  for (const rule of RULES) {
    if (ruleMatches(rule, answers)) {
      const outcome = OUTCOMES.find(o => o.id === rule.outcome) || null;
      return { outcome, matchedRule: rule };
    }
  }
  return null;
}

function ruleMatches(rule, answers) {
  if (!rule.conditions || rule.conditions.length === 0) return true;

  return rule.conditions.every(cond => {
    const qId = String(cond.question);
    const expected = String(cond.equals).toLowerCase();
    const actual = (answers[qId] ?? '').toString().toLowerCase();
    return actual === expected;
  });
}

// -----------------------------
// Branching logic
// -----------------------------

function detectItemTypeBranch(questionId, answerValue) {
  if (answerValue !== "yes") return null;
  return ITEM_TYPE_ROUTING[questionId] || null;
}

function getNextQuestion(currentIndex, answers) {
  // If we are inside a branch
  if (window.currentBranch) {
    const branchQuestions = BRANCHES[window.currentBranch];
    const nextId = branchQuestions[window.branchIndex];

    if (!nextId) return null; // branch finished

    // ⭐ FIX: convert ID → full question object
    const nextQ = QUESTIONS.find(q => q.id === nextId);

    window.branchIndex++;
    return nextQ;
  }

  // Not in a branch yet — follow QUESTIONS array order
  const q = QUESTIONS[currentIndex];
  if (!q) return null;

  return q;
}

// -----------------------------
// Engine initialization
// -----------------------------

async function initEngine() {
  await loadEngineData();
  console.log('Engine data loaded:', {
    questions: QUESTIONS.length,
    outcomes: OUTCOMES.length,
    rules: RULES.length
  });
}

// Expose functions
window.declutterEngine = {
  initEngine,
  evaluateAnswers,
  getNextQuestion,
  detectItemTypeBranch
};
