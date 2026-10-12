import axios, { isAxiosError } from "axios";

import type {
  ActionItem,
  ActionItemWithMeeting,
  MeetingCreateInput,
  MeetingDetail,
  MeetingFilters,
  MeetingListItem,
  MeetingUpdateInput,
  Participant,
  SearchResponse,
  SegmentComment,
  Topic,
  TranscriptFormat,
  TranscriptSegment,
  WorkspaceStats,
} from "./types";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

/** Turn any API/network error into a short, user-facing message. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      return String(detail[0].msg).replace(/^Value error, /, "");
    }
    if (!error.response) return "Cannot reach the server. Is the backend running?";
  }
  return fallback;
}

function cleanParams(filters: MeetingFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "" && value !== false),
  );
}

export const api = {
  // Meetings
  listMeetings: (filters: MeetingFilters = {}) =>
    http.get<MeetingListItem[]>("/meetings", { params: cleanParams(filters) }).then((r) => r.data),
  getMeeting: (id: number) => http.get<MeetingDetail>(`/meetings/${id}`).then((r) => r.data),
  createMeeting: (input: MeetingCreateInput) =>
    http.post<MeetingDetail>("/meetings", input).then((r) => r.data),
  updateMeeting: (id: number, input: MeetingUpdateInput) =>
    http.patch<MeetingDetail>(`/meetings/${id}`, input).then((r) => r.data),
  deleteMeeting: (id: number) => http.delete(`/meetings/${id}`).then(() => undefined),
  replaceTranscript: (id: number, transcriptText: string, format: TranscriptFormat, regenerateNotes: boolean) =>
    http
      .put<MeetingDetail>(`/meetings/${id}/transcript`, {
        transcript_text: transcriptText,
        transcript_format: format,
        regenerate_notes: regenerateNotes,
      })
      .then((r) => r.data),
  generateNotes: (id: number) => http.post<MeetingDetail>(`/meetings/${id}/generate-notes`).then((r) => r.data),

  // Action items
  listActionItems: (status: "all" | "open" | "completed" = "all") =>
    http.get<ActionItemWithMeeting[]>("/action-items", { params: { status } }).then((r) => r.data),
  createActionItem: (meetingId: number, title: string, assigneeName?: string) =>
    http
      .post<ActionItem>(`/meetings/${meetingId}/action-items`, {
        title,
        assignee_name: assigneeName || null,
      })
      .then((r) => r.data),
  updateActionItem: (id: number, input: Partial<{ title: string; completed: boolean; assignee_name: string }>) =>
    http.patch<ActionItem>(`/action-items/${id}`, input).then((r) => r.data),
  deleteActionItem: (id: number) => http.delete(`/action-items/${id}`).then(() => undefined),

  // Transcript annotations
  setHighlight: (segmentId: number, isHighlighted: boolean) =>
    http.patch<TranscriptSegment>(`/segments/${segmentId}`, { is_highlighted: isHighlighted }).then((r) => r.data),
  addComment: (segmentId: number, body: string) =>
    http.post<SegmentComment>(`/segments/${segmentId}/comments`, { body }).then((r) => r.data),
  deleteComment: (commentId: number) => http.delete(`/comments/${commentId}`).then(() => undefined),

  // Workspace
  listParticipants: () => http.get<Participant[]>("/participants").then((r) => r.data),
  listTopics: () => http.get<Topic[]>("/topics").then((r) => r.data),
  stats: () => http.get<WorkspaceStats>("/stats").then((r) => r.data),
  search: (q: string) => http.get<SearchResponse>("/search", { params: { q } }).then((r) => r.data),
};
