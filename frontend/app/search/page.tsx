import type { Metadata } from "next";
import { Suspense } from "react";

import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Spinner } from "@/components/ui/States";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <GlobalSearch />
    </Suspense>
  );
}
