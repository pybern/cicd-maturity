"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

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

const experiencePlaceholders: Record<string, Record<string, string>> = {
  q1: {
    "1": "e.g., We use local builds with manual testing. Developers often face 'works on my machine' issues...",
    "2": "e.g., Jenkins runs nightly builds on main. Sometimes builds break and we find out the next morning...",
    "3": "e.g., GitLab CI runs on every MR. Tests must pass before merging, but some flaky tests slow us down...",
    "4": "e.g., We use a shared pipeline template across 20+ services. Builds take ~5 mins with caching...",
  },
  q2: {
    "1": "e.g., QA team does manual testing before releases. We have a few unit tests but they're often skipped...",
    "2": "e.g., We have ~30% unit test coverage. Tests run in CI but we don't block on failures yet...",
    "3": "e.g., 70% coverage with integration tests. PR cannot merge if tests fail. We review coverage on new code...",
    "4": "e.g., Full test pyramid with contract tests for APIs. Tests run in parallel, feedback in under 10 mins...",
  },
  q3: {
    "1": "e.g., We SSH into servers and run deploy scripts manually. Usually done by one person who knows the process...",
    "2": "e.g., We have Ansible playbooks but someone needs to run them from their laptop. Takes about an hour...",
    "3": "e.g., Pipeline deploys to staging automatically. Prod requires manual approval button click...",
    "4": "e.g., Any developer can deploy any service to any environment via pipeline. Rollbacks are one-click...",
  },
  q4: {
    "1": "e.g., We do 2-3 big releases per year tied to project milestones. Each release is a multi-week effort...",
    "2": "e.g., We aim for monthly releases but sometimes slip to 6-8 weeks. Release planning takes a week...",
    "3": "e.g., We release every Tuesday. Hotfixes can go out same-day when needed...",
    "4": "e.g., We deploy 5-10 times per day across services. Feature flags control what users see...",
  },
  q5: {
    "1": "e.g., Each server is configured differently. We have a wiki with setup steps but it's often outdated...",
    "2": "e.g., We have Docker files for apps but infra changes still require manual AWS console work...",
    "3": "e.g., Terraform for AWS resources, reviewed in PRs. Some legacy systems still have manual config...",
    "4": "e.g., Everything is in Git - Terraform, Kubernetes manifests, app configs. Nothing is manually changed...",
  },
  q6: {
    "1": "e.g., Users report issues via support tickets. We check server logs manually when investigating...",
    "2": "e.g., We use CloudWatch for basic metrics and PagerDuty for uptime alerts. Limited app-level visibility...",
    "3": "e.g., Datadog tracks API latency, error rates, and deploy markers. Alerts go to Slack on anomalies...",
    "4": "e.g., Grafana dashboards show DORA metrics. Teams review weekly and set improvement goals...",
  },
  q7: {
    "1": "e.g., Security team does a manual review before big releases. No automated scanning in place...",
    "2": "e.g., SonarQube runs but findings are cryptic. New devs spend hours googling how to fix vulnerabilities...",
    "3": "e.g., Snyk blocks PRs with high-severity issues. We have a wiki page explaining common fixes...",
    "4": "e.g., Scans include SAST, SCA, and secrets detection. Each finding links to remediation docs with code examples...",
  },
  q8: {
    "1": "e.g., Devs write code, throw it over the wall to QA, then ops handles deployment. Lots of back and forth...",
    "2": "e.g., We have shared Slack channels and weekly syncs. Ops joins sprint planning occasionally...",
    "3": "e.g., Each squad owns their services end-to-end including on-call. Platform team provides shared tooling...",
    "4": "e.g., Teams run monthly retros on delivery metrics. We recently experimented with trunk-based development...",
  },
};

type Answers = Record<string, { value: string; experience: string }>;

