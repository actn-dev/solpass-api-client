"use client";

import { PlatformProvider } from "@/lib/hooks/use-platform";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformProvider>{children}</PlatformProvider>;
}
