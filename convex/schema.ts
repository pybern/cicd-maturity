import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feedback: defineTable({
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
      })
    ),
    totalScore: v.number(),
    maturityLevel: v.string(),
    submittedAt: v.number(),
  }),
});
