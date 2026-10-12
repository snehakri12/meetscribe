"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { CURRENT_USER } from "@/lib/constants";
import { useShell } from "./AppShell";
import { Logo } from "./Sidebar";

function ProfileMenu() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <Avatar name={CURRENT_USER.name} size="md" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 top-11 z-50 w-60 p-1.5 shadow-card">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-semibold">{CURRENT_USER.name}</p>
            <p className="text-xs text-muted">{CURRENT_USER.email}</p>
          </div>
          <Link
            role="menuitem"
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-surface-2"
          >
            <Icon name="user" size={16} /> Profile & settings
          </Link>
          <Link
            role="menuitem"
            href="/team"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-surface-2"
          >
            <Icon name="team" size={16} /> Team
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              toast.info("Authentication is not part of this demo - you're signed in as the default user.");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-surface-2"
          >
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => setPreference(next)}
      className="btn-ghost px-2"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={resolved === "dark" ? "sun" : "moon"} />
    </button>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  if (pathname === "/search") return <div className="flex-1" />;

  return (
    <form onSubmit={onSubmit} className="relative max-w-md flex-1" role="search">
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search across all transcripts..."
        aria-label="Search across all transcripts"
        className="input h-9 rounded-full bg-surface-2 pl-9"
      />
    </form>
  );
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { openCapture, openNewMeeting } = useShell();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onOpenMenu} className="btn-ghost px-2 lg:hidden" aria-label="Open navigation">
        <Icon name="menu" />
      </button>
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="hidden flex-1 sm:flex">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button onClick={openCapture} className="btn-secondary hidden h-9 md:inline-flex">
          <Icon name="bot" size={16} /> Capture
        </button>
        <button onClick={openNewMeeting} className="btn-primary hidden h-9 sm:inline-flex">
          <Icon name="upload" size={16} /> Upload
        </button>
        <ThemeToggle />
        <Link href="/settings" className="btn-ghost px-2" aria-label="Settings" title="Settings">
          <Icon name="settings" />
        </Link>
        <ProfileMenu />
      </div>
    </header>
  );
}
