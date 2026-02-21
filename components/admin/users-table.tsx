"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { getErrorMessage } from "@/lib/utils/user"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserWithRole } from "better-auth/plugins"
import { AlertTriangle, RefreshCw, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DataTable } from "./tables/data-table"
import { getUserColumns } from "./tables/user-columns"
import { UserDialog } from "./user-dialog"

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "user" | "admin"

type ConfirmAction = "impersonate" | "ban" | "unban" | "promote" | "demote"

type ConfirmState = {
    open: boolean
    user: UserWithRole | null
    action: ConfirmAction | null
}

const confirmCopy: Record<
    ConfirmAction,
    { title: string; description: (name: string) => string; label: string; destructive?: boolean }
> = {
    impersonate: {
        title: "Impersonate User",
        description: (name) =>
            `You will temporarily act as ${name}. Your session switches to theirs until you stop.`,
        label: "Impersonate",
    },
    ban: {
        title: "Ban User",
        description: (name) =>
            `${name} will be immediately signed out and blocked from logging in.`,
        label: "Ban",
        destructive: true,
    },
    unban: {
        title: "Unban User",
        description: (name) => `${name} will regain access to their account.`,
        label: "Unban",
    },
    promote: {
        title: "Promote to Admin",
        description: (name) => `${name} will have full admin privileges.`,
        label: "Promote",
    },
    demote: {
        title: "Demote to User",
        description: (name) => `${name} will lose admin access.`,
        label: "Demote",
        destructive: true,
    },
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const userQueryKeys = {
    all: ["users"] as const,
    list: () => [...userQueryKeys.all, "list"] as const,
}

export function UsersTable() {
    const queryClient = useQueryClient()
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        open: false,
        user: null,
        action: null,
    })

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: userQueryKeys.list(),
        queryFn: async () => {
            const { data, error } = await authClient.admin.listUsers({
                query: { limit: 1000, offset: 0 },
            })
            if (error) throw new Error(error.message ?? "Failed to fetch users")
            return (data?.users ?? []) as UserWithRole[]
        },
        staleTime: 30_000,
    })

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })

    const impersonateMutation = useMutation({
        mutationFn: async (user: UserWithRole) => {
            const { error } = await authClient.admin.impersonateUser({ userId: user.id })
            if (error) throw new Error(error.message ?? "Impersonation failed")
            return user
        },
        onSuccess: (user) =>
            toast.success(`Now impersonating ${user.name}`, {
                description: "You are acting as this user.",
                action: { label: "Stop", onClick: () => stopImpersonateMutation.mutate() },
            }),
        onError: (err: unknown) =>
            toast.error("Impersonation failed", { description: getErrorMessage(err) }),
        onSettled: closeConfirm,
    })

    const stopImpersonateMutation = useMutation({
        mutationFn: () => authClient.admin.stopImpersonating(),
        onSuccess: () => toast.success("Stopped impersonating"),
        onError: (err: unknown) =>
            toast.error("Failed to stop", { description: getErrorMessage(err) }),
    })

    const banMutation = useMutation({
        mutationFn: async (user: UserWithRole) => {
            if (user.banned) {
                const { error } = await authClient.admin.unbanUser({ userId: user.id })
                if (error) throw new Error(error.message)
            } else {
                const { error } = await authClient.admin.banUser({ userId: user.id })
                if (error) throw new Error(error.message)
            }
            return user
        },
        onSuccess: (user) => {
            toast.success(`${user.name} has been ${user.banned ? "unbanned" : "banned"}`)
            invalidate()
        },
        onError: (err: unknown) =>
            toast.error("Action failed", { description: getErrorMessage(err) }),
        onSettled: closeConfirm,
    })

    const roleMutation = useMutation({
        mutationFn: async ({ user, role }: { user: UserWithRole; role: UserRole }) => {
            const { error } = await authClient.admin.setRole({ userId: user.id, role })
            if (error) throw new Error(error.message)
            return { user, role }
        },
        onSuccess: ({ user, role }) => {
            toast.success(`${user.name} is now ${role}`)
            invalidate()
        },
        onError: (err: unknown) =>
            toast.error("Failed to update role", { description: getErrorMessage(err) }),
        onSettled: closeConfirm,
    })

    const isPending =
        impersonateMutation.isPending ||
        banMutation.isPending ||
        roleMutation.isPending

    function openConfirm(user: UserWithRole, action: ConfirmAction) {
        setConfirmState({ open: true, user, action })
    }

    function closeConfirm() {
        setConfirmState({ open: false, user: null, action: null })
    }

    function handleConfirm() {
        const { user, action } = confirmState
        if (!user || !action) return
        switch (action) {
            case "impersonate": impersonateMutation.mutate(user); break
            case "ban":
            case "unban": banMutation.mutate(user); break
            case "promote": roleMutation.mutate({ user, role: "admin" }); break
            case "demote": roleMutation.mutate({ user, role: "user" }); break
        }
    }

    // Columns memoised — only rebuilds when isPending changes (controls disabled state)
    // const columns = useMemo(
    //     () =>
    //         getUserColumns({
    //             onImpersonate: (u) => openConfirm(u, "impersonate"),
    //             onPromote: (u) => openConfirm(u, "promote"),
    //             onDemote: (u) => openConfirm(u, "demote"),
    //             onBan: (u) => openConfirm(u, "ban"),
    //             onUnban: (u) => openConfirm(u, "unban"),
    //             isPending,
    //         }),
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    //     [isPending]
    // )
    const columns = getUserColumns({
        onImpersonate: (u) => openConfirm(u, "impersonate"),
        onPromote: (u) => openConfirm(u, "promote"),
        onDemote: (u) => openConfirm(u, "demote"),
        onBan: (u) => openConfirm(u, "ban"),
        onUnban: (u) => openConfirm(u, "unban"),
        isPending,
    })
    const activeCopy = confirmState.action ? confirmCopy[confirmState.action] : null

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
                        <p className="text-sm text-muted-foreground">
                            {data?.length ?? 0} total
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <UserDialog mode="create" />
                </div>
            </div>

            {/* shadcn DataTable — search on "name" column with custom filterFn covering email too */}
            <DataTable
                columns={columns}
                data={data ?? []}
                isLoading={isLoading}
                searchColumn="name"
                searchPlaceholder="Search by name or email…"
            />

            {/* Confirm Dialog */}
            <Dialog open={confirmState.open} onOpenChange={(open) => !open && closeConfirm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {activeCopy?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {activeCopy && confirmState.user
                                ? activeCopy.description(confirmState.user.name)
                                : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeConfirm} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button
                            variant={activeCopy?.destructive ? "destructive" : "default"}
                            onClick={handleConfirm}
                            disabled={isPending}
                        >
                            {isPending && <Spinner />}
                            {activeCopy?.label}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}