import Button from "../components/common/Button";
import Logo from "../components/layout/Logo";
import { ROLE_CARDS } from "../data/constants";

function WelcomePage({ onStart, onLogin, onRegister }) {
  const navItems = [
    ["Features", "features"],
    ["Job Roles", "job-roles"],
    ["How it works", "how-it-works"],
  ];
  const stats = [["6", "Job roles"], ["3", "Difficulty levels"], ["AI", "Instant feedback"], ["100%", "Free to use"]];
  const features = [
    { tone: "bg-blue-50", title: "Real-time feedback", desc: "Get scored on every answer with strengths, improvements, and a sample response instantly." },
    { tone: "bg-emerald-50", title: "Track your progress", desc: "Watch your score and skill bars grow across communication, problem-solving, and clarity." },
    { tone: "bg-amber-50", title: "Role-specific questions", desc: "Questions are tailored to your chosen role and difficulty, not generic interview fluff." },
    { tone: "bg-teal-50", title: "Follow-up prompts", desc: "Short answers? The AI nudges you to elaborate, just like a real interviewer would." },
  ];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f0f6fd] text-slate-800">
      <nav className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-4 border-b border-blue-100 bg-white px-8 max-[720px]:flex-col max-[720px]:items-start max-[720px]:px-4 max-[720px]:py-3">
        <Logo />
        <div className="flex flex-wrap items-center justify-end gap-1.5 max-[720px]:w-full max-[720px]:justify-start max-[460px]:[&>button]:flex-auto">
          {navItems.map(([label, id]) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToSection(id)}
              className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={onLogin}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[13px] font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Login
          </button>
        </div>
      </nav>

      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 to-[#f0f6fd] px-8 pb-12 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-700">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          AI-powered interview coaching
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight text-blue-950">
          Ace your next<br />interview with <span className="text-blue-400">AI</span>
        </h1>
        <p className="mx-auto mb-8 max-w-[500px] text-[15px] leading-7 text-slate-600">
          Practice real interview questions for your job role, get instant AI feedback, and track your improvement, all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button onClick={onRegister} className="rounded-xl px-7 py-3 text-sm">Start practicing</Button>
        </div>
      </section>

      <div className="flex flex-wrap justify-center border-y border-blue-100 bg-white">
        {stats.map(([value, label]) => (
          <div key={label} className="border-r border-blue-100 px-10 py-5 text-center last:border-r-0 max-[720px]:flex-[1_1_50%] max-[720px]:p-4 max-[720px]:[&:nth-child(2)]:border-r-0 max-[460px]:flex-[1_1_100%] max-[460px]:border-r-0">
            <div className="text-2xl font-bold text-blue-700">{value}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <section id="features" className="scroll-mt-[76px] bg-white px-8 py-12">
        <SectionHeader eyebrow="Why it works" title="Everything you need to prepare" description="Structured practice with real feedback beats reading prep guides alone." />
        <div className="mx-auto grid max-w-[760px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {features.map((card) => (
            <div key={card.title} className="rounded-xl border border-l-[3px] border-blue-100 border-l-blue-400 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-blue-700 ${card.tone}`}>AI</div>
              <h3 className="mb-1.5 text-sm font-bold text-blue-950">{card.title}</h3>
              <p className="text-[13px] leading-relaxed text-slate-600">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="job-roles" className="scroll-mt-[76px] px-8 py-12">
        <SectionHeader eyebrow="Supported roles" title="Pick your role, start practicing" description="Choose from six common job roles and customize your difficulty and session length." />
        <div className="mx-auto mb-10 grid max-w-[720px] grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
          {ROLE_CARDS.map(([icon, name]) => (
            <button key={name} type="button" onClick={onStart} className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-center shadow-sm transition hover:border-blue-200 hover:bg-blue-50">
              <div className="mb-1 text-sm font-extrabold text-blue-600">{icon}</div>
              <div className="text-[13px] font-semibold text-blue-800">{name}</div>
            </button>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-[76px] bg-white px-8 pb-14 pt-12">
        <SectionHeader eyebrow="How it works" title="Three steps to interview-ready" description="Simple to start, powerful enough to actually prepare you." />
        <div className="relative mx-auto flex max-w-[680px] max-[720px]:flex-col max-[720px]:gap-5">
          <div className="absolute left-[calc(16.6%+18px)] right-[calc(16.6%+18px)] top-[18px] z-0 h-0.5 bg-blue-100 max-[720px]:hidden" />
          {[["1", "Choose your setup", "Pick a role, difficulty, and number of questions."], ["2", "Answer questions", "The AI asks, you answer. Type freely, as long as you need."], ["3", "Get feedback", "Instant scored feedback with strengths and a sample answer."]].map(([number, heading, copy]) => (
            <div key={number} className="flex-1 px-4 text-center">
              <div className="relative z-[1] mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">{number}</div>
              <h4 className="mb-1 text-[13px] font-bold text-blue-800">{heading}</h4>
              <p className="text-xs leading-relaxed text-slate-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between gap-4 border-t border-blue-100 bg-white px-8 py-5 text-xs text-slate-400 max-[720px]:flex-col max-[720px]:items-start">
        <Logo />
        <span>Built to help you land the job.</span>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <>
      <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-blue-400">{eyebrow}</div>
      <div className="mb-2 text-center text-2xl font-bold text-blue-950">{title}</div>
      <div className="mx-auto mb-10 max-w-[460px] text-center text-sm text-slate-600">{description}</div>
    </>
  );
}

export default WelcomePage;
