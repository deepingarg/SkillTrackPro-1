import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddSkillDialog({ isOpen, onClose }: AddSkillDialogProps) {
  const { toast } = useToast();
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  
  // Fetch existing skills to get categories
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
  });
  
  // Get unique categories
  const existingCategories = skills
    ? Array.from(new Set(skills.map((skill: any) => skill.category)))
    : [];
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    },
  });
  
  // Add skill mutation
  const addSkill = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('POST', '/api/skills', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Skill added",
        description: "The skill has been added successfully.",
      });
      form.reset();
      setIsNewCategory(false);
      setNewCategory("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add skill: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle category selection
  const handleCategoryChange = (value: string) => {
    if (value === "add_new") {
      setIsNewCategory(true);
      form.setValue("category", "");
    } else {
      setIsNewCategory(false);
      form.setValue("category", value);
    }
  };
  
  // Handle new category input
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategory(value);
    form.setValue("category", value);
  };
  
  // Form submission handler
  const onSubmit = (data: FormValues) => {
    if (isNewCategory) {
      data.category = newCategory;
    }
    addSkill.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
          <DialogDescription>
            Add a new skill to track across your team members.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter skill name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isNewCategory ? (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={handleCategoryChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingCategories.map((category: string) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                        <SelectItem value="add_new" className="text-blue-600 font-medium">
                          + Add new category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormItem>
                <FormLabel>New Category</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={handleNewCategoryChange}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => {
                    setIsNewCategory(false);
                    setNewCategory("");
                  }}
                >
                  Cancel
                </Button>
                <FormMessage />
              </FormItem>
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the skill"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSkill.isPending}>
                {addSkill.isPending ? "Adding..." : "Add Skill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
