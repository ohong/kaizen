"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CopilotSidebar } from "@copilotkit/react-ui";

import { FeedbackComposer, FeedbackInsights } from "./FeedbackComposer";
import { SidebarToggleButton } from "@/components/SidebarToggleButton";

// Dummy emails + one real email
const AVAILABLE_EMAILS = [
  "javokhir@raisedash.com", // Real email
  "alice.anderson@example.com",
  "bob.builder@example.com",
  "charlie.chen@example.com",
  "diana.davis@example.com",
  "evan.edwards@example.com",
  "fiona.fisher@example.com",
  "george.garcia@example.com",
  "hannah.harris@example.com",
  "ian.irwin@example.com",
  "julia.johnson@example.com",
  "kevin.kim@example.com",
  "laura.lopez@example.com",
  "michael.martinez@example.com",
  "nina.nguyen@example.com",
  "oliver.owen@example.com",
  "patricia.patel@example.com",
  "quinn.quinn@example.com",
  "rachel.rodriguez@example.com",
  "samuel.smith@example.com",
  "tina.taylor@example.com",
];

interface SurveyData {
  subject: string;
  message: string;
}

interface FeedbackPageClientProps {
  defaultSurveyBody: string;
}

export default function FeedbackPageClient({ defaultSurveyBody }: FeedbackPageClientProps) {
  const router = useRouter();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showEmailSelector, setShowEmailSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      sent?: number;
      successful?: { email: string; messageId?: string }[];
      failed?: { email: string; error: unknown }[];
    };
  } | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const [surveyData, setSurveyData] = useState<SurveyData>({
    subject: "Developer Experience Survey - Your Feedback Matters",
    message: defaultSurveyBody,
  });

  const filteredEmails = AVAILABLE_EMAILS.filter((email) =>
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const selectAll = () => {
    setSelectedEmails(filteredEmails);
  };

  const clearAll = () => {
    setSelectedEmails([]);
  };

  const handleSendSurvey = async () => {
    if (selectedEmails.length === 0) {
      setSendResult({
        success: false,
        message: "Please select at least one recipient",
      });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/send-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: selectedEmails,
          surveyData: {
            ...surveyData,
            title: "Developer Experience Survey",
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: data.message || "Survey sent successfully!",
          details: data,
        });
        // Clear selections after successful send
        setTimeout(() => {
          setSelectedEmails([]);
          setShowEmailSelector(false);
        }, 3000);
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to send survey",
          details: data,
        });
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: "Network error occurred while sending survey",
        details: { sent: 0, failed: [{ email: 'unknown', error: error instanceof Error ? error.message : String(error) }] },
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <CopilotSidebar
      clickOutsideToClose={false}
      defaultOpen={false}
      shortcut="k"
      Button={SidebarToggleButton}
      labels={{
        title: "Kaizen AI",
        initial: `Hi, I'm Kaizen! I can help you craft better developer surveys and analyze feedback.

**What I can do:**
- **Draft survey questions**: Help create targeted questions for your team
- **Analyze feedback**: Understand patterns in developer responses
- **Suggest improvements**: Recommend follow-up questions or areas to explore

**Start by asking:**
- "Help me write a survey about deployment friction"
- "What questions should I ask about code review experience?"
- "How can I measure developer satisfaction with our tools?"`
      }}
    >
      <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
        {/* Corner decorations */}
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--hud-border)] bg-[var(--hud-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Back to dashboard">
              <Image
                src="/logo.png"
                alt="Kaizen"
                width={140}
                height={40}
                className="h-10 w-auto opacity-90"
              />
            </Link>
            <div className="hidden h-8 w-px bg-[var(--hud-border)] md:block" />
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--hud-text-dim)]">
              <span className="text-[var(--hud-accent)]">▸</span> Feedback Survey
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-8 py-12">
        {/* Page Title */}
        <section className="hud-panel hud-corner hud-scanline mb-10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                ◢ Survey Management
              </div>
              <h1 className="mt-2 text-4xl font-semibold text-[var(--hud-text-bright)]">
                Developer Experience Survey
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-[var(--hud-text-dim)]">
                Send feedback surveys to your team members to gather insights on development
                experience, workflow efficiency, and areas for improvement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInsights((prev) => !prev)}
              className="border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
            >
              {showInsights ? "Back to Compose" : "View Insights"}
            </button>
          </div>
        </section>

        {/* Feedback Modules */}
        <div className="mb-10">
          {showInsights ? (
            <FeedbackInsights />
          ) : (
            <FeedbackComposer
              subject={surveyData.subject}
              body={surveyData.message}
              onChange={({ subject, body }) =>
                setSurveyData((prev) => ({
                  subject: subject ?? prev.subject,
                  message: body ?? prev.message,
                }))
              }
            />
          )}
        </div>

        {!showInsights && (
          <>
            {/* Recipients Section */}
            <section className="hud-panel hud-corner mb-6 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">
                    Recipients
                  </h2>
                  <p className="mt-1 text-sm text-[var(--hud-text-dim)]">
                    {selectedEmails.length} email{selectedEmails.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailSelector(!showEmailSelector)}
                  className="border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
                >
                  {showEmailSelector ? "Hide Recipients" : "Select Recipients"}
                </button>
              </div>

              {/* Selected Emails Display */}
              {selectedEmails.length > 0 && (
                <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
                  <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                    Selected Recipients
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 rounded-md border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10 px-3 py-1.5 text-sm"
                      >
                        <span className="text-[var(--hud-text)]">{email}</span>
                        <button
                          type="button"
                          onClick={() => toggleEmail(email)}
                          className="text-[var(--hud-accent)] hover:text-[var(--hud-text-bright)]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Selector */}
              {showEmailSelector && (
                <div className="rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={selectAll}
                      className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-danger)]/60 hover:text-[var(--hud-danger)]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {filteredEmails.map((email) => {
                      const isSelected = selectedEmails.includes(email);
                      const isRealEmail = email === "javokhir@raisedash.com";

                      return (
                        <button
                          key={email}
                          type="button"
                          onClick={() => toggleEmail(email)}
                          className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-[var(--hud-accent)]/50 bg-[var(--hud-accent)]/10"
                              : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] hover:border-[var(--hud-accent)]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-[var(--hud-accent)] bg-[var(--hud-accent)]"
                                  : "border-[var(--hud-border)] bg-[var(--hud-bg)]"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="h-3 w-3 text-[var(--hud-bg)]"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-[var(--hud-text)]">
                              {email}
                            </span>
                            {isRealEmail && (
                              <span className="rounded-full border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-accent)]">
                                Real
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Send Result */}
            {sendResult && (
              <section
                className={`hud-panel hud-corner mb-6 p-6 ${
                  sendResult.success
                    ? "border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/5"
                    : "border border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-2xl ${
                      sendResult.success
                        ? "text-[var(--hud-accent)]"
                        : "text-[var(--hud-danger)]"
                    }`}
                  >
                    {sendResult.success ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold ${
                        sendResult.success
                          ? "text-[var(--hud-accent)]"
                          : "text-[var(--hud-danger)]"
                      }`}
                    >
                      {sendResult.success ? "Success!" : "Error"}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--hud-text)]">
                      {sendResult.message}
                    </p>
                    {sendResult.details?.successful && (
                      <div className="mt-3">
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                          Sent to {sendResult.details.sent} recipient
                          {sendResult.details.sent !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                    {sendResult.details?.failed && sendResult.details.failed.length > 0 && (
                      <div className="mt-3">
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-danger)]">
                          Failed: {sendResult.details.failed.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Send Button */}
            <section className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-8 py-3 font-mono text-sm uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendSurvey}
                disabled={sending || selectedEmails.length === 0}
                className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-8 py-3 font-mono text-sm uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Sending..." : `Send Survey (${selectedEmails.length})`}
              </button>
            </section>
          </>
        )}
      </main>
      </div>
    </CopilotSidebar>
  );
}
