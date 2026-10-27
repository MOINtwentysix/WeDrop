import { Recipient } from "@/components/recipient";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "A drop for you · WeDrop",
  robots: { index: false, follow: false },
};
export default async function Drop({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Recipient id={(await params).id} />;
}
