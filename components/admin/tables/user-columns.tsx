"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils/user"
import { ColumnDef } from "@tanstack/react-table"
import type { UserWithRole } from "better-auth/plugins"
import { ArrowUpDown, Ban, MoreHorizontal, Shield, UserCheck } from "lucide-react"

export type UserAction = {
    onImpersonate: (user: UserWithRole) => void
    onPromote: (user: UserWithRole) => void
    onDemote: (user: UserWithRole) => void
    onBan: (user: UserWithRole) => void
    onUnban: (user: UserWithRole) => void
    isPending: boolean
}

export function getUserColumns(actions: UserAction): ColumnDef<UserWithRole>[] {
    return [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    User
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            ),
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm leading-none">{user.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        </div>
                    </div>
                )
            },
            filterFn: (row, _, filterValue: string) => {
                const q = filterValue.toLowerCase()
                return (
                    row.original.name.toLowerCase().includes(q) ||
                    row.original.email.toLowerCase().includes(q)
                )
            },
        },
        {
            accessorKey: "role",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Role
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            ),
            cell: ({ row }) => {
                const role = row.getValue<string>("role")
                return (
                    <Badge
                        variant={role === "admin" ? "destructive" : "secondary"}
                        className="capitalize"
                    >
                        {role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                        {role}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "banned",
            header: "Status",
            cell: ({ row }) =>
                row.getValue("banned") ? (
                    <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" /> Banned
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Active
                    </Badge>
                ),
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Joined
                    <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            ),
            cell: ({ row }) =>
                new Date(row.getValue<string>("createdAt")).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    disabled={actions.isPending}
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => actions.onImpersonate(user)}
                                    className="gap-2 cursor-pointer"
                                >
                                    <UserCheck className="h-4 w-4" />
                                    Impersonate
                                </DropdownMenuItem>

                                {user.role !== "admin" ? (
                                    <DropdownMenuItem
                                        onClick={() => actions.onPromote(user)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Shield className="h-4 w-4" />
                                        Promote to Admin
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => actions.onDemote(user)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Shield className="h-4 w-4" />
                                        Demote to User
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() =>
                                        user.banned
                                            ? actions.onUnban(user)
                                            : actions.onBan(user)
                                    }
                                    className={`gap-2 cursor-pointer ${!user.banned
                                        ? "text-destructive focus:text-destructive"
                                        : ""
                                        }`}
                                >
                                    <Ban className="h-4 w-4" />
                                    {user.banned ? "Unban User" : "Ban User"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]
}