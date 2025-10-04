export interface Database {
  public: {
    Tables: {
      pull_requests: {
        Row: {
          id: string;
          pr_number: number;
          title: string;
          body: string | null;
          state: 'open' | 'closed';
          author: string;
          author_avatar_url: string | null;
          created_at: string;
          updated_at: string;
          merged_at: string | null;
          closed_at: string | null;
          html_url: string;
          draft: boolean;
          labels: any[] | null;
          requested_reviewers: any[] | null;
          requested_teams: any[] | null;
          head_ref: string;
          base_ref: string;
          // PR size metrics
          additions: number | null;
          deletions: number | null;
          changed_files: number | null;
          commits_count: number | null;
          // Engagement metrics
          comments_count: number;
          review_comments_count: number;
          reviews_count: number;
          // Status fields
          is_merged: boolean;
          mergeable_state: string | null;
          assignees: any[] | null;
          // Time-based metrics
          time_to_first_review_hours: number | null;
          time_to_merge_hours: number | null;
          time_to_close_hours: number | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          pr_number: number;
          title: string;
          body?: string | null;
          state: 'open' | 'closed';
          author: string;
          author_avatar_url?: string | null;
          created_at: string;
          updated_at: string;
          merged_at?: string | null;
          closed_at?: string | null;
          html_url: string;
          draft?: boolean;
          labels?: any[] | null;
          requested_reviewers?: any[] | null;
          requested_teams?: any[] | null;
          head_ref: string;
          base_ref: string;
          // PR size metrics
          additions?: number | null;
          deletions?: number | null;
          changed_files?: number | null;
          commits_count?: number | null;
          // Engagement metrics
          comments_count?: number;
          review_comments_count?: number;
          reviews_count?: number;
          // Status fields
          is_merged?: boolean;
          mergeable_state?: string | null;
          assignees?: any[] | null;
          // Time-based metrics
          time_to_first_review_hours?: number | null;
          time_to_merge_hours?: number | null;
          time_to_close_hours?: number | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          pr_number?: number;
          title?: string;
          body?: string | null;
          state?: 'open' | 'closed';
          author?: string;
          author_avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          merged_at?: string | null;
          closed_at?: string | null;
          html_url?: string;
          draft?: boolean;
          labels?: any[] | null;
          requested_reviewers?: any[] | null;
          requested_teams?: any[] | null;
          head_ref?: string;
          base_ref?: string;
          // PR size metrics
          additions?: number | null;
          deletions?: number | null;
          changed_files?: number | null;
          commits_count?: number | null;
          // Engagement metrics
          comments_count?: number;
          review_comments_count?: number;
          reviews_count?: number;
          // Status fields
          is_merged?: boolean;
          mergeable_state?: string | null;
          assignees?: any[] | null;
          // Time-based metrics
          time_to_first_review_hours?: number | null;
          time_to_merge_hours?: number | null;
          time_to_close_hours?: number | null;
          synced_at?: string;
        };
      };
    };
  };
}

export type PullRequest = Database['public']['Tables']['pull_requests']['Row'];
export type PullRequestInsert = Database['public']['Tables']['pull_requests']['Insert'];
export type PullRequestUpdate = Database['public']['Tables']['pull_requests']['Update'];
