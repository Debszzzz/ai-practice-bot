import { useState } from "react";
import Button from "../components/common/Button";
import { supabase } from "../lib/supabase";
import { AuthShell, authInputClass } from "./LoginPage";

function RegisterPage({ onBack, onLogin, onSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data, error: registerError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (registerError) {
        setError(registerError.message);
        return;
      }

      if (data.session) {
        onSuccess();
        return;
      }

      setMessage("Account created. Check your email to confirm your account, then log in.");
    } catch (requestError) {
      setError(requestError.message || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Set up your practice profile and start preparing." footerText="Already have an account?" footerAction="Login" onFooter={onLogin}>
      <form onSubmit={handleRegister} className="grid gap-2.5">
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={authInputClass} />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClass} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={authInputClass} />
        {error && <p className="text-xs leading-relaxed text-amber-800">{error}</p>}
        {message && <p className="text-xs leading-relaxed text-emerald-600">{message}</p>}
        <Button disabled={loading} className="w-full py-3">{loading ? "Creating account..." : "Register"}</Button>
        <Button type="button" variant="outline" onClick={onBack} className="w-full py-3">Back to home</Button>
      </form>
    </AuthShell>
  );
}

export default RegisterPage;
