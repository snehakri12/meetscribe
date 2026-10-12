// Authentication is out of scope: the app runs as this default user.
// Must match CURRENT_USER_NAME in backend/services/meetings.py.
export const CURRENT_USER = {
  name: "Sneha",
  email: "sneha@meetscribe.demo",
  workspace: "MeetScribe Demo",
};

export const APP_NAME = "MeetScribe";

const SPEAKER_COLORS = [
  "#6d4aff", // violet
  "#0ea5e9", // sky
  "#f97316", // orange
  "#10b981", // emerald
  "#ec4899", // pink
  "#eab308", // amber
  "#14b8a6", // teal
  "#8b5cf6", // purple
  "#ef4444", // red
];

/** Stable colour per person, so a speaker looks the same on every page. */
export function colorForName(name: string): string {
  let hash = 0;
  for (const char of name.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SPEAKER_COLORS[hash % SPEAKER_COLORS.length];
}
