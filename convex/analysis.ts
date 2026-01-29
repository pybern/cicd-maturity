import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // Get the most recent analysis (singleton pattern)
    const analysis = await ctx.db.query("analysis").order("desc").first();
    return analysis;
  },
});

export const upsert = mutation({
  args: {
    totalResponses: v.number(),
    avgScore: v.number(),
    dominantMaturityLevel: v.string(),
    summary: v.string(),
    actionItems: v.array(v.string()),
    areaSummaries: v.array(
      v.object({
        questionId: v.string(),
        title: v.string(),
        avgScore: v.number(),
        summary: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get existing analysis to update or create new
    const existing = await ctx.db.query("analysis").order("desc").first();

    const data = {
      totalResponses: args.totalResponses,
      avgScore: args.avgScore,
      dominantMaturityLevel: args.dominantMaturityLevel,
      summary: args.summary,
      actionItems: args.actionItems,
      areaSummaries: args.areaSummaries,
      generatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("analysis", data);
    }

    return { success: true };
  },
});
