import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    nickname: v.string(),
    role: v.string(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        questionTitle: v.string(),
        selectedValue: v.string(),
        selectedLabel: v.string(),
        selectedText: v.string(),
        experience: v.string(),
        score: v.number(),
      })
    ),
    totalScore: v.number(),
    maturityLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedback", {
      nickname: args.nickname,
      role: args.role,
      answers: args.answers,
      totalScore: args.totalScore,
      maturityLevel: args.maturityLevel,
      submittedAt: Date.now(),
    });
    return feedbackId;
  },
});
