// Shapes returned by the FastAPI backend (see backend/schemas.py).

export type Participant = {
  id: number;
  name: string;
  email: string | null;
};

export type Topic = {
  id: number;
  name: string;
};

export type ActionItem = {
  id: number;
  meeting_id: number;
  title: string;
  completed: boolean;
  assignee: Participant | null;
  source_start_seconds: number | null;
  created_at: string;
  completed_at: string | null;
};

export type ActionItemWithMeeting = ActionItem & { meeting_title: string };

export type SegmentComment = {
  id: number;
  segment_id: number;
  author: string;
  body: string;
  created_at: string;
};

export type TranscriptSegment = {
  id: number;
  position: number;
  start_seconds: number;
  end_seconds: number;
  speaker: Participant;
  text: string;
  is_highlighted: boolean;
  comments: SegmentComment[];
};

export type Chapter = {
  id: number;
  position: number;
  title: string;
  start_seconds: number;
  summary: string;
};

export type MeetingSource = "seed" | "upload" | "paste" | "form";

export type MeetingListItem = {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  source: MeetingSource;
  summary: string;
  participants: Participant[];
  topics: Topic[];
  action_items_total: number;
  action_items_open: number;
};

export type MeetingDetail = {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  source: MeetingSource;
  summary: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  topics: Topic[];
  chapters: Chapter[];
  segments: TranscriptSegment[];
  action_items: ActionItem[];
};

export type TranscriptFormat = "auto" | "txt" | "vtt" | "json";

export type MeetingCreateInput = {
  title: string;
  started_at?: string;
  participants: string[];
  summary?: string;
  topics?: string[];
  transcript_text: string;
  transcript_format: TranscriptFormat;
  source: "upload" | "paste" | "form";
  generate_notes: boolean;
};

export type MeetingUpdateInput = Partial<{
  title: string;
  started_at: string;
  participants: string[];
  topics: string[];
  summary: string;
}>;

export type MeetingFilters = {
  q?: string;
  participant?: string;
  topic?: string;
  date_from?: string;
  date_to?: string;
  mine?: boolean;
  sort?: "newest" | "oldest";
};

export type SearchHit = {
  meeting_id: number;
  meeting_title: string;
  started_at: string;
  segment_id: number;
  start_seconds: number;
  speaker: string;
  text: string;
};

export type SearchResponse = {
  query: string;
  total: number;
  hits: SearchHit[];
};

export type WorkspaceStats = {
  meetings: number;
  total_duration_seconds: number;
  action_items_open: number;
  action_items_completed: number;
  participants: number;
};
