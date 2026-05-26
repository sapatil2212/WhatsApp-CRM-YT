"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, ArrowLeft, Sparkles } from "lucide-react";
import { InteractiveGrid } from "@/components/marketing/interactive-grid";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--m-bg-primary)] px-4 overflow-hidden select-none">
      {/* Decorative Grids and Blurs */}
      <InteractiveGrid gridSize={40} className="opacity-20" />
      <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Floating Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--m-text-tertiary)] hover:text-[var(--m-text-primary)] transition-colors bg-[var(--m-bg-secondary)]/60 border border-[var(--m-border-glass)] px-3 py-1.5 rounded-lg backdrop-blur"
      >
        <ArrowLeft className="size-3.5" /> Back Home
      </Link>

      <Card className="w-full max-w-md border-[var(--m-border-primary)] bg-[var(--m-bg-glass)] shadow-[var(--m-shadow-card)] backdrop-blur-xl relative z-10 p-2">
        <CardHeader className="items-center text-center pb-4">
          <div className="mb-2 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="size-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-[var(--m-text-heading)] flex items-center gap-1.5 justify-center">
            Sign In <Sparkles className="size-4 text-emerald-400" />
          </CardTitle>
          <CardDescription className="text-xs text-[var(--m-text-tertiary)] mt-1">
            Access your AI WhatsApp Automation Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-bold text-[var(--m-text-secondary)]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-[var(--m-input-border)] bg-[var(--m-input-bg)] text-xs text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-[var(--m-text-secondary)]">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-emerald-500 hover:text-emerald-400 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 border-[var(--m-input-border)] bg-[var(--m-input-bg)] text-xs text-[var(--m-text-primary)] placeholder:text-[var(--m-text-muted)] focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-[1.01] active:scale-[0.99] font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--m-text-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-emerald-500 hover:text-emerald-400 font-bold"
            >
              Create Account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
