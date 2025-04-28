
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Profile } from "@/data/mockData";
import { ChevronDown, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileSelectorProps {
  profiles: Profile[];
  currentProfileId: string;
  onProfileChange: (profileId: string) => void;
  onCreateProfile: (name: string) => void;
  onDeleteProfile: (profileId: string) => void;
}

const profileSchema = z.object({
  name: z.string().min(1, { message: "Profile name is required" }),
});

export function ProfileSelector({
  profiles,
  currentProfileId,
  onProfileChange,
  onCreateProfile,
  onDeleteProfile,
}: ProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const { toast } = useToast();

  const form = useForm<{ name: string }>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  const currentProfile = profiles.find(profile => profile.id === currentProfileId) || profiles[0];

  const handleCreateProfile = (values: { name: string }) => {
    onCreateProfile(values.name);
    setCreateDialogOpen(false);
    form.reset();
    toast({
      title: "Profile created",
      description: `${values.name} profile has been created successfully.`
    });
  };

  const handleDeleteConfirm = (profile: Profile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
    setOpen(false);
  };

  const confirmDelete = () => {
    if (profileToDelete) {
      onDeleteProfile(profileToDelete.id);
      setDeleteDialogOpen(false);
      toast({
        title: "Profile deleted",
        description: `${profileToDelete.name} has been removed.`
      });
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            {currentProfile?.name || "Select profile"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Profiles</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {profiles.length > 0 ? (
              profiles.map(profile => (
                <DropdownMenuItem
                  key={profile.id}
                  className="flex items-center justify-between"
                  onClick={() => {
                    if (profile.id !== currentProfileId) {
                      onProfileChange(profile.id);
                      setOpen(false);
                    }
                  }}
                >
                  <span className={profile.id === currentProfileId ? "font-medium" : ""}>
                    {profile.name}
                  </span>
                  {profiles.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfirm(profile);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No profiles available</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            setCreateDialogOpen(true);
            setOpen(false);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Create a new profile for organizing your servers
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProfile)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter profile name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Profile</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the profile "{profileToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
