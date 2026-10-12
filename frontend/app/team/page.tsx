import type { Metadata } from "next";

import { ComingSoonGrid } from "@/components/ui/ComingSoon";
import type { ComingSoonItem } from "@/components/ui/ComingSoon";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Team" };

const TEAM_FEATURES: ComingSoonItem[] = [
  { name: "Invite teammates", description: "Add colleagues to your workspace by email.", icon: "team" },
  { name: "Share meetings", description: "Share notes and transcripts with a link or a channel.", icon: "share" },
  { name: "Roles & permissions", description: "Control who can view, edit and delete meetings.", icon: "lock" },
];

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Team" description="Collaborate on meetings with your team." />
      <ComingSoonGrid items={TEAM_FEATURES} />
    </div>
  );
}
