function ProgressRing({ percent, label }) {
  const circumference = 163;
  const ringOffset = circumference - (circumference * percent / 100);

  return (
    <section className="border-b border-blue-50 bg-white px-4 py-4">
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Session progress</div>
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#E6F1FB" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="#378ADD"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>
        <div>
          <h3 className="text-xl font-bold text-blue-700">{percent}%</h3>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
    </section>
  );
}

export default ProgressRing;
