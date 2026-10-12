"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { HighlightedText } from "@/components/meeting-detail/TranscriptLine";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/States";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { dayLabel, formatTimestamp } from "@/lib/format";
import type { SearchHit, SearchResponse } from "@/lib/types";

const EMPTY: SearchResponse = { query: "", total: 0, hits: [] };

export function GlobalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(q);

  const results = useApi(() => (q ? api.search(q) : Promise.resolve(EMPTY)), `search-${q}`);

  const groups = useMemo(() => {
    const byMeeting = new Map<number, { title: string; startedAt: string; hits: SearchHit[] }>();
    for (const hit of results.data?.hits ?? []) {
      const group = byMeeting.get(hit.meeting_id) ?? { title: hit.meeting_title, startedAt: hit.started_at, hits: [] };
      group.hits.push(hit);
      byMeeting.set(hit.meeting_id, group);
    }
    return [...byMeeting.entries()];
  }, [results.data]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Search" description="Find any moment across every meeting transcript." />

      <form onSubmit={onSubmit} className="relative mb-6" role="search">
        <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='Try "pricing", "SSO" or a person&apos;s name'
          aria-label="Search all transcripts"
          className="input h-12 pl-11 pr-28 text-base"
          autoFocus
        />
        <button type="submit" className="btn-primary absolute right-1.5 top-1/2 h-9 -translate-y-1/2">
          Search
        </button>
      </form>

      {!q ? (
        <div className="card">
          <EmptyState
            icon="search"
            title="Search across all transcripts"
            description="Results show the exact line, who said it and when. Click a result to jump to that moment."
          />
        </div>
      ) : results.error && !results.data ? (
        <ErrorState message={results.error} onRetry={results.reload} />
      ) : !results.data || results.loading ? (
        <Spinner label="Searching..." />
      ) : results.data.total === 0 ? (
        <div className="card">
          <EmptyState icon="search" title={`No results for "${q}"`} description="Try a shorter or different phrase." />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {results.data.total} result{results.data.total === 1 ? "" : "s"} in {groups.length} meeting
            {groups.length === 1 ? "" : "s"}
            {results.data.total > results.data.hits.length && ` (showing first ${results.data.hits.length})`}
          </p>
          {groups.map(([meetingId, group]) => (
            <section key={meetingId} className="card overflow-hidden">
              <Link
                href={`/meetings/${meetingId}`}
                className="flex items-center justify-between border-b border-border px-5 py-3 hover:bg-surface-2"
              >
                <span className="text-sm font-semibold">{group.title}</span>
                <span className="text-xs text-muted">
                  {dayLabel(group.startedAt)} · {group.hits.length} match{group.hits.length === 1 ? "" : "es"}
                </span>
              </Link>
              <ul className="divide-y divide-border">
                {group.hits.map((hit) => (
                  <li key={hit.segment_id}>
                    <Link
                      href={`/meetings/${meetingId}?t=${Math.floor(hit.start_seconds)}`}
                      className="flex gap-3 px-5 py-3 hover:bg-surface-2"
                    >
                      <Avatar name={hit.speaker} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted">
                          <span className="font-semibold text-text">
                            <HighlightedText text={hit.speaker} term={q} />
                          </span>{" "}
                          · <span className="font-mono">{formatTimestamp(hit.start_seconds)}</span>
                        </p>
                        <p className="mt-0.5 text-sm leading-6">
                          <HighlightedText text={hit.text} term={q} />
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
