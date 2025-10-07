"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SessionUser {
  email: string | null;
  userId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  githubConnected: boolean;
}

export function UserMenu() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }
    const sessionUser = session.user;
    const email = sessionUser.email ?? null;
    const userId = sessionUser.id ?? null;
    const fullName = (sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || null) as string | null;
    const avatarUrl = (sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null) as string | null;
    const githubConnected = Boolean(session.provider_token);
    setUser({ email, userId, fullName, avatarUrl, githubConnected });
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    void loadSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadSession]);

  const handleGoogleSignin = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }, []);

  const handleGithubSignin = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        scopes: "read:user repo",
      },
    });
  }, []);

  const handleSignout = useCallback(async () => {
    await supabase.auth.signOut();
    await loadSession();
  }, [loadSession]);

  const initials = useMemo(() => {
    if (!user?.fullName && !user?.email) return "";
    const source = user.fullName ?? user.email ?? "";
    const parts = source.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
  }, [user]);

  if (!mounted || loading) {
    return (
      <div className="min-w-[120px] text-right font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGithubSignin}
          className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)]"
        >
          Sign in with GitHub
        </button>
        <button
          type="button"
          onClick={handleGoogleSignin}
          className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
        >
          Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.fullName || user.email || "User"}
          width={28}
          height={28}
          className="h-7 w-7 rounded-full border border-[var(--hud-border)] object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] text-[10px] text-[var(--hud-text-dim)]">
          {initials}
        </div>
      )}
      <div className="hidden flex-col leading-tight sm:flex">
        <span className="text-xs text-[var(--hud-text)] max-w-[220px] truncate">{user.fullName || user.email}</span>
        {!user.githubConnected && (
          <button
            type="button"
            onClick={handleGithubSignin}
            className="self-start text-[10px] uppercase tracking-wider text-[var(--hud-accent)] hover:underline"
          >
            Connect GitHub
          </button>
        )}
        <button
          type="button"
          onClick={handleSignout}
          className="self-start text-[10px] uppercase tracking-wider text-[var(--hud-danger)] hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
