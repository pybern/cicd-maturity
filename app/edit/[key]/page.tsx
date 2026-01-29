"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";

const questions = [
  {
    id: "q1",
    title: "Build & Integration",
    options: [
      { value: "1", label: "A", text: "Developers build and test mostly on local machines; no reliable shared CI." },
      { value: "2", label: "B", text: "We have a CI server that builds main branch on push or nightly." },
      { value: "3", label: "C", text: "Every merge request/PR triggers automated build and tests." },
      { value: "4", label: "D", text: "Every commit runs a standardized pipeline template for all services." },
    ],
  },
  {
    id: "q2",
    title: "Test Automation",
    options: [
      { value: "1", label: "A", text: "Most testing is manual; automated tests are rare or flaky." },
      { value: "2", label: "B", text: "We have some unit tests that run in CI, but coverage is limited." },
      { value: "3", label: "C", text: "Unit and integration tests run on each pipeline; failures block merges." },
      { value: "4", label: "D", text: "We have a solid test pyramid, including API/UI/contract tests, with reliable, fast feedback." },
    ],
  },
  {
    id: "q3",
    title: "Deployment Process",
    options: [
      { value: "1", label: "A", text: "Deployments are manual (clicks/SSH/scripts), often at night or on weekends." },
      { value: "2", label: "B", text: "We have scripts or tools for deploys, but they require manual triggering." },
      { value: "3", label: "C", text: "We can deploy to at least one non-prod and one prod environment via the pipeline." },
      { value: "4", label: "D", text: "Deployments are fully automated, repeatable, and self-service for teams." },
    ],
  },
  {
    id: "q4",
    title: "Release Frequency",
    options: [
      { value: "1", label: "A", text: "We release a few times a year or only on big projects." },
      { value: "2", label: "B", text: "We release roughly monthly." },
      { value: "3", label: "C", text: "We release weekly or more often." },
      { value: "4", label: "D", text: "We can release on demand and do so frequently (daily or multiple times per week)." },
    ],
  },
  {
    id: "q5",
    title: "Environments & Infrastructure",
    options: [
      { value: "1", label: "A", text: "Environments are snowflakes; changes done manually on servers." },
      { value: "2", label: "B", text: "Some environment setup is scripted, but not fully reproducible." },
      { value: "3", label: "C", text: "We use infrastructure as code for main environments; changes are reviewed." },
      { value: "4", label: "D", text: "All infra and config are defined as code, versioned, and deployed via pipeline." },
    ],
  },
  {
    id: "q6",
    title: "Observability & Feedback",
    options: [
      { value: "1", label: "A", text: "We mostly find issues from user reports; limited central logging." },
      { value: "2", label: "B", text: "We have centralized logs or basic monitoring, mainly for uptime." },
      { value: "3", label: "C", text: "We track key application metrics and deployment events, with alerts on failures." },
      { value: "4", label: "D", text: "We have dashboards for builds, deploys, and service health; teams regularly review them and act." },
    ],
  },
  {
    id: "q7",
    title: "Security & Compliance",
    options: [
      { value: "1", label: "A", text: "No automated scans; security reviews are manual or ad-hoc before major releases." },
      { value: "2", label: "B", text: "We have scans but results are hard to interpret; developers waste time on trial-and-error fixes." },
      { value: "3", label: "C", text: "Scans run in pipelines with clear pass/fail gates; some remediation guidance exists." },
      { value: "4", label: "D", text: "Comprehensive scanning (SAST, SCA, secrets) with actionable feedback and documented remediation paths." },
    ],
  },
  {
    id: "q8",
    title: "Culture & Ownership",
    options: [
      { value: "1", label: "A", text: "Dev and ops are siloed; handoffs for testing and releases are common." },
      { value: "2", label: "B", text: "Dev and ops talk regularly but still have distinct responsibilities." },
      { value: "3", label: "C", text: "A cross-functional team owns build, test, and run for their services." },
      { value: "4", label: "D", text: "Teams continuously improve their delivery process and experiment with new practices." },
    ],
  },
];

const interpretations = [
  { min: 8, max: 13, level: "Initial", description: "Focus on getting basic CI, tests, and scripted deploys." },
  { min: 14, max: 20, level: "Emerging", description: "Standardize pipelines, security scans, and infrastructure as code." },
  { min: 21, max: 27, level: "Established", description: "Invest in observability, faster feedback, and more frequent releases." },
  { min: 28, max: 32, level: "Optimizing", description: "Refine with advanced testing, progressive delivery, and data-driven improvements." },
];

