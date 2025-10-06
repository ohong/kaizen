import { supabase } from "@/lib/supabase";

interface GitHubRepoApiResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
  description: string | null;
}

export interface GithubRepositoryOption {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
}

export async function fetchUserRepositories(limit: number = 100): Promise<GithubRepositoryOption[]> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.provider_token;
  if (!token) {
    throw new Error("Missing GitHub access token");
  }

  const results: GithubRepositoryOption[] = [];
  let page = 1;

  while (results.length < limit) {
    const response = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const body = (await response.json()) as GitHubRepoApiResponse[];
    if (!body.length) break;

    results.push(
      ...body.map((repo) => ({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
      }))
    );

    if (body.length < 100) break;
    page += 1;
  }

  return results.slice(0, limit);
}
