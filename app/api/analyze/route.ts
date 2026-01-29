import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
const MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: GATEWAY_BASE_URL,
});

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

export async function POST(req: NextRequest) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    // Fetch all feedback
    const feedback = await client.query(api.feedback.getAll);

    if (!feedback || feedback.length === 0) {
      return NextResponse.json({ message: "No feedback to analyze" });
    }

    // Aggregate data
    const totalResponses = feedback.length;
    const avgScore = feedback.reduce((sum, f) => sum + f.totalScore, 0) / totalResponses;

    // Maturity distribution
    const maturityDistribution = feedback.reduce((acc, f) => {
      acc[f.maturityLevel] = (acc[f.maturityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMaturityLevel = Object.entries(maturityDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Initial";

    // Question data aggregation
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

    // Build context for AI
    const areaContext = Object.entries(questionData)
      .map(([id, data]) => {
        const title = questionTitles[id] || id;
        const avg = data.total / data.count;
        const experienceSample = data.experiences.slice(0, 5).join("\n  - ");
        return `**${title}** (avg: ${avg.toFixed(2)}/4):\n  - ${experienceSample || "No experiences shared"}`;
      })
      .join("\n\n");

    // Generate overall summary and action items
    const { text: summaryText } = await generateText({
      model: gateway(MODEL),
      system: `You are a CI/CD expert analyzing team assessment results. Provide actionable, specific insights. Be concise but thorough. Format your response as JSON with two fields:
- "summary": A 2-3 sentence executive summary of the team's CI/CD maturity. IMPORTANT: Do NOT include any numerical scores, percentages, or statistics in the summary. Focus on qualitative observations about strengths, weaknesses, and overall state.
- "actionItems": An array of 4-6 specific, prioritized action items based on the weakest areas

Return ONLY valid JSON, no markdown or extra text.`,
      prompt: `Analyze this CI/CD assessment data:

Total Responses: ${totalResponses}
Average Score: ${avgScore.toFixed(1)}/32
Dominant Maturity Level: ${dominantMaturityLevel}

Maturity Distribution:
${Object.entries(maturityDistribution).map(([level, count]) => `- ${level}: ${count}`).join("\n")}

Scores and Experiences by Area:
${areaContext}

Generate a summary and action items:`,
    });

    // Parse the AI response
    let summary = "";
    let actionItems: string[] = [];
    try {
      const parsed = JSON.parse(summaryText);
      summary = parsed.summary || "";
      // Handle both string arrays and object arrays from AI
      const rawItems = parsed.actionItems || [];
      actionItems = rawItems.map((item: string | { action?: string; text?: string }) => {
        if (typeof item === "string") return item;
        // Extract text from object format
        return item.action || item.text || JSON.stringify(item);
      });
    } catch {
      // Fallback if JSON parsing fails
      summary = summaryText;
      actionItems = [];
    }

    // Generate per-area summaries
    const areaSummaries = await Promise.all(
      Object.entries(questionData).map(async ([id, data]) => {
        const title = questionTitles[id] || id;
        const avg = data.total / data.count;

        if (data.experiences.length === 0) {
          return {
            questionId: id,
            title,
            avgScore: avg,
            summary: "No detailed experiences shared for this area.",
          };
        }

        const experienceList = data.experiences
          .slice(0, 10)
          .map((e, i) => `${i + 1}. ${e}`)
          .join("\n");

        const { text: areaSummary } = await generateText({
          model: gateway(MODEL),
          system: `You are a CI/CD expert. Summarize the key themes from team experiences in 2-3 sentences. Be specific and actionable. Do NOT include any numerical scores or statistics in your response.`,
          prompt: `Area: ${title}\n\nTeam experiences:\n${experienceList}\n\nSummarize the key patterns and challenges:`,
        });

        return {
          questionId: id,
          title,
          avgScore: avg,
          summary: areaSummary,
        };
      })
    );

    // Store analysis in Convex
    await client.mutation(api.analysis.upsert, {
      totalResponses,
      avgScore,
      dominantMaturityLevel,
      summary,
      actionItems,
      areaSummaries,
    });

    return NextResponse.json({
      success: true,
      totalResponses,
      avgScore,
      summary,
      actionItems: actionItems.length,
      areaSummaries: areaSummaries.length,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
