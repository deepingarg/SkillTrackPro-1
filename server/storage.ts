import { 
  InsertTeamMember, TeamMember, 
  InsertSkill, Skill, 
  InsertSkillRating, SkillRating, SkillRatingWithDetails,
  InsertUser, User
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team Member methods
  getAllTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  deleteTeamMember(id: number): Promise<boolean>;
  
  // Skill methods
  getAllSkills(): Promise<Skill[]>;
  getSkill(id: number): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  deleteSkill(id: number): Promise<boolean>;
  
  // Skill Rating methods
  getAllSkillRatings(): Promise<SkillRating[]>;
  getSkillRatingsForTeamMember(teamMemberId: number): Promise<SkillRating[]>;
  getSkillRatingsForSkill(skillId: number): Promise<SkillRating[]>;
  getSkillRatingsForWeek(weekDate: Date): Promise<SkillRating[]>;
  createSkillRating(skillRating: InsertSkillRating): Promise<SkillRating>;
  updateSkillRating(id: number, level: number): Promise<SkillRating | undefined>;
  
  // Combined queries
  getSkillRatingsWithDetails(): Promise<SkillRatingWithDetails[]>;
  getTeamSkillMatrix(weekDate: Date): Promise<any>; // Returns skill matrix for dashboard view
  getHistoricalRatings(teamMemberId?: number, skillId?: number): Promise<any>; // For trend analysis
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teamMembers: Map<number, TeamMember>;
  private skills: Map<number, Skill>;
  private skillRatings: Map<number, SkillRating>;
  
  private userId: number;
  private teamMemberId: number;
  private skillId: number;
  private skillRatingId: number;
  
  constructor() {
    this.users = new Map();
    this.teamMembers = new Map();
    this.skills = new Map();
    this.skillRatings = new Map();
    
    this.userId = 1;
    this.teamMemberId = 1;
    this.skillId = 1;
    this.skillRatingId = 1;
    
    // Add demo data
    this.initializeDemoData();
  }
  
  // Initialize with some demo data
  private initializeDemoData() {
    // Demo team members
    const teamMembers = [
      { name: 'Alex Johnson', role: 'Frontend Developer', department: 'Engineering', email: 'alex@example.com' },
      { name: 'Jamie Williams', role: 'Backend Developer', department: 'Engineering', email: 'jamie@example.com' },
      { name: 'Sam Rodriguez', role: 'DevOps Engineer', department: 'Operations', email: 'sam@example.com' }
    ];
    
    // Demo skills
    const skills = [
      { name: 'React.js', category: 'Frontend Development', description: 'Frontend JavaScript framework' },
      { name: 'Next.js', category: 'Frontend Development', description: 'React framework for server-side rendering' },
      { name: 'Tailwind CSS', category: 'Frontend Development', description: 'Utility-first CSS framework' },
      { name: 'Node.js', category: 'Backend Development', description: 'JavaScript runtime' },
      { name: 'Docker', category: 'DevOps', description: 'Containerization platform' }
    ];
    
    // Create team members
    const createdTeamMembers = teamMembers.map(tm => this.createTeamMemberInternal(tm));
    
    // Create skills
    const createdSkills = skills.map(s => this.createSkillInternal(s));
    
    // Create skill ratings (current week)
    const currentWeek = new Date();
    currentWeek.setHours(0, 0, 0, 0);
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()); // Start of week (Sunday)
    
    // Previous week
    const previousWeek = new Date(currentWeek);
    previousWeek.setDate(previousWeek.getDate() - 7);
    
    // Demo skill ratings for current week
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 1, level: 3, weekOf: currentWeek }); // Alex - React - Expert
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 2, level: 2, weekOf: currentWeek }); // Alex - Next - Hands-on
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 3, level: 3, weekOf: currentWeek }); // Alex - Tailwind - Expert
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 4, level: 1, weekOf: currentWeek }); // Alex - Node - Basic
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 5, level: 0, weekOf: currentWeek }); // Alex - Docker - Unknown
    
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 1, level: 1, weekOf: currentWeek }); // Jamie - React - Basic
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 2, level: 1, weekOf: currentWeek }); // Jamie - Next - Basic
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 3, level: 0, weekOf: currentWeek }); // Jamie - Tailwind - Unknown
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 4, level: 3, weekOf: currentWeek }); // Jamie - Node - Expert
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 5, level: 2, weekOf: currentWeek }); // Jamie - Docker - Hands-on
    
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 1, level: 1, weekOf: currentWeek }); // Sam - React - Basic
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 2, level: 0, weekOf: currentWeek }); // Sam - Next - Unknown
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 3, level: 0, weekOf: currentWeek }); // Sam - Tailwind - Unknown
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 4, level: 2, weekOf: currentWeek }); // Sam - Node - Hands-on
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 5, level: 3, weekOf: currentWeek }); // Sam - Docker - Expert
    
    // Demo skill ratings for previous week (slightly lower to show improvement)
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 1, level: 2, weekOf: previousWeek }); // Alex - React - Hands-on
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 2, level: 1, weekOf: previousWeek }); // Alex - Next - Basic
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 3, level: 3, weekOf: previousWeek }); // Alex - Tailwind - Expert
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 4, level: 0, weekOf: previousWeek }); // Alex - Node - Unknown
    this.createSkillRatingInternal({ teamMemberId: 1, skillId: 5, level: 0, weekOf: previousWeek }); // Alex - Docker - Unknown
    
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 1, level: 0, weekOf: previousWeek }); // Jamie - React - Unknown
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 2, level: 0, weekOf: previousWeek }); // Jamie - Next - Unknown
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 3, level: 0, weekOf: previousWeek }); // Jamie - Tailwind - Unknown
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 4, level: 3, weekOf: previousWeek }); // Jamie - Node - Expert
    this.createSkillRatingInternal({ teamMemberId: 2, skillId: 5, level: 1, weekOf: previousWeek }); // Jamie - Docker - Basic
    
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 1, level: 0, weekOf: previousWeek }); // Sam - React - Unknown
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 2, level: 0, weekOf: previousWeek }); // Sam - Next - Unknown
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 3, level: 0, weekOf: previousWeek }); // Sam - Tailwind - Unknown
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 4, level: 2, weekOf: previousWeek }); // Sam - Node - Hands-on
    this.createSkillRatingInternal({ teamMemberId: 3, skillId: 5, level: 2, weekOf: previousWeek }); // Sam - Docker - Hands-on
    
    // Add admin user
    this.createUserInternal({ username: 'admin', password: 'admin123' });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    return this.createUserInternal(insertUser);
  }
  
  private createUserInternal(insertUser: InsertUser): User {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Team Member methods
  async getAllTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }
  
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }
  
  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    return this.createTeamMemberInternal(teamMember);
  }
  
  private createTeamMemberInternal(teamMember: InsertTeamMember): TeamMember {
    const id = this.teamMemberId++;
    const newTeamMember: TeamMember = { ...teamMember, id };
    this.teamMembers.set(id, newTeamMember);
    return newTeamMember;
  }
  
  async deleteTeamMember(id: number): Promise<boolean> {
    const hasTeamMember = this.teamMembers.has(id);
    if (hasTeamMember) {
      this.teamMembers.delete(id);
      // Delete associated skill ratings
      for (const [ratingId, rating] of this.skillRatings.entries()) {
        if (rating.teamMemberId === id) {
          this.skillRatings.delete(ratingId);
        }
      }
    }
    return hasTeamMember;
  }
  
  // Skill methods
  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    return this.createSkillInternal(skill);
  }
  
  private createSkillInternal(skill: InsertSkill): Skill {
    const id = this.skillId++;
    const newSkill: Skill = { ...skill, id };
    this.skills.set(id, newSkill);
    return newSkill;
  }
  
  async deleteSkill(id: number): Promise<boolean> {
    const hasSkill = this.skills.has(id);
    if (hasSkill) {
      this.skills.delete(id);
      // Delete associated skill ratings
      for (const [ratingId, rating] of this.skillRatings.entries()) {
        if (rating.skillId === id) {
          this.skillRatings.delete(ratingId);
        }
      }
    }
    return hasSkill;
  }
  
  // Skill Rating methods
  async getAllSkillRatings(): Promise<SkillRating[]> {
    return Array.from(this.skillRatings.values());
  }
  
  async getSkillRatingsForTeamMember(teamMemberId: number): Promise<SkillRating[]> {
    return Array.from(this.skillRatings.values()).filter(
      rating => rating.teamMemberId === teamMemberId
    );
  }
  
  async getSkillRatingsForSkill(skillId: number): Promise<SkillRating[]> {
    return Array.from(this.skillRatings.values()).filter(
      rating => rating.skillId === skillId
    );
  }
  
  async getSkillRatingsForWeek(weekDate: Date): Promise<SkillRating[]> {
    const startOfWeek = new Date(weekDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    return Array.from(this.skillRatings.values()).filter(rating => {
      const ratingDate = new Date(rating.weekOf);
      return ratingDate >= startOfWeek && ratingDate < endOfWeek;
    });
  }
  
  async createSkillRating(skillRating: InsertSkillRating): Promise<SkillRating> {
    return this.createSkillRatingInternal(skillRating);
  }
  
  private createSkillRatingInternal(skillRating: InsertSkillRating): SkillRating {
    const id = this.skillRatingId++;
    const newSkillRating: SkillRating = { ...skillRating, id };
    this.skillRatings.set(id, newSkillRating);
    return newSkillRating;
  }
  
  async updateSkillRating(id: number, level: number): Promise<SkillRating | undefined> {
    const rating = this.skillRatings.get(id);
    if (rating) {
      const updatedRating = { ...rating, level };
      this.skillRatings.set(id, updatedRating);
      return updatedRating;
    }
    return undefined;
  }
  
  // Combined queries
  async getSkillRatingsWithDetails(): Promise<SkillRatingWithDetails[]> {
    const ratings = await this.getAllSkillRatings();
    return Promise.all(
      ratings.map(async (rating) => {
        const teamMember = await this.getTeamMember(rating.teamMemberId);
        const skill = await this.getSkill(rating.skillId);
        
        if (!teamMember || !skill) {
          throw new Error(`Missing team member or skill for rating ${rating.id}`);
        }
        
        return {
          id: rating.id,
          teamMemberId: rating.teamMemberId,
          teamMemberName: teamMember.name,
          skillId: rating.skillId,
          skillName: skill.name,
          skillCategory: skill.category,
          level: rating.level,
          weekOf: rating.weekOf,
        };
      })
    );
  }
  
  async getTeamSkillMatrix(weekDate: Date): Promise<any> {
    const weekRatings = await this.getSkillRatingsForWeek(weekDate);
    const teamMembers = await this.getAllTeamMembers();
    const skills = await this.getAllSkills();
    
    // Create a matrix of team members and their skill ratings
    const matrix = teamMembers.map(member => {
      const memberRatings = weekRatings.filter(rating => rating.teamMemberId === member.id);
      
      const skillLevels = skills.map(skill => {
        const rating = memberRatings.find(r => r.skillId === skill.id);
        return {
          skillId: skill.id,
          skillName: skill.name,
          level: rating ? rating.level : 0, // Default to Unknown if no rating
        };
      });
      
      return {
        teamMemberId: member.id,
        teamMemberName: member.name,
        role: member.role,
        department: member.department,
        email: member.email,
        skills: skillLevels,
      };
    });
    
    return {
      weekOf: weekDate,
      skills: skills.map(s => ({ id: s.id, name: s.name, category: s.category })),
      teamMembers: matrix,
    };
  }
  
  async getHistoricalRatings(teamMemberId?: number, skillId?: number): Promise<any> {
    let ratings = await this.getAllSkillRatings();
    
    // Apply filters if provided
    if (teamMemberId !== undefined) {
      ratings = ratings.filter(r => r.teamMemberId === teamMemberId);
    }
    
    if (skillId !== undefined) {
      ratings = ratings.filter(r => r.skillId === skillId);
    }
    
    // Group ratings by week
    const ratingsByWeek = new Map<string, SkillRating[]>();
    
    for (const rating of ratings) {
      const weekDate = new Date(rating.weekOf);
      weekDate.setHours(0, 0, 0, 0);
      weekDate.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week (Sunday)
      
      const weekKey = weekDate.toISOString().split('T')[0];
      
      if (!ratingsByWeek.has(weekKey)) {
        ratingsByWeek.set(weekKey, []);
      }
      
      ratingsByWeek.get(weekKey)!.push(rating);
    }
    
    // Convert to array and sort by week
    const weeklyData = Array.from(ratingsByWeek.entries())
      .map(([weekKey, ratings]) => ({
        weekOf: weekKey,
        ratings: ratings,
      }))
      .sort((a, b) => a.weekOf.localeCompare(b.weekOf));
    
    // Enrich with details
    const enrichedData = await Promise.all(
      weeklyData.map(async week => {
        const detailedRatings = await Promise.all(
          week.ratings.map(async rating => {
            const teamMember = await this.getTeamMember(rating.teamMemberId);
            const skill = await this.getSkill(rating.skillId);
            
            return {
              id: rating.id,
              teamMemberId: rating.teamMemberId,
              teamMemberName: teamMember?.name || 'Unknown',
              skillId: rating.skillId,
              skillName: skill?.name || 'Unknown',
              skillCategory: skill?.category || 'Unknown',
              level: rating.level,
              weekOf: rating.weekOf,
            };
          })
        );
        
        return {
          weekOf: week.weekOf,
          ratings: detailedRatings,
        };
      })
    );
    
    return enrichedData;
  }
}

export const storage = new MemStorage();
