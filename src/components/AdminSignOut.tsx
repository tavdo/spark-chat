"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function AdminSignOut() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="w-full"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
      }}
    >
      Sign out
    </Button>
  );
}
