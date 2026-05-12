const rows = [
  ["bg-emerald-50 text-emerald-600", "Strength"],
  ["bg-amber-50 text-amber-700", "Improve"],
  ["bg-teal-50 text-teal-700", "Sample"],
];

function FeedbackCard({ content }) {
  const values = [content.strength, content.improve, content.sample];

  return (
    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-3.5 py-2.5">
        <span className="text-[13px] font-bold text-blue-800">AI Feedback</span>
        <span className="rounded-full border-2 border-blue-200 bg-white px-3 py-0.5 text-[13px] font-bold text-blue-700">{content.score}/10</span>
      </div>
      <div className="flex flex-col gap-2 px-3.5 py-3">
        {rows.map(([badgeClass, label], index) => (
          <div key={label} className="flex items-start gap-2 text-[13px]">
            <span className={`mt-px whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em] ${badgeClass}`}>{label}</span>
            <span className="leading-relaxed text-slate-700">{values[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedbackCard;
