import { promises as fs } from "fs";
import path from "path";

import FeedbackPageClient from "./FeedbackPageClient";

async function loadSurveyTemplate(): Promise<string> {
  const surveyPath = path.join(process.cwd(), "emails", "survey.md");
  try {
    return await fs.readFile(surveyPath, "utf8");
  } catch (error) {
    console.error("Failed to load survey.md", error);
    return "We'd love to hear your feedback on your development experience with our team.";
  }
}

export default async function FeedbackPage() {
  const surveyBody = await loadSurveyTemplate();
  return <FeedbackPageClient defaultSurveyBody={surveyBody} />;
}
