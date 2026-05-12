import { supabase } from "../lib/supabase";

const DEBUG_SESSION_SAVE = import.meta.env.VITE_DEBUG_SESSION_SAVE === "true";

const logSessionSave = (...args) => {
  if (DEBUG_SESSION_SAVE) {
    console.log("[session-save]", ...args);
  }
};

const logSessionSaveError = (label, error, context = {}) => {
  console.error(`[session-save] ${label}`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    status: error?.status,
    context,
    error,
  });
};

export const savePracticeSession = async ({ session, totalPts, accuracy }) => {
  const qaLog = session?.qaLog || [];

  logSessionSave("before save", {
    role: session?.role,
    difficulty: session?.diff,
    totalPts,
    accuracy,
    followups: session?.followups,
    questionCount: qaLog.length,
  });

  if (qaLog.length === 0) {
    logSessionSave("skipped save: empty qaLog");
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSessionSaveError("auth user lookup failed", userError);
    throw userError;
  }

  if (!user?.id) {
    throw new Error("No authenticated Supabase user found. Please log in again before saving sessions.");
  }

  const sessionId = crypto.randomUUID();
  const sessionPayload = {
    id: sessionId,
    user_id: user.id,
    role: session.role,
    difficulty: session.diff,
    total_score: totalPts,
    accuracy,
    followups: session.followups,
  };

  logSessionSave("save payload", {
    session: sessionPayload,
    questions: qaLog.map((item) => ({
      session_id: sessionId,
      question: item.question,
      score: item.scoreValue,
    })),
  });

  const { error: sessionError } = await supabase
    .from("sessions")
    .insert(sessionPayload);

  if (sessionError) {
    logSessionSaveError("session insert failed", sessionError, { userId: user.id, sessionId });
    throw sessionError;
  }

  const questionPayload = qaLog.map((item) => ({
    id: crypto.randomUUID(),
    session_id: sessionId,
    question: item.question,
    answer: item.answer,
    score: item.scoreValue,
    feedback: item.feedback,
  }));

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(questionPayload);

  if (questionsError) {
    logSessionSaveError("questions insert failed", questionsError, {
      userId: user.id,
      sessionId,
      questionCount: questionPayload.length,
    });
    throw questionsError;
  }

  const result = { id: sessionId };
  logSessionSave("after save", result);
  return result;
};

export const getPracticeSessions = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select("id,user_id,role,difficulty,total_score,accuracy,followups,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getDashboardStats = async (userId) => {
  const sessions = await getPracticeSessions(userId);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);
  const { data: questions, error } = await supabase
    .from("questions")
    .select("session_id,question,score")
    .in("session_id", sessionIds);

  if (error) throw error;

  const questionCounts = (questions || []).reduce((counts, question) => ({
    ...counts,
    [question.session_id]: (counts[question.session_id] || 0) + 1,
  }), {});

  return sessions.map((session) => ({
    ...session,
    question_count: questionCounts[session.id] || 0,
    questions: (questions || []).filter((question) => question.session_id === session.id),
  }));
};

export const getSessionQuestions = async (sessionId) => {
  if (!sessionId) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("id,session_id,question,answer,score,feedback")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updatePracticeSession = async (sessionId, updates) => {
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", sessionId)
    .select("id,user_id,role,difficulty,total_score,accuracy,followups,created_at")
    .single();

  if (error) throw error;
  return data;
};

export const deletePracticeSession = async (sessionId) => {
  const { error: questionsError } = await supabase
    .from("questions")
    .delete()
    .eq("session_id", sessionId);

  if (questionsError) throw questionsError;

  const { error: sessionError } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (sessionError) throw sessionError;
};
