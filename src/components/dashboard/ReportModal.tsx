"use client";

import { useMemo } from "react";

import type { ErrorsSummary } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

interface ReportModalResult {
  success: boolean;
  message: string;
}

interface ReportModalProps {
  open: boolean;
  owner: string;
  name: string;
  availableEmails: string[];
  selectedEmails: string[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleEmail: (email: string) => void;
  onSelectAll: (emails: string[]) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
  result: ReportModalResult | null;
  latestSync: string | null;
  errorsSummary: ErrorsSummary | null;
  errorsLoading: boolean;
}

export function ReportModal({
  open,
  owner,
  name,
  availableEmails,
  selectedEmails,
  searchQuery,
  onSearchChange,
  onToggleEmail,
  onSelectAll,
  onClearAll,
  onClose,
  onSend,
  sending,
  result,
  latestSync,
  errorsSummary,
  errorsLoading,
}: ReportModalProps) {
  const filteredEmails = useMemo(
    () =>
      availableEmails.filter((email) =>
        email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [availableEmails, searchQuery]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl hud-panel hud-corner p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--hud-text-bright)]">
            Send Exec Report
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--hud-text-dim)] hover:text-[var(--hud-text)]"
          >
            ×
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Selected Recipients ({selectedEmails.length})
          </div>
          {selectedEmails.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-2 rounded-md border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10 px-3 py-1.5 text-sm"
                >
                  <span className="text-[var(--hud-text)]">{email}</span>
                  <button
                    type="button"
                    onClick={() => onToggleEmail(email)}
                    className="text-[var(--hud-accent)] hover:text-[var(--hud-text-bright)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--hud-text-dim)]">No recipients selected</p>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="flex-1 border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onSelectAll(filteredEmails)}
              className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-danger)]/60 hover:text-[var(--hud-danger)]"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {filteredEmails.map((email) => {
              const isSelected = selectedEmails.includes(email);
              const isRealEmail = email === "javokhir@raisedash.com";
              return (
                <button
                  key={email}
                  type="button"
                  onClick={() => onToggleEmail(email)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--hud-accent)]/50 bg-[var(--hud-accent)]/10"
                      : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] hover:border-[var(--hud-accent)]/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        isSelected
                          ? "border-[var(--hud-accent)] bg-[var(--hud-accent)]"
                          : "border-[var(--hud-border)] bg-[var(--hud-bg)]"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-[var(--hud-bg)]" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[var(--hud-text)]">{email}</span>
                    {isRealEmail && (
                      <span className="rounded-full border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-accent)]">
                        Real
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Repository: {owner}/{name} • Latest Sync: {latestSync ? formatDateTime(latestSync) : "—"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
              Errors: {errorsLoading ? "Loading…" : errorsSummary ? `${errorsSummary.total} in 7d` : "Unavailable"}
            </p>
          </div>
        </div>

        {result && (
          <div
            className={`mb-4 rounded-lg border p-3 ${
              result.success
                ? "border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10"
                : "border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/10"
            }`}
          >
            <p className={result.success ? "text-[var(--hud-accent)]" : "text-[var(--hud-danger)]"}>
              {result.message}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || selectedEmails.length === 0}
            className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : `Send Exec Report (${selectedEmails.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
