"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useToast } from "@/components/providers/ToastProvider";
import { AvatarStack } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { downloadMeeting } from "@/lib/export";
import type { ExportFormat } from "@/lib/export";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { MeetingDetail } from "@/lib/types";

function ExportMenu({ meeting }: { meeting: MeetingDetail }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function exportAs(format: ExportFormat) {
    downloadMeeting(meeting, format);
    setOpen(false);
    toast.success(`Exported as ${format === "md" ? "Markdown" : "plain text"}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-secondary h-9"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="download" size={15} /> Export
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-11 z-30 w-52 p-1.5 shadow-card">
          <button role="menuitem" onClick={() => exportAs("md")} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2">
            Markdown (.md)
          </button>
          <button role="menuitem" onClick={() => exportAs("txt")} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2">
            Plain text (.txt)
          </button>
        </div>
      )}
    </div>
  );
}

type MeetingHeaderProps = {
  meeting: MeetingDetail;
  onEdit: () => void;
  onDelete: () => void;
};

export function MeetingHeader({ meeting, onEdit, onDelete }: MeetingHeaderProps) {
  const toast = useToast();

  return (
    <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
      <Link href="/meetings" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-text">
        <Icon name="arrowLeft" size={14} /> All meetings
      </Link>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">{meeting.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={15} /> {formatDateTime(meeting.started_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={15} /> {formatDuration(meeting.duration_seconds)}
            </span>
            <span className="inline-flex items-center gap-2">
              <AvatarStack names={meeting.participants.map((p) => p.name)} max={5} size="xs" />
              {meeting.participants.length} participant{meeting.participants.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="btn-secondary h-9"
            onClick={() => toast.info("Sharing and team collaboration are coming soon.")}
          >
            <Icon name="share" size={15} /> Share
          </button>
          <ExportMenu meeting={meeting} />
          <button className="btn-secondary h-9" onClick={onEdit}>
            <Icon name="edit" size={15} /> Edit
          </button>
          <button
            className="btn-secondary h-9 text-danger hover:bg-danger-soft"
            onClick={onDelete}
            aria-label="Delete meeting"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
