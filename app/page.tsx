
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import api from "@/lib/api";

type TranscriptLine = {
  time: string;
  speaker: string;
  text: string;
};

type Task = {
  id: number;
  text: string;
  done: boolean;
};

type Meeting = {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: string[];
  category: string;
  summary: string;
  transcript: TranscriptLine[];
  tasks: Task[];
  topics: string[];
};

type ApiTask = {
  id: number;
  title: string;
  completed: boolean;
  meeting_id: number;
};

type ApiMeeting = {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: string;
  summary: string;
  transcript: string;
  topics: string;
};

function parseJson<T>(value: string | T, fallback: T): T {
  if (typeof value !== "string") return value ?? fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function fromApiMeeting(
  meeting: ApiMeeting,
  tasks: ApiTask[],
): Meeting {
  const topics = parseJson<string[]>(meeting.topics, []);

  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    duration: meeting.duration,
    participants: parseJson<string[]>(meeting.participants, []),
    summary: meeting.summary || "",
    transcript: parseJson<TranscriptLine[]>(meeting.transcript, []),
    topics,
    category: topics[0] || "General",
    tasks: tasks
      .filter((task) => task.meeting_id === meeting.id)
      .map((task) => ({
        id: task.id,
        text: task.title,
        done: task.completed,
      })),
  };
}

