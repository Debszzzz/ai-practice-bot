import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import PracticePage from "./pages/PracticePage";
import RegisterPage from "./pages/RegisterPage";
import WelcomePage from "./pages/WelcomePage";

export default function App() {
  const [page, setPage] = useState("welcome");
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const goPractice = () => {
    setPage(user ? "practice" : "login");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setPage("welcome");
  };

  return (
    <>
      {page === "welcome" && (
        <WelcomePage
          onStart={goPractice}
          onLogin={() => setPage("login")}
          onRegister={() => setPage("register")}
        />
      )}
      {page === "practice" && <PracticePage user={user} onLogout={logout} />}
      {page === "login" && <LoginPage onBack={() => setPage("welcome")} onRegister={() => setPage("register")} onSuccess={() => setPage("practice")} />}
      {page === "register" && <RegisterPage onBack={() => setPage("welcome")} onLogin={() => setPage("login")} onSuccess={() => setPage("practice")} />}
    </>
  );
}
