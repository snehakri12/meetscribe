import type { Metadata } from "next";
import { Suspense } from "react";

import { MeetingLibrary } from "@/components/meetings/MeetingLibrary";
import { Spinner } from "@/components/ui/States";

export const metadata: Metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return (
    <Suspense fallback={<Spinner label="Loading meetings..." />}>
      <MeetingLibrary />
    </Suspense>
  );
}
