"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, LogOutIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Media",
    href: "/admin/media",
    icon: ImageIcon,
    // no roles key = visible to all
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
    roles: ["admin", "superadmin"],
  },
];

export function Nav({ role }: { role: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role), // ← no roles = all pass
  );

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/admin/login"),
        onError: () => setIsSigningOut(false),
      },
    });
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <NavigationMenu>
        <NavigationMenuList>
          {visibleItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        disabled={isSigningOut}
        title="Sign out"
      >
        {isSigningOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOutIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
