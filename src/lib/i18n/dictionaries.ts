import kaJson from "./ka.json";

export const LOCALES = ["en", "ka"] as const;
export type Locale = (typeof LOCALES)[number];

export const LANG_COOKIE = "spark_lang";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ka";
}

const en = {
  "lang.en": "EN",
  "lang.ka": "ქარ",
  "lang.label": "Language",

  "common.signIn": "Sign in",
  "common.signOut": "Sign out",
  "common.joinNow": "Join now",
  "common.chat": "Chat",
  "common.profile": "Profile",
  "common.back": "BACK",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.save": "Save changes",
  "common.saving": "Saving...",
  "common.search": "Search",
  "common.continue": "CONTINUE",
  "common.email": "Email",
  "common.password": "Password",
  "common.age": "Age",
  "common.nickname": "Nickname",
  "common.bio": "Bio",
  "common.interests": "Interests",
  "common.remember": "Remember",
  "common.adminOnly": "Admin only",
  "common.networkError": "Network error. Try again.",

  "gender.female": "Female",
  "gender.male": "Male",
  "gender.other": "Other",

  "home.badge": "Verified random chat",
  "home.title": "Meet a stranger.",
  "home.titleAccent": "Skip anytime.",
  "home.subtitle":
    "Send a live selfie, then jump into one-on-one text, photos, voice, and GIFs. No waiting on admin approval.",
  "home.startChatting": "Start chatting",
  "home.haveAccount": "I already have an account",
  "home.moderator": "Moderator?",
  "home.adminPanel": "Open the admin panel",
  "home.feat1Title": "Instant chat",
  "home.feat1Body": "Send a selfie and talk to a stranger right away. Skip whenever you want.",
  "home.feat2Title": "Live matching",
  "home.feat2Body": "One-on-one text, photos, voice notes, and GIFs — no feed.",
  "home.feat3Title": "Selfie first",
  "home.feat3Body":
    "No waiting on admin. If a photo is rejected later, that account is blocked from chat.",
  "home.mediaText": "Text",
  "home.mediaPhoto": "Photo",
  "home.mediaVoice": "Voice",
  "home.mediaGifs": "GIFs",

  "auth.createAccount": "Create Account",
  "auth.userLogin": "User Login",
  "auth.welcome": "Welcome to Spark",
  "auth.loginSubtitle": "Sign in and jump into a one-on-one chat with someone new.",
  "auth.loginFormTitle": "USER LOGIN",
  "auth.loginBtn": "LOGIN",
  "auth.signingIn": "SIGNING IN...",
  "auth.registerSubtitle": "Create an account, send a selfie, and start chatting right away.",
  "auth.registerFormTitle": "CREATE ACCOUNT",
  "auth.selfieTitle": "One live selfie",
  "auth.selfieSubtitle": "Look at the camera. You can chat immediately after this.",
  "auth.selfieFormTitle": "SELFIE",
  "auth.joinChat": "JOIN CHAT",
  "auth.submitting": "SUBMITTING...",
  "auth.mustBe18": "You must be 18 or older",
  "auth.needPhoto": "Capture a live face photo to continue",
  "auth.couldNotCreate": "Could not create account",
  "auth.couldNotSignIn": "Could not sign in",
  "auth.adminWelcome": "Welcome back",
  "auth.adminSubtitle": "Moderator access for verification, reports, and user safety.",
  "auth.adminFormTitle": "MODERATOR LOGIN",

  "webcam.cameraRequired":
    "Camera access is required for verification. Allow the webcam and try again.",
  "webcam.retake": "Retake",
  "webcam.capture": "Capture face photo",
  "webcam.hint":
    "Live capture only — this photo is used for gender and identity checks, and is visible to admins.",
  "webcam.alt": "Captured face",

  "pending.title": "You were blocked from chat",
  "pending.body":
    "An admin rejected your selfie. Send a new live photo to get back in — you can chat again as soon as it is submitted.",
  "pending.resubmit": "Resubmit photo",
  "pending.sending": "Sending...",
  "pending.couldNotResubmit": "Could not resubmit",

  "banned.title": "Account banned",
  "banned.body":
    "This account can no longer use Spark. If you think this is a mistake, contact support.",

  "profile.verification": "Verification",
  "profile.pendingNote":
    "You can chat now. An admin still reviews your selfie and can block the account if it is rejected.",
  "profile.rejectedDefault": "Your photo was rejected. You are blocked from chat.",
  "profile.edit": "Edit profile",
  "profile.saved": "Saved",
  "profile.couldNotSave": "Could not save",
  "profile.photoSubmitted": "Photo submitted. You can chat again now.",
  "profile.resubmit": "Resubmit photo",

  "chat.start": "Start chat",
  "chat.skip": "Skip",
  "chat.block": "Block",
  "chat.report": "Report",
  "chat.connecting": "Connecting...",
  "chat.strangerFound": "Stranger found · {name}",
  "chat.disconnected": "Stranger disconnected",
  "chat.ready": "Ready when you are",
  "chat.idleTitle": "Talk to someone new",
  "chat.idleBody": "You'll be paired with a verified stranger. Skip is instant.",
  "chat.searchingBody": "Looking for the next available stranger.",
  "chat.endedBody": "Jump back in whenever you're ready.",
  "chat.nextStranger": "Next stranger",
  "chat.chattingWith": "Chatting with {name} · {gender}, {age}",
  "chat.typing": "Stranger is typing...",
  "chat.saySomething": "Say something",
  "chat.recording": "Recording voice...",
  "chat.gifSearch": "Search KLIPY",
  "chat.gifMissing": "Add a KLIPY_API_KEY to enable GIF search.",
  "chat.reportTitle": "Report this stranger",
  "chat.reportDetails": "Optional details",
  "chat.reportSkip": "Report & skip",

  "report.SPAM": "Spam",
  "report.INAPPROPRIATE": "Inappropriate content",
  "report.FAKE_PROFILE": "Fake profile",
  "report.HARASSMENT": "Harassment",
  "report.OTHER": "Other",

  "interest.Music": "Music",
  "interest.Movies": "Movies",
  "interest.Gaming": "Gaming",
  "interest.Travel": "Travel",
  "interest.Fitness": "Fitness",
  "interest.Art": "Art",
  "interest.Tech": "Tech",
  "interest.Food": "Food",
  "interest.Books": "Books",
  "interest.Sports": "Sports",
  "interest.Photography": "Photography",
  "interest.Fashion": "Fashion",

  "status.PENDING": "Pending",
  "status.APPROVED": "Approved",
  "status.REJECTED": "Rejected",
  "status.ACTIVE": "Active",
  "status.WARNED": "Warned",
  "status.SUSPENDED": "Suspended",
  "status.BANNED": "Banned",
  "status.OPEN": "Open",
  "status.ACTIONED": "Actioned",
  "status.DISMISSED": "Dismissed",
  "status.SPAM": "Spam",
  "status.INAPPROPRIATE": "Inappropriate",
  "status.FAKE_PROFILE": "Fake profile",
  "status.HARASSMENT": "Harassment",
  "status.OTHER": "Other",

  "time.justNow": "just now",
  "time.minutesAgo": "{n}m ago",
  "time.hoursAgo": "{n}h ago",
  "time.daysAgo": "{n}d ago",

  "admin.moderation": "Moderation",
  "admin.dashboard": "Dashboard",
  "admin.verification": "Verification",
  "admin.reports": "Reports",
  "admin.users": "Users",
  "admin.desk": "Moderation desk",
  "admin.deskBody": "Review face photos, act on reports, and manage accounts.",
  "admin.pendingPhotos": "Pending photos",
  "admin.openReports": "Open reports",
  "admin.bannedSuspended": "Banned / suspended",
  "admin.people": "People",
  "admin.verificationQueue": "Verification queue",
  "admin.openQueue": "Open queue",
  "admin.noPhotos": "No photos waiting.",
  "admin.noOpenReports": "No open reports.",
  "admin.reviewPending": "Review pending photos",
  "admin.verifBody":
    "Users can chat while pending. Rejecting a photo blocks them from chat immediately.",
  "admin.nothingQueue": "Nothing in this queue.",
  "admin.noPhoto": "No photo",
  "admin.statedGender": "Stated gender: {gender} · Age {age} · submitted {time}",
  "admin.rejectReason": "Rejection reason (required to reject)",
  "admin.approve": "Approve",
  "admin.reject": "Reject",
  "admin.couldNotUpdate": "Could not update",
  "admin.reportsBody":
    "Snapshots of recent messages are kept so you can act without storing full history.",
  "admin.noReports": "No reports in this view.",
  "admin.reported": "{reporter} reported {reported}",
  "admin.chatSnapshot": "Chat snapshot",
  "admin.warn": "Warn",
  "admin.suspend7d": "Suspend 7d",
  "admin.ban": "Ban",
  "admin.dismiss": "Dismiss",
  "admin.usersBody": "Search, check verification, warn, suspend, ban, or restore access.",
  "admin.searchPlaceholder": "Search nickname or email",
  "admin.all": "All",
  "admin.pendingVerify": "Pending verify",
  "admin.warnings": "warnings {n}",
  "admin.unban": "Unban",
  "admin.suspend": "Suspend",
  "admin.noUsers": "No users match this view.",

  "error.Too many attempts, try again shortly": "Too many attempts, try again shortly",
  "error.Invalid email or password": "Invalid email or password",
  "error.This account has been banned": "This account has been banned",
  "error.Server is not ready. Please try again in a moment.":
    "Server is not ready. Please try again in a moment.",
  "error.Invalid details": "Invalid details",
  "error.A live face photo is required for verification":
    "A live face photo is required for verification",
  "error.Verification photo is too large (max 8MB)": "Verification photo is too large (max 8MB)",
  "error.Verification photo must be JPEG, PNG, or WebP":
    "Verification photo must be JPEG, PNG, or WebP",
  "error.An account with that email already exists": "An account with that email already exists",
  "error.Could not save verification photo. Try again.":
    "Could not save verification photo. Try again.",
  "error.Sign in required": "Sign in required",
  "error.Account banned": "Account banned",
  "error.Your verification was rejected": "Your verification was rejected",
  "error.Account is suspended": "Account is suspended",
  "error.Chat access denied": "Chat access denied",
  "error.Admin only": "Admin only",
  "error.Account is already verified": "Account is already verified",
  "error.A live face photo is required": "A live face photo is required",
  "error.Photo is too large": "Photo is too large",
  "error.Invalid image type": "Invalid image type",
  "error.Invalid profile data": "Invalid profile data",
  "error.Invalid profile": "Invalid profile",
} as const;

export type MessageKey = keyof typeof en;

const ka = kaJson as Record<MessageKey, string>;

export const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, ka };

export function genderKey(gender: string): MessageKey {
  if (gender === "MALE") return "gender.male";
  if (gender === "FEMALE") return "gender.female";
  return "gender.other";
}

export function statusKey(status: string): MessageKey | null {
  const key = `status.${status}` as MessageKey;
  return key in en ? key : null;
}

export function interestKey(tag: string): MessageKey | null {
  const key = `interest.${tag}` as MessageKey;
  return key in en ? key : null;
}

export function reportKey(reason: string): MessageKey | null {
  const key = `report.${reason}` as MessageKey;
  return key in en ? key : null;
}
