"use client";

import { FormEvent, useEffect, useState } from "react";

interface AddRepositoryModalProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: { owner: string; name: string; description?: string; token: string }) => void;
  onClose: () => void;
}

export function AddRepositoryModal({ open, submitting, error, onSubmit, onClose }: AddRepositoryModalProps) {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (open) {
      setOwner("");
      setName("");
      setDescription("");
      setToken("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      owner: owner.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      token: token.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg hud-panel hud-corner p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[var(--hud-text-bright)]">Add GitHub Repository</h3>
            <p className="mt-1 text-xs text-[var(--hud-text-dim)]">
              Works with public or private repositories. We use your personal access token for this sync only and never store it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--hud-text-dim)] hover:text-[var(--hud-text)]"
            aria-label="Close add repository modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-[var(--hud-text-dim)]">
              Owner / Org
              <input
                required
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="supabase"
                className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-sm text-[var(--hud-text)] focus:border-[var(--hud-accent)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-[var(--hud-text-dim)]">
              Repository Name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="supabase"
                className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-sm text-[var(--hud-text)] focus:border-[var(--hud-accent)] focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-[var(--hud-text-dim)]">
            Optional description
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Team or product context"
              className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-sm text-[var(--hud-text)] focus:border-[var(--hud-accent)] focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-[var(--hud-text-dim)]">
            GitHub personal access token
            <input
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ghp_..."
              className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-sm text-[var(--hud-text)] focus:border-[var(--hud-accent)] focus:outline-none"
            />
            <span className="text-xs text-[var(--hud-text-dim)]">
              Generate a token with <code>repo</code> read scopes at{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--hud-accent)] underline"
              >
                github.com/settings/tokens
              </a>
              . Provide at least <strong>Contents (read)</strong> and <strong>Metadata (read)</strong> so we can pull PR history.
            </span>
          </label>

          <div className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4 text-xs text-[var(--hud-text-dim)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--hud-accent)]">
              Quick tip
            </p>
            <p className="mt-2">
              Tokens never leave your browser aside from this sync request. Rotate or delete tokens any time from your GitHub settings.
            </p>
          </div>

          {error && (
            <div className="rounded border border-[var(--hud-danger)]/60 bg-[var(--hud-danger)]/15 px-3 py-2 text-sm text-[var(--hud-danger)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Adding…" : "Add repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
