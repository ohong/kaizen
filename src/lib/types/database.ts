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
          // Repository tracking
          repository_owner: string;
          repository_name: string;
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
          // Repository tracking
          repository_owner?: string;
          repository_name?: string;
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
          // Repository tracking
          repository_owner?: string;
          repository_name?: string;
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
      datadog_errors: {
        Row: {
          id: number;
          datadog_event_id: string;
          occurred_at: string;
          status: string | null;
          service: string | null;
          env: string | null;
          message: string | null;
          tags: string[] | null;
          attributes: any | null;
          inserted_at: string;
          repository_id: string; // uuid
        };
        Insert: {
          id?: number;
          datadog_event_id: string;
          occurred_at: string;
          status?: string | null;
          service?: string | null;
          env?: string | null;
          message?: string | null;
          tags?: string[] | null;
          attributes?: any | null;
          inserted_at?: string;
          repository_id: string;
        };
        Update: {
          id?: number;
          datadog_event_id?: string;
          occurred_at?: string;
          status?: string | null;
          service?: string | null;
          env?: string | null;
          message?: string | null;
          tags?: string[] | null;
          attributes?: any | null;
          inserted_at?: string;
          repository_id?: string;
        };
      };
      repositories: {
        Row: {
          id: string;
          owner: string;
          name: string;
          full_name: string;
          description: string | null;
          stars: number | null;
          company_size: string | null;
          industry: string | null;
          is_benchmark: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner: string;
          name: string;
          full_name: string;
          description?: string | null;
          stars?: number | null;
          company_size?: string | null;
          industry?: string | null;
          is_benchmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner?: string;
          name?: string;
          full_name?: string;
          description?: string | null;
          stars?: number | null;
          company_size?: string | null;
          industry?: string | null;
          is_benchmark?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      developer_metrics: {
        Row: {
          author: string;
          repository_owner: string;
          repository_name: string;
          total_prs: number;
          merged_prs: number;
          open_prs: number;
          merge_rate_percent: number;
          avg_merge_hours: number | null;
          avg_time_to_first_review_hours: number | null;
          total_additions: number | null;
          total_deletions: number | null;
          total_changes: number | null;
          avg_pr_size: number | null;
          avg_engagement: number | null;
          small_prs: number;
          medium_prs: number;
          large_prs: number;
          last_activity: string | null;
          activity_span_days: number | null;
        };
      };
      repository_metrics: {
        Row: {
          repository_owner: string;
          repository_name: string;
          active_contributors: number;
          total_prs: number;
          merged_prs: number;
          open_prs: number;
          merge_rate_percent: number;
          avg_merge_hours: number | null;
          median_merge_hours: number | null;
          avg_time_to_first_review_hours: number | null;
          avg_reviews_per_pr: number | null;
          avg_pr_size: number | null;
          total_changes: number | null;
          small_prs: number;
          medium_prs: number;
          large_prs: number;
          first_pr_date: string | null;
          last_pr_date: string | null;
          data_span_days: number | null;
        };
      };
    };
  };
}

export type PullRequest = Database['public']['Tables']['pull_requests']['Row'];
export type PullRequestInsert = Database['public']['Tables']['pull_requests']['Insert'];
export type PullRequestUpdate = Database['public']['Tables']['pull_requests']['Update'];
export type Repository = Database['public']['Tables']['repositories']['Row'];
export type RepositoryInsert = Database['public']['Tables']['repositories']['Insert'];
export type RepositoryUpdate = Database['public']['Tables']['repositories']['Update'];
export type DeveloperMetrics = Database['public']['Views']['developer_metrics']['Row'];
export type RepositoryMetrics = Database['public']['Views']['repository_metrics']['Row'];
export type DatadogError = Database['public']['Tables']['datadog_errors']['Row'];
export type DatadogErrorInsert = Database['public']['Tables']['datadog_errors']['Insert'];
export type DatadogErrorUpdate = Database['public']['Tables']['datadog_errors']['Update'];
