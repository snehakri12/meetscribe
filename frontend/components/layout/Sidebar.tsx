"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { APP_NAME } from "@/lib/constants";
import { useShell } from "./AppShell";

type NavItem = { href: string; label: string; icon: IconName; soon?: boolean };

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/meetings", label: "Meetings", icon: "meetings" },
  { href: "/tasks", label: "Action items", icon: "tasks" },
  { href: "/uploads", label: "Uploads", icon: "upload" },
  { href: "/search", label: "Search", icon: "search" },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/analytics", label: "Analytics", icon: "analytics", soon: true },
  { href: "/integrations", label: "Integrations", icon: "integrations", soon: true },
  { href: "/team", label: "Team", icon: "team", soon: true },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c5cff] to-[#e14fad] text-white shadow-sm">
        <Icon name="mic" size={17} />
      </span>
      <span className="text-[17px] font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-primary-soft font-semibold text-primary-text" : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      <Icon name={item.icon} size={18} />
      <span className="flex-1">{item.label}</span>
      {item.soon && <span className="text-[10px] font-medium text-subtle">Soon</span>}
    </Link>
  );
}

export function Sidebar({ mobileOpen, onNavigate }: { mobileOpen: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const { openNewMeeting } = useShell();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Main navigation"
    >
      <div className="mb-5 px-2">
        <Logo />
      </div>

      <button
        onClick={() => {
          onNavigate();
          openNewMeeting();
        }}
        className="btn-primary mb-5 w-full py-2.5"
      >
        <Icon name="plus" size={16} /> New meeting
      </button>

      <nav className="flex flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">Workspace</p>
      <nav className="flex flex-col gap-0.5">
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-surface-2 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Icon name="sparkles" size={14} className="text-primary-text" /> Free plan
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">Unlimited transcripts in this demo workspace.</p>
        <button className="btn-secondary mt-3 w-full py-1.5 text-xs" disabled title="Billing is not part of this demo">
          Upgrade (coming soon)
        </button>
      </div>
    </aside>
  );
}
