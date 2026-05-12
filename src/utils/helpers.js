export const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const initPracticeState = () => ({
  role: "",
  diff: "",
  totalQ: 8,
  qIndex: 0,
  questions: [],
  scores: [],
  followups: 0,
  awaitingFollowup: false,
  sessionActive: false,
  totalScore: 0,
  qaLog: [],
  skills: { comm: 0, prob: 0, tech: 0, clarity: 0 },
});
