const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_FALLBACK = import.meta.env.VITE_GEMINI_API_KEY_FALLBACK;
const GEMINI_KEYS = [GEMINI_API_KEY, GEMINI_API_KEY_FALLBACK].filter(Boolean);
const API_MODEL = "gemini-2.0-flash";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("Missing Gemini keys.");
  }

  const maxRetries = 2;
  const errors = [];

  for (const key of GEMINI_KEYS) {
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${key}`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }

        if (response.status === 429) {
          const wait = (2 ** attempt * 500) + Math.floor(Math.random() * 400);
          console.warn(`Gemini rate limited. Retry in ${wait}ms`);
          await sleep(wait);
          continue;
        }

        let message = `${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          message = errorData?.error?.message || message;
        } catch {
          // Keep the status text if Gemini does not return a JSON error body.
        }

        errors.push(message);
        break;
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  throw new Error(`Gemini unavailable. Using local fallback.${errors.length ? ` Details: ${errors.join("; ")}` : ""}`);
};

const aiModeInstruction = (aiMode = "Balanced") => {
  if (aiMode === "Encouraging") {
    return "Use a warm, supportive coaching style while staying practical.";
  }
  if (aiMode === "Strict") {
    return "Use a direct, high-standard coaching style with firm but professional feedback.";
  }
  return "Use a balanced coaching style: honest, constructive, and concise.";
};

export const generateInterviewQuestion = async (jobRole, difficulty, aiMode = "Balanced") => {
  const prompt = `
You are an expert HR interviewer.
Generate ONE ${difficulty}-level interview question for a "${jobRole}" position.
${aiModeInstruction(aiMode)}

Rules:
- Return ONLY the question itself, no numbering, no extra text.
- Make it realistic and professional.
- For Easy: focus on basic background and motivation.
- For Medium: focus on experience and problem-solving.
- For Hard: focus on complex scenarios and leadership.
`;

  return callGemini(prompt);
};

export const generateInterviewQuestions = async (jobRole, difficulty, count, aiMode = "Balanced") => {
  const prompt = `
You are an expert HR interviewer.
Generate exactly ${count} unique ${difficulty}-level interview questions for a "${jobRole}" position.
${aiModeInstruction(aiMode)}

Rules:
- Return ONLY a JSON array of strings.
- Do not include numbering, markdown, labels, or explanation.
- Every question must be different.
- Make the questions realistic and professional.
- For Easy: focus on basic background and motivation.
- For Medium: focus on experience and problem-solving.
- For Hard: focus on complex scenarios and leadership.
`;

  const raw = await callGemini(prompt);
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch?.[0] || raw);
  return parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, count);
};

export const evaluateAnswer = async (jobRole, question, userAnswer, aiMode = "Balanced") => {
  const prompt = `
You are a professional AI Interview Coach for "${jobRole}" positions.
${aiModeInstruction(aiMode)}

The candidate was asked:
"${question}"

Their answer:
"${userAnswer}"

Evaluate the answer and respond in EXACTLY this format, with each label on its own line:

Score: X/10
Strengths: (2-3 specific things they did well)
Improvements: (2-3 specific things to improve)
Sample Answer: (write a model answer for this question in 3-5 sentences)

Be honest, constructive, and encouraging.
`;

  const raw = await callGemini(prompt);
  const scoreMatch = raw.match(/Score:\s*(.+)/i);
  const strengthsMatch = raw.match(/Strengths:\s*([\s\S]*?)(?=Improvements:|$)/i);
  const improvementsMatch = raw.match(/Improvements:\s*([\s\S]*?)(?=Sample Answer:|$)/i);
  const sampleMatch = raw.match(/Sample Answer:\s*([\s\S]*?)$/i);

  return {
    score: scoreMatch?.[1]?.trim() || "N/A",
    strengths: strengthsMatch?.[1]?.trim() || "N/A",
    improvements: improvementsMatch?.[1]?.trim() || "N/A",
    sampleAnswer: sampleMatch?.[1]?.trim() || "N/A",
    raw,
  };
};

