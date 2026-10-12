import { formatDateTime, formatDuration, formatTimestamp, slugify } from "./format";
import type { MeetingDetail } from "./types";

export type ExportFormat = "md" | "txt";

export function meetingToMarkdown(meeting: MeetingDetail): string {
  const lines = [
    `# ${meeting.title}`,
    "",
    `- **Date:** ${formatDateTime(meeting.started_at)}`,
    `- **Duration:** ${formatDuration(meeting.duration_seconds)}`,
    `- **Participants:** ${meeting.participants.map((p) => p.name).join(", ") || "-"}`,
    meeting.topics.length ? `- **Keywords:** ${meeting.topics.map((t) => t.name).join(", ")}` : "",
    "",
    "## Summary",
    "",
    meeting.summary || "_No summary yet._",
    "",
  ];

  if (meeting.chapters.length) {
    lines.push("## Outline", "");
    meeting.chapters.forEach((c) => {
      lines.push(`- **[${formatTimestamp(c.start_seconds)}] ${c.title}**${c.summary ? ` - ${c.summary}` : ""}`);
    });
    lines.push("");
  }

  lines.push("## Action items", "");
  if (meeting.action_items.length) {
    meeting.action_items.forEach((item) => {
      const owner = item.assignee ? ` (${item.assignee.name})` : "";
      lines.push(`- [${item.completed ? "x" : " "}] ${item.title}${owner}`);
    });
  } else {
    lines.push("_No action items._");
  }
  lines.push("", "## Transcript", "");
  meeting.segments.forEach((s) => {
    lines.push(`**${s.speaker.name}** [${formatTimestamp(s.start_seconds)}]: ${s.text}`, "");
  });
  return lines.filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n");
}

export function meetingToText(meeting: MeetingDetail): string {
  const lines = [
    meeting.title,
    "=".repeat(meeting.title.length),
    `Date: ${formatDateTime(meeting.started_at)}`,
    `Duration: ${formatDuration(meeting.duration_seconds)}`,
    `Participants: ${meeting.participants.map((p) => p.name).join(", ") || "-"}`,
    "",
    "SUMMARY",
    meeting.summary || "No summary yet.",
    "",
  ];
  if (meeting.chapters.length) {
    lines.push("OUTLINE");
    meeting.chapters.forEach((c) => lines.push(`[${formatTimestamp(c.start_seconds)}] ${c.title}`));
    lines.push("");
  }
  lines.push("ACTION ITEMS");
  meeting.action_items.forEach((item) =>
    lines.push(`${item.completed ? "[x]" : "[ ]"} ${item.title}${item.assignee ? ` (${item.assignee.name})` : ""}`),
  );
  lines.push("", "TRANSCRIPT");
  meeting.segments.forEach((s) => lines.push(`[${formatTimestamp(s.start_seconds)}] ${s.speaker.name}: ${s.text}`));
  return lines.join("\n");
}

export function downloadMeeting(meeting: MeetingDetail, format: ExportFormat) {
  const content = format === "md" ? meetingToMarkdown(meeting) : meetingToText(meeting);
  const type = format === "md" ? "text/markdown" : "text/plain";
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(meeting.title)}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the download has started in every browser.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
