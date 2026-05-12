const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
      </svg>
    </div>
    <span className="text-base font-bold text-blue-950">
      AI <span className="text-blue-400">Practice</span> Bot
    </span>
  </div>
);

export default Logo;
