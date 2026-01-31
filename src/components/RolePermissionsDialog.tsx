import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Key } from "lucide-react";
import type { EtcdRole } from "@/lib/types/etcd";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: EtcdRole | null;
}

export function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions for {role.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {role.name === "root" ? (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                The <span className="font-mono font-medium">root</span> role has full cluster access and cannot be modified.
              </p>
            </div>
          ) : role.permissions.length > 0 ? (
            <div className="space-y-2">
              {role.permissions.map((perm, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No permissions defined for this role.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
