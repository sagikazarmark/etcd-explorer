import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key } from "lucide-react";
import { toast } from "sonner";
import type { EtcdRole, EtcdRolePermission } from "@/lib/types/etcd";

interface RevokePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: EtcdRole | null;
  onPermissionRevoked: (roleName: string, permission: EtcdRolePermission) => void;
}

export function RevokePermissionDialog({
  open,
  onOpenChange,
  role,
  onPermissionRevoked,
}: RevokePermissionDialogProps) {
  const [selectedPerm, setSelectedPerm] = useState<EtcdRolePermission | null>(null);

  if (!role) return null;

  const handleRevoke = () => {
    if (!selectedPerm) return;

    onPermissionRevoked(role.name, selectedPerm);
    toast.success("Permission revoked", {
      description: `Permission on "${selectedPerm.key}" removed from role "${role.name}".`,
    });

    setSelectedPerm(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke Permission from {role.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {role.permissions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select a permission to revoke:</p>
              {role.permissions.map((perm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPerm(perm)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedPerm === perm
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {perm.key}
                      {perm.rangeEnd && ` → ${perm.rangeEnd}`}
                    </span>
                  </div>
                  <Badge variant={perm.permType === "readwrite" ? "default" : "secondary"}>
                    {perm.permType}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No permissions to revoke.</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRevoke}
            disabled={!selectedPerm}
            variant="destructive"
          >
            Revoke Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
