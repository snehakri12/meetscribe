import type { Metadata } from "next";

import { ComingSoonGrid } from "@/components/ui/ComingSoon";
import type { ComingSoonItem } from "@/components/ui/ComingSoon";
import { PageHeader } from "@/components/ui/States";

export const metadata: Metadata = { title: "Analytics" };

const ANALYTICS: ComingSoonItem[] = [
  { name: "Conversation analytics", description: "Talk time, monologues and questions asked per speaker.", icon: "analytics" },
  { name: "Topic tracker", description: "Track how often keywords come up across meetings.", icon: "tag" },
  { name: "Team insights", description: "Meeting load and follow-through for every teammate.", icon: "team" },
];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Analytics" description="Insights across all of your conversations." />
      <ComingSoonGrid items={ANALYTICS} />
    </div>
  );
}
