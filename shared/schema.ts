import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Skill level enum (for clarity in code)
export enum SkillLevel {
  Unknown = 0,
  BasicKnowledge = 1,
  HandsOnExperience = 2,
  Expert = 3,
}

// Team Member Schema
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  email: text("email").notNull().unique(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  name: true,
  role: true,
  department: true,
  email: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Skills Schema
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  name: true,
  category: true, 
  description: true,
});

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

// Skill Ratings Schema (tracks team member skill levels over time)
export const skillRatings = pgTable("skill_ratings", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembers.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  level: integer("level").notNull(), // 0-3 following the SkillLevel enum
  weekOf: timestamp("week_of").notNull(), // Week the rating represents
});

export const insertSkillRatingSchema = createInsertSchema(skillRatings).pick({
  teamMemberId: true,
  skillId: true,
  level: true,
  weekOf: true,
});

export type InsertSkillRating = z.infer<typeof insertSkillRatingSchema>;
export type SkillRating = typeof skillRatings.$inferSelect;

// For displaying skill ratings with names instead of just IDs
export type SkillRatingWithDetails = {
  id: number;
  teamMemberId: number;
  teamMemberName: string;
  skillId: number;
  skillName: string;
  skillCategory: string;
  level: number;
  weekOf: Date;
};

// Users Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
