"use client";

import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

import type { RepositoryOption } from "@/lib/repository-utils";

import { RepositorySelector } from "./RepositorySelector";

interface DashboardHeaderProps {
  owner: string;
  name: string;
  repositories: RepositoryOption[];
  onOpenAddRepository: () => void;
  onOpenReport: () => void;
  onNavigateToSurvey: () => void;
  onNavigateToIntegrations: () => void;
  onRepositoryChange: (owner: string, name: string) => void;
}

export function DashboardHeader({
  owner,
  name,
  repositories,
  onOpenAddRepository,
  onOpenReport,
  onNavigateToSurvey,
  onNavigateToIntegrations,
  onRepositoryChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hud-border)] bg-[var(--hud-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-8 py-5">
        <Link href="/" aria-label="Back to dashboard">
          <Image
            src="/logo.png"
            alt="Kaizen"
            width={140}
            height={40}
            className="h-10 w-auto opacity-90"
            priority
          />
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <RepositorySelector
            repositories={repositories}
            selectedOwner={owner}
            selectedName={name}
            onChange={onRepositoryChange}
            onAddRepository={onOpenAddRepository}
          />
          <button
            type="button"
            onClick={onNavigateToSurvey}
            className="border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
          >
            Survey
          </button>
          <button
            type="button"
            onClick={onNavigateToIntegrations}
            className="border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
          >
            Integrations
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="border border-[var(--hud-warning)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)] transition-all duration-200 hover:bg-[var(--hud-warning)] hover:text-[var(--hud-bg)]"
          >
            Send Report
          </button>
          <div className="hidden h-8 w-px bg-[var(--hud-border)] sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
