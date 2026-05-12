import Button from "../common/Button";
import Logo from "./Logo";

function Header({ sessionLabel = "No active session", userEmail, onReset, onLogout }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-blue-100 bg-white px-6">
      <Logo />
      <div className="flex items-center gap-2.5">
        {userEmail && (
          <span className="text-xs font-semibold text-slate-600 max-[720px]:hidden">
            {userEmail}
          </span>
        )}
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          {sessionLabel}
        </span>
        <Button variant="outline" onClick={onReset}>New Session</Button>
        {onLogout && <Button onClick={onLogout}>Logout</Button>}
      </div>
    </header>
  );
}

export default Header;
