import { useCallback, useEffect, useRef, useState } from "react";
import MessageBubble from "../components/chat/MessageBubble";
import Button from "../components/common/Button";
import ProgressRing from "../components/dashboard/ProgressRing";
import SkillsPanel from "../components/dashboard/SkillsPanel";
import StatsPanel from "../components/dashboard/StatsPanel";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { FLOW_STEPS } from "../data/constants";
import { QUESTIONS } from "../data/questions";
import { supabase } from "../lib/supabase";
import {
  evaluateAnswer,
  explainInterviewTopic,
  generateFollowUp,
  generateHint,
  generateInterviewQuestions,
  generateSampleAnswer,
  generateSessionSummary,
} from "../services/geminiService";
import {
  deletePracticeSession,
  getDashboardStats,
  getPracticeSessions,
  getSessionQuestions,
  savePracticeSession,
  updatePracticeSession,
} from "../services/sessionService";
import { delay } from "../utils/delay";
import {
  buildLocalQuestionSet,
  evaluateRuleBasedAnswer,
  explainLocalTopic,
  generateLocalHint,
  generateLocalSampleAnswer,
  generateRuleBasedFollowUp,
  generateRuleBasedSummary,
  getQuestionMetadata,
  getQuestionText,
  mergeQuestionSets,
  needsRuleBasedFollowUp,
} from "../utils/hybridInterview";
import { QUESTION_METADATA_BY_TEXT } from "../data/questions";
import { initPracticeState } from "../utils/helpers";

