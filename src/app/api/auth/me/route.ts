import { getCurrentUser } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  return json({ user });
}
