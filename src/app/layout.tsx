import type { Metadata } from "next";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

export const metadata: Metadata = {
  title: "Kaizen Console",
  description: "One place to measure, analyze, and improve your engineering team's productivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--hud-bg)] text-[var(--hud-text)]">
        <CopilotKit runtimeUrl="/api/copilotkit" agent="sample_agent">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
