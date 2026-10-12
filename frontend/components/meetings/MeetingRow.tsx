"use client";

import Link from "next/link";

import { AvatarStack } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDuration, formatTime } from "@/lib/format";
import type { MeetingListItem } from "@/lib/types";

type MeetingRowProps = {
  meeting: MeetingListItem;
  onEdit: (meeting: MeetingListItem) => void;
  onDelete: (meeting: MeetingListItem) => void;
  onTopicClick?: (topic: string) => void;
};

const SOURCE_LABEL: Record<MeetingListItem["source"], string> = {
  seed: "Recorded",
  upload: "Uploaded",
  paste: "Pasted",
  form: "Manual",
};

export function MeetingRow({ meeting, onEdit, onDelete, onTopicClick }: MeetingRowProps) {
  return (
    <div className="group relative flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
      <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text sm:flex">
        <Icon name="meetings" size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <Link
          href={`/meetings/${meeting.id}`}
          className="block truncate text-[15px] font-semibold after:absolute after:inset-0 hover:text-primary-text"
        >
          {meeting.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>{formatTime(meeting.started_at)}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} /> {formatDuration(meeting.duration_seconds)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{SOURCE_LABEL[meeting.source]}</span>
          {meeting.action_items_total > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="tasks" size={13} />
                {meeting.action_items_open} open / {meeting.action_items_total}
              </span>
            </>
          )}
        </div>
        {meeting.topics.length > 0 && (
          <div className="relative z-10 mt-2.5 flex flex-wrap gap-1.5">
            {meeting.topics.slice(0, 4).map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onTopicClick?.(topic.name)}
                className="chip py-0.5 hover:border-primary hover:text-primary-text"
                title={`Filter by ${topic.name}`}
              >
                #{topic.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <AvatarStack names={meeting.participants.map((p) => p.name)} />
        <div className="relative z-10 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(meeting)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-3 hover:text-text"
            aria-label={`Edit ${meeting.title}`}
            title="Edit details"
          >
            <Icon name="edit" size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(meeting)}
            className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${meeting.title}`}
            title="Delete meeting"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
