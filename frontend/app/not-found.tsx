import Link from "next/link";

import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="card">
        <EmptyState
          icon="search"
          title="Page not found"
          description="The page or meeting you're looking for doesn't exist."
          action={
            <Link href="/meetings" className="btn-primary">
              Go to meetings
            </Link>
          }
        />
      </div>
    </div>
  );
}
