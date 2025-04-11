import { db } from "./db";
import { teamMembers, skills, skillRatings, users } from "@shared/schema";

export async function seedDatabase() {
  console.log("Checking if seed data is needed...");
  
  // Check if we already have data
  const existingTeamMembers = await db.select().from(teamMembers);
  
  if (existingTeamMembers.length > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }

  console.log("Seeding database with initial data...");
  
  try {
    // Insert demo team members
    const createdTeamMembers = await db.insert(teamMembers).values([
      { name: 'Alex Johnson', role: 'Frontend Developer', department: 'Engineering', email: 'alex@example.com' },
      { name: 'Jamie Williams', role: 'Backend Developer', department: 'Engineering', email: 'jamie@example.com' },
      { name: 'Sam Rodriguez', role: 'DevOps Engineer', department: 'Operations', email: 'sam@example.com' }
    ]).returning();
    
    // Insert demo skills
    const createdSkills = await db.insert(skills).values([
      { name: 'React.js', category: 'Frontend Development', description: 'Frontend JavaScript framework' },
      { name: 'Next.js', category: 'Frontend Development', description: 'React framework for server-side rendering' },
      { name: 'Tailwind CSS', category: 'Frontend Development', description: 'Utility-first CSS framework' },
      { name: 'Node.js', category: 'Backend Development', description: 'JavaScript runtime' },
      { name: 'Docker', category: 'DevOps', description: 'Containerization platform' }
    ]).returning();
    
    // Create skill ratings (current week)
    const currentWeek = new Date();
    currentWeek.setHours(0, 0, 0, 0);
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()); // Start of week (Sunday)
    
    // Previous week
    const previousWeek = new Date(currentWeek);
    previousWeek.setDate(previousWeek.getDate() - 7);

    // Prepare ratings data for current week
    const currentWeekRatings = [
      // Alex's ratings
      { teamMemberId: 1, skillId: 1, level: 3, weekOf: currentWeek }, // React - Expert
      { teamMemberId: 1, skillId: 2, level: 2, weekOf: currentWeek }, // Next - Hands-on
      { teamMemberId: 1, skillId: 3, level: 3, weekOf: currentWeek }, // Tailwind - Expert
      { teamMemberId: 1, skillId: 4, level: 1, weekOf: currentWeek }, // Node - Basic
      { teamMemberId: 1, skillId: 5, level: 0, weekOf: currentWeek }, // Docker - Unknown
      
      // Jamie's ratings
      { teamMemberId: 2, skillId: 1, level: 1, weekOf: currentWeek }, // React - Basic
      { teamMemberId: 2, skillId: 2, level: 1, weekOf: currentWeek }, // Next - Basic
      { teamMemberId: 2, skillId: 3, level: 0, weekOf: currentWeek }, // Tailwind - Unknown
      { teamMemberId: 2, skillId: 4, level: 3, weekOf: currentWeek }, // Node - Expert
      { teamMemberId: 2, skillId: 5, level: 2, weekOf: currentWeek }, // Docker - Hands-on
      
      // Sam's ratings
      { teamMemberId: 3, skillId: 1, level: 1, weekOf: currentWeek }, // React - Basic
      { teamMemberId: 3, skillId: 2, level: 0, weekOf: currentWeek }, // Next - Unknown
      { teamMemberId: 3, skillId: 3, level: 0, weekOf: currentWeek }, // Tailwind - Unknown
      { teamMemberId: 3, skillId: 4, level: 2, weekOf: currentWeek }, // Node - Hands-on
      { teamMemberId: 3, skillId: 5, level: 3, weekOf: currentWeek }, // Docker - Expert
    ];
    
    // Prepare ratings data for previous week (slightly lower to show improvement)
    const previousWeekRatings = [
      // Alex's ratings
      { teamMemberId: 1, skillId: 1, level: 2, weekOf: previousWeek }, // React - Hands-on
      { teamMemberId: 1, skillId: 2, level: 1, weekOf: previousWeek }, // Next - Basic
      { teamMemberId: 1, skillId: 3, level: 3, weekOf: previousWeek }, // Tailwind - Expert
      { teamMemberId: 1, skillId: 4, level: 0, weekOf: previousWeek }, // Node - Unknown
      { teamMemberId: 1, skillId: 5, level: 0, weekOf: previousWeek }, // Docker - Unknown
      
      // Jamie's ratings
      { teamMemberId: 2, skillId: 1, level: 0, weekOf: previousWeek }, // React - Unknown
      { teamMemberId: 2, skillId: 2, level: 0, weekOf: previousWeek }, // Next - Unknown
      { teamMemberId: 2, skillId: 3, level: 0, weekOf: previousWeek }, // Tailwind - Unknown
      { teamMemberId: 2, skillId: 4, level: 3, weekOf: previousWeek }, // Node - Expert
      { teamMemberId: 2, skillId: 5, level: 1, weekOf: previousWeek }, // Docker - Basic
      
      // Sam's ratings
      { teamMemberId: 3, skillId: 1, level: 0, weekOf: previousWeek }, // React - Unknown
      { teamMemberId: 3, skillId: 2, level: 0, weekOf: previousWeek }, // Next - Unknown
      { teamMemberId: 3, skillId: 3, level: 0, weekOf: previousWeek }, // Tailwind - Unknown
      { teamMemberId: 3, skillId: 4, level: 2, weekOf: previousWeek }, // Node - Hands-on
      { teamMemberId: 3, skillId: 5, level: 2, weekOf: previousWeek }, // Docker - Hands-on
    ];
    
    // Insert all skill ratings
    await db.insert(skillRatings).values([...currentWeekRatings, ...previousWeekRatings]);
    
    // Add admin user
    await db.insert(users).values({ username: 'admin', password: 'admin123' });
    
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}