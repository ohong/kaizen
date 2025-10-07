"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAvailableRepositories, parseRepositoryFromUrl, buildRepositoryUrl } from "@/lib/repository-utils";
import type { Database } from "@/lib/types/database";
import type { RepositoryOption } from "@/lib/repository-utils";
import { Datadog } from "@/components/icons/Datadog";
import { Linear } from "@/components/icons/Linear";

type Integration = Database['public']['Tables']['integrations']['Row'];
type IntegrationInsert = Database['public']['Tables']['integrations']['Insert'];

interface DatadogIntegrationForm {
  name: string;
  apiKey: string;
  appKey: string;
  site: string;
}

interface SyncSummary {
  from: string;
  to: string;
  query: string;
  pages: number;
  processed: number;
  upserted: number;
}

interface DatadogSyncResponse {
  error?: string;
  summary?: SyncSummary;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const selectedRepository = useMemo(() => parseRepositoryFromUrl(searchParams), [searchParams]);
  
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatadogForm, setShowDatadogForm] = useState(false);
  const [formData, setFormData] = useState<DatadogIntegrationForm>({
    name: '',
    apiKey: '',
    appKey: '',
    site: 'datadoghq.com'
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncIntegration, setSyncIntegration] = useState<Integration | null>(null);
  const [syncSubmitting, setSyncSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [syncingIntegrationId, setSyncingIntegrationId] = useState<string | null>(null);
  const [syncForm, setSyncForm] = useState({
    days: 7,
    service: '',
    env: '',
    status: 'error',
    query: '',
    tags: '', // comma or space separated
    limitPerPage: 100,
    maxPages: 10,
  });

  const getRepositoryId = useCallback(async (repo: { owner: string; name: string }): Promise<string | null> => {
    const { data } = await supabase
      .from('repositories')
      .select('id')
      .eq('owner', repo.owner)
      .eq('name', repo.name)
      .single<{ id: string }>();
    return data?.id ?? null;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available repositories using the same pattern as homepage
      const availableRepos = await getAvailableRepositories();
      setRepositories(availableRepos);

      // Load integrations for the selected repository
      const repositoryId = await getRepositoryId(selectedRepository);
      if (!repositoryId) {
        setIntegrations([]);
        return;
      }

      const { data: integrationsData, error: integrationsError } = await supabase
        .from('integrations')
        .select('id, repository_id, type, name, status, config, created_at, updated_at, datadog_api_key, datadog_app_key')
        .eq('repository_id', repositoryId)
        .order('created_at', { ascending: false });

      if (integrationsError) throw integrationsError;

      setIntegrations(integrationsData ?? []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [getRepositoryId, selectedRepository]);

  // Load repositories and integrations
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRepositoryChange = (owner: string, name: string) => {
    const newUrl = buildRepositoryUrl(owner, name, '/integrations');
    router.push(newUrl);
  };

  const handleDatadogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.apiKey || !formData.appKey) {
      setError('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const repositoryId = await getRepositoryId(selectedRepository);
      if (!repositoryId) {
        throw new Error('Repository not found');
      }

      const integrationData: IntegrationInsert = {
        repository_id: repositoryId,
        type: 'datadog',
        name: formData.name,
        status: 'active',
        config: {
          site: formData.site
        },
        datadog_api_key: formData.apiKey,
        datadog_app_key: formData.appKey
      };

      const { data, error } = await supabase
        .from('integrations')
        .insert(integrationData)
        .select()
        .single<Integration>();

      if (error) throw error;

      if (data) {
        setIntegrations(prev => [data, ...prev]);
      }
      setShowDatadogForm(false);
      setFormData({
        name: '',
        apiKey: '',
        appKey: '',
        site: 'datadoghq.com'
      });
    } catch (err) {
      console.error('Error creating integration:', err);
      setError(err instanceof Error ? err.message : 'Failed to create integration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      setDeleteLoading(integrationId);
      setError(null);

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
    } catch (err) {
      console.error('Error deleting integration:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete integration');
    } finally {
      setDeleteLoading(null);
    }
  };

  const openSyncDialog = (integration: Integration) => {
    setSyncIntegration(integration);
    setSyncSummary(null);
    setSyncError(null);
    setSyncForm({
      days: 7,
      service: '',
      env: '',
      status: 'error',
      query: '',
      tags: '',
      limitPerPage: 100,
      maxPages: 10,
    });
    setShowSyncDialog(true);
  };

  const closeSyncDialog = () => {
    setShowSyncDialog(false);
    setSyncIntegration(null);
    setSyncSubmitting(false);
    setSyncingIntegrationId(null);
    setSyncError(null);
    setSyncSummary(null);
  };

  const parseTags = (input: string): string[] | undefined => {
    if (!input) return undefined;
    const parts = input
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    return parts.length > 0 ? parts : undefined;
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncIntegration) return;
    try {
      setSyncSubmitting(true);
      setSyncError(null);
      setSyncSummary(null);
      setSyncingIntegrationId(syncIntegration.id);

      const payload: Record<string, unknown> = {
        integrationId: syncIntegration.id,
        days: Number(syncForm.days),
      };
      if (syncForm.service.trim()) payload.service = syncForm.service.trim();
      if (syncForm.env.trim()) payload.env = syncForm.env.trim();
      if (syncForm.status.trim()) payload.status = syncForm.status.trim();
      if (syncForm.query.trim()) payload.query = syncForm.query.trim();
      const tags = parseTags(syncForm.tags);
      if (tags) payload.tags = tags;
      if (Number.isFinite(syncForm.limitPerPage) && syncForm.limitPerPage > 0) payload.limitPerPage = syncForm.limitPerPage;
      if (Number.isFinite(syncForm.maxPages) && syncForm.maxPages > 0) payload.maxPages = syncForm.maxPages;

      const res = await fetch('/api/import_datadog_errors_to_supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as DatadogSyncResponse;
      if (!res.ok) {
        throw new Error(json.error || 'Failed to sync Datadog logs');
      }
      setSyncSummary(json.summary ?? null);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncError(err instanceof Error ? err.message : 'Failed to sync Datadog logs');
    } finally {
      setSyncSubmitting(false);
      setSyncingIntegrationId(null);
    }
  };

  const getSelectedRepositoryName = () => {
    // Since we're filtering by repository, all integrations belong to the selected repository
    return `${selectedRepository.owner}/${selectedRepository.name}`;
  };

  const getIntegrationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[var(--hud-accent)] bg-[var(--hud-accent)]/10';
      case 'inactive': return 'text-[var(--hud-text-dim)] bg-[var(--hud-bg)]';
      case 'error': return 'text-[var(--hud-danger)] bg-[var(--hud-danger)]/10';
      default: return 'text-[var(--hud-text-dim)] bg-[var(--hud-bg)]';
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
        {/* Corner decorations */}
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--hud-accent)] mx-auto"></div>
            <p className="mt-4 text-[var(--hud-text-dim)]">Loading integrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
      {/* Corner decorations */}
      <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--hud-border)] bg-[var(--hud-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Back to dashboard">
              <Image
                src="/logo.png"
                alt="Kaizen"
                width={140}
                height={40}
                className="h-10 w-auto opacity-90"
              />
            </Link>
            <div className="hidden h-8 w-px bg-[var(--hud-border)] md:block" />
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--hud-text-dim)]">
              <span className="text-[var(--hud-accent)]">▸</span> Integrations
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-8 py-12">
        {/* Page Title */}
        <section className="hud-panel hud-corner hud-scanline mb-10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                ◢ Integration Management
              </div>
              <h1 className="mt-2 text-4xl font-semibold text-[var(--hud-text-bright)]">
                Third-Party Integrations
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-[var(--hud-text-dim)]">
                Manage third-party integrations for {selectedRepository.owner}/{selectedRepository.name}. 
                Connect external services to enhance your development workflow and monitoring capabilities.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={`${selectedRepository.owner}/${selectedRepository.name}`}
                onChange={(e) => {
                  const [owner, name] = e.target.value.split('/');
                  handleRepositoryChange(owner, name);
                }}
                className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
              >
                {repositories.map(repo => (
                  <option key={`${repo.owner}/${repo.name}`} value={`${repo.owner}/${repo.name}`}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="hud-panel hud-corner mb-6 border border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/5 p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl text-[var(--hud-danger)]">✗</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--hud-danger)]">Error</h3>
                <p className="mt-1 text-sm text-[var(--hud-text)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Integration Section */}
        <section className="hud-panel hud-corner mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">Add New Integration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setShowDatadogForm(true)}
              className="p-4 border-2 border-dashed border-[var(--hud-border)] rounded-lg hover:border-[var(--hud-accent)]/60 hover:bg-[var(--hud-accent)]/5 transition-all duration-200"
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white">
                  <Datadog className="h-9 w-9" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-[var(--hud-text-bright)]">Datadog</h3>
                <p className="mt-1 text-sm text-[var(--hud-text-dim)]">Monitor errors and performance</p>
              </div>
            </button>

            {/* Linear placeholder */}
            <div className="p-4 border-2 border-dashed border-[var(--hud-border)]/50 rounded-lg bg-[var(--hud-bg)] opacity-60">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white/80">
                  <Linear className="h-8 w-8" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-[var(--hud-text-dim)]">Linear</h3>
                <p className="mt-1 text-sm text-[var(--hud-text-dim)]">Coming soon</p>
              </div>
            </div>

            {/* Placeholder for future integrations */}
            <div className="p-4 border-2 border-dashed border-[var(--hud-border)]/40 rounded-lg opacity-40">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-[var(--hud-bg)]">
                  <svg className="h-6 w-6 text-[var(--hud-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-[var(--hud-text-dim)]">More integrations</h3>
                <p className="mt-1 text-sm text-[var(--hud-text-dim)]">Coming soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* Datadog Integration Form Modal */}
        {showDatadogForm && (
          <div className="fixed inset-0 bg-[var(--hud-bg)]/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 w-96">
              <div className="hud-panel hud-corner p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--hud-text-bright)]">Add Datadog Integration</h3>
                  <button
                    onClick={() => setShowDatadogForm(false)}
                    className="text-[var(--hud-text-dim)] hover:text-[var(--hud-text-bright)] transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleDatadogSubmit} className="space-y-4">
                  <div className="border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/5 rounded-md p-3">
                    <p className="text-sm text-[var(--hud-accent)]">
                      <strong>Repository:</strong> {selectedRepository.owner}/{selectedRepository.name}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Integration Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                      placeholder="e.g., Production Monitoring"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Datadog Site</label>
                    <select
                      value={formData.site}
                      onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                      className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                    >
                      <option value="datadoghq.com">US1 (datadoghq.com)</option>
                      <option value="datadoghq.eu">EU1 (datadoghq.eu)</option>
                      <option value="us3.datadoghq.com">US3 (us3.datadoghq.com)</option>
                      <option value="us5.datadoghq.com">US5 (us5.datadoghq.com)</option>
                      <option value="ap1.datadoghq.com">AP1 (ap1.datadoghq.com)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">API Key</label>
                    <input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                      placeholder="Your Datadog API key"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Application Key</label>
                    <input
                      type="password"
                      value={formData.appKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, appKey: e.target.value }))}
                      className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                      placeholder="Your Datadog application key"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDatadogForm(false)}
                      className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? 'Adding...' : 'Add Integration'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Existing Integrations */}
        <section className="hud-panel hud-corner">
          <div className="px-6 py-4 border-b border-[var(--hud-border)]">
            <h2 className="text-lg font-semibold text-[var(--hud-text-bright)]">Existing Integrations</h2>
          </div>
          
          {integrations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-[var(--hud-text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-[var(--hud-text-bright)]">No integrations</h3>
              <p className="mt-1 text-sm text-[var(--hud-text-dim)]">Get started by adding your first integration.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--hud-border)]">
              {integrations.map((integration) => (
                <div key={integration.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {integration.type === 'datadog' && (
                          <div className="h-10 w-10 rounded-full bg-[var(--hud-accent)]/10 flex items-center justify-center">
                            <svg className="h-6 w-6 text-[var(--hud-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[var(--hud-text-bright)]">
                          {integration.name || `${integration.type} Integration`}
                        </h3>
                        <p className="text-sm text-[var(--hud-text-dim)]">
                          {getSelectedRepositoryName()}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIntegrationStatusColor(integration.status)}`}>
                            {integration.status}
                          </span>
                          <span className="text-xs text-[var(--hud-text-dim)]">
                            {integration.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integration.type === 'datadog' && (
                        <button
                          onClick={() => openSyncDialog(integration)}
                          disabled={syncSubmitting && syncingIntegrationId === integration.id}
                          className="border border-[var(--hud-accent)] bg-[var(--hud-accent)]/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)]/20 disabled:opacity-50"
                        >
                          {syncSubmitting && syncingIntegrationId === integration.id ? 'Syncing…' : 'Sync'}
                        </button>
                      )}
                      <span className="text-xs text-[var(--hud-text-dim)]">
                        Added {new Date(integration.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteIntegration(integration.id)}
                        disabled={deleteLoading === integration.id}
                        className="text-[var(--hud-danger)] hover:text-[var(--hud-danger)]/80 disabled:opacity-50 transition-colors"
                      >
                        {deleteLoading === integration.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--hud-danger)]"></div>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sync Datadog Modal */}
        {showSyncDialog && syncIntegration && (
          <div className="fixed inset-0 bg-[var(--hud-bg)]/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 w-[560px] max-w-[90vw]">
              <div className="hud-panel hud-corner p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--hud-text-bright)]">Sync Datadog Errors</h3>
                  <button
                    onClick={closeSyncDialog}
                    className="text-[var(--hud-text-dim)] hover:text-[var(--hud-text-bright)] transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/5 rounded-md p-3 mb-4">
                  <p className="text-sm text-[var(--hud-accent)]">
                    <strong>Integration:</strong> {syncIntegration.name || 'Datadog'} · {selectedRepository.owner}/{selectedRepository.name}
                  </p>
                </div>

                {syncError && (
                  <div className="mb-4 border border-[var(--hud-danger)]/50 bg-[var(--hud-danger)]/10 p-3 rounded">
                    <p className="text-sm text-[var(--hud-danger)]">{syncError}</p>
                  </div>
                )}

                {syncSummary ? (
                  <div className="space-y-3">
                    <div className="text-sm text-[var(--hud-text)]">Sync completed successfully.</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-[var(--hud-text-dim)]">
                      <div><span className="text-[var(--hud-text)]">From:</span> {new Date(syncSummary.from).toLocaleString()}</div>
                      <div><span className="text-[var(--hud-text)]">To:</span> {new Date(syncSummary.to).toLocaleString()}</div>
                      <div><span className="text-[var(--hud-text)]">Pages:</span> {syncSummary.pages}</div>
                      <div><span className="text-[var(--hud-text)]">Processed:</span> {syncSummary.processed}</div>
                      <div><span className="text-[var(--hud-text)]">Upserted:</span> {syncSummary.upserted}</div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={closeSyncDialog}
                        className="border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSyncSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Days</label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={syncForm.days}
                          onChange={(e) => setSyncForm((p) => ({ ...p, days: Number(e.target.value) }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Service (optional)</label>
                        <input
                          type="text"
                          value={syncForm.service}
                          onChange={(e) => setSyncForm((p) => ({ ...p, service: e.target.value }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                          placeholder="api, web, worker"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Environment (optional)</label>
                        <input
                          type="text"
                          value={syncForm.env}
                          onChange={(e) => setSyncForm((p) => ({ ...p, env: e.target.value }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                          placeholder="prod, staging"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Status</label>
                        <input
                          type="text"
                          value={syncForm.status}
                          onChange={(e) => setSyncForm((p) => ({ ...p, status: e.target.value }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                          placeholder="error (default), warn, info"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Additional Query (optional)</label>
                      <input
                        type="text"
                        value={syncForm.query}
                        onChange={(e) => setSyncForm((p) => ({ ...p, query: e.target.value }))}
                        className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                        placeholder="@http.status_code:500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Tags (optional)</label>
                      <input
                        type="text"
                        value={syncForm.tags}
                        onChange={(e) => setSyncForm((p) => ({ ...p, tags: e.target.value }))}
                        className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                        placeholder="team:core version:1.2.3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Limit per page</label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={syncForm.limitPerPage}
                          onChange={(e) => setSyncForm((p) => ({ ...p, limitPerPage: Number(e.target.value) }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Max pages</label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={syncForm.maxPages}
                          onChange={(e) => setSyncForm((p) => ({ ...p, maxPages: Number(e.target.value) }))}
                          className="w-full border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={closeSyncDialog}
                        className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={syncSubmitting}
                        className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {syncSubmitting ? 'Syncing…' : 'Start Sync'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
