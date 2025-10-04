"use client";

import { use } from "react";
import Link from "next/link";
import { dummyContributors } from "@/lib/dummy-data";
import { RadarChart } from "@/components/RadarChart";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function ContributorDetail({ params }: PageProps) {
  const { username } = use(params);
  const contributor = dummyContributors.find(
    (c) => c.github_username === username
  );

  if (!contributor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Contributor Not Found
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const dimensionNames: { [key: string]: string } = {
    code_velocity: "Code Velocity",
    review_quality: "Review Quality",
    code_stability: "Code Stability",
    collaboration: "Collaboration",
    incident_response: "Incident Response",
    feature_delivery: "Feature Delivery",
    documentation: "Documentation",
    testing_rigor: "Testing Rigor",
    availability: "Availability",
  };

  const radarData = Object.entries(contributor.dimensions).map(
    ([key, value]) => ({
      dimension: dimensionNames[key],
      score: value,
    })
  );

  const percentile = Math.round(
    ((dummyContributors.length - contributor.rank + 1) /
      dummyContributors.length) *
      100
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <img
              src={contributor.avatar_url}
              alt={contributor.github_username}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                @{contributor.github_username}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {contributor.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Rank
            </div>
            <div className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              #{contributor.rank}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              out of {dummyContributors.length} contributors
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Composite Score
            </div>
            <div className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              {contributor.composite_score}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              out of 100
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Percentile
            </div>
            <div className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
              Top {100 - percentile}%
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              of all contributors
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Performance Radar
            </h2>
            <RadarChart data={radarData} />
          </div>

          {/* Dimension Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Dimension Scores
            </h2>
            <div className="space-y-4">
              {Object.entries(contributor.dimensions)
                .sort(([, a], [, b]) => b - a)
                .map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {dimensionNames[key]}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 90
                            ? "bg-green-600"
                            : value >= 80
                            ? "bg-blue-600"
                            : value >= 70
                            ? "bg-yellow-600"
                            : "bg-orange-600"
                        }`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Notable Contributions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Notable Contributions
          </h2>
          <div className="space-y-3">
            {[
              {
                type: "PR Review",
                title: "Reviewed: Add new authentication flow",
                date: "2 days ago",
              },
              {
                type: "Commit",
                title: "feat: Implement real-time subscriptions",
                date: "3 days ago",
              },
              {
                type: "Issue Resolution",
                title: "Fixed critical bug in database migrations",
                date: "5 days ago",
              },
              {
                type: "Documentation",
                title: "Updated API documentation for v2.0",
                date: "1 week ago",
              },
              {
                type: "Feature",
                title: "Completed Linear ticket: Add dark mode support",
                date: "1 week ago",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {item.type}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
