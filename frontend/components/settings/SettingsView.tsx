"use client";

import type { ReactNode } from "react";

import { useTheme } from "@/components/providers/ThemeProvider";
import type { ThemePreference } from "@/components/providers/ThemeProvider";
import { Avatar } from "@/components/ui/Avatar";
import { ComingSoonBadge } from "@/components/ui/ComingSoon";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/States";
import { CURRENT_USER } from "@/lib/constants";

function SettingsCard({
  title,
  description,
  soon,
  children,
}: {
  title: string;
  description: string;
  soon?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        {soon && <ComingSoonBadge />}
      </div>
      {children}
    </section>
  );
}

const THEMES: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "settings" },
];

const NOTIFICATIONS = [
  "Email me the summary after every meeting",
  "Remind me about open action items",
  "Weekly digest of my meetings",
];

export function SettingsView() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Settings" description="Manage your profile, appearance and workspace preferences." />

      <SettingsCard title="Profile" description="Authentication is out of scope - the app runs as a default user." soon>
        <div className="flex items-center gap-4">
          <Avatar name={CURRENT_USER.name} size="lg" />
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="label">
                Name
              </label>
              <input id="profile-name" className="input" value={CURRENT_USER.name} disabled readOnly />
            </div>
            <div>
              <label htmlFor="profile-email" className="label">
                Email
              </label>
              <input id="profile-email" className="input" value={CURRENT_USER.email} disabled readOnly />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Appearance" description="Choose how MeetScribe looks on this device.">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              role="radio"
              aria-checked={preference === theme.value}
              onClick={() => setPreference(theme.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                preference === theme.value
                  ? "border-primary bg-primary-soft text-primary-text"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              <Icon name={theme.icon} size={20} />
              {theme.label}
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Notifications" description="Email and in-app notification preferences." soon>
        <div className="space-y-3">
          {NOTIFICATIONS.map((label) => (
            <label key={label} className="flex items-center justify-between gap-3 text-sm text-muted">
              {label}
              <input type="checkbox" disabled className="h-4 w-4" />
            </label>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Notetaker" description="Auto-join settings for the live meeting bot." soon>
        <select className="input" disabled>
          <option>Join all calendar events with a meeting link</option>
        </select>
      </SettingsCard>

      <SettingsCard title="Workspace" description={`You're in the "${CURRENT_USER.workspace}" workspace.`} soon>
        <button className="btn-secondary" disabled>
          Manage billing
        </button>
      </SettingsCard>
    </div>
  );
}
