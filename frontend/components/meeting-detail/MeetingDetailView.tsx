"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { useToast } from "@/components/providers/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState, Spinner } from "@/components/ui/States";
import { useApi } from "@/hooks/useApi";
import { usePlayback } from "@/hooks/usePlayback";
import { api, errorMessage } from "@/lib/api";
import type { Chapter, MeetingDetail, TranscriptSegment } from "@/lib/types";
import { EditTranscriptModal } from "./EditTranscriptModal";
import { MediaPlayer } from "./MediaPlayer";
import { MeetingHeader } from "./MeetingHeader";
import { NotesPanel } from "./NotesPanel";
import { TranscriptPanel } from "./TranscriptPanel";

/** Index of the last item whose start time is <= time (items sorted by start). */
function lastStartedIndex(items: { start_seconds: number }[], time: number): number {
  let low = 0;
  let high = items.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (items[mid].start_seconds <= time) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

export function MeetingDetailView({ meetingId }: { meetingId: number }) {
  const { data: meeting, error, reload, mutate } = useApi(() => api.getMeeting(meetingId), `meeting-${meetingId}`);

  if (error && !meeting) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={error} onRetry={reload} />
        <p className="mt-4 text-center text-sm">
          <Link href="/meetings" className="text-primary-text hover:underline">
            Back to all meetings
          </Link>
        </p>
      </div>
    );
  }
  if (!meeting) return <Spinner label="Loading meeting..." />;

  return <MeetingWorkspace meeting={meeting} mutate={mutate} />;
}

function MeetingWorkspace({
  meeting,
  mutate,
}: {
  meeting: MeetingDetail;
  mutate: (updater: (meeting: MeetingDetail) => MeetingDetail) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const duration = Math.max(meeting.duration_seconds, meeting.segments.at(-1)?.end_seconds ?? 0);
  // Deep link from global search: /meetings/1?t=94 starts at that moment.
  const startAt = Number(searchParams.get("t"));
  const playback = usePlayback(duration, Number.isFinite(startAt) ? startAt : 0);
  const [follow, setFollow] = useState(true);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeIndex = lastStartedIndex(meeting.segments, playback.currentTime);
  const activeSegment: TranscriptSegment | undefined = meeting.segments[activeIndex];
  const activeChapter: Chapter | undefined = meeting.chapters[lastStartedIndex(meeting.chapters, playback.currentTime)];

  const replace = useCallback((updated: MeetingDetail) => mutate(() => updated), [mutate]);
  const patchSegment = useCallback(
    (segmentId: number, update: (segment: TranscriptSegment) => TranscriptSegment) =>
      mutate((m) => ({ ...m, segments: m.segments.map((s) => (s.id === segmentId ? update(s) : s)) })),
    [mutate],
  );

  const { seek } = playback;
  const seekAndFollow = useCallback(
    (seconds: number) => {
      seek(seconds, true);
      setFollow(true);
    },
    [seek],
  );

  const toggleHighlight = useCallback(
    async (segment: TranscriptSegment) => {
      try {
        const updated = await api.setHighlight(segment.id, !segment.is_highlighted);
        patchSegment(segment.id, (s) => ({ ...s, is_highlighted: updated.is_highlighted }));
        toast.success(updated.is_highlighted ? "Moment highlighted" : "Highlight removed");
      } catch (err) {
        toast.error(errorMessage(err, "Could not update the highlight"));
      }
    },
    [patchSegment, toast],
  );

  const addComment = useCallback(
    async (segment: TranscriptSegment, body: string) => {
      try {
        const comment = await api.addComment(segment.id, body);
        patchSegment(segment.id, (s) => ({ ...s, comments: [...s.comments, comment] }));
        toast.success("Comment added");
        return true;
      } catch (err) {
        toast.error(errorMessage(err, "Could not add the comment"));
        return false;
      }
    },
    [patchSegment, toast],
  );

  const deleteComment = useCallback(
    async (segment: TranscriptSegment, commentId: number) => {
      try {
        await api.deleteComment(commentId);
        patchSegment(segment.id, (s) => ({ ...s, comments: s.comments.filter((c) => c.id !== commentId) }));
        toast.success("Comment deleted");
      } catch (err) {
        toast.error(errorMessage(err, "Could not delete the comment"));
      }
    },
    [patchSegment, toast],
  );

  async function deleteMeeting() {
    try {
      await api.deleteMeeting(meeting.id);
      toast.success(`"${meeting.title}" deleted`);
      router.push("/meetings");
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete the meeting"));
    }
  }

  const segments = useMemo(() => meeting.segments, [meeting.segments]);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-3.5rem)]">
      <MeetingHeader meeting={meeting} onEdit={() => setEditingDetails(true)} onDelete={() => setConfirmDelete(true)} />

      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <aside className="border-b border-border bg-surface lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <NotesPanel
            meeting={meeting}
            activeChapterId={activeChapter?.id ?? null}
            onSeek={seekAndFollow}
            onReplace={replace}
            onPatch={mutate}
          />
        </aside>
        <section className="bg-surface lg:overflow-y-auto" aria-label="Transcript">
          <TranscriptPanel
            segments={segments}
            activeSegmentId={activeSegment?.id ?? null}
            follow={follow}
            onFollowChange={setFollow}
            onSeek={seekAndFollow}
            onToggleHighlight={toggleHighlight}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onEditTranscript={() => setEditingTranscript(true)}
          />
        </section>
      </div>

      <MediaPlayer
        playback={playback}
        duration={duration}
        segments={segments}
        activeSpeaker={playback.playing ? (activeSegment?.speaker.name ?? null) : null}
      />

      {editingDetails && (
        <EditMeetingModal meeting={meeting} onClose={() => setEditingDetails(false)} onSaved={replace} />
      )}
      {editingTranscript && (
        <EditTranscriptModal
          meeting={meeting}
          open
          onClose={() => setEditingTranscript(false)}
          onSaved={(updated) => {
            replace(updated);
            playback.seek(0);
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete meeting?"
        message={`"${meeting.title}" and its transcript, notes and action items will be permanently deleted.`}
        confirmLabel="Delete meeting"
        destructive
        onConfirm={deleteMeeting}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
