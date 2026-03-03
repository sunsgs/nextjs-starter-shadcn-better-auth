"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth-client";
import { ImageIcon, LogOutIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export function Nav({ role }: { role?: string }) {
  const router = useRouter();
  console.log("nav role", role);
  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/admin/login");
        },
      },
    });
  };
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/headcode/media">
              <span className="hidden sm:inline">Media</span>
              <span className="inline sm:hidden">
                <ImageIcon className="size-4" />
              </span>
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {role === "admin" && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/admin/users">
                <span className="hidden sm:inline">Users</span>
                <span className="inline sm:hidden">
                  <UsersIcon className="size-4" />
                </span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        <NavigationMenuItem>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => signOut()}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
