"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo, useState } from "react";

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

const maturityFocus: Record<string, string> = {
  Initial: "Focus on establishing basic CI pipelines, adding automated tests, and scripting deployments. Start with the fundamentals before scaling.",
  Emerging: "Standardize pipeline templates across teams, implement infrastructure as code, and add security scanning to builds.",
  Established: "Invest in observability and monitoring, increase release frequency, and optimize feedback loops for faster iteration.",
  Optimizing: "Experiment with progressive delivery, refine metrics-driven improvements, and share best practices across the organization.",
};

export default function DashboardPage() {
  const feedback = useQuery(api.feedback.getAll);
  const analysis = useQuery(api.analysis.get);
  const [showMetrics, setShowMetrics] = useState(true);
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);

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

    const questionData: Record<string, { total: number; count: number; experiences: string[] }> = {};
    feedback.forEach((f) => {
      f.answers.forEach((a) => {
        if (!questionData[a.questionId]) {
          questionData[a.questionId] = { total: 0, count: 0, experiences: [] };
        }
        questionData[a.questionId].total += a.score;
        questionData[a.questionId].count += 1;
        if (a.experience && a.experience.trim()) {
          questionData[a.questionId].experiences.push(a.experience);
        }
      });
    });

    const questionAverages = Object.entries(questionData)
      .map(([id, data]) => ({
        id,
        title: questionTitles[id] || id,
        avg: data.total / data.count,
        experiences: data.experiences,
      }))
      .sort((a, b) => a.avg - b.avg);

    const weakest = questionAverages[0];
    const strongest = questionAverages[questionAverages.length - 1];

    const dominantLevel = Object.entries(maturityDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Initial";

    return {
      totalSubmissions,
      avgScore,
      maturityDistribution,
      roleDistribution,
      questionAverages,
      weakest,
      strongest,
      dominantLevel,
    };
  }, [feedback]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await fetch("/api/analyze", { method: "POST" });
    } catch (error) {
      console.error("Failed to regenerate analysis:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleArea = (questionId: string) => {
    setExpandedAreas((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Get area summary from stored analysis
  const getAreaSummary = (questionId: string) => {
    if (!analysis?.areaSummaries) return null;
    return analysis.areaSummaries.find((a) => a.questionId === questionId);
  };

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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              CI/CD Assessment
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {showMetrics 
                ? `${stats?.totalSubmissions} response${stats?.totalSubmissions !== 1 ? "s" : ""}`
                : "•••• responses"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:hover:text-zinc-300"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate insights"}
            </button>
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {showMetrics ? "Mask metrics" : "Show metrics"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* AI Analysis Summary */}
        {analysis && (
          <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              AI Analysis Summary
              {analysis.generatedAt && (
                <span className="font-normal normal-case tracking-normal">
                  {" · "}
                  {new Date(analysis.generatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </h2>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              {analysis.summary}
            </p>

            {analysis.actionItems && analysis.actionItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Action Items
                </h3>
                <ul className="mt-3 space-y-2">
                  {analysis.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Key metrics */}
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 lg:grid-cols-4">
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Responses</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {showMetrics ? stats?.totalSubmissions : "••••"}
            </p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="text-xs text-zinc-500">Avg Score</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
              {showMetrics ? stats?.avgScore.toFixed(1) : "••••"}
              <span className="text-sm text-zinc-400">/32</span>
            </p>
          </div>
            <div className="bg-white p-6 dark:bg-black">
              <p className="text-xs text-zinc-500">Needs Attention</p>
              <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {stats?.weakest?.title}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-zinc-500">{showMetrics ? `${stats?.weakest?.avg.toFixed(2)} avg` : "••••"}</p>
            </div>
            <div className="bg-white p-6 dark:bg-black">
              <p className="text-xs text-zinc-500">Strongest</p>
              <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {stats?.strongest?.title}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-zinc-500">{showMetrics ? `${stats?.strongest?.avg.toFixed(2)} avg` : "••••"}</p>
            </div>
          </div>

        {/* Score by area with stored summaries */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Score by Area
          </h2>
          <p className="mt-1 text-xs text-zinc-400">Click to view AI-generated insights</p>
          <div className="mt-4 space-y-2">
            {stats?.questionAverages
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((q) => {
                const percentage = (q.avg / 4) * 100;
                const isExpanded = expandedAreas[q.id];
                const areaSummary = getAreaSummary(q.id);

                return (
                  <div key={q.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => toggleArea(q.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">{q.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                            {showMetrics ? q.avg.toFixed(2) : "••••"}
                          </span>
                          <svg
                            className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                          style={{ width: `${showMetrics ? percentage : 0}%` }}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-zinc-100 px-4 pb-4 dark:border-zinc-800">
                        {areaSummary ? (
                          <p className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
                            {areaSummary.summary}
                          </p>
                        ) : (
                          <p className="py-3 text-sm italic text-zinc-400">
                            No analysis available. Click "Regenerate insights" above.
                          </p>
                        )}
                        <p className="text-xs text-zinc-400">
                          {q.experiences.length} experience{q.experiences.length !== 1 ? "s" : ""} shared
                        </p>
                      </div>
                    )}
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
                const isDominant = level === stats?.dominantLevel;
                return (
                  <div key={level} className="flex items-center gap-4">
                    <span className={`w-24 text-sm ${isDominant ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                      {level}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                          style={{ width: `${showMetrics ? percentage : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm tabular-nums text-zinc-500">
                      {showMetrics ? count : "••"}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Focus recommendation */}
            {stats?.dominantLevel && (
              <div className="mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Recommended Focus
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {maturityFocus[stats.dominantLevel]}
                </p>
              </div>
            )}
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
                          style={{ width: `${showMetrics ? percentage : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm tabular-nums text-zinc-500">
                      {showMetrics ? count : "••"}
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
                      {showMetrics ? f.totalScore : "••"}
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
