"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getAvailableRepositories, type RepositoryOption } from "@/lib/repository-utils";
import type {
  DeveloperMetrics,
  PullRequest,
  RepositoryMetrics,
} from "@/lib/types/database";

type RepositoryIdentifier = {
  owner: string;
  name: string;
};

interface UseRepositoryDashboardResult {
  prs: PullRequest[];
  developerMetrics: DeveloperMetrics[];
  repositoryMetrics: RepositoryMetrics[];
  repositories: RepositoryOption[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRepositoryDashboard(
  selectedRepository: RepositoryIdentifier
): UseRepositoryDashboardResult {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [developerMetrics, setDeveloperMetrics] = useState<DeveloperMetrics[]>([]);
  const [repositoryMetrics, setRepositoryMetrics] = useState<RepositoryMetrics[]>([]);
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [prResult, devResult, repoResult] = await Promise.all([
        supabase
          .from("pull_requests")
          .select("*")
          .eq("repository_owner", selectedRepository.owner)
          .eq("repository_name", selectedRepository.name)
          .order("updated_at", { ascending: false }),
        supabase
          .from("developer_metrics")
          .select("*")
          .eq("repository_owner", selectedRepository.owner)
          .eq("repository_name", selectedRepository.name),
        supabase.from("repository_metrics").select("*"),
      ]);

      if (prResult.error) throw prResult.error;
      if (devResult.error) throw devResult.error;
      if (repoResult.error) throw repoResult.error;

      setPrs(prResult.data ?? []);
      setDeveloperMetrics(devResult.data ?? []);
      setRepositoryMetrics(repoResult.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setPrs([]);
      setDeveloperMetrics([]);
      setRepositoryMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRepository.owner, selectedRepository.name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let isMounted = true;
    getAvailableRepositories()
      .then((items) => {
        if (isMounted) setRepositories(items);
      })
      .catch(() => {
        if (isMounted) setRepositories([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    prs,
    developerMetrics,
    repositoryMetrics,
    repositories,
    loading,
    error,
    refresh,
  };
}
