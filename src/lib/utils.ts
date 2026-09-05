export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function publicUser(user: {
  id: string;
  nickname: string;
  gender: string;
  age: number;
  avatarUrl: string | null;
  verificationStatus: string;
  bio?: string | null;
  interests?: string[];
}) {
  return {
    id: user.id,
    nickname: user.nickname,
    gender: user.gender,
    age: user.age,
    avatarUrl: user.avatarUrl,
    verified: user.verificationStatus === "APPROVED",
    bio: user.bio ?? null,
    interests: Array.isArray(user.interests) ? (user.interests as string[]) : [],
  };
}

export function strangerPreview(user: {
  nickname: string;
  gender: string;
  age: number;
  avatarUrl: string | null;
}) {
  return {
    nickname: user.nickname,
    gender: user.gender,
    age: user.age,
    avatarUrl: user.avatarUrl,
  };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function formatGender(gender: string) {
  if (gender === "MALE") return "Male";
  if (gender === "FEMALE") return "Female";
  return "Other";
}

export function canChat(user: {
  verificationStatus: string;
  status: string;
  suspendUntil: Date | null;
}) {
  if (user.verificationStatus === "REJECTED") return false;
  if (user.status === "BANNED") return false;
  if (user.status === "SUSPENDED") {
    if (!user.suspendUntil) return false;
    if (user.suspendUntil > new Date()) return false;
  }
  return true;
}

export function isSuspended(user: {
  status: string;
  suspendUntil: Date | null;
}) {
  if (user.status !== "SUSPENDED") return false;
  if (!user.suspendUntil) return true;
  return user.suspendUntil > new Date();
}
