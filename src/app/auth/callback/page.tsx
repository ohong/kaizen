"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Exchanging code for session…");

  useEffect(() => {
    const run = async () => {
      try {
        const href = window.location.href;
        const currentUrl = new URL(href);
        const hasCode = !!currentUrl.searchParams.get("code") || href.includes("access_token=");

        // If there's no code/access_token, user may already be signed in or visited directly.
        if (!hasCode) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace("/");
            return;
          }
          // Not signed in and no code present – go to login
          router.replace("/auth/login");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(href);
        if (error) {
          // If exchange fails but session exists, continue; otherwise show a soft message then redirect
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace("/");
            return;
          }
          setMessage(error.message || "Failed to sign in");
          setTimeout(() => router.replace("/auth/login"), 800);
          return;
        }
        setMessage("Signed in! Redirecting…");
        setTimeout(() => router.replace("/"), 400);
      } catch (e: any) {
        setMessage(e?.message ?? "Unexpected error during authentication");
      }
    };
    void run();
  }, [router]);

  return (
    <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
      <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />
      <main className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-12">
        <section className="hud-panel hud-corner w-full p-8 text-center">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            ◢ Authentication
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">Signing you in</h1>
          <p className="mt-3 text-sm text-[var(--hud-text-dim)]">{message}</p>
        </section>
      </main>
    </div>
  );
}


