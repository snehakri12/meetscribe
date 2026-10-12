import type { Metadata } from "next";

import { UploadPage } from "@/components/meetings/UploadPage";

export const metadata: Metadata = { title: "Uploads" };

export default function UploadsPage() {
  return <UploadPage />;
}
