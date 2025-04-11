import { useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DownloadTemplateButton from "@/components/download-template-button";

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("teamMembers");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setPreview(null);
      
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      
      setFile(selectedFile);
      
      // Read the file
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data);
      
      // Get the first worksheet
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON
      const jsonData = utils.sheet_to_json(firstSheet);
      
      // Preview the data
      setPreview(jsonData.slice(0, 5)); // Show first 5 rows
    } catch (err) {
      console.error("Error reading Excel file:", err);
      setError("Failed to read Excel file. Please ensure it's a valid Excel file.");
    }
  };

  const teamMembersImportMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return fetch("/api/import/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to import team members");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Team members were imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setFile(null);
      setPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import team members",
        variant: "destructive",
      });
    },
  });

  const skillsImportMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return fetch("/api/import/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to import skills");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Skills were imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setFile(null);
      setPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import skills",
        variant: "destructive",
      });
    },
  });

  const skillRatingsImportMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return fetch("/api/import/skill-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to import skill ratings");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Skill ratings were imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/skill-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/team-skill-matrix"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/historical-ratings"] });
      setFile(null);
      setPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import skill ratings",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!file || !preview) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    // Get full data again
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(firstSheet);
        
        if (activeTab === "teamMembers") {
          teamMembersImportMutation.mutate(jsonData);
        } else if (activeTab === "skills") {
          skillsImportMutation.mutate(jsonData);
        } else if (activeTab === "skillRatings") {
          skillRatingsImportMutation.mutate(jsonData);
        }
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Failed to process Excel data. Please check the file format.");
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="teamMembers">Team Members</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="skillRatings">Skill Ratings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="teamMembers">
            <Card>
              <CardHeader>
                <CardTitle>Import Team Members</CardTitle>
                <CardDescription>
                  Upload an Excel file with team member data. Your Excel should have columns for name, role, department, and email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Need a sample Excel file? Download our template:</p>
                      <DownloadTemplateButton templateType="teamMembers" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="team-members-file" className="block text-sm font-medium mb-2">
                      Select Excel File
                    </label>
                    <input
                      id="team-members-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {preview && preview.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Preview (First 5 Rows)</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(preview[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {preview.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((cell: any, cellIdx) => (
                                  <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={handleImport}
                          disabled={teamMembersImportMutation.isPending}
                        >
                          {teamMembersImportMutation.isPending ? "Importing..." : "Import Team Members"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Import Skills</CardTitle>
                <CardDescription>
                  Upload an Excel file with skills data. Your Excel should have columns for name, category, and description.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Need a sample Excel file? Download our template:</p>
                      <DownloadTemplateButton templateType="skills" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="skills-file" className="block text-sm font-medium mb-2">
                      Select Excel File
                    </label>
                    <input
                      id="skills-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {preview && preview.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Preview (First 5 Rows)</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(preview[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {preview.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((cell: any, cellIdx) => (
                                  <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={handleImport}
                          disabled={skillsImportMutation.isPending}
                        >
                          {skillsImportMutation.isPending ? "Importing..." : "Import Skills"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skillRatings">
            <Card>
              <CardHeader>
                <CardTitle>Import Skill Ratings</CardTitle>
                <CardDescription>
                  Upload an Excel file with skill ratings data. Your Excel should have columns for teamMemberId or teamMemberName, 
                  skillId or skillName, level (0-3), and weekOf (date).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Need a sample Excel file? Download our template:</p>
                      <DownloadTemplateButton templateType="skillRatings" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="skill-ratings-file" className="block text-sm font-medium mb-2">
                      Select Excel File
                    </label>
                    <input
                      id="skill-ratings-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {preview && preview.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Preview (First 5 Rows)</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {Object.keys(preview[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {preview.map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((cell: any, cellIdx) => (
                                  <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          onClick={handleImport}
                          disabled={skillRatingsImportMutation.isPending}
                        >
                          {skillRatingsImportMutation.isPending ? "Importing..." : "Import Skill Ratings"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}