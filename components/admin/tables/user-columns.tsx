"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import type { UserWithRole } from "better-auth/plugins";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Shield,
  ShieldAlert,
  ShieldOff,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
} from "lucide-react";

export interface UserColumnOptions {
  onImpersonate: (user: UserWithRole) => void;
  onPromoteAdmin: (user: UserWithRole) => void;
  onPromoteSuperadmin: (user: UserWithRole) => void;
  onDemote: (user: UserWithRole) => void;
  onBan: (user: UserWithRole) => void;
  onUnban: (user: UserWithRole) => void;
  onEdit: (user: UserWithRole) => void;
  onDelete: (user: UserWithRole) => void;
  currentUserRole: string;
  isPending: boolean;
}

export function getUserColumns({
  onImpersonate,
  onPromoteAdmin,
  onPromoteSuperadmin,
  onDemote,
  onBan,
  onUnban,
  onEdit,
  onDelete,
  currentUserRole,
  isPending,
}: UserColumnOptions): ColumnDef<UserWithRole>[] {
  const isSuperAdmin = currentUserRole === "superadmin";
  const isAdmin = currentUserRole === "admin" || isSuperAdmin;

  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      filterFn: (row, _, filterValue: string) => {
        const name = row.getValue<string>("name")?.toLowerCase() ?? "";
        const email = row.original.email?.toLowerCase() ?? "";
        const q = filterValue.toLowerCase();
        return name.includes(q) || email.includes(q);
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("email")}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue<string>("role");
        return (
          <Badge
            variant={
              role === "superadmin"
                ? "default"
                : role === "admin"
                  ? "secondary"
                  : "outline"
            }
          >
            {role === "superadmin" && <ShieldAlert className="h-3 w-3 mr-1" />}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => {
        const banned = row.getValue<boolean>("banned");
        return (
          <Badge variant={banned ? "destructive" : "outline"}>
            {banned ? "Banned" : "Active"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.getValue<string>("createdAt")), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const u = row.original;
        const targetIsSuperAdmin = u.role === "superadmin";
        const locked = targetIsSuperAdmin && !isSuperAdmin;
        const hasAdminRole = u.role === "admin" || u.role === "superadmin";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isPending}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {locked ? (
                <DropdownMenuItem disabled>
                  <ShieldAlert className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Superadmin protected
                  </span>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(u)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>

                  {!(u.role === "superadmin" && !isSuperAdmin) && (
                    <DropdownMenuItem onClick={() => onImpersonate(u)}>
                      <UserCog className="h-4 w-4 mr-2" />
                      Impersonate
                    </DropdownMenuItem>
                  )}

                  {u.banned ? (
                    <DropdownMenuItem onClick={() => onUnban(u)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Unban
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-amber-600 focus:text-amber-600"
                      onClick={() => onBan(u)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Ban
                    </DropdownMenuItem>
                  )}

                  {hasAdminRole ? (
                    // Already admin or superadmin — show demote
                    <DropdownMenuItem onClick={() => onDemote(u)}>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Demote to User
                    </DropdownMenuItem>
                  ) : (
                    // Plain user — show promote to admin
                    <DropdownMenuItem onClick={() => onPromoteAdmin(u)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Promote to Admin
                    </DropdownMenuItem>
                  )}

                  {/* Promote to superadmin — only superadmins can see this,
                      only on non-superadmin targets */}
                  {isSuperAdmin && !targetIsSuperAdmin && (
                    <DropdownMenuItem onClick={() => onPromoteSuperadmin(u)}>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Promote to Superadmin
                    </DropdownMenuItem>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(u)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
