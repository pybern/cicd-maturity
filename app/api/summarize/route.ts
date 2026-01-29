import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
const MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: GATEWAY_BASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { questionTitle, experiences, avgScore } = await req.json();

    if (!experiences || experiences.length === 0) {
      return NextResponse.json({ summary: "No experiences shared yet." });
    }

    const experienceList = experiences
      .filter((e: string) => e && e.trim())
      .slice(0, 20) // Limit to 20 to avoid token limits
      .map((e: string, i: number) => `${i + 1}. ${e}`)
      .join("\n");

    if (!experienceList) {
      return NextResponse.json({ summary: "No detailed experiences shared." });
    }

    const { text } = await generateText({
      model: gateway(MODEL),
      system: `You are a technical analyst summarizing CI/CD assessment feedback. Be concise and actionable. Focus on patterns, common challenges, and key insights. Output 2-3 sentences max.`,
      prompt: `Area: ${questionTitle}
Average Score: ${avgScore.toFixed(2)}/4

Team experiences:
${experienceList}

Summarize the key themes and patterns from these experiences:`,
    });

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
