import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronUp, 
  ChevronDown, 
  Rocket, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import SkillChart from "@/components/skill-chart";

const formatDateRange = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startMonth = startOfWeek.toLocaleString('default', { month: 'short' });
  const endMonth = endOfWeek.toLocaleString('default', { month: 'short' });
  
  const startDay = startOfWeek.getDate();
  const endDay = endOfWeek.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

export default function Dashboard() {
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  
  // Format for API query
  const formatDateForQuery = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: [`/api/dashboard/team-skill-matrix?weekOf=${formatDateForQuery(weekDate)}`],
  });
  
  // Fetch historical data for chart
  const { data: historicalData, isLoading: isHistoricalLoading } = useQuery({
    queryKey: [`/api/dashboard/historical-ratings${selectedTeamMember ? `?teamMemberId=${selectedTeamMember}` : ''}${selectedSkill ? `?skillId=${selectedSkill}` : ''}`],
  });
  
  // Get categories from skills
  const categories = dashboardData?.skills?.reduce((acc: Set<string>, skill: any) => {
    if (skill.category) acc.add(skill.category);
    return acc;
  }, new Set<string>());
  
  // Filter skills by category
  const filteredSkills = dashboardData?.skills?.filter((skill: any) => {
    if (!selectedCategory) return true;
    return skill.category === selectedCategory;
  });
  
  // Calculate team average skill level
  const calculateTeamAverage = () => {
    if (!dashboardData?.teamMembers) return 0;
    
    let totalRatings = 0;
    let totalSkills = 0;
    
    dashboardData.teamMembers.forEach((member: any) => {
      member.skills.forEach((skill: any) => {
        totalRatings += skill.level;
        totalSkills++;
      });
    });
    
    return totalSkills > 0 ? (totalRatings / totalSkills).toFixed(1) : 0;
  };
  
  // Find most improved skill
  const findMostImprovedSkill = () => {
    if (!historicalData || historicalData.length < 2) return null;
    
    // Sort historical data by date
    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime()
    );
    
    // Get latest and previous week data
    const latestWeek = sortedData[sortedData.length - 1];
    const previousWeek = sortedData[sortedData.length - 2];
    
    // Calculate improvement for each skill
    const skillImprovements: Record<string, { name: string, improvement: number }> = {};
    
    latestWeek.ratings.forEach((latestRating: any) => {
      const previousRating = previousWeek.ratings.find(
        (pr: any) => pr.skillId === latestRating.skillId && pr.teamMemberId === latestRating.teamMemberId
      );
      
      if (previousRating) {
        const improvement = latestRating.level - previousRating.level;
        
        if (!skillImprovements[latestRating.skillName] || 
            improvement > skillImprovements[latestRating.skillName].improvement) {
          skillImprovements[latestRating.skillName] = {
            name: latestRating.skillName,
            improvement
          };
        }
      }
    });
    
    // Find the most improved skill
    let mostImproved = { name: '', improvement: -1 };
    
    Object.values(skillImprovements).forEach(skill => {
      if (skill.improvement > mostImproved.improvement) {
        mostImproved = skill;
      }
    });
    
    return mostImproved.improvement > 0 ? mostImproved : null;
  };
  
  // Find skill gap
  const findSkillGap = () => {
    if (!dashboardData?.teamMembers) return null;
    
    const skillAverages: Record<string, { name: string, category: string, average: number, belowBasicCount: number }> = {};
    
    // Calculate average for each skill
    dashboardData.skills.forEach((skill: any) => {
      let totalLevel = 0;
      let memberCount = 0;
      let belowBasicCount = 0;
      
      dashboardData.teamMembers.forEach((member: any) => {
        const memberSkill = member.skills.find((s: any) => s.skillId === skill.id);
        if (memberSkill) {
          totalLevel += memberSkill.level;
          memberCount++;
          if (memberSkill.level < 1) { // Below Basic Knowledge
            belowBasicCount++;
          }
        }
      });
      
      const average = memberCount > 0 ? totalLevel / memberCount : 0;
      
      skillAverages[skill.name] = {
        name: skill.name,
        category: skill.category,
        average,
        belowBasicCount
      };
    });
    
    // Find skill with lowest average
    let lowestSkill = { name: '', category: '', average: 4, belowBasicCount: 0 };
    
    Object.values(skillAverages).forEach(skill => {
      if (skill.average < lowestSkill.average) {
        lowestSkill = skill;
      }
    });
    
    return lowestSkill.average < 1.5 ? lowestSkill : null;
  };
  
  // Get previous week's date
  const getPreviousWeek = () => {
    const prevWeek = new Date(weekDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setWeekDate(prevWeek);
  };
  
  // Get next week's date
  const getNextWeek = () => {
    const nextWeek = new Date(weekDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Don't allow going to future weeks
    if (nextWeek <= new Date()) {
      setWeekDate(nextWeek);
    }
  };
  
  // Export data as CSV
  const exportData = () => {
    if (!dashboardData) return;
    
    // Create CSV header
    let csv = "Team Member,Role,Department,";
    dashboardData.skills.forEach((skill: any) => {
      csv += `${skill.name},`;
    });
    csv += "\n";
    
    // Add data rows
    dashboardData.teamMembers.forEach((member: any) => {
      csv += `${member.teamMemberName},${member.role},${member.department},`;
      
      dashboardData.skills.forEach((skill: any) => {
        const memberSkill = member.skills.find((s: any) => s.skillId === skill.id);
        const skillLevel = memberSkill 
          ? ["Unknown", "Basic Knowledge", "Hands-on Experience", "Expert"][memberSkill.level]
          : "Unknown";
        
        csv += `${skillLevel},`;
      });
      
      csv += "\n";
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `skill_matrix_${formatDateForQuery(weekDate)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Dashboard metrics
  const teamAverage = calculateTeamAverage();
  const teamAveragePercentage = parseFloat(teamAverage) * 100 / 3;
  const mostImprovedSkill = findMostImprovedSkill();
  const skillGap = findSkillGap();
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Skills Dashboard</h1>
            <p className="text-gray-600 mt-1">Track and visualize your team's skill progress</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Button variant="outline" className="flex items-center">
                <span>Weekly Report</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Button variant="outline" className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                <span>This Week ({formatDateRange(weekDate)})</span>
              </Button>
            </div>
            <Button onClick={exportData} className="flex items-center">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
              <Select 
                value={selectedTeamMember} 
                onValueChange={setSelectedTeamMember}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {dashboardData?.teamMembers?.map((member: any) => (
                    <SelectItem key={member.teamMemberId} value={member.teamMemberId.toString()}>
                      {member.teamMemberName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories && Array.from(categories).map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specific Skill</label>
              <Select 
                value={selectedSkill} 
                onValueChange={setSelectedSkill}
                disabled={!filteredSkills?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {filteredSkills?.map((skill: any) => (
                    <SelectItem key={skill.id} value={skill.id.toString()}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Team Average Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Team Average Skill Level</p>
                {isDashboardLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{teamAverage}/3.0</h3>
                )}
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                {isDashboardLoading ? (
                  <Skeleton className="h-2.5 w-full rounded-full" />
                ) : (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${teamAveragePercentage}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{Math.round(teamAveragePercentage)}%</span>
                  </>
                )}
              </div>
              {isDashboardLoading ? (
                <Skeleton className="h-5 w-48 mt-2" />
              ) : (
                mostImprovedSkill && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <ChevronUp className="mr-1 h-4 w-4" />
                    <span>{mostImprovedSkill.improvement * 33}% improvement from last week</span>
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Most Improved Skill Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Most Improved Skill</p>
                {isHistoricalLoading ? (
                  <Skeleton className="h-6 w-32 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold text-gray-800 mt-1">
                    {mostImprovedSkill ? mostImprovedSkill.name : "No improvement detected"}
                  </h3>
                )}
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Rocket className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                {isHistoricalLoading ? (
                  <Skeleton className="h-2.5 w-full rounded-full" />
                ) : (
                  mostImprovedSkill ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${mostImprovedSkill.improvement * 33}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{mostImprovedSkill.improvement * 33}%</span>
                    </>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                  )
                )}
              </div>
              {isHistoricalLoading ? (
                <Skeleton className="h-5 w-48 mt-2" />
              ) : (
                mostImprovedSkill && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <ChevronUp className="mr-1 h-4 w-4" />
                    <span>{mostImprovedSkill.improvement} level improvement from last week</span>
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Skill Gap Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Skill Gap Alert</p>
                {isDashboardLoading ? (
                  <Skeleton className="h-6 w-32 mt-1" />
                ) : (
                  <h3 className="text-lg font-bold text-gray-800 mt-1">
                    {skillGap ? `${skillGap.category} Skills` : "No significant gaps"}
                  </h3>
                )}
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                {isDashboardLoading ? (
                  <Skeleton className="h-2.5 w-full rounded-full" />
                ) : (
                  skillGap ? (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-600 h-2.5 rounded-full" 
                          style={{ width: `${(skillGap.average / 3) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{Math.round((skillGap.average / 3) * 100)}%</span>
                    </>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  )
                )}
              </div>
              {isDashboardLoading ? (
                <Skeleton className="h-5 w-48 mt-2" />
              ) : (
                skillGap && (
                  <p className="text-sm text-red-600 mt-2 flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    <span>{skillGap.belowBasicCount} team members need training</span>
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Skill Progression Over Time</h2>
            <div className="mt-2 md:mt-0 flex items-center space-x-3">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-1"></span>
                <span className="text-sm text-gray-600">Current Week</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-gray-300 rounded-full mr-1"></span>
                <span className="text-sm text-gray-600">Previous Week</span>
              </div>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <ChevronLeft 
                  className="h-5 w-5 text-gray-500"
                  onClick={getPreviousWeek}
                />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <ChevronRight 
                  className="h-5 w-5 text-gray-500"
                  onClick={getNextWeek}
                />
              </Button>
            </div>
          </div>
          <div className="h-80">
            {isHistoricalLoading || isDashboardLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <SkillChart 
                dashboardData={dashboardData} 
                historicalData={historicalData}
                selectedTeamMember={selectedTeamMember}
                selectedSkill={selectedSkill}
                weekDate={weekDate}
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Team Skills Table */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Team Skills Overview</h2>
          <div className="mt-2 md:mt-0 flex items-center">
            <div className="relative ml-2">
              <input 
                type="text" 
                placeholder="Search skills..." 
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isDashboardLoading ? (
            <div className="p-4">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  {dashboardData?.skills.map((skill: any) => (
                    <th 
                      key={skill.id}
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {skill.name}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.teamMembers.map((member: any) => (
                  <tr key={member.teamMemberId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {member.teamMemberName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.teamMemberName}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    {dashboardData?.skills.map((skill: any) => {
                      const memberSkill = member.skills.find((s: any) => s.skillId === skill.id);
                      const level = memberSkill ? memberSkill.level : 0;
                      
                      let badgeClass = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
                      let badgeText = "Unknown";
                      
                      if (level === 0) {
                        badgeClass += " bg-gray-100 text-gray-800";
                        badgeText = "Unknown";
                      } else if (level === 1) {
                        badgeClass += " bg-yellow-100 text-yellow-800";
                        badgeText = "Basic Knowledge";
                      } else if (level === 2) {
                        badgeClass += " bg-blue-100 text-blue-800";
                        badgeText = "Hands-on Experience";
                      } else if (level === 3) {
                        badgeClass += " bg-green-100 text-green-800";
                        badgeText = "Expert";
                      }
                      
                      return (
                        <td key={skill.id} className="px-6 py-4 whitespace-nowrap">
                          <span className={badgeClass}>
                            {badgeText}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="link" className="text-blue-600 hover:text-blue-700">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{dashboardData?.teamMembers?.length || 0}</span> of <span className="font-medium">{dashboardData?.teamMembers?.length || 0}</span> team members
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button variant="outline" size="sm" className="relative inline-flex items-center px-2 py-2 rounded-l-md">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="sm" className="relative inline-flex items-center px-4 py-2">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="relative inline-flex items-center px-2 py-2 rounded-r-md">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
