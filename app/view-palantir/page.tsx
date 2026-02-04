"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";

export default function ViewPalantirPage() {
  const feedback = useQuery(api.feedback.getAll);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const roles = useMemo(() => {
    if (!feedback) return [];
    return [...new Set(feedback.map((f) => f.role))];
  }, [feedback]);

  const levels = ["Initial", "Emerging", "Established", "Optimizing"];

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
            Feedback Viewer
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {filteredFeedback.length} of {feedback.length} responses
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
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
      </div>
    </div>
  );
}
