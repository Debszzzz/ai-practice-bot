import { useState } from "react";
import Button from "../components/common/Button";
import Logo from "../components/layout/Logo";
import { supabase } from "../lib/supabase";

function LoginPage({ onBack, onRegister, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    onSuccess();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your interview practice." footerText="Need an account?" footerAction="Register" onFooter={onRegister}>
      <form onSubmit={handleLogin} className="grid gap-2.5">
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClass} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={authInputClass} />
        {error && <p className="text-xs leading-relaxed text-amber-800">{error}</p>}
        <Button disabled={loading} className="w-full py-3">{loading ? "Logging in..." : "Login"}</Button>
        <Button type="button" variant="outline" onClick={onBack} className="w-full py-3">Back to home</Button>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children, footerText, footerAction, onFooter }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f0f6fd] p-8">
      <div className="w-full max-w-[380px] rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-blue-950">{title}</h1>
        <p className="mb-5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        <div className="grid gap-2.5">{children}</div>
        <p className="mt-4 text-center text-[13px] text-slate-600">
          {footerText} <button type="button" onClick={onFooter} className="font-bold text-blue-700 transition hover:text-blue-800">{footerAction}</button>
        </p>
      </div>
    </div>
  );
}

export const authInputClass = "w-full rounded-lg border-2 border-blue-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400";

export default LoginPage;
