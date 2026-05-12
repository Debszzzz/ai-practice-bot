const actionWords = ["built", "created", "led", "fixed", "designed", "implemented", "improved", "analyzed", "resolved", "coordinated", "managed", "launched", "reduced", "increased"];
const resultWords = ["result", "reduced", "increased", "improved", "saved", "delivered", "achieved", "impact", "outcome", "percent", "%", "metric", "revenue", "cost", "time"];
const starWords = ["situation", "task", "action", "result", "first", "then", "after", "because", "therefore", "finally"];

export const getQuestionText = (question) => (
  typeof question === "string" ? question : question?.text || ""
);

export const getQuestionMetadata = (question, metadataByText = {}) => {
  if (typeof question === "object" && question?.text) return question;
  return metadataByText[getQuestionText(question).trim().toLowerCase()] || {};
};

export const buildLocalQuestionSet = (questionBank, role, difficulty, count, history = [], metadataByText = {}) => {
  const base = questionBank?.[role]?.[difficulty] || questionBank?.["Software Engineer"]?.Medium || [];
  const personalized = prioritizeQuestions(base.map(normalizeQuestion), history, metadataByText, role, difficulty);
  return shuffle(personalized).slice(0, count);
};

export const mergeQuestionSets = (localQuestions, geminiQuestions, count) => {
  const unique = [];

  [...(geminiQuestions || []).map((text) => normalizeQuestion(text, localQuestions[0])), ...localQuestions].forEach((question) => {
    const normalized = getQuestionText(question).trim().toLowerCase();
    if (normalized && !unique.some((item) => getQuestionText(item).trim().toLowerCase() === normalized)) {
      unique.push(question);
    }
  });

  return balanceByMetadata(unique, count);
};

export const needsRuleBasedFollowUp = (answer, question = null) => {
  const words = countWords(answer);
  const metadata = getQuestionMetadata(question);
  const keywordMatches = countKeywordMatches(answer, metadata);
  return words < 25 || !hasAny(answer, actionWords) || !hasAny(answer, resultWords) || keywordMatches === 0;
};

export const generateRuleBasedFollowUp = (question, answer) => {
  const metadata = getQuestionMetadata(question);

  if (countWords(answer) < 25) {
    return "Can you expand that into a specific example? Include the situation, what you personally did, and what changed afterward.";
  }

  if (!hasAny(answer, actionWords)) {
    return "What specific action did you personally take in that situation?";
  }

  if (!hasAny(answer, resultWords)) {
    return "What was the result or measurable impact of your action?";
  }

  if (metadata.skill) {
    return `Can you connect your answer more directly to ${metadata.skill} and explain the outcome?`;
  }

  return `Can you connect your answer more directly to this question: "${getQuestionText(question)}"?`;
};

export const evaluateRuleBasedAnswer = ({ role, question, answer }) => {
  const metadata = getQuestionMetadata(question);
  const questionText = getQuestionText(question);
  const words = countWords(answer);
  const hasAction = hasAny(answer, actionWords);
  const hasResult = hasAny(answer, resultWords) || /\d/.test(answer);
  const hasStructure = hasAny(answer, starWords);
  const referencesQuestion = questionText
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 5)
    .some((word) => answer.toLowerCase().includes(word));
  const keywordMatches = countKeywordMatches(answer, metadata);

  let score = 3;
  if (words >= 25) score += 1;
  if (words >= 50) score += 1;
  if (hasAction) score += 1;
  if (hasResult) score += 1;
  if (hasStructure) score += 1;
  if (referencesQuestion) score += 1;
  if (keywordMatches > 0) score += 1;
  score = Math.max(1, Math.min(10, score));

  return {
    score,
    strength: buildStrength({ words, hasAction, hasResult, hasStructure, referencesQuestion, metadata, keywordMatches }),
    improve: buildImprovement({ words, hasAction, hasResult, referencesQuestion, metadata, keywordMatches }),
    sample: generateLocalSampleAnswer(role, question),
    metadata,
  };
};

