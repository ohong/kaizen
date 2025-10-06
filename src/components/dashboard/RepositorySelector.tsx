"use client";

import { useEffect, useMemo, useState } from "react";

import type { RepositoryOption } from "@/lib/repository-utils";

interface RepositorySelectorProps {
  repositories: RepositoryOption[];
  selectedOwner: string;
  selectedName: string;
  onChange: (owner: string, name: string) => void;
  onAddRepository: () => void;
}

export function RepositorySelector({
  repositories,
  selectedOwner,
  selectedName,
  onChange,
  onAddRepository,
}: RepositorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedRepoLabel = useMemo(() => {
    const match = repositories.find(
      (repo) => repo.owner === selectedOwner && repo.name === selectedName
    );
    return (match?.fullName ?? `${selectedOwner}/${selectedName}`).toUpperCase();
  }, [repositories, selectedOwner, selectedName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedRepoLabel}</span>
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] shadow-lg">
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            <li>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddRepository();
                }}
                className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--hud-accent)] transition-colors hover:bg-[var(--hud-accent)]/10"
                role="option"
                aria-selected="false"
              >
                <span>Add Repo</span>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </li>
            {repositories.length > 0 && (
              <li className="mx-4 border-t border-[var(--hud-border)]" aria-hidden="true" />
            )}
            {repositories.map((repo) => {
              const isSelected = repo.owner === selectedOwner && repo.name === selectedName;
              return (
                <li key={repo.fullName}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onChange(repo.owner, repo.name);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-medium uppercase tracking-wider transition-colors ${
                      isSelected
                        ? "bg-[var(--hud-accent)]/10 text-[var(--hud-accent)]"
                        : "text-[var(--hud-text)] hover:bg-[var(--hud-bg-elevated)]"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{repo.fullName.toUpperCase()}</span>
                    {isSelected && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
