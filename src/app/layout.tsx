import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "WeDrop – Drop it. Share it.",
  description:
    "A thought, a snippet, a little something. Share text and code with an expiring link.",
  manifest: "/manifest.json",
  applicationName: "WeDrop",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "WeDrop" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  themeColor: "#f6f7f2",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
