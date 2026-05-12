"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Shield, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for the confirmation link.");
      }
    } catch (err: any) { setError(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255,255,255) 1px, transparent 0)`, backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <span className="text-2xl font-display text-ink-50">TriagePilot</span>
          </div>
          <h1 className="text-4xl font-display text-ink-50 leading-tight mb-6">Commercial submissions.<br /><span className="italic text-accent">Triaged in seconds.</span></h1>
          <p className="text-ink-400 text-lg leading-relaxed">AI-powered submission triage that reads broker packets, extracts risk signals, checks carrier appetite, and delivers source-backed underwriting briefs.</p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[{ value: "90s", label: "per brief" }, { value: "10+", label: "doc types" }, { value: "3×", label: "throughput" }].map((s) => (
              <div key={s.label}><div className="text-2xl font-display text-accent">{s.value}</div><div className="text-xs text-ink-500 mt-1">{s.label}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10"><div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div><span className="text-xl font-display text-ink-50">TriagePilot</span></div>
          <h2 className="text-2xl font-display text-ink-50 mb-1">{isLogin ? "Welcome back" : "Create account"}</h2>
          <p className="text-sm text-ink-400 mb-8">{isLogin ? "Sign in to your underwriting workspace" : "Start triaging submissions in minutes"}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@carrier.com" required /></div>
            <div><label className="label">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" required minLength={6} /></div>
            {error && <div className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-2.5">{error}</div>}
            {message && <div className="text-sm text-accent-green bg-accent-green/10 border border-accent-green/20 rounded-lg px-4 py-2.5">{message}</div>}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isLogin ? "Sign in" : "Create account"}<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="mt-6 text-center"><button onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }} className="text-sm text-ink-400 hover:text-ink-200 transition-colors">{isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}</button></div>
        </div>
      </div>
    </div>
  );
}