function formatDate(date: string) {
  if (!date) return "Unknown date";

  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const days = Math.round(
    (today.getTime() - value.getTime()) / 86400000,
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timestampToSeconds(time: string) {
  const parts = (time ?? "00:00").split(":").map(Number);

  if (parts.some((part) => !Number.isFinite(part))) return 0;

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const term = query.trim();

  if (!term) return <>{text}</>;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 text-gray-900"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Summary");
  const [activeNav, setActiveNav] = useState("Meetings");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All meetings");
  const [dateFilter, setDateFilter] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [newTranscript, setNewTranscript] = useState("");
  const [newSummary, setNewSummary] = useState("");

  const selected = meetings.find((meeting) => meeting.id === selectedId);

  const loadMeetings = useCallback(async () => {
    setLoading(true);

    try {
      const [meetingResponse, taskResponse] = await Promise.all([
        api.get<ApiMeeting[]>("/meetings"),
        api.get<ApiTask[]>("/tasks"),
      ]);

      const mapped = meetingResponse.data.map((meeting) =>
        fromApiMeeting(meeting, taskResponse.data),
      );

      setMeetings(mapped);
      setSelectedId((current) =>
        mapped.some((meeting) => meeting.id === current)
          ? current
          : mapped[0]?.id ?? null,
      );
    } catch (error) {
      console.error(error);
      setNotice("Could not load meetings. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(
    () => [
      "All meetings",
      "My meetings",
      ...Array.from(
        new Set(meetings.map((meeting) => meeting.category)),
      ).filter(Boolean),
    ],
    [meetings],
  );

  const filteredMeetings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return meetings
      .filter((meeting) => {
        const matchesSearch =
          !term ||
          meeting.title.toLowerCase().includes(term) ||
          meeting.category.toLowerCase().includes(term) ||
          meeting.participants.some((person) =>
            person.toLowerCase().includes(term),
          );
        const matchesDate =
          !dateFilter || meeting.date.slice(0, 10) === dateFilter;
        const matchesCategory =
          category === "All meetings" ||
          (category === "My meetings" &&
            meeting.participants.some((person) =>
              ["SK", "Sneha"].includes(person),
            )) ||
          meeting.category === category;

        return matchesSearch && matchesCategory && matchesDate;
      })
      .sort((a, b) =>
        sortNewest
          ? b.date.localeCompare(a.date) || b.id - a.id
          : a.date.localeCompare(b.date) || a.id - b.id,
      );
  }, [meetings, search, category, dateFilter, sortNewest]);

  const visibleTranscript = useMemo(() => {
    if (!selected) return [];

    const term = query.trim().toLowerCase();

    return selected.transcript.filter(
      (line) =>
        !term ||
        line.text.toLowerCase().includes(term) ||
        line.speaker.toLowerCase().includes(term),
    );
  }, [selected, query]);

  const pendingTasks = meetings.reduce(
    (total, meeting) =>
      total + meeting.tasks.filter((task) => !task.done).length,
    0,
  );

  const completedTasks = meetings.reduce(
    (total, meeting) =>
      total + meeting.tasks.filter((task) => task.done).length,
    0,
  );

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim()) return;

    const participants = newParticipants
      .split(",")
      .map((person) => person.trim())
      .filter(Boolean);

    const transcript: TranscriptLine[] = newTranscript
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, index) => ({
        time: `00:${String(index * 30).padStart(2, "0")}`,
        speaker: participants[index % Math.max(participants.length, 1)] || "You",
        text,
      }));

    try {
      const response = await api.post<ApiMeeting>("/meetings", {
        title: newTitle.trim(),
        date: new Date().toISOString().slice(0, 10),
        duration: "0 min",
        participants: JSON.stringify(participants),
        summary: newSummary.trim() || "No summary added yet.",
        transcript: JSON.stringify(transcript),
        topics: JSON.stringify(["General"]),
      });

      const created = fromApiMeeting(response.data, []);

      setMeetings((current) => [created, ...current]);
      setSelectedId(created.id);
      setCategory("All meetings");
      setSearch("");
      setActiveTab("Summary");
      setActiveNav("Meetings");
      setShowCreate(false);
      setNewTitle("");
      setNewParticipants("");
      setNewTranscript("");
      setNewSummary("");
      setNotice("Meeting created successfully");
    } catch (error) {
      console.error(error);
      setNotice("Could not create meeting");
    }
  }

  async function updateMeetingTitle(newTitle: string) {
    if (!selected || !newTitle.trim()) return;

    try {
      await api.patch(`/meetings/${selected.id}`, {
        title: newTitle.trim(),
      });

      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selected.id
            ? { ...meeting, title: newTitle.trim() }
            : meeting,
        ),
      );

      setNotice("Meeting title updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not update meeting title");
    }
  }


  async function updateMeetingSummary(newSummary: string) {
    if (!selected) return;

    try {
      await api.patch(`/meetings/${selected.id}`, {
        summary: newSummary,
      });

      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selected.id
            ? { ...meeting, summary: newSummary }
            : meeting,
        ),
      );

      setNotice("Meeting summary updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not update meeting summary");
    }
  }


  async function updateMeetingTranscript(
    newTranscript: TranscriptLine[],
  ) {
    if (!selected) return;

    try {
      await api.patch(`/meetings/${selected.id}`, {
        transcript: JSON.stringify(newTranscript),
      });

      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selected.id
            ? { ...meeting, transcript: newTranscript }
            : meeting,
        ),
      );

      setNotice("Meeting transcript updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not update meeting transcript");
    }
  }


  async function updateMeetingParticipants(newParticipants: string[]) {
    if (!selected) return;

    try {
      await api.patch(`/meetings/${selected.id}`, {
        participants: JSON.stringify(newParticipants),
      });

      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selected.id
            ? { ...meeting, participants: newParticipants }
            : meeting,
        ),
      );

      setNotice("Meeting participants updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not update meeting participants");
    }
  }


  async function deleteMeeting() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}"?`)) return;

    try {
      await api.delete(`/meetings/${selected.id}`);

      const remaining = meetings.filter(
        (meeting) => meeting.id !== selected.id,
      );

      setMeetings(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setNotice("Meeting deleted");
    } catch (error) {
      console.error(error);
      setNotice("Could not delete meeting");
    }
  }

  async function addTask(title: string): Promise<boolean> {
    if (!selected) return false;

    try {
      const response = await api.post<ApiTask>("/tasks", {
        title,
        meeting_id: selected.id,
      });

      const newTask: Task = {
        id: response.data.id,
        text: response.data.title,
        done: response.data.completed,
      };

      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selected.id
            ? { ...meeting, tasks: [...meeting.tasks, newTask] }
            : meeting,
        ),
      );

      setNotice("Action item added");
      return true;
    } catch (error) {
      console.error(error);
      setNotice("Could not add task");
      return false;
    }
  }

  async function toggleTask(task: Task) {
    try {
      await api.patch(`/tasks/${task.id}`, {
        completed: !task.done,
      });

      setMeetings((current) =>
        current.map((meeting) => ({
          ...meeting,
          tasks: meeting.tasks.map((item) =>
            item.id === task.id
              ? { ...item, done: !item.done }
              : item,
          ),
        })),
      );

      setNotice("Action item updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not update task");
    }
  }

  async function editTask(task: Task, newTitle: string) {
    if (!newTitle.trim()) return;

    try {
      await api.patch(`/tasks/${task.id}`, {
        title: newTitle.trim(),
      });

      setMeetings((current) =>
        current.map((meeting) => ({
          ...meeting,
          tasks: meeting.tasks.map((item) =>
            item.id === task.id
              ? { ...item, text: newTitle.trim() }
              : item,
          ),
        })),
      );

      setNotice("Action item updated");
    } catch (error) {
      console.error(error);
      setNotice("Could not edit action item");
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.text}"?`)) return;

    try {
      await api.delete(`/tasks/${task.id}`);

      setMeetings((current) =>
        current.map((meeting) => ({
          ...meeting,
          tasks: meeting.tasks.filter((item) => item.id !== task.id),
        })),
      );

      setNotice("Action item deleted");
    } catch (error) {
      console.error(error);
      setNotice("Could not delete action item");
    }
  }


  function seekTo(time: string) {
    const player = document.getElementById(
      "meeting-player",
    ) as HTMLAudioElement | null;

    if (!player) return;

    const targetTime = timestampToSeconds(time);

    if (Number.isFinite(player.duration) && player.duration > 0) {
      player.currentTime = Math.min(targetTime, player.duration);
      void player.play().catch(() => {
        setNotice(`Selected transcript at ${time}. Press Play to continue.`);
      });
      setNotice(`Jumped to transcript timestamp ${time}`);
    } else {
      setNotice("Audio is loading. Please try again in a moment.");
    }
  }


  function exportMeeting() {
    if (!selected) return;

    const content = [
      selected.title,
      `Date: ${selected.date}`,
      `Duration: ${selected.duration}`,
      `Participants: ${selected.participants.join(", ")}`,
      "",
      "SUMMARY",
      selected.summary,
      "",
      "TOPICS",
      ...selected.topics,
      "",
      "TRANSCRIPT",
      ...selected.transcript.map(
        (line) => `[${line.time}] ${line.speaker}: ${line.text}`,
      ),
      "",
      "ACTION ITEMS",
      ...selected.tasks.map(
        (task) => `${task.done ? "[x]" : "[ ]"} ${task.text}`,
      ),
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${selected.title.replace(/[^a-z0-9]+/gi, "-")}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    setNotice("Meeting exported");
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#20212a]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[#e9eaf0] bg-white px-4 py-6 lg:flex">
          <div className="mb-9 flex items-center gap-2 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-xl font-bold text-white">
              M
            </div>
            <span className="text-[22px] font-bold tracking-tight">
              MeetScribe<span className="text-violet-600">.ai</span>
            </span>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="mb-7 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6254e8] px-3 font-semibold text-white shadow-sm transition hover:bg-[#5143d0]"
          >
            <span className="text-xl">+</span> New meeting
          </button>

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.6px] text-gray-400">
            Workspace
          </p>

          {[
            ["Meetings", "▤"],
            ["Transcripts", "▥"],
            ["Tasks", "✓"],
            ["Analytics", "▥"],
          ].map(([label, icon]) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                if (label === "Transcripts") setActiveTab("Transcript");
                if (label === "Tasks") setActiveTab("Tasks");
                setNotice(`${label} workspace selected`);
              }}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${activeNav === label
                ? "bg-[#f0eeff] font-semibold text-[#6254e8]"
                : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <span className="w-5 text-center text-base">{icon}</span>
              {label}
              {label === "Tasks" && (
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700">
                  {pendingTasks}
                </span>
              )}
            </button>
          ))}

          <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[1.6px] text-gray-400">
            Manage
          </p>

          {["Team members", "Integrations", "Settings"].map((label) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                setNotice(`${label}: coming soon`);
              }}
              className="mb-1 rounded-lg px-3 py-2.5 text-left text-[13px] text-gray-600 transition hover:bg-gray-50"
            >
              {label}
            </button>
          ))}

          <div className="mt-auto rounded-xl border border-[#eeeafc] bg-[#faf9ff] p-3">
            <p className="mb-2 text-xs font-bold">✦ AI meeting notes</p>
            <p className="text-[11px] leading-5 text-gray-500">
              Turn conversations into clear next steps.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e4ff] text-xs font-bold text-violet-700">
              SK
            </div>
            <div>
              <p className="text-xs font-semibold">My workspace</p>
              <p className="text-[10px] text-gray-500">Local demo</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e9eaf0] bg-white/95 px-5 backdrop-blur sm:px-8">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight lg:hidden">
                MeetScribe<span className="text-violet-600">.ai</span>
              </span>
              <span className="hidden text-sm text-gray-400 sm:inline">
                Workspace
              </span>
              <span className="hidden text-gray-300 sm:inline">/</span>
              <span className="text-sm font-semibold">{activeNav}</span>
            </div>
            <span className="rounded-full bg-[#f5f4ff] px-3 py-1.5 text-[11px] font-semibold text-violet-700">
              ✦ AI workspace
            </span>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
                Loading your meetings...
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-violet-600">
                      ✦ YOUR MEETING WORKSPACE
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-[34px]">
                      Meeting library
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Every conversation, organized in one place.
                    </p>
                  </div>

                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#ececf3] bg-white p-5">
                    <p className="text-xs text-gray-500">Total meetings</p>
                    <p className="mt-3 text-3xl font-bold">{meetings.length}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      In your workspace
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#ececf3] bg-white p-5">
                    <p className="text-xs text-gray-500">Pending action items</p>
                    <p className="mt-3 text-3xl font-bold">{pendingTasks}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Tasks still to complete
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#ececf3] bg-white p-5">
                    <p className="text-xs text-gray-500">Completed tasks</p>
                    <p className="mt-3 text-3xl font-bold">{completedTasks}</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Across all meetings
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                  <section className="overflow-hidden rounded-2xl border border-[#e9eaf0] bg-white">
                    <div className="p-5">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-bold">Your meetings</h2>
                          <p className="mt-1 text-sm text-gray-400">
                            Browse and revisit your conversations
                          </p>
                        </div>
                        <button
                          onClick={() => setSortNewest((value) => !value)}
                          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          {sortNewest ? "Newest first ↓" : "Oldest first ↑"}
                        </button>
                      </div>

                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search meetings or participants..."
                        className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:border-violet-400"
                      />


                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(event) => setDateFilter(event.target.value)}
                          aria-label="Filter meetings by date"
                          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600"
                        />

                        {categories.map((item) => (
                          <button
                            key={item}
                            onClick={() => setCategory(item)}
                            className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${category === item
                              ? "bg-[#6254e8] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      {dateFilter && (
                        <button
                          type="button"
                          onClick={() => setDateFilter("")}
                          className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-800"
                        >
                          Clear date filter
                        </button>
                      )}

                    </div>

                    <div className="divide-y divide-gray-100">
                      {filteredMeetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => {
                            setSelectedId(meeting.id);
                            setQuery("");
                          }}
                          className={`block w-full border-l-4 p-5 text-left transition ${selected?.id === meeting.id
                            ? "border-violet-500 bg-[#f8f6ff]"
                            : "border-transparent hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg text-violet-600">
                              ▤
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold">
                                  {meeting.title}
                                </p>
                                {selected?.id === meeting.id && (
                                  <span className="rounded bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-700">
                                    OPEN
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-xs text-gray-400">
                                {formatDate(meeting.date)} · {meeting.duration} ·{" "}
                                {meeting.category}
                              </p>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                                <span>
                                  {meeting.participants.join(", ") ||
                                    "No participants"}{" "}
                                  · {meeting.participants.length} participants
                                </span>
                                <span>
                                  {meeting.tasks.filter((task) => !task.done).length}{" "}
                                  pending
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}

                      {filteredMeetings.length === 0 && (
                        <p className="p-8 text-center text-sm text-gray-400">
                          No meetings match your search.
                        </p>
                      )}
                    </div>

                    <p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
                      Showing {filteredMeetings.length} of {meetings.length} meetings
                    </p>
                  </section>

                  {selected ? (
                    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e9eaf0] bg-white">
                      <div className="border-b border-gray-100 p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            MEETING NOTES
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(selected.date)}
                          </span>
                          <button
                            onClick={exportMeeting}
                            className="ml-auto rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                          >
                            Export ↓
                          </button>
                        </div>

                        <h2 className="break-words text-xl font-bold">
                          {selected.title}
                        </h2>
                        <p className="mt-2 text-sm text-gray-400">
                          {selected.duration} · {selected.participants.length} participants
                        </p>

                        <div className="mt-6 flex gap-2 border-b border-gray-100">
                          {["Summary", "Transcript", "Tasks"].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`border-b-2 px-3 py-3 text-sm font-semibold ${activeTab === tab
                                ? "border-violet-600 text-violet-600"
                                : "border-transparent text-gray-400 hover:text-gray-700"
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeTab === "Summary" && (
                        <div className="space-y-7 p-5">

                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-base font-bold">
                                <span className="mr-2 text-violet-600">✦</span>
                                AI summary
                              </h3>

                              <button
                                onClick={() => {
                                  const newSummary = window.prompt(
                                    "Edit meeting summary",
                                    selected.summary || "",
                                  );

                                  if (newSummary !== null) {
                                    updateMeetingSummary(newSummary);
                                  }
                                }}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                              >
                                Edit summary
                              </button>
                            </div>

                            <p className="text-sm leading-7 text-gray-600">
                              {selected.summary || "No summary has been added yet."}
                            </p>
                          </div>


                          <div className="rounded-2xl border border-violet-100 bg-[#faf9ff] p-5">
                            <h3 className="mb-4 text-sm font-bold">
                              ◎ Key topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selected.topics.length ? (
                                selected.topics.map((topic) => (
                                  <span
                                    key={topic}
                                    className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-xs text-violet-700"
                                  >
                                    {topic}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No topics yet.
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-sm font-bold">
                                <span className="mr-2 text-emerald-600">✓</span>
                                Action items
                              </h3>
                              <span className="text-xs text-gray-400">
                                {selected.tasks.filter((task) => task.done).length}/
                                {selected.tasks.length} done
                              </span>
                            </div>

                            <div className="space-y-3">
                              {selected.tasks.map((task) => (
                                <label
                                  key={task.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.done}
                                    onChange={() => void toggleTask(task)}
                                    className="mt-0.5 accent-violet-600"
                                  />
                                  <span
                                    className={`text-xs leading-5 ${task.done
                                      ? "text-gray-400 line-through"
                                      : "text-gray-700"
                                      }`}
                                  >
                                    {task.text}
                                  </span>
                                </label>
                              ))}

                              {selected.tasks.length === 0 && (
                                <p className="text-xs text-gray-400">
                                  No action items yet.
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab("Transcript")}
                            className="w-full rounded-xl border border-gray-200 py-3 text-xs font-semibold transition hover:bg-gray-50"
                          >
                            Read full transcript →
                          </button>
                        </div>
                      )}

                      {activeTab === "Transcript" && (
                        <div className="p-5">
                          <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search within transcript..."
                            className="mb-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
                          />

                          <div className="mb-6 rounded-2xl bg-[#f7f7fb] p-5">
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-sm font-bold">Meeting player</h3>
                              <span className="text-xs text-gray-400">
                                Audio placeholder
                              </span>
                            </div>
                            <audio
                              id="meeting-player"
                              controls
                              preload="metadata"
                              onTimeUpdate={(event) =>
                                setCurrentTime(event.currentTarget.currentTime)
                              }
                              className="h-9 w-full"
                            >
                              <source src="/audio/meeting-sample.mp3" type="audio/mpeg" />
                              Your browser does not support audio playback.
                            </audio>
                            <p className="mt-3 text-xs text-gray-400">
                              Click a transcript timestamp to seek when audio is available.
                            </p>
                          </div>


                          <div className="mb-4 flex justify-end">
                            <button
                              onClick={() => {
                                const currentTranscript = selected.transcript
                                  .map((line) => `${line.time} | ${line.speaker} | ${line.text}`)
                                  .join("\n");

                                const editedTranscript = window.prompt(
                                  "Edit transcript (one line per entry: timestamp | speaker | text)",
                                  currentTranscript,
                                );

                                if (editedTranscript !== null) {
                                  const newTranscript = editedTranscript
                                    .split("\n")
                                    .map((line) => {
                                      const firstSeparator = line.indexOf("|");
                                      const secondSeparator = line.indexOf("|", firstSeparator + 1);

                                      if (firstSeparator === -1 || secondSeparator === -1) {
                                        return null;
                                      }

                                      return {
                                        time: line.slice(0, firstSeparator).trim(),
                                        speaker: line.slice(firstSeparator + 1, secondSeparator).trim(),
                                        text: line.slice(secondSeparator + 1).trim(),
                                      };
                                    })
                                    .filter(
                                      (line): line is TranscriptLine =>
                                        line !== null && !!line.time && !!line.speaker && !!line.text,
                                    );

                                  if (newTranscript.length > 0) {
                                    updateMeetingTranscript(newTranscript);
                                  } else {
                                    setNotice("Please enter at least one valid transcript line");
                                  }
                                }
                              }}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                              Edit transcript
                            </button>
                          </div>

                          <div className="space-y-5">

                            {visibleTranscript.map((line, index) => (

                              <div
                                key={`${line.time}-${index}`}
                                className={`flex gap-3 rounded-xl p-3 transition-colors ${currentTime >= timestampToSeconds(line.time) &&
                                  (index === visibleTranscript.length - 1 ||
                                    currentTime <
                                    timestampToSeconds(visibleTranscript[index + 1].time))
                                  ? "bg-violet-50 ring-1 ring-violet-200"
                                  : ""
                                  }`}
                              >

                                <button
                                  onClick={() => seekTo(line.time)}
                                  className="h-fit shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-violet-100 hover:text-violet-700"
                                >
                                  {line.time}
                                </button>
                                <div className="min-w-0">
                                  <p className="mb-1 text-xs font-bold">
                                    {line.speaker}
                                  </p>
                                  <p className="text-sm leading-6 text-gray-600">
                                    <HighlightedText
                                      text={line.text}
                                      query={query}
                                    />
                                  </p>
                                </div>
                              </div>
                            ))}

                            {visibleTranscript.length === 0 && (
                              <p className="py-8 text-center text-sm text-gray-400">
                                No matching transcript lines.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "Tasks" && (
                        <div className="p-5">
                          <h3 className="mb-4 text-sm font-bold">
                            Action items and follow-ups
                          </h3>

                          <form
                            className="mb-4 flex gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const form = event.currentTarget;
                              const input = form.elements.namedItem(
                                "taskTitle",
                              ) as HTMLInputElement;
                              const title = input.value.trim();

                              if (!title) return;

                              void addTask(title).then((success) => {
                                if (success) form.reset();
                              });
                            }}
                          >
                            <input
                              name="taskTitle"
                              type="text"
                              placeholder="Add an action item..."
                              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
                              required
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                            >
                              + Add task
                            </button>
                          </form>

                          <div className="space-y-3">
                            {selected.tasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  onChange={() => void toggleTask(task)}
                                  className="mt-0.5 accent-violet-600"
                                />

                                <span
                                  className={`flex-1 text-xs leading-5 ${task.done
                                    ? "text-gray-400 line-through"
                                    : "text-gray-700"
                                    }`}
                                >
                                  {task.text}
                                </span>

                                {activeTab === "Tasks" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTitle = window.prompt(
                                          "Edit action item:",
                                          task.text,
                                        );

                                        if (
                                          newTitle?.trim() &&
                                          newTitle.trim() !== task.text
                                        ) {
                                          void editTask(task, newTitle.trim());
                                        }
                                      }}
                                      className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void deleteTask(task)}
                                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}

                            {selected.tasks.length === 0 && (
                              <p className="text-xs text-gray-400">
                                No action items yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
                        <span className="text-xs text-gray-400">
                          Saved in SQLite
                        </span>
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              const title = window.prompt(
                                "Edit meeting title:",
                                selected.title,
                              );

                              if (
                                title?.trim() &&
                                title.trim() !== selected.title
                              ) {
                                void updateMeetingTitle(title.trim());
                              }
                            }}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                          >
                            Edit title
                          </button>

                          <button
                            onClick={() => {
                              const participants = window.prompt(
                                "Edit participants (separate names with commas):",
                                selected.participants.join(", "),
                              );

                              if (participants !== null && participants.trim()) {
                                void updateMeetingParticipants(
                                  participants
                                    .split(",")
                                    .map((name) => name.trim())
                                    .filter(Boolean),
                                );
                              }
                            }}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                          >
                            Edit participants
                          </button>

                          <button
                            onClick={() => void deleteMeeting()}
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                          >
                            Delete meeting
                          </button>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                      <h2 className="text-lg font-bold">No meeting selected</h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Create a meeting to get started.
                      </p>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={createMeeting}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Create a meeting</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Meeting title
              </label>
              <input
                required
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Product planning meeting"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Participants (comma-separated)
              </label>
              <input
                value={newParticipants}
                onChange={(event) => setNewParticipants(event.target.value)}
                placeholder="Sneha, Alex"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Summary
              </label>
              <textarea
                value={newSummary}
                onChange={(event) => setNewSummary(event.target.value)}
                placeholder="What was discussed?"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Transcript (one line per entry)
              </label>
              <textarea
                value={newTranscript}
                onChange={(event) => setNewTranscript(event.target.value)}
                placeholder={"Let's review the roadmap.\nWe should finalize the next steps."}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Create meeting
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl bg-[#252333] px-5 py-4 text-sm text-white shadow-xl"
        >
          <span className="mr-2 text-emerald-400">✓</span>
          {notice}
          <button
            onClick={() => setNotice("")}
            className="ml-4 text-gray-300 hover:text-white"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
