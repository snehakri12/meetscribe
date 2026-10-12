"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { MeetingCreateForm } from "@/components/meetings/MeetingCreateForm";
import { Modal } from "@/components/ui/Modal";
import { CaptureModal } from "./CaptureModal";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type ShellContextValue = {
  openNewMeeting: () => void;
  openCapture: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useShell must be used inside <AppShell>");
  return context;
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  const closeNewMeeting = useCallback(() => setNewMeetingOpen(false), []);
  const value = useMemo<ShellContextValue>(
    () => ({
      openNewMeeting: () => setNewMeetingOpen(true),
      openCapture: () => setCaptureOpen(true),
    }),
    [],
  );

  return (
    <ShellContext.Provider value={value}>
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMobileNavOpen(true)} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <Modal
        open={newMeetingOpen}
        onClose={closeNewMeeting}
        title="Add a meeting"
        description="Upload or paste a transcript and MeetScribe will generate the notes."
        size="lg"
      >
        {newMeetingOpen && (
          <MeetingCreateForm
            onCancel={closeNewMeeting}
            onCreated={(meeting) => {
              closeNewMeeting();
              router.push(`/meetings/${meeting.id}`);
            }}
          />
        )}
      </Modal>
      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </ShellContext.Provider>
  );
}
