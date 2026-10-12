import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MeetingDetailView } from "@/components/meeting-detail/MeetingDetailView";
import { Spinner } from "@/components/ui/States";

export default async function MeetingPage({ params }: PageProps<"/meetings/[id]">) {
  const { id } = await params;
  const meetingId = Number(id);
  if (!Number.isInteger(meetingId) || meetingId <= 0) notFound();

  return (
    <Suspense fallback={<Spinner label="Loading meeting..." />}>
      {/* key: reset player and panel state when navigating between meetings */}
      <MeetingDetailView key={meetingId} meetingId={meetingId} />
    </Suspense>
  );
}
