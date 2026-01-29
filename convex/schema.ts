import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feedback: defineTable({
    editKey: v.string(),
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
    submittedAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_submittedAt", ["submittedAt"])
    .index("by_editKey", ["editKey"]),

  analysis: defineTable({
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
    generatedAt: v.number(),
  }),
});
