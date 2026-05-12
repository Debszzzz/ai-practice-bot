function StatsPanel({ stats }) {
  const rows = [
    ["Total score", stats.score],
    ["Accuracy", stats.acc],
    ["Follow-ups triggered", stats.followup],
    ["Role", stats.role],
    ["Difficulty", stats.diff],
  ];

  return (
    <section className="border-b border-blue-50 bg-white px-4 py-4">
      <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Stats</div>
      <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-blue-50 px-3 py-2 text-[13px] last:border-b-0">
            <span className="text-slate-600">{label}</span>
            <span className="font-bold text-blue-700">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsPanel;
