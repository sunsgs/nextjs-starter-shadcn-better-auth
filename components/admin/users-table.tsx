"use client";

import { UserDialog } from "@/components/admin/user-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { updateUser } from "@/lib/actions/admin/user-actions";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserWithRole } from "better-auth/plugins";
import { AlertTriangle, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "./tables/data-table";
import { getUserColumns } from "./tables/user-columns";

// ── Types ──────────────────────────────────────────────────────────────────

type AdminRole = "admin" | "superadmin";

type ConfirmAction =
  | "impersonate"
  | "ban"
  | "unban"
  | "promoteAdmin"
  | "promoteSuperadmin"
  | "demote"
  | "delete";

type ConfirmState = {
  open: boolean;
  user: UserWithRole | null;
  action: ConfirmAction | null;
};

const confirmCopy: Record<
  ConfirmAction,
  {
    title: string;
    description: (name: string) => string;
    label: string;
    destructive?: boolean;
  }
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
  promoteAdmin: {
    title: "Promote to Admin",
    description: (name) => `${name} will have full admin privileges.`,
    label: "Promote to Admin",
  },
  promoteSuperadmin: {
    title: "Promote to Superadmin",
    description: (name) => `${name} will have unrestricted superadmin access.`,
    label: "Promote to Superadmin",
  },
  demote: {
    title: "Demote to User",
    description: (name) => `${name} will lose all admin access.`,
    label: "Demote",
    destructive: true,
  },
  delete: {
    title: "Delete User",
    description: (name) =>
      `This will permanently delete ${name} and all their data. This cannot be undone.`,
    label: "Delete",
    destructive: true,
  },
};

// ── Query keys ─────────────────────────────────────────────────────────────

export const userQueryKeys = {
  all: ["users"] as const,
  list: () => [...userQueryKeys.all, "list"] as const,
};

// ── Component ──────────────────────────────────────────────────────────────

