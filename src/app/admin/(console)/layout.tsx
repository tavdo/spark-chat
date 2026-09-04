import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-full flex-col bg-bg md:flex-row">
      <AdminNav />
      <div className="min-h-full flex-1 p-5 md:p-8">{children}</div>
    </div>
  );
}
