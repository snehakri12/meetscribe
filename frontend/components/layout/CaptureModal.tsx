"use client";

import { ComingSoonBadge } from "@/components/ui/ComingSoon";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

/** Placeholder for the real-time notetaker bot that joins live calls (out of scope). */
export function CaptureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add notetaker to a live meeting"
      description="Paste a Zoom, Google Meet or Teams link and the bot joins to record and transcribe."
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" disabled>
            <Icon name="bot" size={16} /> Join meeting
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-warning-soft p-3 text-sm">
          <ComingSoonBadge />
          <p className="text-muted">
            The live meeting bot and real-time speech-to-text are not part of this demo. Upload or paste a
            transcript instead.
          </p>
        </div>
        <div>
          <label htmlFor="capture-link" className="label">
            Meeting link
          </label>
          <input id="capture-link" className="input" placeholder="https://meet.google.com/abc-defg-hij" disabled />
        </div>
        <div>
          <label htmlFor="capture-name" className="label">
            Meeting name
          </label>
          <input id="capture-name" className="input" placeholder="Optional" disabled />
        </div>
      </div>
    </Modal>
  );
}