type Answers = Record<string, { value: string; experience: string }>;

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const editKey = (params.key as string)?.toUpperCase();
  
  const feedback = useQuery(api.feedback.getByEditKey, { editKey: editKey || "" });
  const updateFeedback = useMutation(api.feedback.update);
  
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<Record<string, string>>({});

  // Load existing data
  useEffect(() => {
    if (feedback) {
      setNickname(feedback.nickname);
      setRole(feedback.role);
      const loadedAnswers: Answers = {};
      feedback.answers.forEach((a) => {
        loadedAnswers[a.questionId] = {
          value: a.selectedValue,
          experience: a.experience,
        };
      });
      setAnswers(loadedAnswers);
    }
  }, [feedback]);

  const totalScore = useMemo(() => {
    return Object.values(answers).reduce((sum, a) => sum + parseInt(a.value || "0", 10), 0);
  }, [answers]);

  const interpretation = useMemo(() => {
    return interpretations.find((i) => totalScore >= i.min && totalScore <= i.max);
  }, [totalScore]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        value,
        experience: prev[questionId]?.experience || "",
      },
    }));
  };

  const handleExperienceChange = (questionId: string, experience: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        experience,
      },
    }));
  };

  const handleEnhance = async (questionId: string) => {
    const answer = answers[questionId];
    if (!answer?.experience?.trim()) return;
    
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    
    setIsEnhancing(questionId);
    try {
      const selectedOption = question.options.find((o) => o.value === answer.value);
      
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTitle: question.title,
          selectedOption: selectedOption?.text || "",
          experience: answer.experience,
        }),
      });
      
      if (!response.ok) throw new Error("Enhancement failed");
      
      const { enhanced } = await response.json();
      setEnhancedSuggestions((prev) => ({ ...prev, [questionId]: enhanced }));
    } catch (error) {
      console.error("Enhancement error:", error);
    } finally {
      setIsEnhancing(null);
    }
  };

  const handleAcceptEnhancement = (questionId: string) => {
    const suggestion = enhancedSuggestions[questionId];
    if (suggestion) {
      handleExperienceChange(questionId, suggestion);
      setEnhancedSuggestions((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleRejectEnhancement = (questionId: string) => {
    setEnhancedSuggestions((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedAnswers = questions.map((q) => {
        const answer = answers[q.id];
        const option = q.options.find((o) => o.value === answer?.value);
        return {
          questionId: q.id,
          questionTitle: q.title,
          selectedValue: answer?.value || "",
          selectedLabel: option?.label || "",
          selectedText: option?.text || "",
          experience: answer?.experience || "",
          score: parseInt(answer?.value || "0", 10),
        };
      });

      await updateFeedback({
        editKey,
        nickname: nickname.trim(),
        role,
        answers: formattedAnswers,
        totalScore,
        maturityLevel: interpretation?.level || "",
      });

      setShowThankYou(true);
    } catch (error) {
      console.error("Failed to update:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedback === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (feedback === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Assessment not found
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The edit key &quot;{editKey}&quot; is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Start a new assessment
          </button>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    const handleCopyLink = async () => {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const input = document.createElement("input");
        input.value = window.location.origin;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Your changes have been saved!
          </h1>
          
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your edit key (click to copy)
            </p>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(editKey);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2000);
                } catch {
                  const input = document.createElement("input");
                  input.value = editKey;
                  document.body.appendChild(input);
                  input.select();
                  document.execCommand("copy");
                  document.body.removeChild(input);
                  setKeyCopied(true);
                  setTimeout(() => setKeyCopied(false), 2000);
                }
              }}
              className="mt-1 font-mono text-lg font-semibold tracking-wider text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              {keyCopied ? "Copied!" : editKey}
            </button>
            <button
              onClick={() => setShowThankYou(false)}
              className="mt-2 block text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Continue editing
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Copy link to share
              </>
            )}
          </button>

          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Your Assessment
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Key: {editKey}
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="engineer">Engineer</option>
                <option value="product">Product</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {questions.map((q) => {
            const answer = answers[q.id];
            const selectedOption = q.options.find((o) => o.value === answer?.value);
            const isExpanded = expandedQuestion === q.id;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {selectedOption?.label || "?"}
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {q.title}
                    </span>
                  </div>
                  <svg
                    className={`h-5 w-5 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                    <div className="space-y-2">
                      {q.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswerChange(q.id, option.value)}
                          className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                            answer?.value === option.value
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold ${
                              answer?.value === option.value
                                ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {option.label}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Your experience
                        </label>
                        {answer?.experience?.trim() && !enhancedSuggestions[q.id] && (
                          <button
                            onClick={() => handleEnhance(q.id)}
                            disabled={isEnhancing === q.id}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            {isEnhancing === q.id ? "Enhancing..." : "✨ Enhance with AI"}
                          </button>
                        )}
                      </div>
                      
                      {enhancedSuggestions[q.id] ? (
                        <div>
                          <div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
                            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              Your original:
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {answer?.experience}
                            </p>
                          </div>
                          <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/30">
                            <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                              ✨ AI suggestion:
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {enhancedSuggestions[q.id]}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptEnhancement(q.id)}
                              className="flex-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              Use suggestion
                            </button>
                            <button
                              onClick={() => handleRejectEnhancement(q.id)}
                              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            >
                              Keep original
                            </button>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={answer?.experience || ""}
                          onChange={(e) => handleExperienceChange(q.id, e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
