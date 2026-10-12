"use client";

import { Icon } from "@/components/ui/Icon";
import type { Participant, Topic } from "@/lib/types";

export type LibraryFilters = {
  q: string;
  participant: string;
  topic: string;
  date_from: string;
  date_to: string;
  sort: "newest" | "oldest";
};

export const EMPTY_FILTERS: LibraryFilters = {
  q: "",
  participant: "",
  topic: "",
  date_from: "",
  date_to: "",
  sort: "newest",
};

type MeetingFiltersProps = {
  filters: LibraryFilters;
  participants: Participant[];
  topics: Topic[];
  onChange: (patch: Partial<LibraryFilters>) => void;
  onReset: () => void;
};

const selectClass =
  "h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-text outline-none focus:border-primary";

export function MeetingFilters({ filters, participants, topics, onChange, onReset }: MeetingFiltersProps) {
  const active =
    filters.q || filters.participant || filters.topic || filters.date_from || filters.date_to;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search by title, participant, keyword or anything said in the meeting..."
          aria-label="Search meetings"
          className="input h-10 pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted">
          <Icon name="filter" size={14} /> Filters
        </span>
        <select
          aria-label="Filter by participant"
          className={selectClass}
          value={filters.participant}
          onChange={(e) => onChange({ participant: e.target.value })}
        >
          <option value="">All participants</option>
          {participants.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by keyword"
          className={selectClass}
          value={filters.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
        >
          <option value="">All keywords</option>
          {topics.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          From
          <input
            type="date"
            className={selectClass}
            value={filters.date_from}
            max={filters.date_to || undefined}
            onChange={(e) => onChange({ date_from: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          To
          <input
            type="date"
            className={selectClass}
            value={filters.date_to}
            min={filters.date_from || undefined}
            onChange={(e) => onChange({ date_to: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-secondary h-9 px-3"
          onClick={() => onChange({ sort: filters.sort === "newest" ? "oldest" : "newest" })}
          aria-label={`Sorted ${filters.sort} first. Click to reverse.`}
        >
          <Icon name="sort" size={15} />
          {filters.sort === "newest" ? "Newest first" : "Oldest first"}
        </button>
        {active && (
          <button type="button" className="btn-ghost h-9 px-2 text-primary-text" onClick={onReset}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
