"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";

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

const scoreLabels: Record<number, string> = {
  1: "A - Basic",
  2: "B - Developing",
  3: "C - Mature",
  4: "D - Advanced",
};

const scoreColors: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-blue-500",
  4: "bg-green-500",
};

type ExportOptions = {
  allResponses: boolean;
  filteredResponses: boolean;
  insights: boolean;
  aiAnalysis: boolean;
};

export default function ViewPalantirPage() {
  const feedback = useQuery(api.feedback.getAll);
  const analysis = useQuery(api.analysis.get);
  const [view, setView] = useState<"responses" | "charts">("charts");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    allResponses: true,
    filteredResponses: false,
    insights: true,
    aiAnalysis: true,
  });

  const filteredFeedback = useMemo(() => {
    if (!feedback) return [];

    let filtered = feedback.filter((f) => {
      const matchesSearch =
        searchTerm === "" ||
        f.nickname.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || f.role === roleFilter;
      const matchesLevel = levelFilter === "all" || f.maturityLevel === levelFilter;
      return matchesSearch && matchesRole && matchesLevel;
    });

    filtered.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return (a.submittedAt - b.submittedAt) * multiplier;
      } else {
        return (a.totalScore - b.totalScore) * multiplier;
      }
    });

    return filtered;
  }, [feedback, searchTerm, roleFilter, levelFilter, sortBy, sortOrder]);

  // Chart data aggregation
  const chartData = useMemo(() => {
    if (!feedback || feedback.length === 0) return null;

    const questionStats: Record<string, {
      title: string;
      distribution: Record<number, number>;
      total: number;
      avgScore: number;
    }> = {};

    // Initialize all questions
    Object.keys(questionTitles).forEach((qId) => {
      questionStats[qId] = {
        title: questionTitles[qId],
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
        total: 0,
        avgScore: 0,
      };
    });

    // Aggregate data
    feedback.forEach((f) => {
      f.answers.forEach((a) => {
        if (questionStats[a.questionId]) {
          questionStats[a.questionId].distribution[a.score] =
            (questionStats[a.questionId].distribution[a.score] || 0) + 1;
          questionStats[a.questionId].total += a.score;
        }
      });
    });

    // Calculate averages
    Object.keys(questionStats).forEach((qId) => {
      const totalResponses = Object.values(questionStats[qId].distribution).reduce((a, b) => a + b, 0);
      questionStats[qId].avgScore = totalResponses > 0
        ? questionStats[qId].total / totalResponses
        : 0;
    });

    return {
      questionStats,
      totalResponses: feedback.length,
    };
  }, [feedback]);

  const roles = useMemo(() => {
    if (!feedback) return [];
    return [...new Set(feedback.map((f) => f.role))];
  }, [feedback]);

  const levels = ["Initial", "Emerging", "Established", "Optimizing"];

  const handleExport = () => {
    if (!feedback) return;

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      exportOptions,
    };

    if (exportOptions.allResponses) {
      exportData.allResponses = feedback.map((f) => ({
        nickname: f.nickname,
        role: f.role,
        totalScore: f.totalScore,
        maturityLevel: f.maturityLevel,
        submittedAt: new Date(f.submittedAt).toISOString(),
        updatedAt: f.updatedAt ? new Date(f.updatedAt).toISOString() : null,
        answers: f.answers.map((a) => ({
          questionId: a.questionId,
          questionTitle: a.questionTitle,
          selectedLabel: a.selectedLabel,
          selectedText: a.selectedText,
          score: a.score,
          experience: a.experience,
        })),
      }));
    }

    if (exportOptions.filteredResponses && filteredFeedback.length !== feedback.length) {
      exportData.filteredResponses = {
        filters: {
          searchTerm: searchTerm || null,
          roleFilter: roleFilter !== "all" ? roleFilter : null,
          levelFilter: levelFilter !== "all" ? levelFilter : null,
        },
        count: filteredFeedback.length,
        responses: filteredFeedback.map((f) => ({
          nickname: f.nickname,
          role: f.role,
          totalScore: f.totalScore,
          maturityLevel: f.maturityLevel,
          submittedAt: new Date(f.submittedAt).toISOString(),
          answers: f.answers.map((a) => ({
            questionId: a.questionId,
            questionTitle: a.questionTitle,
            selectedLabel: a.selectedLabel,
            score: a.score,
            experience: a.experience,
          })),
        })),
      };
    }

    if (exportOptions.insights && chartData) {
      exportData.insights = {
        totalResponses: chartData.totalResponses,
        questionStats: Object.entries(chartData.questionStats).map(([qId, stats]) => ({
          questionId: qId,
          title: stats.title,
          avgScore: Number(stats.avgScore.toFixed(2)),
          distribution: {
            "A (1)": stats.distribution[1] || 0,
            "B (2)": stats.distribution[2] || 0,
            "C (3)": stats.distribution[3] || 0,
            "D (4)": stats.distribution[4] || 0,
          },
          distributionPercentages: {
            "A (1)": Number(((stats.distribution[1] || 0) / chartData.totalResponses * 100).toFixed(1)),
            "B (2)": Number(((stats.distribution[2] || 0) / chartData.totalResponses * 100).toFixed(1)),
            "C (3)": Number(((stats.distribution[3] || 0) / chartData.totalResponses * 100).toFixed(1)),
            "D (4)": Number(((stats.distribution[4] || 0) / chartData.totalResponses * 100).toFixed(1)),
          },
        })),
        rankings: {
          lowestScoring: Object.entries(chartData.questionStats)
            .sort((a, b) => a[1].avgScore - b[1].avgScore)
            .slice(0, 3)
            .map(([, stats]) => ({ title: stats.title, avgScore: Number(stats.avgScore.toFixed(2)) })),
          highestScoring: Object.entries(chartData.questionStats)
            .sort((a, b) => b[1].avgScore - a[1].avgScore)
            .slice(0, 3)
            .map(([, stats]) => ({ title: stats.title, avgScore: Number(stats.avgScore.toFixed(2)) })),
        },
      };
    }

    if (exportOptions.aiAnalysis && analysis) {
      exportData.aiAnalysis = {
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        dominantMaturityLevel: analysis.dominantMaturityLevel,
        avgScore: analysis.avgScore,
        totalResponses: analysis.totalResponses,
        areaSummaries: analysis.areaSummaries,
        generatedAt: new Date(analysis.generatedAt).toISOString(),
      };
    }

    // Download JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cicd-assessment-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
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
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Export to JSON
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select what to include in the export
            </p>

            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.allResponses}
                  onChange={(e) => setExportOptions({ ...exportOptions, allResponses: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">All Responses</p>
                  <p className="text-xs text-zinc-500">{feedback.length} responses with full details</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.filteredResponses}
                  onChange={(e) => setExportOptions({ ...exportOptions, filteredResponses: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                  disabled={filteredFeedback.length === feedback.length}
                />
                <div>
                  <p className={`text-sm font-medium ${filteredFeedback.length === feedback.length ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                    Filtered Responses
                  </p>
                  <p className="text-xs text-zinc-500">
                    {filteredFeedback.length === feedback.length
                      ? "No filters applied"
                      : `${filteredFeedback.length} responses matching current filters`}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.insights}
                  onChange={(e) => setExportOptions({ ...exportOptions, insights: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Insights & Analytics</p>
                  <p className="text-xs text-zinc-500">Question stats, distributions, and rankings</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.aiAnalysis}
                  onChange={(e) => setExportOptions({ ...exportOptions, aiAnalysis: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600"
                  disabled={!analysis}
                />
                <div>
                  <p className={`text-sm font-medium ${!analysis ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                    AI Analysis
                  </p>
                  <p className="text-xs text-zinc-500">
                    {analysis ? "Summary, action items, and area insights" : "No AI analysis available"}
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={!exportOptions.allResponses && !exportOptions.filteredResponses && !exportOptions.insights && !exportOptions.aiAnalysis}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Feedback Viewer
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {feedback.length} total responses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <div className="flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
              <button
                onClick={() => setView("charts")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "charts"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                Charts
              </button>
              <button
                onClick={() => setView("responses")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === "responses"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                Responses
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {view === "charts" && chartData && (
          <div className="space-y-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs text-zinc-500">Total Responses</p>
                <p className="mt-1 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {chartData.totalResponses}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs text-zinc-500">Questions</p>
                <p className="mt-1 text-2xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                  {Object.keys(chartData.questionStats).length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs text-zinc-500">Lowest Avg</p>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {Object.entries(chartData.questionStats)
                    .sort((a, b) => a[1].avgScore - b[1].avgScore)[0]?.[1].title}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs text-zinc-500">Highest Avg</p>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {Object.entries(chartData.questionStats)
                    .sort((a, b) => b[1].avgScore - a[1].avgScore)[0]?.[1].title}
                </p>
              </div>
            </div>

            {/* Question charts */}
            <div>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Response Distribution by Question
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {Object.entries(chartData.questionStats)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([qId, stats]) => {
                    const totalForQuestion = Object.values(stats.distribution).reduce((a, b) => a + b, 0);
                    return (
                      <div
                        key={qId}
                        className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {stats.title}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {totalForQuestion} responses
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                              {stats.avgScore.toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500">avg score</p>
                          </div>
                        </div>

                        {/* Stacked bar */}
                        <div className="mb-3 flex h-8 overflow-hidden rounded-lg">
                          {[1, 2, 3, 4].map((score) => {
                            const count = stats.distribution[score] || 0;
                            const percentage = totalForQuestion > 0 ? (count / totalForQuestion) * 100 : 0;
                            if (percentage === 0) return null;
                            return (
                              <div
                                key={score}
                                className={`${scoreColors[score]} flex items-center justify-center transition-all`}
                                style={{ width: `${percentage}%` }}
                                title={`${scoreLabels[score]}: ${count} (${percentage.toFixed(1)}%)`}
                              >
                                {percentage > 10 && (
                                  <span className="text-xs font-medium text-white">
                                    {count}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {[1, 2, 3, 4].map((score) => {
                            const count = stats.distribution[score] || 0;
                            const percentage = totalForQuestion > 0 ? (count / totalForQuestion) * 100 : 0;
                            return (
                              <div key={score} className="flex items-center gap-1.5">
                                <div className={`h-2.5 w-2.5 rounded-sm ${scoreColors[score]}`} />
                                <span className="text-zinc-600 dark:text-zinc-400">
                                  {String.fromCharCode(64 + score)}: {percentage.toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Average scores bar chart */}
            <div>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Average Score by Question
              </h2>
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="space-y-3">
                  {Object.entries(chartData.questionStats)
                    .sort((a, b) => a[1].avgScore - b[1].avgScore)
                    .map(([qId, stats]) => {
                      const percentage = (stats.avgScore / 4) * 100;
                      return (
                        <div key={qId}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">{stats.title}</span>
                            <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                              {stats.avgScore.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stats.avgScore < 2
                                  ? "bg-red-500"
                                  : stats.avgScore < 2.5
                                  ? "bg-orange-500"
                                  : stats.avgScore < 3
                                  ? "bg-yellow-500"
                                  : stats.avgScore < 3.5
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "responses" && (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search by nickname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="all">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="all">All levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "score")}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="date">Sort by date</option>
                  <option value="score">Sort by score</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {sortOrder === "asc" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                {filteredFeedback.length} of {feedback.length} shown
              </p>
            </div>

            {/* Feedback list */}
            <div className="space-y-3">
              {filteredFeedback.map((f) => {
                const isExpanded = expandedId === f._id;
                return (
                  <div
                    key={f._id}
                    className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : f._id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {f.nickname}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {f.role.charAt(0).toUpperCase() + f.role.slice(1)} · {f.maturityLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
                            {f.totalScore}/32
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                            {new Date(f.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <svg
                          className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800">
                        <div className="p-4">
                          <div className="mb-4 flex items-center gap-4 text-xs text-zinc-500">
                            <span>Edit Key: <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">{f.editKey}</code></span>
                            {f.updatedAt && (
                              <span>
                                Updated: {new Date(f.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            {f.answers.map((answer) => (
                              <div
                                key={answer.questionId}
                                className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                      {answer.questionTitle}
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                      <span className="font-medium">{answer.selectedLabel}:</span>{" "}
                                      {answer.selectedText}
                                    </p>
                                  </div>
                                  <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                                    {answer.score}/4
                                  </span>
                                </div>
                                {answer.experience && (
                                  <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                                      Experience
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                      {answer.experience}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredFeedback.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500">No matching responses found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
