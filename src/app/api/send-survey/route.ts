import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SurveyData {
  subject?: string;
  title?: string;
  message?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

interface SurveySendResult {
  email: string;
  messageId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, surveyData } = body as { recipients: string[]; surveyData?: SurveyData };

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Send emails to all recipients
    const results = await Promise.allSettled(
      recipients.map(async (email: string) => {
        const { data, error } = await resend.emails.send({
          from: "Kaizen <send@markmdev.com>", // Update this to your verified domain
          to: [email],
          subject: surveyData?.subject || "Developer Experience Survey - Your Feedback Matters",
          html: generateSurveyEmailHTML(surveyData),
        });

        if (error) {
          console.error(`Failed to send to ${email}:`, error);
          throw error;
        }

        return { email, messageId: data?.id };
      })
    );

    // Separate successful and failed sends
    const successful = results
      .filter((result): result is PromiseFulfilledResult<SurveySendResult> => result.status === "fulfilled")
      .map((result) => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result, index) => ({
        email: recipients[index],
        error: result.reason,
      }));

    return NextResponse.json({
      success: true,
      sent: successful.length,
      failedCount: failed.length,
      successful,
      failed,
      message: `Successfully sent ${successful.length} out of ${recipients.length} emails`,
    });
  } catch (error) {
    console.error("Error sending survey emails:", error);
    return NextResponse.json(
      {
        error: "Failed to send survey emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function generateSurveyEmailHTML(surveyData?: SurveyData): string {
  const title = surveyData?.title || "Developer Experience Survey";
  const message =
    surveyData?.message ||
    "We'd love to hear your feedback on your development experience with our team.";
  const ctaUrl = surveyData?.ctaUrl || "https://forms.gle/example";
  const ctaLabel = surveyData?.ctaLabel || "Take Survey (5 minutes)";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 3px solid #00ff88;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #0a0a0a;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .message {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background-color: #00ff88;
      color: #0a0a0a;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: background-color 0.3s ease;
    }
    .cta-button:hover {
      background-color: #00cc6a;
    }
    .questions {
      background-color: #f8f9fa;
      border-left: 4px solid #00ff88;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .question {
      margin-bottom: 15px;
    }
    .question-title {
      font-weight: 600;
      color: #0a0a0a;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    .logo {
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #00ff88;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">KAIZEN</div>
      <h1>${title}</h1>
      <p class="subtitle">Your feedback helps us improve continuously</p>
    </div>
    
    <div class="content">
      <p class="message">${message}</p>
      
      <div class="questions">
        <div class="question">
          <div class="question-title">📊 How would you rate your overall development experience?</div>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Scale: 1 (Poor) to 5 (Excellent)</p>
        </div>
        
        <div class="question">
          <div class="question-title">⚡ What's working well in our current workflow?</div>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Share what you appreciate about the team's processes</p>
        </div>
        
        <div class="question">
          <div class="question-title">🔧 What could be improved?</div>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Help us identify pain points and bottlenecks</p>
        </div>
        
        <div class="question">
          <div class="question-title">💡 Any suggestions for tools or practices?</div>
          <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">We're always looking to adopt better solutions</p>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="${ctaUrl}" class="cta-button">${ctaLabel}</a>
      </p>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Your responses are confidential and will be used to improve our team's development experience and processes.
      </p>
    </div>
    
    <div class="footer">
      <p>Sent via Kaizen Control Tower</p>
      <p>This is an automated survey. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
