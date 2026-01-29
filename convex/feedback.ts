import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a simple 6-character alphanumeric key
function generateEditKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded similar chars (0,O,1,I)
  let key = "";
  for (let i = 0; i < 6; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

const answersValidator = v.array(
  v.object({
    questionId: v.string(),
    questionTitle: v.string(),
    selectedValue: v.string(),
    selectedLabel: v.string(),
    selectedText: v.string(),
    experience: v.string(),
    score: v.number(),
  })
);

export const submit = mutation({
  args: {
    nickname: v.string(),
    role: v.string(),
    answers: answersValidator,
    totalScore: v.number(),
    maturityLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const editKey = generateEditKey();
    
    await ctx.db.insert("feedback", {
      editKey,
      nickname: args.nickname,
      role: args.role,
      answers: args.answers,
      totalScore: args.totalScore,
      maturityLevel: args.maturityLevel,
      submittedAt: Date.now(),
    });
    
    return { editKey };
  },
});

export const getByEditKey = query({
  args: { editKey: v.string() },
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_editKey", (q) => q.eq("editKey", args.editKey.toUpperCase()))
      .first();
    return feedback;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_submittedAt")
      .order("desc")
      .collect();
    return feedback;
  },
});

export const update = mutation({
  args: {
    editKey: v.string(),
    nickname: v.string(),
    role: v.string(),
    answers: answersValidator,
    totalScore: v.number(),
    maturityLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feedback")
      .withIndex("by_editKey", (q) => q.eq("editKey", args.editKey.toUpperCase()))
      .first();
    
    if (!existing) {
      throw new Error("Assessment not found");
    }
    
    await ctx.db.patch(existing._id, {
      nickname: args.nickname,
      role: args.role,
      answers: args.answers,
      totalScore: args.totalScore,
      maturityLevel: args.maturityLevel,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});
