import type { Metadata } from "next";

import { ComingSoonGrid } from "@/components/ui/ComingSoon";
import type { ComingSoonItem } from "@/components/ui/ComingSoon";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Integrations" };

const INTEGRATIONS: ComingSoonItem[] = [
  { name: "Zoom", description: "Automatically join and transcribe Zoom meetings.", icon: "bot" },
  { name: "Google Meet", description: "Capture Google Meet calls from your calendar.", icon: "bot" },
  { name: "Microsoft Teams", description: "Record and transcribe Teams meetings.", icon: "bot" },
  { name: "Google Calendar", description: "Sync upcoming meetings and auto-join them.", icon: "calendar" },
  { name: "Slack", description: "Send meeting summaries and action items to channels.", icon: "comment" },
  { name: "Salesforce", description: "Attach notes and action items to CRM records.", icon: "integrations" },
];

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Integrations" description="Connect MeetScribe to the tools your team already uses." />
      <ComingSoonGrid items={INTEGRATIONS} />
    </div>
  );
}
