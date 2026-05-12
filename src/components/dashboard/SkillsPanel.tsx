function SkillsPanel({ skills, flowSteps, flowStep }) {
  const skillRows = [
    ["Communication", skills.comm, skills.commPct],
    ["Problem solving", skills.prob, skills.probPct],
    ["Technical depth", skills.tech, skills.techPct],
    ["Clarity", skills.clar, skills.clarPct],
  ];

  return (
    <>
      <section className="border-b border-blue-50 bg-white px-4 py-4">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Skills assessed</div>
        <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          {skillRows.map(([name, pct, pctNum]) => (
            <div key={name} className="mb-2.5 last:mb-0">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-600">{name}</span>
                <span className="font-bold text-blue-600">{pct}</span>
              </div>
              <progress
                aria-label={`${name} score`}
                value={pctNum}
                max="100"
                className="h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-400 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-blue-50 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-400"
              />
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white px-4 py-4">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Session flow</div>
        <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          <FlowRow done label="Select role & difficulty" />
          {flowSteps.map((step) => <FlowRow key={step.id} done={flowStep > step.id} active={flowStep === step.id} label={step.label} />)}
        </div>
      </section>
    </>
  );
}

function FlowRow({ label, done, active }) {
  const dotClass = done
    ? "bg-emerald-600"
    : active
      ? "bg-blue-400 shadow-[0_0_0_3px_rgb(239_246_255)]"
      : "bg-slate-200";
  const textClass = done
    ? "font-normal text-emerald-600 line-through opacity-70"
    : active
      ? "font-semibold text-blue-700"
      : "font-normal text-slate-600";

  return (
    <div className="flex items-start gap-2 border-b border-blue-50 py-2 text-[12.5px] last:border-b-0">
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <span className={textClass}>{label}</span>
    </div>
  );
}

export default SkillsPanel;
