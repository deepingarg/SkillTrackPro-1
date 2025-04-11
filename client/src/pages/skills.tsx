import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  Search, 
  ArrowUpDown,
  PlusCircle,
  ListFilter,
  BarChart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddSkillDialog from "@/components/add-skill-dialog";
import EditSkillRatingDialog from "@/components/edit-skill-rating-dialog";

export default function Skills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditRatingDialogOpen, setIsEditRatingDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch skills
  const { data: skills, isLoading: isSkillsLoading } = useQuery({
    queryKey: ['/api/skills'],
  });
  
  // Fetch team members
  const { data: teamMembers, isLoading: isTeamMembersLoading } = useQuery({
    queryKey: ['/api/team-members'],
  });
  
  // Fetch skill ratings
  const { data: skillRatings, isLoading: isRatingsLoading } = useQuery({
    queryKey: ['/api/skill-ratings/details'],
  });
  
  // Delete skill mutation
  const deleteSkill = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Skill deleted",
        description: "The skill has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete skill: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Filter skills by search query
  const filteredSkills = skills?.filter((skill: any) => {
    if (!searchQuery) return true;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      skill.name.toLowerCase().includes(lowerCaseQuery) ||
      skill.category.toLowerCase().includes(lowerCaseQuery) ||
      (skill.description && skill.description.toLowerCase().includes(lowerCaseQuery))
    );
  });
  
  // Group skills by category
  const skillsByCategory = filteredSkills?.reduce((acc: any, skill: any) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});
  
  // Get unique categories
  const categories = skillsByCategory ? Object.keys(skillsByCategory) : [];
  
  // Handle delete confirmation
  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteSkill.mutate(id);
    }
  };
  
  // Get skill level distribution for a skill
  const getSkillLevelDistribution = (skillId: number) => {
    if (!skillRatings) return { unknown: 0, basic: 0, handson: 0, expert: 0, total: 0 };
    
    const ratings = skillRatings.filter((rating: any) => rating.skillId === skillId);
    const unknown = ratings.filter((r: any) => r.level === 0).length;
    const basic = ratings.filter((r: any) => r.level === 1).length;
    const handson = ratings.filter((r: any) => r.level === 2).length;
    const expert = ratings.filter((r: any) => r.level === 3).length;
    
    return {
      unknown,
      basic,
      handson,
      expert,
      total: unknown + basic + handson + expert
    };
  };
  
  // Open edit rating dialog
  const openEditRatingDialog = (skill: any) => {
    setSelectedSkill(skill);
    setIsEditRatingDialogOpen(true);
  };
  
  // Get date of the most recent week
  const getMostRecentWeek = () => {
    if (!skillRatings || skillRatings.length === 0) return new Date();
    
    const dates = skillRatings.map((rating: any) => new Date(rating.weekOf));
    return new Date(Math.max(...dates.map(date => date.getTime())));
  };
  
  const isLoading = isSkillsLoading || isTeamMembersLoading || isRatingsLoading;
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Skills</h1>
          <p className="text-gray-600 mt-1">Manage your team's skills and proficiency levels</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Skills Overview</CardTitle>
              <CardDescription>
                {isLoading 
                  ? "Loading skills..."
                  : `Total of ${skills?.length || 0} skills across ${categories.length} categories`
                }
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0 flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search skills..."
                  className="pl-8 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex items-center">
                <ListFilter className="mr-2 h-4 w-4" />
                All Skills
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div>
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{category}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">
                              <div className="flex items-center">
                                Skill Name
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Proficiency Distribution</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {skillsByCategory[category].map((skill: any) => {
                            const distribution = getSkillLevelDistribution(skill.id);
                            
                            return (
                              <TableRow key={skill.id}>
                                <TableCell className="font-medium">{skill.name}</TableCell>
                                <TableCell className="max-w-xs truncate">{skill.description || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {distribution.total > 0 ? (
                                      <>
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div className="flex h-full">
                                            <div 
                                              style={{ 
                                                width: `${(distribution.unknown / distribution.total) * 100}%`,
                                                backgroundColor: "#9CA3AF"  // gray
                                              }} 
                                              className="h-full"
                                            ></div>
                                            <div 
                                              style={{ 
                                                width: `${(distribution.basic / distribution.total) * 100}%`,
                                                backgroundColor: "#FBBF24" // yellow
                                              }} 
                                              className="h-full"
                                            ></div>
                                            <div 
                                              style={{ 
                                                width: `${(distribution.handson / distribution.total) * 100}%`,
                                                backgroundColor: "#3B82F6" // blue
                                              }} 
                                              className="h-full"
                                            ></div>
                                            <div 
                                              style={{ 
                                                width: `${(distribution.expert / distribution.total) * 100}%`,
                                                backgroundColor: "#10B981" // green
                                              }} 
                                              className="h-full"
                                            ></div>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                          {Math.round((distribution.handson + distribution.expert) / distribution.total * 100)}% proficient
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-500">No ratings yet</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openEditRatingDialog(skill)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Edit Ratings</span>
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDelete(skill.id, skill.name)}
                                      disabled={deleteSkill.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 italic">
                    {searchQuery 
                      ? "No skills found matching your search."
                      : "No skills added yet. Click 'Add Skill' to get started."
                    }
                  </div>
                )
              )}
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Skills by Expertise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Skills by Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {skills?.slice(0, 5).map((skill: any) => {
                          const distribution = getSkillLevelDistribution(skill.id);
                          const expertisePercentage = distribution.total > 0 
                            ? Math.round((distribution.expert / distribution.total) * 100) 
                            : 0;
                          
                          return (
                            <div key={skill.id} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-sm">{skill.name}</div>
                                  <div className="text-xs text-gray-500">{expertisePercentage}% Expert</div>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${expertisePercentage}%` }}
                                    className="h-full bg-green-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Skill Gaps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Potential Skill Gaps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {skills?.slice(0, 5).map((skill: any) => {
                          const distribution = getSkillLevelDistribution(skill.id);
                          const unknownPercentage = distribution.total > 0 
                            ? Math.round((distribution.unknown / distribution.total) * 100) 
                            : 0;
                          
                          return (
                            <div key={skill.id} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-sm">{skill.name}</div>
                                  <div className="text-xs text-gray-500">{unknownPercentage}% Unknown</div>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${unknownPercentage}%` }}
                                    className="h-full bg-red-500"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Skill Categories Overview */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Skill Categories Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map((category) => {
                          const categorySkills = skillsByCategory[category];
                          const skillCount = categorySkills.length;
                          
                          return (
                            <div key={category} className="border rounded-md p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{category}</h4>
                                  <p className="text-sm text-gray-500">{skillCount} skills</p>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {skillCount} skills
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {categorySkills.slice(0, 3).map((skill: any) => (
                                  <div key={skill.id} className="text-sm">{skill.name}</div>
                                ))}
                                {skillCount > 3 && (
                                  <div className="text-sm text-blue-600">+{skillCount - 3} more</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Skill Dialog */}
      <AddSkillDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
      />
      
      {/* Edit Skill Rating Dialog */}
      {selectedSkill && (
        <EditSkillRatingDialog 
          isOpen={isEditRatingDialogOpen} 
          onClose={() => setIsEditRatingDialogOpen(false)}
          skill={selectedSkill}
          teamMembers={teamMembers || []}
          weekDate={getMostRecentWeek()}
        />
      )}
    </div>
  );
}
