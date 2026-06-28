import { useState } from "react";
import { Compass, Shield, Lock, Mail, ArrowRight, Github } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all requested fields.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }
        setError("Check your email for a confirmation link.");
        setIsLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const autofillDemo = () => {
    setEmail("founder@venture.os");
    setPassword("incubation_2026");
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] overflow-hidden flex items-center justify-center select-none font-sans">
      {/* Background grid system alignment */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Dynamic ambient violet radial vector orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C6EF8]/5 blur-[120px] rounded-full glowing-orb pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Main platform logo */}
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-950 border border-white/5 text-[#7C6EF8] mb-4 shadow-xl">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-extrabold font-syne tracking-tight text-white">
            Venture<span className="text-[#7C6EF8]">OS</span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono uppercase mt-2 tracking-widest">
            AI Venture Incubation Console
          </p>
        </div>

        {/* Login Portal Card */}
        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle upper glow ribbon */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#7C6EF8]/40 to-transparent" />

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 text-center">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                Enterprise Email Address
              </label>
              <div className="relative flex items-center bg-zinc-900/60 border border-white/5 rounded-lg focus-within:border-[#7C6EF8]/40 transition-all duration-300">
                <div className="pl-3 text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. founder@venture.os"
                  className="w-full px-3 py-2.5 text-xs bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                  Access Key Passphrase
                </label>
                <span className="text-[10px] text-zinc-600 hover:text-[#7C6EF8] transition-colors cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative flex items-center bg-zinc-900/60 border border-white/5 rounded-lg focus-within:border-[#7C6EF8]/40 transition-all duration-300">
                <div className="pl-3 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2.5 text-xs bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Incubation authorization button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#7C6EF8] hover:bg-[#6c5ee0] active:scale-[0.98] disabled:opacity-40 text-white rounded-lg text-xs font-bold font-space uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,110,248,0.25)]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
                  <span>AUTHORIZING PORTAL...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "CREATE ACCOUNT" : "INITIALIZE CONSOLE"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle sign up / sign in */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-[10px] font-mono text-zinc-500 hover:text-[#7C6EF8] transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Social connection line */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-3 text-[9px] font-mono uppercase tracking-widest text-zinc-600">
              Authorized Integrations
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button
            onClick={autofillDemo}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-mono font-medium text-zinc-400 hover:text-white transition-all duration-200"
          >
            ⚡ AUTOFILL CONSOLE DEMO CREDENTIALS
          </button>
        </div>

        {/* Footer info links */}
        <div className="flex items-center justify-between mt-6 px-4">
          <span className="text-[9px] text-zinc-600 font-mono">
            VentureOS v2.4.0 (Secure Terminal)
          </span>
          <div className="flex gap-3 text-[9px] text-zinc-500 font-mono">
            <span className="hover:text-zinc-300 cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:text-zinc-300 cursor-pointer">SLA Core</span>
          </div>
        </div>
      </div>
    </div>
  );
}
