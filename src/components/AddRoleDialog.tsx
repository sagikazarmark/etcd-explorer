import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleAdded?: (role: { name: string }) => void;
}

export function AddRoleDialog({
  open,
  onOpenChange,
  onRoleAdded,
}: AddRoleDialogProps) {
  const [roleName, setRoleName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    // Validate role name (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(roleName.trim())) {
      toast.error("Invalid role name", {
        description:
          "Role name must start with a letter and contain only letters, numbers, hyphens, and underscores.",
      });
      return;
    }

    onRoleAdded?.({ name: roleName.trim() });
    toast.success(`Role "${roleName}" created successfully`);

    // Reset form
    setRoleName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
          <DialogDescription>
            Create a new role. You can grant permissions to the role after
            creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Must start with a letter. Can contain letters, numbers, hyphens,
                and underscores.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