export const generateLocalHint = (_role, question) => {
  const metadata = getQuestionMetadata(question);
  const questionText = getQuestionText(question);

  if (metadata.category || metadata.skill) {
    return `- Focus on ${metadata.category || "the main topic"} and show ${metadata.skill || "clear judgment"}.\n- Use a specific situation, action, and result.\n- Include a measurable or observable outcome.`;
  }
  if (/project/i.test(questionText)) {
    return "- Name the project and your exact role.\n- Explain the problem it solved.\n- End with a concrete result or what you learned.";
  }
  if (/debug|bug|issue|troubleshoot/i.test(questionText)) {
    return "- Describe the symptom and how you narrowed it down.\n- Mention the tool or method you used.\n- Close with the fix and how you prevented it from recurring.";
  }
  return "- Use situation, action, and result.\n- Be specific about what you personally did.\n- Include a measurable or observable outcome.";
};

export const explainLocalTopic = (_role, question) => {
  const metadata = getQuestionMetadata(question);
  if (metadata.category || metadata.skill) {
    return `This question assesses ${metadata.category || "role judgment"}, especially ${metadata.skill || "how you structure decisions"}. A strong answer should show context, your specific action, and the business or user result.`;
  }
  return "This question checks whether you can give a clear, relevant example and connect your actions to a meaningful result.";
};

export const generateLocalSampleAnswer = (role, question) => {
  const metadata = getQuestionMetadata(question);
  const focus = metadata.skill || metadata.category || "the problem";

  return `In my experience as a ${role}, I would approach this by first clarifying the goal and the constraints around ${focus}. Then I would take ownership of the highest-impact next step, communicate progress clearly, and validate that the solution addressed the original need. In one similar situation, that meant aligning with the team, making a practical decision, and measuring the result after implementation. The outcome was a clearer process, fewer follow-up issues, and a better experience for the people affected.`;
};

export const generateRuleBasedSummary = (session, accuracy) => {
  const answered = session.scores.length;
  const averageScore = answered > 0
    ? session.scores.reduce((total, score) => total + score, 0) / answered
    : 0;
  const hadManyFollowUps = session.followups > Math.max(1, answered / 3);
  const weakSkills = getWeakItems(session.qaLog, "skill").slice(0, 2).join(", ");

  return {
    overallScore: `${averageScore.toFixed(1)}/10`,
    strongPoints: accuracy >= 80
      ? "You gave answers with useful detail and enough structure to show your thinking clearly."
      : "You completed the practice flow and gave enough information to identify what to improve next.",
    areasToImprove: weakSkills
      ? `Focus next on ${weakSkills}. Add specific actions, outcomes, and measurable results.`
      : hadManyFollowUps
        ? "Several answers needed follow-up prompts, so focus on giving a complete example the first time: situation, action, and result."
        : "Keep strengthening your answers by adding measurable results, tools used, and a clear lesson learned.",
    finalAdvice: `For your next ${session.role || "interview"} practice, choose one concrete story before answering, then connect it directly to the question and finish with the outcome.`,
  };
};

const prioritizeQuestions = (questions, history, metadataByText, role, difficulty) => {
  const weak = getWeakAreas(history, metadataByText);
  const roleWeak = weak.roles[role] || 0;
  const difficultyWeak = weak.difficulties[difficulty] || 0;

  return [...questions].sort((a, b) => {
    const aMeta = getQuestionMetadata(a, metadataByText);
    const bMeta = getQuestionMetadata(b, metadataByText);
    const aScore = (weak.categories[aMeta.category] || 0) + (weak.skills[aMeta.skill] || 0) + roleWeak + difficultyWeak;
    const bScore = (weak.categories[bMeta.category] || 0) + (weak.skills[bMeta.skill] || 0) + roleWeak + difficultyWeak;
    return bScore - aScore;
  });
};

