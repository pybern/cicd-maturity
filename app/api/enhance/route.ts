import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

// Vercel AI Gateway configuration
const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

// Model can be configured via env var (e.g., "openai/gpt-4o-mini", "anthropic/claude-sonnet-4.5", etc.)
const MODEL = process.env.AI_MODEL || "openai/gpt-4o-mini";

// Create gateway client
const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: GATEWAY_BASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { questionTitle, selectedOption, experience } = await req.json();

    const { text } = await generateText({
      model: gateway(MODEL),
      system: `You are a technical writing assistant helping improve CI/CD maturity assessment responses. 
Your job is to enhance the user's description to be clearer, more specific, and professionally worded while preserving their original meaning and context.
Keep it concise (2-3 sentences max). Don't add information they didn't provide. Use their perspective (first person plural "we").`,
      prompt: `Question: ${questionTitle}
Selected answer: ${selectedOption}
User's experience: ${experience}

Enhance this description to be clearer and more professionally worded:`,
    });

    return NextResponse.json({ enhanced: text });
  } catch (error) {
    console.error("AI enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance description" },
      { status: 500 }
    );
  }
}
