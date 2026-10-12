"use client";

import { useRouter } from "next/navigation";

import { ComingSoonBadge } from "@/components/ui/ComingSoon";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/States";
import { MeetingCreateForm } from "./MeetingCreateForm";

const FORMAT_EXAMPLES = [
  {
    name: "Plain text (.txt)",
    example: "[00:00] Sneha: Welcome everyone.\n[00:12] Rahul Mehta: Thanks, let's start.",
  },
  {
    name: "WebVTT (.vtt)",
    example: "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\n<v Sneha>Welcome everyone.",
  },
  {
    name: "JSON (.json)",
    example: '[{"speaker": "Sneha", "start": 0, "text": "Welcome everyone."}]',
  },
];

export function UploadPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Uploads"
        description="Upload or paste a transcript - MeetScribe creates the meeting, speaker timeline and AI notes."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="card p-5">
          <MeetingCreateForm onCreated={(meeting) => router.push(`/meetings/${meeting.id}`)} />
        </section>
        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold">Supported transcript formats</h2>
            <div className="space-y-3">
              {FORMAT_EXAMPLES.map((format) => (
                <div key={format.name}>
                  <p className="mb-1 text-xs font-semibold text-muted">{format.name}</p>
                  <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[11px] leading-5 text-muted">
                    {format.example}
                  </pre>
                </div>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="mic" size={16} className="text-primary-text" /> Audio & video files
              </h2>
              <ComingSoonBadge />
            </div>
            <p className="text-sm text-muted">
              Uploading MP3, MP4 or WAV recordings for automatic speech-to-text transcription is not available in
              this demo.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
