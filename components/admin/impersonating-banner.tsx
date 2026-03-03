"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const { data: session, refetch } = authClient.useSession(); // ← destructure refetch
  const router = useRouter();

  const isImpersonating = !!(
    session?.session as { impersonatedBy?: string } | undefined
  )?.impersonatedBy;

  const stopMutation = useMutation({
    mutationFn: () => authClient.admin.stopImpersonating(),
    onSuccess: async () => {
      await refetch();
      toast.success("Stopped impersonating");
      window.location.href = "/admin/users";
    },
    onError: () => toast.error("Failed to stop impersonating"),
  });

  if (!isImpersonating) return null;

  return (
    <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          You are impersonating <strong>{session?.user.name}</strong> (
          {session?.user.email})
        </span>
      </div>
      <Button
        size="lg"
        variant="outline"
        className="border-amber-800 text-amber-950 hover:bg-amber-600 h-7"
        onClick={() => stopMutation.mutate()}
        disabled={stopMutation.isPending}
      >
        Stop Impersonating
      </Button>
    </div>
  );
}
