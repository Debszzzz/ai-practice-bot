const menuItems = [
  { id: "dashboard", name: "Dashboard", purpose: "Overview", icon: "grid" },
  { id: "practice", name: "Practice", purpose: "Action", icon: "play", badge: "Live" },
  { id: "sessions", name: "Sessions", purpose: "History", icon: "list" },
  { id: "analytics", name: "Analytics", purpose: "Intelligence", icon: "chart" },
];

const accountItems = [
  { id: "profile", name: "Profile", purpose: "Account", icon: "user" },
  { id: "settings", name: "Settings", purpose: "Preferences", icon: "settings" },
];

function Sidebar({ activeView = "practice", onNavigate }) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-blue-100 bg-white px-3 pt-4 max-[980px]:order-[-1] max-[980px]:h-auto max-[980px]:w-full max-[980px]:max-w-none max-[980px]:border-b max-[980px]:border-r-0 max-[980px]:px-3 max-[980px]:py-2.5">
      <div className="flex-1 overflow-hidden max-[980px]:overflow-x-auto max-[980px]:overflow-y-hidden">
        <div className="flex flex-col gap-0.5 max-[980px]:min-w-max max-[980px]:flex-row max-[980px]:items-stretch max-[980px]:gap-2">
          <div className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 max-[980px]:hidden">Menu</div>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
          <div className="hidden max-[980px]:contents">
            {accountItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={() => onNavigate?.(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-blue-100 py-3 max-[980px]:hidden">
        <div className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Account</div>
        {accountItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={activeView === item.id}
            onClick={() => onNavigate?.(item.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 max-[980px]:min-w-[132px] max-[980px]:border max-[980px]:border-blue-100 max-[980px]:bg-white max-[560px]:min-w-[88px] max-[560px]:justify-center max-[560px]:px-2.5 ${
        active ? "bg-blue-50 text-blue-700 max-[980px]:border-blue-300" : ""
      }`}
      onClick={() => onClick?.()}
    >
      <Icon name={item.icon} />

      <span className="flex min-w-0 flex-col gap-px max-[560px]:items-center">
        <span className="text-[13.5px] font-semibold leading-tight max-[560px]:text-xs">
          {item.name}
        </span>

        <span className={`text-[10.5px] leading-tight max-[560px]:hidden ${active ? "text-blue-600" : "text-slate-400"}`}>
          {item.purpose}
        </span>
      </span>
    </button>
  );
}

function Icon({ name }) {
  if (name === "play") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <circle cx="12" cy="12" r="10" />
        <path d="M10 8l6 4-6 4V8z" />
      </svg>
    );
  }

  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-7" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V22h-4v-.2a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H2v-4h.2a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V2h4v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1h.2v4h-.2a1.7 1.7 0 00-1.5 1z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

const iconClass = "h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]";

export default Sidebar;
