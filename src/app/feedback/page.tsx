import { promises as fs } from "fs";
import path from "path";

import { FeedbackComposer } from "./FeedbackComposer";

async function loadSurveyTemplate() {
  const templatePath = path.join(process.cwd(), "emails", "survey.md");

  try {
    const raw = await fs.readFile(templatePath, "utf-8");
    const subjectMatch = raw.match(/\*\*Subject:\*\*\s*(.+)/);
    const subject = subjectMatch?.[1]?.trim() ?? "Developer Experience Pulse (Draft)";

    const body = raw
      .replace(subjectMatch?.[0] ?? "", "")
      .trimStart();

    return {
      subject,
      body,
    };
  } catch {
    return {
      subject: "Developer Experience Pulse (Draft)",
      body:
        "Hi team,\n\nWe're gathering feedback on how AI tooling and our internal platform support (or slow down) your daily work. Please reply with quick thoughts on wins, friction, and what you want us to fix next.\n\nThanks!",
    };
  }
}

export default async function FeedbackPage() {
  const { subject, body } = await loadSurveyTemplate();

  return (
    <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
      <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
      <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

      <FeedbackComposer defaultSubject={subject} defaultBody={body} />
    </div>
  );
}
