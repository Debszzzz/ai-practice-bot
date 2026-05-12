import Button from "../common/Button";
import FeedbackCard from "./FeedbackCard";
import TypingBubble from "./TypingBubble";

function MessageBubble({ msg, onContinue, onEndEarly, onReset, onChip }) {
  const isBot = msg.role === "bot";
  const { content } = msg;

  const rowClass = isBot ? "flex-row" : "flex-row-reverse";
  const avatarClass = isBot ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800";
  const textBubbleClass = isBot
    ? "rounded-bl-sm border border-blue-100 bg-white text-slate-800 shadow-sm"
    : "rounded-br-sm bg-blue-600 text-white";

  return (
    <div className={`flex animate-[fadeUp_.25s_ease] gap-2.5 ${rowClass}`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClass}`}>
        {isBot ? "AI" : "You"}
      </div>
      <div className="max-w-[72%]">
        {content === "typing" && <TypingBubble />}
        {content?.type === "text" && (
          <div className={`max-w-full whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-7 ${textBubbleClass}`}>
            {content.text}
          </div>
        )}
        {content?.type === "question" && (
          <div>
            <div className="rounded-xl rounded-bl-sm border border-blue-100 bg-white px-4 py-3 text-sm leading-7 text-slate-800 shadow-sm">
              <strong>Question {content.idx} of {content.total}</strong><br /><br />{content.q}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button variant="soft" onClick={() => onChip("Give me a hint for this question", content.q, content.idx - 1)} className="px-3 py-1 text-xs font-medium">Hint</Button>
              <Button variant="soft" onClick={() => onChip("Skip this question", content.q, content.idx - 1)} className="px-3 py-1 text-xs font-medium">Skip</Button>
            </div>
          </div>
        )}
        {content?.type === "short-warn" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-2.5 text-[13px] text-amber-800 shadow-sm">
            {content.followUp || "Can you add one specific action you took and the result of that action?"}
          </div>
        )}
        {content?.type === "feedback" && <FeedbackCard content={content} />}
        {content?.type === "continue" && (
          <div>
            <div className="rounded-xl rounded-bl-sm border border-blue-100 bg-white px-4 py-3 text-sm leading-7 text-slate-800 shadow-sm">
              Great effort! Ready for the next question?
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button variant="soft" onClick={onContinue} className="px-3 py-1 text-xs font-medium">Continue</Button>
              <Button variant="soft" onClick={onEndEarly} className="px-3 py-1 text-xs font-medium">End session</Button>
            </div>
          </div>
        )}
        {content?.type === "summary" && (
          <div className="max-w-[80%] overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-sm">
            <div className="bg-blue-600 px-4 py-3.5 text-white">
              <h3 className="mb-0.5 text-base font-bold">Session complete!</h3>
              <p className="text-xs opacity-80">{content.role} - {content.diff} - {content.total} questions answered</p>
            </div>
            <div className="flex flex-col gap-2.5 px-4 py-3.5">
              <div className="grid grid-cols-3 gap-2">
                {[[`${content.totalPts}/${content.total * 10}`, "Total score"], [`${content.avg}%`, "Accuracy"], [content.followups, "Follow-ups"]].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-blue-50 px-3 py-2.5 text-center">
                    <div className="text-xl font-bold text-blue-700">{value}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
                  </div>
                ))}
              </div>
              <SectionLabel>Strong points</SectionLabel>
              <SummaryText>{content.aiSummary?.strongPoints || "You completed the practice flow and built a baseline for the next session."}</SummaryText>
              <SectionLabel>Areas to improve</SectionLabel>
              <SummaryText>{content.aiSummary?.areasToImprove || "Add more specific examples, concrete actions, and measurable results."}</SummaryText>
              {content.aiSummary?.finalAdvice && (
                <>
                  <SectionLabel>Final advice</SectionLabel>
                  <SummaryText>{content.aiSummary.finalAdvice}</SummaryText>
                </>
              )}
              <div className="mt-1 flex gap-2">
                <Button onClick={onReset}>New session</Button>
                <Button variant="soft" onClick={onReset}>Change role</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="mt-1 text-xs font-bold uppercase tracking-[0.04em] text-slate-600">
      {children}
    </div>
  );
}

function SummaryText({ children }) {
  return (
    <div className="text-[13.5px] leading-relaxed text-slate-700">
      {children}
    </div>
  );
}

export default MessageBubble;
