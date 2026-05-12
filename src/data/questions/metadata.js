import { QUESTIONS } from "./index.js";

export const QUESTION_METADATA = Object.entries(QUESTIONS).flatMap(([role, difficulties]) => (
  Object.entries(difficulties).flatMap(([difficulty, questions]) => (
    questions.map((question, index) => ({
      id: `${role}:${difficulty}:${index + 1}`,
      text: question.text,
      category: question.category,
      skill: question.skill,
      difficulty: question.difficulty || difficulty,
      role: question.role || role,
    }))
  ))
));

export const QUESTION_METADATA_BY_TEXT = QUESTION_METADATA.reduce((items, question) => ({
  ...items,
  [question.text.trim().toLowerCase()]: question,
}), {});

export default QUESTION_METADATA;
