import { prisma } from "@/lib/prisma";
import { json, withAdmin } from "@/lib/api";

export async function GET() {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const [
    pendingVerifications,
    openReports,
    bannedUsers,
    suspendedUsers,
    totalUsers,
    rejectedVerifications,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "USER", verificationStatus: "PENDING" },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { role: "USER", status: "BANNED" } }),
    prisma.user.count({ where: { role: "USER", status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({
      where: { role: "USER", verificationStatus: "REJECTED" },
    }),
  ]);

  return json({
    pendingVerifications,
    openReports,
    bannedUsers,
    suspendedUsers,
    totalUsers,
    rejectedVerifications,
  });
}