export const generateFollowUp = async (jobRole, originalQuestion, userAnswer, aiMode = "Balanced") => {
  const prompt = `
You are an AI Interview Coach for "${jobRole}" positions.
${aiModeInstruction(aiMode)}

The candidate was asked: "${originalQuestion}"
They answered: "${userAnswer}"

Their answer was incomplete or could go deeper.
Generate ONE follow-up question to help them elaborate.
Return ONLY the follow-up question, nothing else.
`;

  return callGemini(prompt);
};

export const generateHint = async (jobRole, question, aiMode = "Balanced") => {
  const prompt = `
You are an AI Interview Coach for "${jobRole}" positions.
${aiModeInstruction(aiMode)}

The candidate is answering this interview question:
"${question}"

Give a concise hint that helps them structure their answer without fully answering for them.
Return 2-3 practical bullet points only.
`;

  return callGemini(prompt);
};

export const explainInterviewTopic = async (jobRole, question, aiMode = "Balanced") => {
  const prompt = `
You are an AI Interview Coach for "${jobRole}" positions.
${aiModeInstruction(aiMode)}

Explain the main topic behind this interview question:
"${question}"

Keep it clear, practical, and beginner-friendly. Include what the interviewer is trying to assess.
`;

  return callGemini(prompt);
};

export const generateSampleAnswer = async (jobRole, question, aiMode = "Balanced") => {
  const prompt = `
You are an AI Interview Coach for "${jobRole}" positions.
${aiModeInstruction(aiMode)}

Write a strong sample answer for this interview question:
"${question}"

Rules:
- Return ONLY the sample answer itself.
- Write in first person, as if you are the candidate answering in an interview.
- Do NOT give advice, tips, bullet points, labels, or explain how to answer.
- Do NOT say phrases like "you should", "try to", or "a good answer would".
- Use a realistic professional tone.
- Keep it to 3-5 sentences.
- Include a specific action and result when possible.
`;

  const answer = await callGemini(prompt);
  return answer.replace(/^sample answer:\s*/i, "").trim();
};

export const generateSessionSummary = async (jobRole, questionsAndAnswers, aiMode = "Balanced") => {
  const sessionLog = questionsAndAnswers
    .map((item, i) => `Q${i + 1}: ${item.question}\nAnswer: ${item.answer}\nScore: ${item.score}`)
    .join("\n\n");

  const prompt = `
You are an AI Interview Coach reviewing a full mock interview session for a "${jobRole}" position.
${aiModeInstruction(aiMode)}

Here is the full session:
${sessionLog}

Provide a session summary in EXACTLY this format:

Overall Score: X/10
Strong Points: (2-3 overall strengths shown during the session)
Areas to Improve: (2-3 patterns or weaknesses to work on)
Final Advice: (1 paragraph of motivational and practical advice)
`;

  const raw = await callGemini(prompt);
  const overallMatch = raw.match(/Overall Score:\s*(.+)/i);
  const strongMatch = raw.match(/Strong Points:\s*([\s\S]*?)(?=Areas to Improve:|$)/i);
  const areasMatch = raw.match(/Areas to Improve:\s*([\s\S]*?)(?=Final Advice:|$)/i);
  const adviceMatch = raw.match(/Final Advice:\s*([\s\S]*?)$/i);

  return {
    overallScore: overallMatch?.[1]?.trim() || "N/A",
    strongPoints: strongMatch?.[1]?.trim() || "N/A",
    areasToImprove: areasMatch?.[1]?.trim() || "N/A",
    finalAdvice: adviceMatch?.[1]?.trim() || "N/A",
    raw,
  };
};

export const needsFollowUp = async (userAnswer) => {
  const prompt = `
Is the following interview answer too short, vague, or incomplete?
Answer: "${userAnswer}"

Reply with ONLY "yes" or "no".
`;

  const result = await callGemini(prompt);
  return result.toLowerCase().includes("yes");
};