function PracticePage({ user, onLogout }) {
  const [state, setState] = useState(initPracticeState());
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [inputDisabled, setInputDisabled] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [role, setRole] = useState("");
  const [diff, setDiff] = useState("");
  const [qCount, setQCount] = useState("8");
  const [flowStep, setFlowStep] = useState(99);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Question 1 of 8");
  const [scoreDisplay, setScoreDisplay] = useState("Score: 0");
  const [stats, setStats] = useState({ score: "-", acc: "-", followup: 0, role: "-", diff: "-" });
  const [skills, setSkills] = useState({ comm: "-", prob: "-", tech: "-", clar: "-", commPct: 0, probPct: 0, techPct: 0, clarPct: 0 });
  const [ringPct, setRingPct] = useState(0);
  const [ringLabel, setRingLabel] = useState("Not started");
  const [activeView, setActiveView] = useState("dashboard");
  const [savedSessions, setSavedSessions] = useState([]);
  const [savedSessionsLoading, setSavedSessionsLoading] = useState(false);
  const [savedSessionsError, setSavedSessionsError] = useState("");
  const [settings, setSettings] = useState({
    theme: "System",
    accentColor: "#2563eb",
    language: "English",
    voiceInput: false,
    notifications: true,
    aiMode: "Balanced",
    hybridMode: true,
    sessionAlerts: true,
    saveSessions: true,
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const saved = localStorage.getItem("ai_practice_settings");
    if (saved) {
      setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("ai_practice_settings", JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme.toLowerCase();
  }, [settings]);

  const loadSavedSessions = useCallback(async () => {
    if (!user?.id) {
      setSavedSessions([]);
      return;
    }

    setSavedSessionsLoading(true);
    setSavedSessionsError("");
    try {
      setSavedSessions(await getDashboardStats(user.id));
    } catch (error) {
      console.warn("Loading dashboard session data failed.", error);
      setSavedSessionsError(error.message || "Could not load dashboard data.");
    } finally {
      setSavedSessionsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSavedSessions();
  }, [loadSavedSessions]);

  const addMessage = useCallback((roleName, content) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: roleName, content }]);
  }, []);

  const addTypingMsg = useCallback(() => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, role: "bot", content: "typing", typingId: id }]);
    return id;
  }, []);

  const removeTyping = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateProgressUI = useCallback((s) => {
    const pct = Math.round((s.qIndex / s.totalQ) * 100);
    setProgress(pct);
    setProgressLabel(`Question ${Math.min(s.qIndex + 1, s.totalQ)} of ${s.totalQ}`);
    setScoreDisplay(`Score: ${s.totalScore}`);
    setRingPct(pct);
    setRingLabel(`${s.qIndex} of ${s.totalQ} done`);
    setStats({
      score: `${s.totalScore} / ${s.qIndex * 10}`,
      acc: s.scores.length > 0 ? `${Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10)}%` : "-",
      followup: s.followups,
      role: s.role || "-",
      diff: s.diff || "-",
    });
    if (s.scores.length > 0) {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      const comm = Math.min(100, Math.round(avg * 8 + Math.random() * 12));
      const prob = Math.min(100, Math.round(avg * 9 + Math.random() * 10));
      const tech = Math.min(100, Math.round(avg * 7 + Math.random() * 15));
      const clar = Math.min(100, Math.round(avg * 8.5 + Math.random() * 10));
      setSkills({ comm: `${comm}%`, prob: `${prob}%`, tech: `${tech}%`, clar: `${clar}%`, commPct: comm, probPct: prob, techPct: tech, clarPct: clar });
    }
  }, []);

  const showSummary = useCallback(async (s) => {
    const total = s.scores.length;
    const totalPts = s.scores.reduce((a, b) => a + b, 0);
    const avg = total > 0 ? Math.round((totalPts / total) * 10) : 0;
    const tid = addTypingMsg();
    await delay(300);
    removeTyping(tid);

    let aiSummary = generateRuleBasedSummary(s, avg);
    let saved = false;
    if (settings.saveSessions) {
      try {
        saved = Boolean(await savePracticeSession({ session: s, totalPts, accuracy: avg }));
        if (saved) {
          loadSavedSessions();
        }
      } catch (error) {
        console.warn("Saving practice session failed.", error);
      }
    }

    const summaryMessageId = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id: summaryMessageId, role: "bot", content: { type: "summary", total, totalPts, avg, role: s.role, diff: s.diff, followups: s.followups, aiSummary, saved } }]);
    if (s.qaLog.length > 0) {
      generateSessionSummary(s.role, s.qaLog, settings.aiMode)
        .then((enhancedSummary) => {
          setMessages((prev) => prev.map((message) => (
            message.id === summaryMessageId
              ? { ...message, content: { ...message.content, aiSummary: enhancedSummary } }
              : message
          )));
        })
        .catch((error) => {
          console.warn("Gemini summary enhancement failed. Using rule-based summary.", error);
        });
    }
    if (settings.notifications && "Notification" in window && Notification.permission === "granted") {
      new Notification("Interview session complete", {
        body: `Score: ${totalPts}/${total * 10} (${avg}%)`,
      });
    }
    setState((prev) => ({ ...prev, sessionActive: false }));
    setInputDisabled(true);
    setProgress(100);
    setRingPct(100);
  }, [addTypingMsg, loadSavedSessions, removeTyping, settings.aiMode, settings.notifications, settings.saveSessions]);

  const askQuestion = useCallback(async (s) => {
    setFlowStep(2);
    const tid = addTypingMsg();
    await delay(150);
    removeTyping(tid);

    const question = s.questions[s.qIndex];
    addMessage("bot", { type: "question", q: getQuestionText(question), idx: s.qIndex + 1, total: s.totalQ });
    setFlowStep(3);
    setInputDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [addMessage, addTypingMsg, removeTyping]);

  const enhanceQuestionsInBackground = useCallback(({ role: selectedRole, diff: selectedDiff, count, aiMode, localQuestions, cacheKey }) => {
    generateInterviewQuestions(selectedRole, selectedDiff, count, aiMode)
      .then((geminiQuestions) => {
        const merged = mergeQuestionSets(localQuestions, geminiQuestions, count);
        cacheQuestions(cacheKey, merged);
        setState((prev) => {
          if (!prev.sessionActive || prev.role !== selectedRole || prev.diff !== selectedDiff) {
            return prev;
          }

          const lockedCount = Math.min(prev.qIndex + 1, prev.questions.length);
          const nextQuestions = merged.map((question, index) => (
            index < lockedCount ? prev.questions[index] : question
          ));
          const updated = { ...prev, questions: nextQuestions };
          stateRef.current = updated;
          return updated;
        });
      })
      .catch((error) => {
        console.warn("Gemini question enhancement failed. Keeping local question bank.", error);
      });
  }, []);

  const startSession = useCallback(async () => {
    if (!role || !diff) {
      alert("Please select a job role and difficulty first.");
      return;
    }
    const count = parseInt(qCount, 10);
    const cacheKey = `questions:${role}:${diff}:${count}:${settings.aiMode}`;
    const cachedQuestions = readCachedQuestions(cacheKey, count);
    const questions = cachedQuestions || buildLocalQuestionSet(QUESTIONS, role, diff, count, savedSessions, QUESTION_METADATA_BY_TEXT);

    if (questions.length < count) {
      addMessage("bot", { type: "text", text: "The local question bank could not prepare enough questions for this setup. Please choose a shorter session." });
      return;
    }

    const session = { ...initPracticeState(), role, diff, totalQ: count, questions: questions.slice(0, count), sessionActive: true };
    setState(session);
    stateRef.current = session;
    setMessages([]);
    setSessionStarted(true);
    setFlowStep(99);
    setStats((prev) => ({ ...prev, role, diff }));
    updateProgressUI(session);
    await askQuestion(session);
    enhanceQuestionsInBackground({ role, diff, count, aiMode: settings.aiMode, localQuestions: questions, cacheKey });
  }, [role, diff, qCount, addMessage, askQuestion, enhanceQuestionsInBackground, savedSessions, settings.aiMode, updateProgressUI]);

  const enhanceFeedbackInBackground = useCallback(({ role: selectedRole, question, answer, aiMode, messageId, qaIndex }) => {
    evaluateAnswer(selectedRole, question, answer, aiMode)
      .then((aiFeedback) => {
        const enhanced = {
          strength: aiFeedback.strengths,
          improve: aiFeedback.improvements,
          sample: aiFeedback.sampleAnswer,
        };

        setMessages((prev) => prev.map((message) => (
          message.id === messageId
            ? { ...message, content: { ...message.content, ...enhanced } }
            : message
        )));

        setState((prev) => {
          if (!prev.qaLog[qaIndex]) return prev;
          const qaLog = [...prev.qaLog];
          qaLog[qaIndex] = {
            ...qaLog[qaIndex],
            feedback: `Strengths: ${enhanced.strength}\nImprovements: ${enhanced.improve}\nSample Answer: ${enhanced.sample}`,
          };
          const updated = { ...prev, qaLog };
          stateRef.current = updated;
          return updated;
        });
      })
      .catch((error) => {
        console.warn("Gemini answer enhancement failed. Keeping rule-based feedback.", error);
      });
  }, []);

  const enhanceFollowUpInBackground = useCallback(({ role: selectedRole, question, answer, aiMode, messageId }) => {
    generateFollowUp(selectedRole, getQuestionText(question), answer, aiMode)
      .then((followUp) => {
        setMessages((prev) => prev.map((message) => (
          message.id === messageId
            ? { ...message, content: { ...message.content, followUp } }
            : message
        )));
      })
      .catch((error) => {
        console.warn("Gemini follow-up enhancement failed. Keeping local follow-up.", error);
      });
  }, []);

  const submitAnswer = useCallback(async () => {
    const txt = inputVal.trim();
    const current = stateRef.current;
    if (!txt || !current.sessionActive) return;
    setInputVal("");
    setInputDisabled(true);
    addMessage("user", { type: "text", text: txt });

    const currentQuestion = current.questions[current.qIndex];
    const shouldFollowUp = needsRuleBasedFollowUp(txt, currentQuestion);

    if (!current.awaitingFollowup && shouldFollowUp) {
      setFlowStep(4);
      await delay(120);
      const next = { ...current, followups: current.followups + 1, awaitingFollowup: true };
      setState(next);
      stateRef.current = next;

      const followUp = generateRuleBasedFollowUp(currentQuestion, txt);
      const followUpMessageId = Date.now() + Math.random();

      setMessages((prev) => [...prev, { id: followUpMessageId, role: "bot", content: { type: "short-warn", followUp } }]);
      enhanceFollowUpInBackground({
        role: current.role,
        question: currentQuestion,
        answer: txt,
        aiMode: settings.aiMode,
        messageId: followUpMessageId,
      });
      setInputDisabled(false);
      updateProgressUI(next);
      setTimeout(() => textareaRef.current?.focus(), 100);
      return;
    }

    const ready = { ...current, awaitingFollowup: false };
    setState(ready);
    stateRef.current = ready;
    setFlowStep(5);
    const tid = addTypingMsg();
    await delay(250);
    removeTyping(tid);

    const feedback = evaluateRuleBasedAnswer({
      role: ready.role,
      question: ready.questions[ready.qIndex],
      answer: txt,
    });
    const score = feedback.score;
    const qaIndex = ready.qaLog.length;

    const qaLog = [
      ...ready.qaLog,
      {
        question: getQuestionText(ready.questions[ready.qIndex]),
        answer: txt,
        score: `${score}/10`,
        scoreValue: score,
        feedback: `Strengths: ${feedback.strength}\nImprovements: ${feedback.improve}\nSample Answer: ${feedback.sample}`,
        metadata: getQuestionMetadata(ready.questions[ready.qIndex], QUESTION_METADATA_BY_TEXT),
      },
    ];
    const updated = { ...ready, scores: [...ready.scores, score], totalScore: ready.totalScore + score, qIndex: ready.qIndex + 1, qaLog };
    setState(updated);
    stateRef.current = updated;
    const feedbackMessageId = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id: feedbackMessageId, role: "bot", content: { type: "feedback", score, ...feedback } }]);
    enhanceFeedbackInBackground({
      role: ready.role,
      question: getQuestionText(ready.questions[ready.qIndex]),
      answer: txt,
      aiMode: settings.aiMode,
      messageId: feedbackMessageId,
      qaIndex,
    });
    updateProgressUI(updated);
    await delay(600);

    if (updated.qIndex >= updated.totalQ) {
      setFlowStep(6);
      await delay(800);
      await showSummary(updated);
    } else {
      const tid2 = addTypingMsg();
      await delay(700);
      removeTyping(tid2);
      addMessage("bot", { type: "continue" });
    }
  }, [inputVal, addMessage, addTypingMsg, removeTyping, enhanceFeedbackInBackground, enhanceFollowUpInBackground, settings.aiMode, updateProgressUI, showSummary]);

  const continueSession = useCallback(async () => {
    setInputDisabled(false);
    await askQuestion(stateRef.current);
  }, [askQuestion]);

  const endEarly = useCallback(async () => {
    const current = stateRef.current;
    const updated = { ...current, totalQ: current.qIndex };
    setState(updated);
    stateRef.current = updated;
    setFlowStep(6);
    await showSummary(updated);
  }, [showSummary]);

  const resetAll = useCallback(() => {
    const fresh = initPracticeState();
    setState(fresh);
    stateRef.current = fresh;
    setMessages([]);
    setSessionStarted(false);
    setInputVal("");
    setInputDisabled(true);
    setRole("");
    setDiff("");
    setQCount("8");
    setFlowStep(99);
    setProgress(0);
    setProgressLabel("Question 1 of 8");
    setScoreDisplay("Score: 0");
    setStats({ score: "-", acc: "-", followup: 0, role: "-", diff: "-" });
    setSkills({ comm: "-", prob: "-", tech: "-", clar: "-", commPct: 0, probPct: 0, techPct: 0, clarPct: 0 });
    setRingPct(0);
    setRingLabel("Not started");
  }, []);

  const endPracticeSession = useCallback(async () => {
    const current = stateRef.current;
    if (!current.sessionActive) {
      resetAll();
      return;
    }

    if (current.qaLog.length > 0) {
      const ended = { ...current, totalQ: current.qIndex, sessionActive: true };
      setState(ended);
      stateRef.current = ended;
      setFlowStep(6);
      await showSummary(ended);
      return;
    }

    resetAll();
  }, [resetAll, showSummary]);

  const handleViewChange = useCallback(async (view) => {
    if (view === activeView) return;

    const current = stateRef.current;
    if (current.sessionActive && view !== "practice") {
      const confirmed = window.confirm("You have an active interview session. Leaving now will end the session.");
      if (!confirmed) return;
      await endPracticeSession();
    }

    setActiveView(view);
  }, [activeView, endPracticeSession]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };

  const chipClick = async (txt, visibleQuestion = null, visibleIndex = null) => {
    const current = stateRef.current;
    if (!current.sessionActive || inputDisabled) return;

    const action = normalizeChip(txt);
    const question = visibleQuestion || current.questions[current.qIndex];
    const questionIndex = visibleIndex ?? current.qIndex;
    if (action === "skip" && questionIndex !== current.qIndex) return;
    addMessage("user", { type: "text", text: txt });
    setInputDisabled(true);

    if (action === "skip") {
      await handleSkipQuestion(current, question);
      return;
    }

    const tid = addTypingMsg();
    let response;

    try {
      if (action === "hint") {
        response = await generateHint(current.role, getQuestionText(question), settings.aiMode);
      } else if (action === "explain") {
        response = await explainInterviewTopic(current.role, getQuestionText(question), settings.aiMode);
      } else if (action === "sample") {
        const sample = await generateSampleAnswer(current.role, getQuestionText(question), settings.aiMode);
        response = `Sample answer:\n\n${sample}`;
      }
    } catch (error) {
      console.warn("Gemini quick action enhancement failed. Using local response.", error);
      response = getQuickActionFallback(action, error, current.role, question);
    }

    removeTyping(tid);
    addMessage("bot", { type: "text", text: response });
    setInputDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSkipQuestion = async (current, question) => {
    const tid = addTypingMsg();
    let response;

    try {
      const sample = await generateSampleAnswer(current.role, getQuestionText(question), settings.aiMode);
      response = `Skipped. Here's a sample answer you can study:\n\n${sample}`;
    } catch (error) {
      console.warn("Gemini skip/sample enhancement failed. Using local sample.", error);
      response = `Skipped. Here's a sample answer you can study:\n\n${generateLocalSampleAnswer(current.role, question)}`;
    }

    removeTyping(tid);
    addMessage("bot", { type: "text", text: response });

    const updated = {
      ...current,
      awaitingFollowup: false,
      scores: [...current.scores, 0],
      qIndex: current.qIndex + 1,
      qaLog: [
        ...current.qaLog,
        {
          question: getQuestionText(question),
          answer: "Skipped",
          score: "0/10",
          scoreValue: 0,
          feedback: response,
          metadata: getQuestionMetadata(question, QUESTION_METADATA_BY_TEXT),
        },
      ],
    };
    setState(updated);
    stateRef.current = updated;
    updateProgressUI(updated);

    if (updated.qIndex >= updated.totalQ) {
      setFlowStep(6);
      await delay(500);
      await showSummary(updated);
      return;
    }

    await delay(500);
    addMessage("bot", { type: "continue" });
  };

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800">
        <Header sessionLabel={state.sessionActive ? `${state.role} - ${state.diff}` : "No active session"} userEmail={user?.email} onReset={resetAll} onLogout={onLogout} />
        <div className="flex min-h-0 flex-1 overflow-hidden max-[980px]:flex-col">
          <Sidebar activeView={activeView} onNavigate={handleViewChange} />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {activeView === "practice" && (
              <>
                {!sessionStarted && <SetupBar role={role} diff={diff} qCount={qCount} setRole={setRole} setDiff={setDiff} setQCount={setQCount} onStart={startSession} />}
                {sessionStarted && <ProgressBar progressLabel={progressLabel} progress={progress} scoreDisplay={scoreDisplay} />}
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
                  {!sessionStarted && <EmptyState />}
                  {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onContinue={continueSession} onEndEarly={endEarly} onReset={resetAll} onChip={chipClick} />)}
                  <div ref={messagesEndRef} />
                </div>
                <InputZone textareaRef={textareaRef} inputVal={inputVal} setInputVal={setInputVal} inputDisabled={inputDisabled} submitAnswer={submitAnswer} handleKey={handleKey} chipClick={chipClick} />
              </>
            )}
            {activeView === "dashboard" && <DashboardView sessions={savedSessions} loading={savedSessionsLoading} error={savedSessionsError} onPractice={() => handleViewChange("practice")} />}
            {activeView === "sessions" && <SessionsView user={user} state={state} sessionStarted={sessionStarted} />}
            {activeView === "analytics" && <AnalyticsView sessions={savedSessions} loading={savedSessionsLoading} error={savedSessionsError} />}
            {activeView === "profile" && <ProfileView user={user} sessions={savedSessions} />}
            {activeView === "settings" && <SettingsView settings={settings} setSettings={setSettings} user={user} />}
          </main>
          <div className="w-[248px] shrink-0 overflow-y-auto border-l border-blue-100 bg-white max-[980px]:hidden">
            <ProgressRing percent={ringPct} label={ringLabel} />
            <StatsPanel stats={stats} />
            <SkillsPanel skills={skills} flowSteps={FLOW_STEPS} flowStep={flowStep} />
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardView({ sessions, loading, error, onPractice }) {
  const overall = buildOverallStats(sessions);
  const roleDifficultyStats = buildRoleDifficultyStats(sessions);

  return (
    <div className={viewPanelClass}>
      <div className={viewKickerClass}>Dashboard</div>
      <h2 className={viewTitleClass}>Overview</h2>
      <p className={`${viewCopyClass} mb-[18px]`}>Overall interview performance across roles, with score and accuracy by difficulty.</p>
      {loading && <p className={`${viewCopyClass} mb-3`}>Loading saved session data...</p>}
      {error && <p className={errorTextClass}>{error}</p>}
      <div className={viewGridClass}>
        <MetricCard label="Total sessions" value={overall.totalSessions} detail="Saved mock interviews" />
        <MetricCard label="Questions answered" value={overall.totalQuestions} detail="Saved question records" />
        <MetricCard label="Total follow-ups" value={overall.totalFollowups} detail="Prompts to add more detail" />
        <MetricCard label="Most practiced role" value={overall.mostPracticedRole} detail="Role with the most sessions" />
        <MetricCard label="Best performing role" value={overall.bestRole} detail="Highest average accuracy" />
      </div>
      {roleDifficultyStats.length > 0 && (
        <div className="mt-[18px] grid gap-3.5">
          {groupStatsByRole(roleDifficultyStats).map(([role, rows]) => (
            <div key={role} className={viewCardClass}>
              <h3 className="mb-3 text-[15px] font-bold text-blue-950">{role}</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                {rows.map((item) => (
                  <div key={`${item.role}-${item.difficulty}`} className="rounded-lg border border-blue-100 bg-slate-50 p-3">
                    <div className="mb-2 text-xs font-extrabold text-blue-700">{item.difficulty}</div>
                    <div className="text-[13px] leading-7 text-slate-700">Score: <strong>{item.avgScore}</strong></div>
                    <div className="text-[13px] leading-7 text-slate-700">Accuracy: <strong>{item.avgAccuracy}</strong></div>
                    <div className="mt-1 text-xs text-slate-400">{item.sessions} session{item.sessions === 1 ? "" : "s"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {sessions.length === 0 && !loading && <p className={`${viewCopyClass} mt-3.5`}>No saved sessions yet. Complete a practice session to populate your dashboard.</p>}
      <div className="mt-[18px]">
        <Button onClick={onPractice}>Go to Practice</Button>
      </div>
    </div>
  );
}

function SessionsView({ user, state, sessionStarted }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ role: "", difficulty: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
  setLoading(true);
  setError("");

  try {

    setSessions(await getPracticeSessions(user?.id));

  } catch (loadError) {

    console.error("SUPABASE FULL ERROR:", loadError);
    console.error("MESSAGE:", loadError?.message);
    console.error("DETAILS:", loadError?.details);
    console.error("CODE:", loadError?.code);

    setError(loadError.message || "Could not load saved sessions.");

  } finally {
    setLoading(false);
  }

}, [user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const openSession = async (session) => {
    setSelectedSession(session);
    setError("");
    try {
      setQuestions(await getSessionQuestions(session.id));
    } catch (loadError) {
      setError(loadError.message || "Could not load session questions.");
    }
  };

  const beginEdit = (session) => {
    setEditingId(session.id);
    setEditForm({ role: session.role || "", difficulty: session.difficulty || "" });
  };

  const saveEdit = async (sessionId) => {
    setError("");
    try {
      const updated = await updatePracticeSession(sessionId, editForm);
      setSessions((prev) => prev.map((item) => (item.id === sessionId ? updated : item)));
      if (selectedSession?.id === sessionId) setSelectedSession(updated);
      setEditingId("");
    } catch (saveError) {
      setError(saveError.message || "Could not update session.");
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm("Delete this saved session?")) return;
    setError("");
    try {
      await deletePracticeSession(sessionId);
      setSessions((prev) => prev.filter((item) => item.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setQuestions([]);
      }
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete session.");
    }
  };

  return (
    <div className={viewPanelClass}>
      <div className={viewKickerClass}>Sessions</div>
      <h2 className={viewTitleClass}>History</h2>
      <p className={`${viewCopyClass} mb-[18px]`}>Read, update, and delete your saved Supabase interview sessions.</p>
      <div className="mb-3.5 flex flex-wrap gap-2">
        <Button type="button" onClick={loadSessions}>Refresh History</Button>
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
      <div className={viewCardClass}>
        <h3 className="mb-2 text-[15px] font-bold text-blue-950">Current session</h3>
        <p className={viewCopyClass}>
          {sessionStarted
            ? `${state.role || "Selected role"} - ${state.diff || "difficulty"} - ${state.qIndex} answered so far.`
            : "No active session yet. Start a practice session to create history."}
        </p>
      </div>
      <div className={`${viewGridClass} mt-3.5`}>
        <div className={viewCardClass}>
          <h3 className="mb-2.5 text-[15px] font-bold text-blue-950">Saved sessions</h3>
          {loading && <p className={viewCopyClass}>Loading sessions...</p>}
          {!loading && sessions.length === 0 && <p className={viewCopyClass}>No saved sessions yet.</p>}
          <div className="grid gap-2.5">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-blue-100 p-2.5">
                {editingId === session.id ? (
                  <div className="grid gap-2">
                    <input value={editForm.role} onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))} className={inputClass} />
                    <select value={editForm.difficulty} onChange={(event) => setEditForm((prev) => ({ ...prev, difficulty: event.target.value }))} className={selectClass}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => saveEdit(session.id)}>Save</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingId("")}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-[13px] font-extrabold text-blue-950">{session.role} - {session.difficulty}</div>
                    <div className="my-1 mb-2 text-xs text-slate-600">
                      Score {session.total_score} | Accuracy {session.accuracy}% | {formatDate(session.created_at)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="soft" onClick={() => openSession(session)}>View</Button>
                      <Button type="button" variant="outline" onClick={() => beginEdit(session)}>Edit</Button>
                      <Button type="button" variant="outline" onClick={() => deleteSession(session.id)}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className={viewCardClass}>
          <h3 className="mb-2.5 text-[15px] font-bold text-blue-950">Session questions</h3>
          {!selectedSession && <p className={viewCopyClass}>Select a saved session to view answers and feedback.</p>}
          {selectedSession && questions.length === 0 && <p className={viewCopyClass}>No questions found for this session.</p>}
          <div className="grid gap-2.5">
            {questions.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-blue-100 p-2.5">
                <div className="mb-1.5 text-xs font-extrabold text-blue-700">Question {index + 1} | {item.score}/10</div>
                <p className={`${viewCopyClass} mb-1.5 text-blue-950`}>{item.question}</p>
                <p className={`${viewCopyClass} mb-1.5`}><strong>Answer:</strong> {item.answer}</p>
                <p className={`${viewCopyClass} whitespace-pre-wrap`}>{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ sessions, loading, error }) {
  const roleDifficultyStats = buildRoleDifficultyStats(sessions);

  return (
    <div className={viewPanelClass}>
      <div className={viewKickerClass}>Analytics</div>
      <h2 className={viewTitleClass}>Intelligence</h2>
      <p className={`${viewCopyClass} mb-[18px]`}>Detailed performance grouped by job role and difficulty from your saved Supabase sessions.</p>
      {loading && <p className={`${viewCopyClass} mb-3`}>Loading analytics...</p>}
      {error && <p className={errorTextClass}>{error}</p>}
      {roleDifficultyStats.length === 0 && !loading && <p className={viewCopyClass}>No role analytics yet. Save at least one completed session.</p>}
      <div className={`${viewCardClass} overflow-x-auto`}>
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr>
              {["Role", "Difficulty", "Sessions", "Questions", "Avg score", "Accuracy", "Follow-ups"].map((heading) => (
                <th key={heading} className={tableHeaderClass}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roleDifficultyStats.map((item) => (
              <tr key={`${item.role}-${item.difficulty}`}>
                <td className={tableCellClass}><strong>{item.role}</strong></td>
                <td className={tableCellClass}>{item.difficulty}</td>
                <td className={tableCellClass}>{item.sessions}</td>
                <td className={tableCellClass}>{item.questions}</td>
                <td className={tableCellClass}>{item.avgScore}</td>
                <td className={tableCellClass}>{item.avgAccuracy}</td>
                <td className={tableCellClass}>{item.followups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileView({ user, sessions }) {
  const metadata = user?.user_metadata || {};
  const overall = buildOverallStats(sessions);
  const preferredRole = metadata.role_preference || overall.mostPracticedRole || "-";
  const preferredDifficulty = metadata.preferred_difficulty || getMostCommon(sessions.map((session) => session.difficulty).filter(Boolean));

  return (
    <div className={viewPanelClass}>
      <div className={viewKickerClass}>Profile</div>
      <h2 className={viewTitleClass}>Account Profile</h2>
      <p className={`${viewCopyClass} mb-[18px]`}>Your profile and practice preferences.</p>

      <div className="grid grid-cols-[minmax(260px,360px)_1fr] gap-4 max-[900px]:grid-cols-1">
        <div className={viewCardClass}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white">
              {getInitials(metadata.full_name || metadata.name || user?.email)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-blue-950">{metadata.full_name || metadata.name || "Practice User"}</h3>
              <p className="truncate text-[13px] text-slate-500">{user?.email || "No email available"}</p>
            </div>
          </div>
          <div className="grid gap-2.5">
            <ProfileRow label="User ID" value={user?.id || "-"} />
            <ProfileRow label="Role preference" value={preferredRole || "-"} />
            <ProfileRow label="Preferred difficulty" value={preferredDifficulty || "-"} />
          </div>
        </div>

        <div className={viewCardClass}>
          <h3 className="mb-3 text-[15px] font-bold text-blue-950">Practice summary</h3>
          <div className={viewGridClass}>
            <MetricCard label="Saved sessions" value={overall.totalSessions} detail="Practice history" />
            <MetricCard label="Questions answered" value={overall.totalQuestions} detail="Across all sessions" />
            <MetricCard label="Best role" value={overall.bestRole} detail="Highest accuracy" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-slate-50 p-3">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</div>
      <div className="break-words text-[13px] font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function SettingsView({ settings, setSettings, user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  const updateEmail = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    setSecurityMessage("");
    setSecurityError("");

    if (!trimmedEmail) {
      setSecurityError("Enter a valid email address.");
      return;
    }

    if (trimmedEmail === user?.email) {
      setSecurityError("Use a different email address before saving.");
      return;
    }

    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
    setEmailLoading(false);

    if (error) {
      setSecurityError(error.message);
      return;
    }

    setSecurityMessage("Email update requested. Check your inbox to confirm the new address.");
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    setSecurityMessage("");
    setSecurityError("");

    if (newPassword.length < 6) {
      setSecurityError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setSecurityError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSecurityMessage("Password updated successfully.");
  };

  return (
    <div className={viewPanelClass}>
      <div className={viewKickerClass}>Settings</div>
      <h2 className={viewTitleClass}>Preferences</h2>
      <p className={`${viewCopyClass} mb-[18px]`}>Control app behavior, interview style, and local preferences.</p>

      <div className="grid gap-4">
        <div className={viewCardClass}>
          <h3 className="mb-3 text-[15px] font-bold text-blue-950">General</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <SettingSelect label="Theme" value={settings.theme} options={["Light", "Dark", "System"]} onChange={(value) => setSettings((prev) => ({ ...prev, theme: value }))} />
            <SettingSelect label="Language" value={settings.language} options={["English"]} onChange={(value) => setSettings((prev) => ({ ...prev, language: value }))} />
            <SettingField label="Accent color">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(event) => setSettings((prev) => ({ ...prev, accentColor: event.target.value }))}
                className="h-10 w-full cursor-pointer rounded-lg border-2 border-blue-200 bg-slate-50 p-1 outline-none transition focus:border-blue-400"
              />
            </SettingField>
          </div>
        </div>

        <div className={viewCardClass}>
          <h3 className="mb-3 text-[15px] font-bold text-blue-950">Interview behavior</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <SettingSelect label="AI mode" value={settings.aiMode} options={["Encouraging", "Balanced", "Strict"]} onChange={(value) => setSettings((prev) => ({ ...prev, aiMode: value }))} />
            <SettingToggle label="Hybrid mode" checked={settings.hybridMode} onChange={(checked) => setSettings((prev) => ({ ...prev, hybridMode: checked }))} />
            <SettingToggle label="Save sessions" checked={settings.saveSessions} onChange={(checked) => setSettings((prev) => ({ ...prev, saveSessions: checked }))} />
          </div>
        </div>

        <div className={viewCardClass}>
          <h3 className="mb-3 text-[15px] font-bold text-blue-950">Notifications</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            <SettingToggle label="Voice input" checked={settings.voiceInput} onChange={(checked) => setSettings((prev) => ({ ...prev, voiceInput: checked }))} />
            <SettingToggle label="Browser notifications" checked={settings.notifications} onChange={(checked) => setSettings((prev) => ({ ...prev, notifications: checked }))} />
            <SettingToggle label="Session alerts" checked={settings.sessionAlerts} onChange={(checked) => setSettings((prev) => ({ ...prev, sessionAlerts: checked }))} />
          </div>
        </div>

        <div className={viewCardClass}>
          <h3 className="mb-3 text-[15px] font-bold text-blue-950">Security</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            <form onSubmit={updateEmail} className="grid gap-3 rounded-lg border border-blue-100 bg-slate-50 p-3">
              <SettingField label="Email address">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  required
                />
              </SettingField>
              <Button disabled={emailLoading} className="w-full">
                {emailLoading ? "Saving email..." : "Change Email"}
              </Button>
            </form>

            <form onSubmit={updatePassword} className="grid gap-3 rounded-lg border border-blue-100 bg-slate-50 p-3">
              <SettingField label="New password">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={6}
                  className={inputClass}
                  required
                />
              </SettingField>
              <SettingField label="Confirm password">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  className={inputClass}
                  required
                />
              </SettingField>
              <Button disabled={passwordLoading} className="w-full">
                {passwordLoading ? "Saving password..." : "Change Password"}
              </Button>
            </form>
          </div>
          {securityError && <p className="mt-3 text-[13px] leading-relaxed text-amber-800">{securityError}</p>}
          {securityMessage && <p className="mt-3 text-[13px] leading-relaxed text-emerald-700">{securityMessage}</p>}
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, children }) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  return (
    <SettingField label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </SettingField>
  );
}

function SettingToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-slate-50 p-3">
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-blue-600"
      />
    </label>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <div className={viewCardClass}>
      <div className="mb-1.5 text-xs font-semibold text-slate-600">{label}</div>
      <div className="mb-1 text-2xl font-extrabold text-blue-700">{value}</div>
      <div className="text-xs leading-6 text-slate-400">{detail}</div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function buildOverallStats(sessions) {
  if (!sessions.length) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      avgScore: "-",
      avgAccuracy: "-",
      totalFollowups: 0,
      mostPracticedRole: "-",
      bestRole: "-",
    };
  }

  const roleStats = buildRoleStats(sessions);
  const totalSessions = sessions.length;
  const totalScore = sessions.reduce((sum, session) => sum + Number(session.total_score || 0), 0);
  const totalAccuracy = sessions.reduce((sum, session) => sum + Number(session.accuracy || 0), 0);
  const totalFollowups = sessions.reduce((sum, session) => sum + Number(session.followups || 0), 0);
  const totalQuestions = sessions.reduce((sum, session) => sum + estimateQuestionCount(session), 0);
  const mostPracticedRole = [...roleStats].sort((a, b) => b.sessions - a.sessions)[0]?.role || "-";
  const bestRole = [...roleStats].sort((a, b) => b.avgAccuracyValue - a.avgAccuracyValue)[0]?.role || "-";

  return {
    totalSessions,
    totalQuestions,
    avgScore: formatNumber(totalScore / totalSessions),
    avgAccuracy: `${Math.round(totalAccuracy / totalSessions)}%`,
    totalFollowups,
    mostPracticedRole,
    bestRole,
  };
}

function buildRoleStats(sessions) {
  const grouped = sessions.reduce((groups, session) => {
    const role = session.role || "Unspecified role";
    return { ...groups, [role]: [...(groups[role] || []), session] };
  }, {});

  return Object.entries(grouped)
    .map(([role, list]) => {
      const totalScore = list.reduce((sum, session) => sum + Number(session.total_score || 0), 0);
      const totalAccuracy = list.reduce((sum, session) => sum + Number(session.accuracy || 0), 0);
      const followups = list.reduce((sum, session) => sum + Number(session.followups || 0), 0);
      const avgAccuracyValue = list.length ? totalAccuracy / list.length : 0;

      return {
        role,
        sessions: list.length,
        questions: list.reduce((sum, session) => sum + estimateQuestionCount(session), 0),
        avgScore: formatNumber(totalScore / list.length),
        avgAccuracy: `${Math.round(avgAccuracyValue)}%`,
        avgAccuracyValue,
        followups,
        bestDifficulty: getMostCommon(list.map((session) => session.difficulty).filter(Boolean)),
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

function buildRoleDifficultyStats(sessions) {
  const grouped = sessions.reduce((groups, session) => {
    const role = session.role || "Unspecified role";
    const difficulty = session.difficulty || "Unspecified";
    const key = `${role}-${difficulty}`;
    return { ...groups, [key]: [...(groups[key] || []), session] };
  }, {});

  return Object.values(grouped)
    .map((list) => {
      const totalScore = list.reduce((sum, session) => sum + Number(session.total_score || 0), 0);
      const totalAccuracy = list.reduce((sum, session) => sum + Number(session.accuracy || 0), 0);
      const followups = list.reduce((sum, session) => sum + Number(session.followups || 0), 0);
      const avgAccuracyValue = list.length ? totalAccuracy / list.length : 0;

      return {
        role: list[0].role || "Unspecified role",
        difficulty: list[0].difficulty || "Unspecified",
        sessions: list.length,
        questions: list.reduce((sum, session) => sum + estimateQuestionCount(session), 0),
        avgScore: formatNumber(totalScore / list.length),
        avgAccuracy: `${Math.round(avgAccuracyValue)}%`,
        avgAccuracyValue,
        followups,
      };
    })
    .sort((a, b) => a.role.localeCompare(b.role) || difficultyRank(a.difficulty) - difficultyRank(b.difficulty));
}

function groupStatsByRole(stats) {
  const grouped = stats.reduce((groups, item) => ({
    ...groups,
    [item.role]: [...(groups[item.role] || []), item],
  }), {});

  return Object.entries(grouped);
}

function estimateQuestionCount(session) {
  return Number(session.question_count || 0);
}

function getMostCommon(values) {
  if (!values.length) return "-";
  const counts = values.reduce((result, value) => ({ ...result, [value]: (result[value] || 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function getInitials(value = "") {
  const parts = value.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] || "P") + (parts[1]?.[0] || "U");
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

function difficultyRank(difficulty) {
  return { Easy: 1, Medium: 2, Hard: 3 }[difficulty] || 99;
}

function SetupBar({ role, diff, qCount, setRole, setDiff, setQCount, onStart }) {
  return (
    <div className="flex items-center gap-3 border-b border-blue-100 bg-white px-6 py-3.5 max-[720px]:flex-wrap">
      <label className={labelClass}>Job Role</label>
      <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
        <option value="">Select role...</option>
        {Object.keys(QUESTIONS).map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <Separator />
      <label className={labelClass}>Difficulty</label>
      <select value={diff} onChange={(e) => setDiff(e.target.value)} className={selectClass}>
        <option value="">Select...</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      <Separator />
      <label className={labelClass}>Questions</label>
      <select value={qCount} onChange={(e) => setQCount(e.target.value)} className={selectClass}>
        <option value="5">5</option>
        <option value="8">8</option>
        <option value="10">10</option>
        <option value="15">15</option>
      </select>
      <div className="ml-auto max-[720px]:ml-0">
        <Button onClick={onStart}>Start Session</Button>
      </div>
    </div>
  );
}

function ProgressBar({ progressLabel, progress, scoreDisplay }) {
  return (
    <div className="flex items-center gap-3 border-b border-blue-50 bg-white px-6 py-2">
      <span className="whitespace-nowrap text-xs font-semibold text-blue-700">{progressLabel}</span>
      <progress
        aria-label="Practice progress"
        value={progress}
        max="100"
        className="h-1.5 flex-1 overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-400 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-blue-50 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-400"
      />
      <span className="whitespace-nowrap rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{scoreDisplay}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
      <svg viewBox="0 0 24 24" className="h-12 w-12 fill-none stroke-blue-200 stroke-[1.5]"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
      <p className="text-[15px] font-semibold text-blue-300">Select a role and start your session</p>
    </div>
  );
}

function InputZone({ textareaRef, inputVal, setInputVal, inputDisabled, submitAnswer, handleKey, chipClick }) {
  return (
    <div className="border-t border-blue-100 bg-white px-6 pb-5 pt-4">
      <div className="flex items-end gap-2.5 rounded-2xl border-2 border-blue-200 bg-slate-50 py-2.5 pl-4 pr-2.5 transition-colors focus-within:border-blue-400">
        <textarea
          ref={textareaRef}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
          }}
          onKeyDown={handleKey}
          disabled={inputDisabled}
          placeholder={inputDisabled ? "Start a session to begin..." : "Type your answer..."}
          rows={1}
          className="min-h-[22px] max-h-[110px] flex-1 resize-none overflow-y-auto border-0 bg-transparent text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <button onClick={submitAnswer} disabled={inputDisabled} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 transition-all disabled:cursor-not-allowed disabled:bg-slate-200">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Give me a hint", "Skip this question", "Explain this topic", "Show a sample answer"].map((chip) => (
          <button key={chip} type="button" onClick={() => chipClick(chip)} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

const viewPanelClass = "flex-1 overflow-y-auto p-6";
const viewKickerClass = "mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-blue-500";
const viewTitleClass = "mb-2 text-xl font-extrabold text-blue-950";
const viewCopyClass = "text-[13px] leading-7 text-slate-600";
const viewGridClass = "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3";
const viewCardClass = "rounded-xl border border-blue-100 bg-white p-4 shadow-sm";
const errorTextClass = "mb-3 text-[13px] text-amber-800";
const labelClass = "whitespace-nowrap text-[13px] font-semibold text-slate-600";
const inputClass = "rounded-lg border-2 border-blue-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-800 outline-none transition focus:border-blue-400";
const selectClass = "cursor-pointer rounded-lg border-2 border-blue-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-800 outline-none transition focus:border-blue-400";
const tableHeaderClass = "border-b border-blue-100 px-2 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400";
const tableCellClass = "border-b border-blue-50 px-2 py-2.5 text-[13px] text-slate-700";
const Separator = () => <div className="h-6 w-px bg-blue-100 max-[720px]:hidden" />;

function normalizeChip(text) {
  const value = text.toLowerCase();
  if (value.includes("hint")) return "hint";
  if (value.includes("skip")) return "skip";
  if (value.includes("explain")) return "explain";
  if (value.includes("sample")) return "sample";
  return "hint";
}

function readCachedQuestions(cacheKey, count) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
    return Array.isArray(cached) && cached.length >= count ? cached.slice(0, count) : null;
  } catch {
    return null;
  }
}

function cacheQuestions(cacheKey, questions) {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(questions));
  } catch {
    // Cache failures should never block practice.
  }
}

function getQuickActionFallback(action, _error, role, question) {
  if (action === "hint") {
    return generateLocalHint(role, question);
  }
  if (action === "explain") {
    return explainLocalTopic(role, question);
  }
  if (action === "sample") {
    return `Sample answer:\n\n${generateLocalSampleAnswer(role, question)}`;
  }
  return "I'll move you to the next question.";
}

export default PracticePage;
