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
  ShieldOff,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
} from "lucide-react";

export interface UserColumnOptions {
  onImpersonate: (user: UserWithRole) => void;
  onPromote: (user: UserWithRole) => void;
  onDemote: (user: UserWithRole) => void;
  onBan: (user: UserWithRole) => void;
  onUnban: (user: UserWithRole) => void;
  onEdit: (user: UserWithRole) => void;
  onDelete: (user: UserWithRole) => void;
  isAdmin: boolean; // current session user is admin
  isPending: boolean;
}

export function getUserColumns({
  onImpersonate,
  onPromote,
  onDemote,
  onBan,
  onUnban,
  onEdit,
  onDelete,
  isAdmin: currentUserIsAdmin,
  isPending,
}: UserColumnOptions): ColumnDef<UserWithRole>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
      // custom filterFn covers both name and email for the search column
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
          <Badge variant={role === "admin" ? "default" : "secondary"}>
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
        const rowUserIsAdmin = u.role === "admin";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isPending}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onEdit(u)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onImpersonate(u)}>
                <UserCog className="h-4 w-4 mr-2" />
                Impersonate
              </DropdownMenuItem>

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
              <DropdownMenuSeparator />

              {rowUserIsAdmin ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDemote(u)}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Demote to User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPromote(u)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Promote to Admin
                </DropdownMenuItem>
              )}

              {currentUserIsAdmin && (
                <>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(u)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
