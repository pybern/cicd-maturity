"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo } from "react";

const questionTitles: Record<string, string> = {
  q1: "Build & Integration",
  q2: "Test Automation",
  q3: "Deployment Process",
  q4: "Release Frequency",
  q5: "Environments & Infrastructure",
  q6: "Observability & Feedback",
  q7: "Security & Compliance",
  q8: "Culture & Ownership",
};

export default function DashboardPage() {
  const feedback = useQuery(api.feedback.getAll);

  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) return null;

    const totalSubmissions = feedback.length;
    const avgScore = feedback.reduce((sum, f) => sum + f.totalScore, 0) / totalSubmissions;

    const maturityDistribution = feedback.reduce((acc, f) => {
      acc[f.maturityLevel] = (acc[f.maturityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roleDistribution = feedback.reduce((acc, f) => {
      acc[f.role] = (acc[f.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const questionScores: Record<string, { total: number; count: number }> = {};
    feedback.forEach((f) => {
      f.answers.forEach((a) => {
        if (!questionScores[a.questionId]) {
          questionScores[a.questionId] = { total: 0, count: 0 };
        }
        questionScores[a.questionId].total += a.score;
        questionScores[a.questionId].count += 1;
      });
    });

    const questionAverages = Object.entries(questionScores)
      .map(([id, data]) => ({
        id,
        title: questionTitles[id] || id,
        avg: data.total / data.count,
      }))
      .sort((a, b) => a.avg - b.avg);

    const weakest = questionAverages[0];
    const strongest = questionAverages[questionAverages.length - 1];

    return {
      totalSubmissions,
      avgScore,
      maturityDistribution,
      roleDistribution,
      questionAverages,
      weakest,
      strongest,
    };
  }, [feedback]);

  if (feedback === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <p className="text-sm text-zinc-500">No submissions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            CI/CD Assessment
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {stats?.totalSubmissions} response{stats?.totalSubmissions !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 lg:grid-cols-4">
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Responses</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {stats?.totalSubmissions}
            </p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Avg Score</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {stats?.avgScore.toFixed(1)}
              <span className="text-sm text-zinc-400">/32</span>
            </p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Needs Attention</p>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {stats?.weakest?.title}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-zinc-500">{stats?.weakest?.avg.toFixed(2)} avg</p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Strongest</p>
            <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {stats?.strongest?.title}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-zinc-500">{stats?.strongest?.avg.toFixed(2)} avg</p>
          </div>
        </div>

        {/* Score by area */}
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Score by Area
          </h2>
          <div className="mt-4 space-y-4">
            {stats?.questionAverages
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((q) => {
                const percentage = (q.avg / 4) * 100;
                return (
                  <div key={q.id} className="group">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">{q.title}</span>
                      <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                        {q.avg.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Distribution */}
        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Maturity Distribution
            </h2>
            <div className="mt-4 space-y-3">
              {["Initial", "Emerging", "Established", "Optimizing"].map((level) => {
                const count = stats?.maturityDistribution[level] || 0;
                const percentage = stats ? (count / stats.totalSubmissions) * 100 : 0;
                return (
                  <div key={level} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400">{level}</span>
                    <div className="flex-1">
                      <div className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm tabular-nums text-zinc-500">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              By Role
            </h2>
            <div className="mt-4 space-y-3">
              {Object.entries(stats?.roleDistribution || {}).map(([role, count]) => {
                const percentage = stats ? (count / stats.totalSubmissions) * 100 : 0;
                return (
                  <div key={role} className="flex items-center gap-4">
                    <span className="w-24 text-sm capitalize text-zinc-600 dark:text-zinc-400">{role}</span>
                    <div className="flex-1">
                      <div className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm tabular-nums text-zinc-500">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent submissions */}
        <div className="mt-12">
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recent Responses
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Nickname</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {feedback.slice(0, 10).map((f) => (
                  <tr key={f._id} className="bg-white dark:bg-black">
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{f.nickname}</td>
                    <td className="px-4 py-3 capitalize text-zinc-500">{f.role}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-900 dark:text-zinc-100">
                      {f.totalScore}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{f.maturityLevel}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">
                      {new Date(f.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
