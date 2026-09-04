import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canChat } from "@/lib/utils";
import { ChatApp } from "@/components/ChatApp";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "BANNED") redirect("/banned");
  if (!canChat(user)) redirect("/pending");

  return (
    <ChatApp
      me={{
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      }}
    />
  );
}
