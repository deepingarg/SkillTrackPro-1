import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTeamMemberSchema,
  insertSkillSchema,
  insertSkillRatingSchema,
  SkillLevel
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Team Members routes
  apiRouter.get("/team-members", async (req, res) => {
    try {
      const teamMembers = await storage.getAllTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });
  
  apiRouter.post("/team-members", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const newTeamMember = await storage.createTeamMember(validatedData);
      res.status(201).json(newTeamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid team member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create team member" });
      }
    }
  });
  
  apiRouter.delete("/team-members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const result = await storage.deleteTeamMember(id);
      if (result) {
        res.status(200).json({ message: "Team member deleted successfully" });
      } else {
        res.status(404).json({ message: "Team member not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });
  
  // Skills routes
  apiRouter.get("/skills", async (req, res) => {
    try {
      const skills = await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });
  
  apiRouter.post("/skills", async (req, res) => {
    try {
      const validatedData = insertSkillSchema.parse(req.body);
      const newSkill = await storage.createSkill(validatedData);
      res.status(201).json(newSkill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid skill data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create skill" });
      }
    }
  });
  
  apiRouter.delete("/skills/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const result = await storage.deleteSkill(id);
      if (result) {
        res.status(200).json({ message: "Skill deleted successfully" });
      } else {
        res.status(404).json({ message: "Skill not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });
  
  // Skill Ratings routes
  apiRouter.get("/skill-ratings", async (req, res) => {
    try {
      const teamMemberId = req.query.teamMemberId 
        ? parseInt(req.query.teamMemberId as string) 
        : undefined;
      
      const skillId = req.query.skillId 
        ? parseInt(req.query.skillId as string) 
        : undefined;
      
      let skillRatings;
      
      if (teamMemberId && !isNaN(teamMemberId)) {
        skillRatings = await storage.getSkillRatingsForTeamMember(teamMemberId);
      } else if (skillId && !isNaN(skillId)) {
        skillRatings = await storage.getSkillRatingsForSkill(skillId);
      } else {
        skillRatings = await storage.getAllSkillRatings();
      }
      
      res.json(skillRatings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill ratings" });
    }
  });
  
  apiRouter.get("/skill-ratings/details", async (req, res) => {
    try {
      const ratings = await storage.getSkillRatingsWithDetails();
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill ratings details" });
    }
  });
  
  apiRouter.post("/skill-ratings", async (req, res) => {
    try {
      const validatedData = insertSkillRatingSchema.parse(req.body);
      
      // Ensure level is within valid range
      if (validatedData.level < 0 || validatedData.level > 3) {
        return res.status(400).json({ 
          message: "Invalid skill level. Must be between 0-3",
          validLevels: [
            { value: 0, label: "Unknown" },
            { value: 1, label: "Basic Knowledge" },
            { value: 2, label: "Hands-on Experience" },
            { value: 3, label: "Expert" }
          ]
        });
      }
      
      const newSkillRating = await storage.createSkillRating(validatedData);
      res.status(201).json(newSkillRating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid skill rating data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create skill rating" });
      }
    }
  });
  
  apiRouter.patch("/skill-ratings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { level } = req.body;
      if (level === undefined || typeof level !== 'number' || level < 0 || level > 3) {
        return res.status(400).json({ 
          message: "Invalid skill level. Must be between 0-3",
          validLevels: [
            { value: 0, label: "Unknown" },
            { value: 1, label: "Basic Knowledge" },
            { value: 2, label: "Hands-on Experience" },
            { value: 3, label: "Expert" }
          ]
        });
      }
      
      const updatedRating = await storage.updateSkillRating(id, level);
      if (updatedRating) {
        res.json(updatedRating);
      } else {
        res.status(404).json({ message: "Skill rating not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update skill rating" });
    }
  });
  
  // Dashboard data routes
  apiRouter.get("/dashboard/team-skill-matrix", async (req, res) => {
    try {
      // Get week date from query params or use current date
      let weekDate: Date;
      if (req.query.weekOf && typeof req.query.weekOf === 'string') {
        weekDate = new Date(req.query.weekOf);
        if (isNaN(weekDate.getTime())) {
          weekDate = new Date(); // Use current date if invalid
        }
      } else {
        weekDate = new Date();
      }
      
      const matrix = await storage.getTeamSkillMatrix(weekDate);
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team skill matrix" });
    }
  });
  
  apiRouter.get("/dashboard/historical-ratings", async (req, res) => {
    try {
      const teamMemberId = req.query.teamMemberId 
        ? parseInt(req.query.teamMemberId as string) 
        : undefined;
      
      const skillId = req.query.skillId 
        ? parseInt(req.query.skillId as string) 
        : undefined;
      
      if (teamMemberId !== undefined && isNaN(teamMemberId)) {
        return res.status(400).json({ message: "Invalid team member ID format" });
      }
      
      if (skillId !== undefined && isNaN(skillId)) {
        return res.status(400).json({ message: "Invalid skill ID format" });
      }
      
      const historicalData = await storage.getHistoricalRatings(teamMemberId, skillId);
      res.json(historicalData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch historical ratings" });
    }
  });
  
  // Skill level names helper
  apiRouter.get("/skill-levels", async (_, res) => {
    try {
      const skillLevels = [
        { value: SkillLevel.Unknown, label: "Unknown" },
        { value: SkillLevel.BasicKnowledge, label: "Basic Knowledge" },
        { value: SkillLevel.HandsOnExperience, label: "Hands-on Experience" },
        { value: SkillLevel.Expert, label: "Expert" }
      ];
      
      res.json(skillLevels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skill levels" });
    }
  });
  
  // Excel import routes
  apiRouter.post("/import/team-members", async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of team members." });
      }
      
      const results = {
        success: 0,
        errors: [] as { row: number; message: string }[]
      };
      
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Validate and transform the data
          const teamMemberData = {
            name: row.name || row.Name || "",
            role: row.role || row.Role || row.position || row.Position || "",
            department: row.department || row.Department || "",
            email: row.email || row.Email || ""
          };
          
          // Validate with zod schema
          const validatedData = insertTeamMemberSchema.parse(teamMemberData);
          
          // Create team member
          await storage.createTeamMember(validatedData);
          results.success++;
        } catch (error) {
          let message = "Unknown error";
          if (error instanceof z.ZodError) {
            message = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
          } else if (error instanceof Error) {
            message = error.message;
          }
          
          results.errors.push({ row: i + 1, message });
        }
      }
      
      res.json({
        message: `Imported ${results.success} team members successfully with ${results.errors.length} errors.`,
        details: results
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import team members", error: String(error) });
    }
  });
  
  apiRouter.post("/import/skills", async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of skills." });
      }
      
      const results = {
        success: 0,
        errors: [] as { row: number; message: string }[]
      };
      
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Validate and transform the data
          const skillData = {
            name: row.name || row.Name || "",
            category: row.category || row.Category || "",
            description: row.description || row.Description || null
          };
          
          // Validate with zod schema
          const validatedData = insertSkillSchema.parse(skillData);
          
          // Create skill
          await storage.createSkill(validatedData);
          results.success++;
        } catch (error) {
          let message = "Unknown error";
          if (error instanceof z.ZodError) {
            message = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
          } else if (error instanceof Error) {
            message = error.message;
          }
          
          results.errors.push({ row: i + 1, message });
        }
      }
      
      res.json({
        message: `Imported ${results.success} skills successfully with ${results.errors.length} errors.`,
        details: results
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import skills", error: String(error) });
    }
  });
  
  apiRouter.post("/import/skill-ratings", async (req, res) => {
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Invalid data format. Expected an array of skill ratings." });
      }
      
      const results = {
        success: 0,
        errors: [] as { row: number; message: string }[]
      };
      
      // Get all team members and skills for name mapping
      const teamMembers = await storage.getAllTeamMembers();
      const skills = await storage.getAllSkills();
      
      const teamMemberMap = new Map();
      teamMembers.forEach(tm => {
        teamMemberMap.set(tm.id.toString(), tm);
        teamMemberMap.set(tm.name.toLowerCase(), tm);
      });
      
      const skillMap = new Map();
      skills.forEach(skill => {
        skillMap.set(skill.id.toString(), skill);
        skillMap.set(skill.name.toLowerCase(), skill);
      });
      
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Find team member by id or name
          let teamMemberId = row.teamMemberId || row.team_member_id || null;
          const teamMemberName = row.teamMemberName || row.team_member_name || row.name || row.Name || "";
          
          if (!teamMemberId && teamMemberName) {
            const teamMember = teamMemberMap.get(teamMemberName.toLowerCase());
            if (teamMember) {
              teamMemberId = teamMember.id;
            }
          }
          
          // Find skill by id or name
          let skillId = row.skillId || row.skill_id || null;
          const skillName = row.skillName || row.skill_name || row.skill || row.Skill || "";
          
          if (!skillId && skillName) {
            const skill = skillMap.get(skillName.toLowerCase());
            if (skill) {
              skillId = skill.id;
            }
          }
          
          // Parse level (can be string or number)
          let level = row.level || row.Level || 0;
          if (typeof level === 'string') {
            // Handle text-based levels
            const levelLower = level.toLowerCase();
            if (levelLower.includes('unknown') || levelLower.includes('none')) {
              level = SkillLevel.Unknown;
            } else if (levelLower.includes('basic') || levelLower.includes('beginner')) {
              level = SkillLevel.BasicKnowledge;
            } else if (levelLower.includes('hands') || levelLower.includes('experienced') || levelLower.includes('intermediate')) {
              level = SkillLevel.HandsOnExperience;
            } else if (levelLower.includes('expert') || levelLower.includes('advanced')) {
              level = SkillLevel.Expert;
            } else {
              // Try to parse as number
              level = parseInt(level);
              if (isNaN(level)) level = 0;
            }
          }
          
          // Parse weekOf date
          let weekOf = row.weekOf || row.week_of || row.date || row.Date || null;
          if (weekOf) {
            try {
              weekOf = new Date(weekOf);
              if (isNaN(weekOf.getTime())) {
                weekOf = new Date(); // Default to current date if invalid
              }
            } catch (e) {
              weekOf = new Date(); // Default to current date if parsing fails
            }
          } else {
            weekOf = new Date(); // Default to current date if not provided
          }
          
          // Ensure level is within valid range
          if (level < 0) level = 0;
          if (level > 3) level = 3;
          
          // Validate and transform the data
          const skillRatingData = {
            teamMemberId: Number(teamMemberId),
            skillId: Number(skillId),
            level: Number(level),
            weekOf: weekOf
          };
          
          // Validate with zod schema
          const validatedData = insertSkillRatingSchema.parse(skillRatingData);
          
          // Create skill rating
          await storage.createSkillRating(validatedData);
          results.success++;
        } catch (error) {
          let message = "Unknown error";
          if (error instanceof z.ZodError) {
            message = error.errors.map(err => `${err.path}: ${err.message}`).join(", ");
          } else if (error instanceof Error) {
            message = error.message;
          }
          
          results.errors.push({ row: i + 1, message });
        }
      }
      
      res.json({
        message: `Imported ${results.success} skill ratings successfully with ${results.errors.length} errors.`,
        details: results
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import skill ratings", error: String(error) });
    }
  });
  
  // Use the API router with prefix
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  
  return httpServer;
}
