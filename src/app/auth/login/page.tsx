"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setEmail(data.session?.user?.email ?? null);
  }, []);

  useEffect(() => {
    void fetchSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void fetchSession();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchSession]);

  const handleGoogle = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (signInError) {
        setError(signInError.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to start Google sign-in");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
    await fetchSession();
  }, [fetchSession]);

  const isSignedIn = useMemo(() => !!email, [email]);

  return (
    <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
      <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

      <main className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-12">
        <section className="hud-panel hud-corner w-full p-8">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            ◢ Authentication
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--hud-text-bright)]">Sign in</h1>
          <p className="mt-3 text-sm text-[var(--hud-text-dim)]">
            Continue with Google to create your account or sign in.
          </p>

          {error && (
            <div className="mt-4 border border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/15 px-4 py-3 text-sm text-[var(--hud-text-bright)]">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            {!isSignedIn ? (
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Redirecting..." : "Continue with Google"}
              </button>
            ) : (
              <>
                <div className="text-sm text-[var(--hud-text)]">Signed in as {email}</div>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="border border-[var(--hud-danger)]/50 bg-[var(--hud-danger)]/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-danger)] transition-all duration-200 hover:bg-[var(--hud-danger)]/20"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

