
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EndpointType } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(1, { message: "Profile name is required" }),
  endpointType: z.enum(["HTTP_SSE", "STDIO"], { 
    required_error: "Endpoint type is required" 
  }),
  endpoint: z.string().min(1, { message: "Endpoint URL or path is required" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CreateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProfile: (profile: {
    name: string;
    endpointType: EndpointType;
    endpoint: string;
  }) => void;
}

export function CreateProfileDialog({ open, onOpenChange, onCreateProfile }: CreateProfileDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      endpointType: "HTTP_SSE",
      endpoint: "",
    },
  });

  const handleSubmit = (values: ProfileFormValues) => {
    onCreateProfile({
      name: values.name,
      endpointType: values.endpointType,
      endpoint: values.endpoint,
    });
    
    form.reset();
    onOpenChange(false);
    
    toast({
      title: "Profile created",
      description: `Created profile "${values.name}"`,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogDescription>
            Profiles allow you to group server instances and connect to hosts.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Development, Production" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endpointType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an endpoint type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HTTP_SSE">HTTP SSE</SelectItem>
                      <SelectItem value="STDIO">Standard I/O</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Endpoint</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        form.watch("endpointType") === "HTTP_SSE" 
                          ? "http://localhost:8008/mcp" 
                          : "/usr/local/bin/mcp-stdio"
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
