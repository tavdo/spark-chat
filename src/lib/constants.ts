export const APP_NAME = "Spark";
export const COOKIE_NAME = "spark_session";
export const MESSAGE_RETENTION_HOURS = Number(
  process.env.MESSAGE_RETENTION_HOURS || 48
);

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_VOICE_BYTES = 5 * 1024 * 1024;
export const MAX_VOICE_SECONDS = 60;
export const REPORT_CONTEXT_LIMIT = 40;

export const INTEREST_OPTIONS = [
  "Music",
  "Movies",
  "Gaming",
  "Travel",
  "Fitness",
  "Art",
  "Tech",
  "Food",
  "Books",
  "Sports",
  "Photography",
  "Fashion",
];

export const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "FAKE_PROFILE", label: "Fake profile" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "OTHER", label: "Other" },
] as const;

export const PHOTO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const VOICE_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);
