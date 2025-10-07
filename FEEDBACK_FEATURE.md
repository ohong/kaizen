# Feedback Survey Feature

## Overview
The feedback page allows you to send developer experience surveys to team members via email using Resend. It also includes an insights dashboard showing AI-generated feedback analysis.

## Features
- ✅ Beautiful, modern UI matching the Kaizen design system
- ✅ Email selection with search functionality
- ✅ Customizable survey content (subject, title, message)
- ✅ Dummy emails + one real email (javokhir@raisedash.com)
- ✅ Bulk send with individual email tracking
- ✅ Success/error feedback with detailed results
- ✅ Professional HTML email template
- ✅ Integrated feedback insights dashboard
- ✅ Toggle between survey sending and insights view

## Setup

### 1. Install Dependencies
The required packages are already installed:
```bash
npm install resend @react-email/render @react-email/components
```

### 2. Configure Resend API Key
Add your Resend API key to `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Update Email Domain
In `src/app/api/send-survey/route.ts`, update the `from` field with your verified domain:

```typescript
from: "Kaizen <noreply@yourdomain.com>", // Update this
```

**Note**: For development/testing, you can use `onboarding@resend.dev` which is provided by Resend for testing purposes.

## Usage

### Access the Page
Navigate to `/survey` or click the "Survey" button in the dashboard header.

### Send a Survey
1. Customize the survey content (optional)
2. Click "Select Recipients" to show the email list
3. Search and select recipients (or use "Select All")
4. Click "Send Survey" to send emails

### Email List
- **Real email**: javokhir@raisedash.com (marked with "Real" badge)
- **Dummy emails**: 20 example emails for testing

## API Endpoint

### POST `/api/send-survey`

**Request Body:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "surveyData": {
    "subject": "Developer Experience Survey",
    "title": "Survey Title",
    "message": "Introduction message"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "sent": 2,
  "failedCount": 0,
  "successful": [
    { "email": "email1@example.com", "messageId": "msg_123" },
    { "email": "email2@example.com", "messageId": "msg_456" }
  ],
  "failed": [],
  "message": "Successfully sent 2 out of 2 emails"
}
```

**Response (Error):**
```json
{
  "error": "Failed to send survey emails",
  "details": "Error message"
}
```

## Email Template
The email includes:
- Professional HTML design
- Survey questions preview
- Call-to-action button
- Kaizen branding
- Responsive layout

## Testing
1. Make sure your Resend API key is configured
2. Navigate to `/survey`
3. Select the real email (javokhir@raisedash.com)
4. Customize the content if desired
5. Click "Send Survey"
6. Check the inbox for the email

## Notes
- Emails are sent individually to each recipient
- Failed sends are tracked and reported
- The UI provides real-time feedback on send status
- All emails are sent asynchronously with Promise.allSettled
- The real email is highlighted with a badge for easy identification
