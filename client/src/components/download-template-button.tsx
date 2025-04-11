import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import * as XLSX from 'xlsx';

interface DownloadTemplateButtonProps {
  templateType: 'teamMembers' | 'skills' | 'skillRatings';
}

export default function DownloadTemplateButton({ templateType }: DownloadTemplateButtonProps) {
  
  const generateTeamMembersTemplate = () => {
    // Generate more comprehensive team member examples
    const data = [
      {
        name: "John Doe",
        role: "Frontend Developer",
        department: "Engineering",
        email: "john.doe@example.com"
      },
      {
        name: "Jane Smith",
        role: "UX Designer",
        department: "Design",
        email: "jane.smith@example.com"
      },
      {
        name: "Robert Johnson",
        role: "Backend Developer",
        department: "Engineering",
        email: "robert.johnson@example.com"
      },
      {
        name: "Emily Chen",
        role: "Product Manager",
        department: "Product",
        email: "emily.chen@example.com"
      },
      {
        name: "Michael Brown",
        role: "DevOps Engineer",
        department: "Operations",
        email: "michael.brown@example.com"
      }
    ];
    
    return data;
  };
  
  const generateSkillsTemplate = () => {
    // Create a comprehensive list of example skills across different categories
    const data = [
      {
        name: "React.js",
        category: "Frontend",
        description: "A JavaScript library for building user interfaces"
      },
      {
        name: "Angular",
        category: "Frontend",
        description: "Platform for building mobile and desktop web applications"
      },
      {
        name: "Vue.js",
        category: "Frontend",
        description: "Progressive JavaScript framework for building user interfaces"
      },
      {
        name: "Node.js",
        category: "Backend",
        description: "JavaScript runtime built on Chrome's V8 JavaScript engine"
      },
      {
        name: "Django",
        category: "Backend",
        description: "High-level Python web framework"
      },
      {
        name: "PostgreSQL",
        category: "Database",
        description: "Open source object-relational database system"
      },
      {
        name: "MongoDB",
        category: "Database",
        description: "NoSQL document database"
      },
      {
        name: "Docker",
        category: "DevOps",
        description: "Platform for developing, shipping, and running applications in containers"
      },
      {
        name: "AWS",
        category: "Cloud",
        description: "On-demand cloud computing platforms and APIs"
      },
      {
        name: "Figma",
        category: "Design",
        description: "Collaborative interface design tool"
      }
    ];
    
    return data;
  };
  
  const generateSkillRatingsTemplate = () => {
    // Get the current week's start date (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek); // Roll back to the start of the week
    const weekOf = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create sample skill ratings with different levels and consistent date
    const data = [
      {
        teamMemberName: "John Doe",
        skillName: "React.js",
        level: 3, // Expert
        weekOf: weekOf
      },
      {
        teamMemberName: "John Doe",
        skillName: "Node.js",
        level: 2, // Hands-on Experience
        weekOf: weekOf
      },
      {
        teamMemberName: "John Doe",
        skillName: "PostgreSQL",
        level: 1, // Basic Knowledge
        weekOf: weekOf
      },
      {
        teamMemberName: "Jane Smith",
        skillName: "React.js",
        level: 1, // Basic Knowledge
        weekOf: weekOf
      },
      {
        teamMemberName: "Jane Smith",
        skillName: "Figma",
        level: 3, // Expert
        weekOf: weekOf
      },
      {
        teamMemberName: "Robert Johnson",
        skillName: "Node.js",
        level: 3, // Expert
        weekOf: weekOf
      },
      {
        teamMemberName: "Robert Johnson",
        skillName: "MongoDB",
        level: 2, // Hands-on Experience
        weekOf: weekOf
      },
      {
        teamMemberName: "Emily Chen",
        skillName: "Figma",
        level: 2, // Hands-on Experience
        weekOf: weekOf
      },
      {
        teamMemberName: "Michael Brown",
        skillName: "Docker",
        level: 3, // Expert
        weekOf: weekOf
      },
      {
        teamMemberName: "Michael Brown",
        skillName: "AWS",
        level: 3, // Expert
        weekOf: weekOf
      }
    ];
    
    return data;
  };
  
  const handleDownload = () => {
    let data;
    let filename;
    
    switch (templateType) {
      case 'teamMembers':
        data = generateTeamMembersTemplate();
        filename = 'team-members-template.xlsx';
        break;
      case 'skills':
        data = generateSkillsTemplate();
        filename = 'skills-template.xlsx';
        break;
      case 'skillRatings':
        data = generateSkillRatingsTemplate();
        filename = 'skill-ratings-template.xlsx';
        break;
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert the data to a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add column width information
    const columnWidths = [];
    
    // Calculate column widths based on content
    if (data.length > 0) {
      const firstRow = data[0];
      for (const key in firstRow) {
        if (Object.prototype.hasOwnProperty.call(firstRow, key)) {
          // Set minimum width based on header length
          const headerWidth = key.length * 1.5;
          
          // Check content width for each row
          let maxContentWidth = 0;
          for (const row of data) {
            const content = String(row[key] || '');
            const contentWidth = content.length * 1.2;
            maxContentWidth = Math.max(maxContentWidth, contentWidth);
          }
          
          // Use the larger of header width or content width
          columnWidths.push({ width: Math.max(headerWidth, maxContentWidth) });
        }
      }
    }
    
    // Apply column widths if available
    if (columnWidths.length > 0) {
      ws['!cols'] = columnWidths;
    }
    
    // Add notes/instructions based on template type
    let instructions = '';
    if (templateType === 'teamMembers') {
      instructions = 'Instructions: Fill in team member details. All fields are required.';
    } else if (templateType === 'skills') {
      instructions = 'Instructions: Fill in skill details. Name and category are required, description is optional.';
    } else if (templateType === 'skillRatings') {
      instructions = 'Instructions: Fill in skill ratings. Use existing team member and skill names. Level values: 0=Unknown, 1=Basic Knowledge, 2=Hands-on Experience, 3=Expert. Format weekOf as YYYY-MM-DD.';
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, filename);
  };
  
  let templateLabel = "Template";
  switch (templateType) {
    case 'teamMembers':
      templateLabel = "Team Members Template";
      break;
    case 'skills':
      templateLabel = "Skills Template";
      break;
    case 'skillRatings':
      templateLabel = "Skill Ratings Template";
      break;
  }
  
  return (
    <Button 
      variant="outline"
      onClick={handleDownload}
      className="flex items-center gap-2"
    >
      <DownloadIcon className="h-4 w-4" />
      Download {templateLabel}
    </Button>
  );
}