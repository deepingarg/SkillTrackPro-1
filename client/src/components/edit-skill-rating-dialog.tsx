import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

// Form schema for skill rating
const formSchema = z.object({
  teamMemberId: z.string(),
  level: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditSkillRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skill: any;
  teamMembers: any[];
  weekDate: Date;
}

const skillLevelOptions = [
  { value: "0", label: "Unknown" },
  { value: "1", label: "Basic Knowledge" },
  { value: "2", label: "Hands-on Experience" },
  { value: "3", label: "Expert" }
];

export default function EditSkillRatingDialog({ 
  isOpen, 
  onClose, 
  skill, 
  teamMembers,
  weekDate
}: EditSkillRatingDialogProps) {
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<string>("");
  
  // Format date for API
  const formattedWeekDate = format(weekDate, "yyyy-MM-dd");
  
  // Fetch skill ratings for this skill
  const { data: skillRatings, isLoading: isRatingsLoading } = useQuery({
    queryKey: [`/api/skill-ratings?skillId=${skill.id}`],
  });
  
  // Fetch historical data for trend analysis
  const { data: historicalData, isLoading: isHistoricalLoading } = useQuery({
    queryKey: [`/api/dashboard/historical-ratings?skillId=${skill.id}`],
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamMemberId: "",
      level: "0",
    },
  });
  
  // Watch teamMemberId to update the form when it changes
  const watchedMemberId = form.watch("teamMemberId");
  
  // Update selected member when form value changes
  useEffect(() => {
    if (watchedMemberId) {
      setSelectedMember(watchedMemberId);
    }
  }, [watchedMemberId]);
  
  // Update form values when member is selected
  useEffect(() => {
    if (selectedMember && skillRatings) {
      // Find existing rating for this member and skill
      const currentRating = skillRatings.find(
        (rating: any) => 
          rating.teamMemberId.toString() === selectedMember && 
          new Date(rating.weekOf).toDateString() === weekDate.toDateString()
      );
      
      if (currentRating) {
        form.setValue("level", currentRating.level.toString());
      } else {
        form.setValue("level", "0"); // Default to unknown
      }
    }
  }, [selectedMember, skillRatings, form, weekDate]);
  
  // Create/update skill rating mutation
  const updateSkillRating = useMutation({
    mutationFn: async (values: any) => {
      try {
        // Check if rating already exists for this team member, skill, and week
        if (skillRatings) {
          const existingRating = skillRatings.find(
            (rating: any) => 
              rating.teamMemberId.toString() === values.teamMemberId &&
              new Date(rating.weekOf).toDateString() === weekDate.toDateString()
          );
          
          if (existingRating) {
            // Update existing rating
            const response = await apiRequest('PATCH', `/api/skill-ratings/${existingRating.id}`, {
              level: parseInt(values.level)
            });
            if (!response) throw new Error('Failed to update skill rating');
            return response;
          }
        }
        
        // Create new rating
        const startOfDay = new Date(weekDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const payload = {
          teamMemberId: Number(values.teamMemberId),
          skillId: Number(skill.id),
          level: Number(values.level),
          weekOf: startOfDay
        };
        
        // Ensure all required fields are present and valid
        if (!payload.teamMemberId || !payload.skillId || isNaN(payload.level)) {
          throw new Error('Required fields are missing or invalid');
        }
        
        const response = await apiRequest('POST', '/api/skill-ratings', payload);
        if (!response) throw new Error('Failed to create skill rating');
        return response;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save skill rating');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skill-ratings'] });
      queryClient.invalidateQueries({ queryKey: [`/api/skill-ratings?skillId=${skill.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/team-skill-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/historical-ratings'] });
      
      toast({
        title: "Skill rating updated",
        description: "The skill rating has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update skill rating: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: FormValues) => {
    updateSkillRating.mutate(data);
  };
  
  // Get the skill rating from historical data for a specific team member
  const getMemberHistoricalRatings = (memberId: string) => {
    if (!historicalData || historicalData.length < 2) return [];
    
    const memberHistory: any[] = [];
    
    historicalData.forEach((weekData: any) => {
      const memberRating = weekData.ratings.find(
        (r: any) => r.teamMemberId.toString() === memberId
      );
      
      if (memberRating) {
        memberHistory.push({
          week: weekData.weekOf,
          level: memberRating.level,
          levelName: skillLevelOptions[memberRating.level].label
        });
      }
    });
    
    return memberHistory.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  };
  
  // Find trend direction (improving, declining, or same)
  const getSkillTrend = (history: any[]) => {
    if (history.length < 2) return "same";
    
    const latest = history[history.length - 1].level;
    const previous = history[history.length - 2].level;
    
    if (latest > previous) return "improving";
    if (latest < previous) return "declining";
    return "same";
  };
  
  const memberRatingHistory = selectedMember ? getMemberHistoricalRatings(selectedMember) : [];
  const trend = getSkillTrend(memberRatingHistory);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Skill Ratings - {skill.name}</DialogTitle>
          <DialogDescription>
            Update team members' proficiency in this skill.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Rating</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="teamMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Member</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skill level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {skillLevelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedMember && memberRatingHistory.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Previous Rating</p>
                        <p className="text-sm text-gray-600">
                          {memberRatingHistory[memberRatingHistory.length - 1]?.levelName || "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {trend === "improving" && (
                          <div className="flex items-center text-green-600">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">Improving</span>
                          </div>
                        )}
                        {trend === "declining" && (
                          <div className="flex items-center text-red-600">
                            <ArrowDown className="h-4 w-4 mr-1" />
                            <span className="text-sm">Declining</span>
                          </div>
                        )}
                        {trend === "same" && (
                          <div className="flex items-center text-gray-600">
                            <Minus className="h-4 w-4 mr-1" />
                            <span className="text-sm">No change</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter className="pt-4">
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateSkillRating.isPending || !selectedMember}
                    variant={updateSkillRating.isError ? "destructive" : "default"}
                  >
                    {updateSkillRating.isPending ? "Saving..." : updateSkillRating.isError ? "Failed to Save" : "Save Rating"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Team Member
                </label>
                <Select
                  value={selectedMember}
                  onValueChange={setSelectedMember}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isHistoricalLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                selectedMember ? (
                  memberRatingHistory.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Week Of
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Skill Level
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {memberRatingHistory.map((history, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {format(new Date(history.week), "MMM d, yyyy")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${history.level === 0 ? "bg-gray-100 text-gray-800" : ""}
                                  ${history.level === 1 ? "bg-yellow-100 text-yellow-800" : ""}
                                  ${history.level === 2 ? "bg-blue-100 text-blue-800" : ""}
                                  ${history.level === 3 ? "bg-green-100 text-green-800" : ""}
                                `}>
                                  {history.levelName}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No historical data available for this team member.
                    </div>
                  )
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Select a team member to view their skill history.
                  </div>
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