export default function Home() {
  const [started, setStarted] = useState(false);
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showReview, setShowReview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedSuggestion, setEnhancedSuggestion] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);

  const submitFeedback = useMutation(api.feedback.submit);

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion?.id];

  const totalScore = useMemo(() => {
    return Object.values(answers).reduce((sum, a) => sum + parseInt(a.value, 10), 0);
  }, [answers]);

  const interpretation = useMemo(() => {
    return interpretations.find((i) => totalScore >= i.min && totalScore <= i.max);
  }, [totalScore]);

  const allAnswered = Object.keys(answers).length === questions.length;

  const handleOptionSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        value,
        experience: prev[currentQuestion.id]?.experience || "",
      },
    }));
  };

  const handleExperienceChange = (experience: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        experience,
      },
    }));
  };

  const handleNext = () => {
    setEnhancedSuggestion(null);
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (allAnswered) {
      setShowReview(true);
    }
  };

  const handleBack = () => {
    setEnhancedSuggestion(null);
    if (showResults) {
      setShowResults(false);
      setShowReview(true);
    } else if (showReview) {
      setShowReview(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setStarted(false);
    setNickname("");
    setRole("");
    setAnswers({});
    setCurrentStep(0);
    setShowReview(false);
    setShowResults(false);
    setShowThankYou(false);
    setExpandedReview(null);
    setEditKey(null);
  };

  const handleStart = () => {
    if (nickname.trim() && role) {
      setStarted(true);
    }
  };

  const handleEnhance = async () => {
    if (!currentAnswer?.experience?.trim()) return;
    
    setIsEnhancing(true);
    try {
      const selectedOption = currentQuestion.options.find(
        (o) => o.value === currentAnswer.value
      );
      
      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTitle: currentQuestion.title,
          selectedOption: selectedOption?.text || "",
          experience: currentAnswer.experience,
        }),
      });
      
      if (!response.ok) throw new Error("Enhancement failed");
      
      const { enhanced } = await response.json();
      setEnhancedSuggestion(enhanced);
    } catch (error) {
      console.error("Enhancement error:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancement = () => {
    if (enhancedSuggestion) {
      handleExperienceChange(enhancedSuggestion);
      setEnhancedSuggestion(null);
    }
  };

  const handleRejectEnhancement = () => {
    setEnhancedSuggestion(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Tom Bombadil passes through without leaving a trace
      if (nickname.toLowerCase() === "tombombadil") {
        setShowReview(false);
        setShowThankYou(true);
        return;
      }

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

      const result = await submitFeedback({
        nickname: nickname.trim(),
        role,
        answers: formattedAnswers,
        totalScore,
        maturityLevel: interpretation?.level || "",
      });

      setEditKey(result.editKey);
      setShowReview(false);
      setShowThankYou(true);

      // Trigger analysis regeneration in background
      fetch("/api/analyze", { method: "POST" }).catch(console.error);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = (index: number) => {
    setShowReview(false);
    setCurrentStep(index);
  };

  const getPlaceholder = () => {
    if (!currentAnswer?.value) return "Share your experience or context for this answer (optional)...";
    return experiencePlaceholders[currentQuestion.id]?.[currentAnswer.value] || "Share your experience...";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Initial":
        return "from-red-500 to-orange-500";
      case "Emerging":
        return "from-orange-500 to-yellow-500";
      case "Established":
        return "from-yellow-500 to-green-500";
      case "Optimizing":
        return "from-green-500 to-emerald-500";
      default:
        return "from-zinc-500 to-zinc-600";
    }
  };

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                CI/CD Assessment
              </h1>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Evaluate your team&apos;s CI/CD maturity across 8 key areas: build & integration, test automation, deployment, release frequency, infrastructure, observability, security, and culture.
              </p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Takes about 5 minutes to complete
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Responses are anonymous. Please reflect as accurately as possible.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                >
                  <option value="">Select your role</option>
                  <option value="engineer">Engineer</option>
                  <option value="product">Product</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!nickname.trim() || !role}
              className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Assessment
            </button>

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
              <span className="mx-3 text-xs text-zinc-400 dark:text-zinc-500">or</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Have an edit key?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your key"
                  maxLength={6}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm uppercase tracking-wider text-zinc-900 placeholder:text-zinc-400 placeholder:normal-case focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        window.location.href = `/edit/${input.value.trim().toUpperCase()}`;
                      }
                    }
                  }}
                  id="editKeyInput"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("editKeyInput") as HTMLInputElement;
                    if (input?.value.trim()) {
                      window.location.href = `/edit/${input.value.trim().toUpperCase()}`;
                    }
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
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
            Thank you for your feedback!
          </h1>
          
          {editKey && (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your edit key (click to copy)
              </p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(editKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    const input = document.createElement("input");
                    input.value = editKey;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand("copy");
                    document.body.removeChild(input);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="mt-1 font-mono text-lg font-semibold tracking-wider text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {copied ? "Copied!" : editKey}
              </button>
              <a
                href={`/edit/${editKey}`}
                className="mt-2 block text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Edit your responses
              </a>
            </div>
          )}

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

  if (showReview) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Review Your Answers
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Click on any question to expand or edit your response
              </p>
            </div>

            <div className="space-y-3">
              {questions.map((q, index) => {
                const answer = answers[q.id];
                const option = q.options.find((o) => o.value === answer?.value);
                const isExpanded = expandedReview === q.id;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    <button
                      onClick={() => setExpandedReview(isExpanded ? null : q.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                          {option?.label}
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

                    <div
                      className={`grid transition-all duration-200 ${
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
                          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                            {option?.text}
                          </p>
                          {answer?.experience && (
                            <div className="mb-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Your experience:
                              </p>
                              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                                {answer.experience}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => handleEditQuestion(index)}
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          >
                            Edit response
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBack}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Your CI/CD Assessment
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Based on your responses across 8 dimensions
              </p>
            </div>

            <div className="mb-8 flex flex-col items-center">
              <div
                className={`mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r ${getLevelColor(interpretation?.level || "")} px-6 py-2 text-lg font-semibold text-white`}
              >
                {interpretation?.level}
              </div>
              <div className="mb-2 text-5xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalScore}
                <span className="text-2xl font-normal text-zinc-400">/32</span>
              </div>
              <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
                {interpretation?.description}
              </p>
            </div>

            <div className="mb-8 space-y-3">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Your Responses
              </h2>
              {questions.map((q) => {
                const answer = answers[q.id];
                const option = q.options.find((o) => o.value === answer?.value);
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                      {option?.label}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {q.title}
                      </div>
                      {answer?.experience && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          &ldquo;{answer.experience}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Review Answers
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-2xl">
        {/* Question card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {currentQuestion.title}
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {currentStep + 1} / {questions.length}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                est. 5 minutes
              </span>
            </div>
          </div>

          {/* Options - fixed height container */}
          <div className="mb-6 min-h-[296px] space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer?.value === option.value;
              return (
                <div key={option.value}>
                  <button
                    onClick={() => handleOptionSelect(option.value)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                        isSelected
                          ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span
                      className={`pt-0.5 text-sm ${
                        isSelected
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {option.text}
                    </span>
                  </button>
                  {/* Accordion for experience when selected */}
                  <div
                    className={`grid transition-all duration-200 ${
                      isSelected ? "mt-2 grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Describe your experience {nickname.toLowerCase() !== "tombombadil" && <span className="text-red-500">*</span>}
                        </label>
                        {currentAnswer?.experience?.trim() && !enhancedSuggestion && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnhance();
                            }}
                            disabled={isEnhancing}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
                          >
                            {isEnhancing ? "Enhancing..." : "✨ Enhance with AI"}
                          </button>
                        )}
                      </div>
                      
                      {enhancedSuggestion ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              Your original:
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {currentAnswer?.experience}
                            </p>
                          </div>
                          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
                            <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                              ✨ AI suggestion:
                            </p>
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              {enhancedSuggestion}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAcceptEnhancement}
                              className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              Use suggestion
                            </button>
                            <button
                              onClick={handleRejectEnhancement}
                              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            >
                              Keep original
                            </button>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={currentAnswer?.experience || ""}
                          onChange={(e) => handleExperienceChange(e.target.value)}
                          placeholder={getPlaceholder()}
                          rows={2}
                          required
                          onClick={(e) => e.stopPropagation()}
                          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswer?.value || (!currentAnswer?.experience?.trim() && nickname.toLowerCase() !== "tombombadil")}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {currentStep === questions.length - 1 ? "Review" : "Continue"}
            </button>
          </div>

        </div>

        {/* Quick nav dots */}
        <div className="mt-6 flex justify-center gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentStep;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentStep(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  isCurrent
                    ? "w-6 bg-zinc-900 dark:bg-zinc-100"
                    : isAnswered
                      ? "bg-zinc-400 dark:bg-zinc-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
