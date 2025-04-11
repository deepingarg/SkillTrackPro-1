import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import * as XLSX from 'xlsx';

interface DownloadTemplateButtonProps {
  templateType: 'teamMembers' | 'skills' | 'skillRatings';
}

export default function DownloadTemplateButton({ templateType }: DownloadTemplateButtonProps) {
  
  const generateTeamMembersTemplate = () => {
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
      }
    ];
    
    return data;
  };
  
  const generateSkillsTemplate = () => {
    const data = [
      {
        name: "React.js",
        category: "Frontend",
        description: "A JavaScript library for building user interfaces"
      },
      {
        name: "Node.js",
        category: "Backend",
        description: "JavaScript runtime built on Chrome's V8 JavaScript engine"
      },
      {
        name: "PostgreSQL",
        category: "Database",
        description: "Open source object-relational database system"
      }
    ];
    
    return data;
  };
  
  const generateSkillRatingsTemplate = () => {
    const data = [
      {
        teamMemberName: "John Doe",
        skillName: "React.js",
        level: 3,
        weekOf: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      },
      {
        teamMemberName: "John Doe",
        skillName: "Node.js",
        level: 2,
        weekOf: new Date().toISOString().split('T')[0]
      },
      {
        teamMemberName: "Jane Smith",
        skillName: "React.js",
        level: 1,
        weekOf: new Date().toISOString().split('T')[0]
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
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, filename);
  };
  
  return (
    <Button 
      variant="outline"
      onClick={handleDownload}
      className="flex items-center gap-2"
    >
      <DownloadIcon className="h-4 w-4" />
      Download Template
    </Button>
  );
}