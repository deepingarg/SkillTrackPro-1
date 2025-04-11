import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SkillChartProps {
  dashboardData: any;
  historicalData: any;
  selectedTeamMember: string;
  selectedSkill: string;
  weekDate: Date;
}

export default function SkillChart({
  dashboardData,
  historicalData,
  selectedTeamMember,
  selectedSkill,
  weekDate
}: SkillChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!dashboardData || !historicalData) return;
    
    // Prepare chart data
    const data: any[] = [];
    
    // Prepare for all skills or filtered by skill
    let skillsToDisplay: any[] = [];
    if (selectedSkill) {
      const skill = dashboardData.skills.find((s: any) => s.id.toString() === selectedSkill);
      if (skill) {
        skillsToDisplay = [skill];
      }
    } else {
      // Take top 5 skills if there are many
      skillsToDisplay = dashboardData.skills.slice(0, Math.min(5, dashboardData.skills.length));
    }
    
    // Get the most recent two weeks of data
    const sortedHistorical = [...historicalData].sort(
      (a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime()
    );
    const currentWeekData = sortedHistorical[0];
    const previousWeekData = sortedHistorical.length > 1 ? sortedHistorical[1] : null;
    
    // Create data for each skill
    skillsToDisplay.forEach((skill: any) => {
      // Filter ratings by skill and optionally by team member
      const currentWeekRatings = currentWeekData.ratings.filter(
        (r: any) => r.skillId === skill.id && 
        (!selectedTeamMember || r.teamMemberId.toString() === selectedTeamMember)
      );
      
      let previousWeekRatings: any[] = [];
      if (previousWeekData) {
        previousWeekRatings = previousWeekData.ratings.filter(
          (r: any) => r.skillId === skill.id && 
          (!selectedTeamMember || r.teamMemberId.toString() === selectedTeamMember)
        );
      }
      
      // Calculate average skill level for current week
      let currentWeekAvg = 0;
      if (currentWeekRatings.length > 0) {
        currentWeekAvg = currentWeekRatings.reduce((sum: number, r: any) => sum + r.level, 0) / currentWeekRatings.length;
      }
      
      // Calculate average skill level for previous week
      let previousWeekAvg = 0;
      if (previousWeekRatings.length > 0) {
        previousWeekAvg = previousWeekRatings.reduce((sum: number, r: any) => sum + r.level, 0) / previousWeekRatings.length;
      }
      
      data.push({
        name: skill.name,
        current: parseFloat(currentWeekAvg.toFixed(1)),
        previous: parseFloat(previousWeekAvg.toFixed(1)),
      });
    });
    
    setChartData(data);
  }, [dashboardData, historicalData, selectedTeamMember, selectedSkill, weekDate]);
  
  // Custom tooltip formatter
  const customTooltipFormatter = (value: number) => {
    const labels = ["Unknown", "Basic Knowledge", "Hands-on Experience", "Expert"];
    const nearestLevel = Math.floor(value);
    const label = labels[nearestLevel];
    return `${label} (${value.toFixed(1)})`;
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {customTooltipFormatter(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          domain={[0, 3]} 
          ticks={[0, 1, 2, 3]} 
          tickFormatter={(value) => {
            const labels = ["Unknown", "Basic", "Hands-on", "Expert"];
            return labels[value];
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar name="Current Week" dataKey="current" fill="#3B82F6" />
        <Bar name="Previous Week" dataKey="previous" fill="#D1D5DB" />
      </BarChart>
    </ResponsiveContainer>
  );
}
