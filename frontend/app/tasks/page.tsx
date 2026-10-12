import type { Metadata } from "next";

import { ActionItemsBoard } from "@/components/action-items/ActionItemsBoard";

export const metadata: Metadata = { title: "Action items" };

export default function TasksPage() {
  return <ActionItemsBoard />;
}