const getWeakAreas = (sessions, metadataByText) => sessions.reduce((weak, session) => {
  if (Number(session.accuracy || 100) < 70) {
    weak.roles[session.role] = (weak.roles[session.role] || 0) + 1;
    weak.difficulties[session.difficulty] = (weak.difficulties[session.difficulty] || 0) + 1;
  }

  (session.questions || []).forEach((item) => {
    if (Number(item.score || 10) >= 7) return;
    const meta = metadataByText[item.question?.trim().toLowerCase()] || {};
    if (meta.category) weak.categories[meta.category] = (weak.categories[meta.category] || 0) + 1;
    if (meta.skill) weak.skills[meta.skill] = (weak.skills[meta.skill] || 0) + 1;
  });

  return weak;
}, { roles: {}, difficulties: {}, categories: {}, skills: {} });

const getWeakItems = (qaLog, key) => {
  const counts = qaLog.reduce((items, item) => {
    if (Number(item.scoreValue || 10) >= 7 || !item.metadata?.[key]) return items;
    return { ...items, [item.metadata[key]]: (items[item.metadata[key]] || 0) + 1 };
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([item]) => item);
};

const balanceByMetadata = (questions, count) => {
  const selected = [];
  const seen = new Set();
  const buckets = questions.reduce((groups, question) => {
    const meta = getQuestionMetadata(question);
    const key = meta.category || "general";
    return { ...groups, [key]: [...(groups[key] || []), question] };
  }, {});

  while (selected.length < count && Object.values(buckets).some((items) => items.length > 0)) {
    Object.keys(buckets).forEach((key) => {
      if (selected.length >= count) return;
      const question = buckets[key].shift();
      const text = getQuestionText(question).trim().toLowerCase();
      if (question && !seen.has(text)) {
        seen.add(text);
        selected.push(question);
      }
    });
  }

  return selected;
};

const normalizeQuestion = (question, fallback = {}) => {
  if (typeof question === "object" && question?.text) return question;
  return {
    text: String(question || "").trim(),
    category: fallback.category || "ai-generated",
    skill: fallback.skill || "adaptive interview practice",
    difficulty: fallback.difficulty || "",
    role: fallback.role || "",
  };
};

const buildStrength = ({ words, hasAction, hasResult, hasStructure, referencesQuestion, metadata, keywordMatches }) => {
  if (keywordMatches > 0 && metadata.skill) {
    return `Your answer connects to ${metadata.skill} and gives relevant detail.`;
  }
  if (hasAction && hasResult && referencesQuestion) {
    return "Your answer connects to the question, includes action, and gives a result.";
  }
  if (hasStructure) {
    return "Your answer has a clear structure, which makes it easier to follow.";
  }
  if (words >= 50) {
    return "Your answer has enough detail to show context and effort.";
  }
  return "Your answer gives a starting point that can be developed into a stronger example.";
};

const buildImprovement = ({ words, hasAction, hasResult, referencesQuestion, metadata, keywordMatches }) => {
  if (metadata.skill && keywordMatches === 0) {
    return `Tie your response more directly to ${metadata.skill}.`;
  }
  if (!referencesQuestion) {
    return "Tie your response more directly to the exact question being asked.";
  }
  if (words < 25) {
    return "Add more detail. Aim for at least three to five sentences with a specific example.";
  }
  if (!hasAction) {
    return "Add the specific action you personally took.";
  }
  if (!hasResult) {
    return "Add a result, metric, or clear outcome to show impact.";
  }
  return "You can make the answer stronger by adding a measurable result or lesson learned.";
};

const countKeywordMatches = (answer, metadata) => {
  const keywords = [metadata.category, metadata.skill]
    .filter(Boolean)
    .flatMap((value) => value.toLowerCase().split(/\W+/))
    .filter((word) => word.length > 4);
  return keywords.filter((word) => answer.toLowerCase().includes(word)).length;
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const hasAny = (text, words) => words.some((word) => text.toLowerCase().includes(word));
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