export function UsersTable() {
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data: currentSession, refetch: refetchSession } =
    authClient.useSession();
  const currentUserRole = (currentSession?.user.role ?? "user") as string;

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    user: null,
    action: null,
  });
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 1000, offset: 0 },
      });
      if (error) throw new Error(error.message ?? "Failed to fetch users");
      return (data?.users ?? []) as UserWithRole[];
    },
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: userQueryKeys.list() });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const impersonateMutation = useMutation({
    mutationFn: async (user: UserWithRole) => {
      if (user.role === "superadmin" && currentUserRole !== "superadmin") {
        throw new Error("Only a superadmin can impersonate another superadmin");
      }
      const { error } = await authClient.admin.impersonateUser({
        userId: user.id,
      });
      if (error) throw new Error(error.message ?? "Impersonation failed");
      return user;
    },
    onSuccess: async (user) => {
      await refetchSession(); // ← banner appears immediately
      router.refresh(); // ← refresh server components
      toast.success(`Now impersonating ${user.name}`, {
        description:
          "A banner will appear at the top — click Stop to end the session.",
      });
    },
    onError: (err: unknown) =>
      toast.error("Impersonation failed", {
        description: getErrorMessage(err),
      }),
    onSettled: closeConfirm,
  });

  const stopImpersonateMutation = useMutation({
    mutationFn: () => authClient.admin.stopImpersonating(),
    onSuccess: () => toast.success("Stopped impersonating"),
    onError: (err: unknown) =>
      toast.error("Failed to stop", { description: getErrorMessage(err) }),
  });

  const banMutation = useMutation({
    mutationFn: async (user: UserWithRole) => {
      if (user.banned) {
        const { error } = await authClient.admin.unbanUser({ userId: user.id });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.admin.banUser({ userId: user.id });
        if (error) throw new Error(error.message);
      }
      return user;
    },
    onSuccess: (user) => {
      toast.success(
        `${user.name} has been ${user.banned ? "unbanned" : "banned"}`,
      );
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error("Action failed", { description: getErrorMessage(err) }),
    onSettled: closeConfirm,
  });

  // setRole — promotes to admin-level role
  const promoteMutation = useMutation({
    mutationFn: async ({
      user,
      role,
    }: {
      user: UserWithRole;
      role: AdminRole;
    }) => {
      const { error } = await authClient.admin.setRole({
        userId: user.id,
        role,
      });
      if (error) throw new Error(error.message);
      return { user, role };
    },
    onSuccess: ({ user, role }) => {
      toast.success(`${user.name} is now ${role}`);
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error("Failed to promote", { description: getErrorMessage(err) }),
    onSettled: closeConfirm,
  });

  // setRole with "user" — demotes back to base role
  // "as unknown as AdminRole" is a TS workaround: API accepts "user" at runtime
  // but the type is constrained to adminRoles when custom roles are defined
  const demoteMutation = useMutation({
    mutationFn: async (user: UserWithRole) => {
      const { error } = await authClient.admin.setRole({
        userId: user.id,
        role: "user" as unknown as AdminRole,
      });
      if (error) throw new Error(error.message);
      return user;
    },
    onSuccess: (user) => {
      toast.success(`${user.name} has been demoted to user`);
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error("Failed to demote", { description: getErrorMessage(err) }),
    onSettled: closeConfirm,
  });

  // removeUser — Better Auth cascades session + account cleanup automatically
  const deleteMutation = useMutation({
    mutationFn: async (user: UserWithRole) => {
      const { error } = await authClient.admin.removeUser({ userId: user.id });
      if (error) throw new Error(error.message);
      return user;
    },
    onSuccess: (user) => {
      toast.success(`${user.name} has been deleted`);
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error("Delete failed", { description: getErrorMessage(err) }),
    onSettled: closeConfirm,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      user,
      data,
    }: {
      user: UserWithRole;
      data: {
        name: string;
        email: string;
        role: "user" | "admin" | "superadmin";
        password?: string;
      };
    }) => {
      await updateUser(user.id, data);
      return user;
    },
    onSuccess: (user) => {
      toast.success(`${user.name} has been updated`);
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error("Update failed", { description: getErrorMessage(err) }),
    onSettled: () => setEditingUser(null),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isPending =
    impersonateMutation.isPending ||
    banMutation.isPending ||
    promoteMutation.isPending ||
    demoteMutation.isPending ||
    deleteMutation.isPending;

  function openConfirm(user: UserWithRole, action: ConfirmAction) {
    setConfirmState({ open: true, user, action });
  }

  function closeConfirm() {
    setConfirmState({ open: false, user: null, action: null });
  }

  function handleConfirm() {
    const { user, action } = confirmState;
    if (!user || !action) return;

    switch (action) {
      case "impersonate":
        impersonateMutation.mutate(user);
        break;
      case "ban":
      case "unban":
        banMutation.mutate(user);
        break;
      case "promoteAdmin":
        promoteMutation.mutate({ user, role: "admin" });
        break;
      case "promoteSuperadmin":
        promoteMutation.mutate({ user, role: "superadmin" });
        break;
      case "demote":
        demoteMutation.mutate(user);
        break;
      case "delete":
        deleteMutation.mutate(user);
        break;
    }
  }

  const columns = getUserColumns({
    onImpersonate: (u) => openConfirm(u, "impersonate"),
    onPromoteAdmin: (u) => openConfirm(u, "promoteAdmin"),
    onPromoteSuperadmin: (u) => openConfirm(u, "promoteSuperadmin"),
    onDemote: (u) => openConfirm(u, "demote"),
    onBan: (u) => openConfirm(u, "ban"),
    onUnban: (u) => openConfirm(u, "unban"),
    onEdit: (u) => setEditingUser(u),
    onDelete: (u) => openConfirm(u, "delete"),
    currentUserRole,
    isPending,
  });

  const activeCopy = confirmState.action
    ? confirmCopy[confirmState.action]
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

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
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <UserDialog mode="create" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search by name or email…"
      />

      {/* Edit Dialog */}
      <UserDialog
        mode="edit"
        user={editingUser ?? undefined}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={(data) => {
          if (!editingUser) return;
          updateMutation.mutate({ user: editingUser, data });
        }}
        isPending={updateMutation.isPending}
      />

      {/* Confirm Dialog */}
      <Dialog
        open={confirmState.open}
        onOpenChange={(open) => !open && closeConfirm()}
      >
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
            <Button
              variant="outline"
              onClick={closeConfirm}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={activeCopy?.destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Spinner className="mr-2 h-4 w-4" />}
              {activeCopy?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
