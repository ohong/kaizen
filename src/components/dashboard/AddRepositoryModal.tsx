"use client";

import { FormEvent, useEffect, useState } from "react";

interface RepositorySuggestion {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
}

interface AddRepositoryModalProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  githubToken: string | null;
  githubUsername?: string | null;
  onConnectGithub: () => void;
  repositoryOptions: RepositorySuggestion[];
  repositoriesLoading: boolean;
  onRefreshRepositories: () => void;
  onSubmit: (payload: { owner: string; name: string; description?: string; token: string }) => void;
  onClose: () => void;
}

export function AddRepositoryModal({
  open,
  submitting,
  error,
  githubToken,
  githubUsername,
  onConnectGithub,
  repositoryOptions,
  repositoriesLoading,
  onRefreshRepositories,
  onSubmit,
  onClose,
}: AddRepositoryModalProps) {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setOwner("");
      setName("");
      setDescription("");
    }
  }, [open]);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!githubToken) {
      onConnectGithub();
      return;
    }

    onSubmit({
      owner: owner.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      token: githubToken,
    });
  };

  const connected = Boolean(githubToken);
  const hasSuggestions = connected && repositoryOptions.length > 0;

  useEffect(() => {
    if (open && connected && repositoryOptions.length === 0) {
      onRefreshRepositories();
    }
  }, [open, connected, repositoryOptions.length, onRefreshRepositories]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg hud-panel hud-corner p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[var(--hud-text-bright)]">Add GitHub Repository</h3>
            <p className="mt-1 text-xs text-[var(--hud-text-dim)]">
              Authorize GitHub once, then pick any repository to analyse. We only request read access.
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
          {!connected && (
            <div className="rounded border border-[var(--hud-warning)]/40 bg-[var(--hud-warning)]/10 p-4 text-sm text-[var(--hud-text)]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--hud-warning)]">
                Connect GitHub
              </p>
              <p className="mt-2 text-[var(--hud-text-dim)]">
                We use GitHub OAuth to fetch repository metadata with read-only <code className="mx-1 font-mono">repo</code> and
                <code className="mx-1 font-mono">read:user</code> scopes. No tokens are stored server-side.
              </p>
              <button
                type="button"
                onClick={onConnectGithub}
                className="mt-3 inline-flex items-center gap-2 rounded border border-[var(--hud-accent)] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--hud-accent)] transition-colors hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
              >
                Authorize GitHub
              </button>
            </div>
          )}

          <div className={`grid gap-3 ${hasSuggestions ? "sm:grid-cols-[minmax(0,1fr)]" : "sm:grid-cols-2"}`}>
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

          {connected && (
            <div className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] p-3 text-xs text-[var(--hud-text-dim)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--hud-text-dim)]">
                  Your repositories
                </p>
                <button
                  type="button"
                  onClick={onRefreshRepositories}
                  className="text-[var(--hud-accent)] hover:text-[var(--hud-text-bright)]"
                >
                  Refresh
                </button>
              </div>
              {repositoriesLoading ? (
                <p className="text-[var(--hud-text-dim)]">Loading repositories from GitHub…</p>
              ) : hasSuggestions ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-[var(--hud-border)] p-2">
                  {repositoryOptions.map((repo) => (
                    <li key={repo.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOwner(repo.owner);
                          setName(repo.name);
                          setDescription(repo.description || "");
                        }}
                        className="flex w-full flex-col items-start gap-1 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--hud-accent)]/40 hover:bg-[var(--hud-bg)]"
                      >
                        <span className="text-sm text-[var(--hud-text)]">{repo.fullName}</span>
                        {repo.description && (
                          <span className="text-xs text-[var(--hud-text-dim)] line-clamp-2">{repo.description}</span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--hud-text-dim)]">
                  No repositories fetched yet. Use the refresh button above to pull the latest list from GitHub.
                </p>
              )}
            </div>
          )}

          <div className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4 text-xs text-[var(--hud-text-dim)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--hud-accent)]">
              Quick tip
            </p>
            <p className="mt-2">
              Tokens never leave the browser. We send your GitHub token directly to the sync endpoint and discard it after the request completes.
            </p>
          </div>

          {connected && (
            <div className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-xs text-[var(--hud-text-dim)]">
              Connected as <span className="text-[var(--hud-text-bright)]">{githubUsername || "GitHub user"}</span>
            </div>
          )}

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
              disabled={submitting || !connected}
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
