"use client";

import { UserDialog } from "@/components/admin/user-dialog";
import { UsersTable } from "@/components/admin/users-table";

interface UsersClientProps {
  newInstallation: boolean;
}

export function UsersClient({ newInstallation }: UsersClientProps) {
  if (newInstallation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <UserDialog mode="setup" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground text-sm">
          Manage users and roles in your system.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
