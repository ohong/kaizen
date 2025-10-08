/**
 * Get semantic color class based on score value (0-100)
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "text-[var(--hud-text-dim)]";
  }

  if (score >= 80) {
    return "text-emerald-400";
  } else if (score >= 60) {
    return "text-blue-400";
  } else if (score >= 40) {
    return "text-amber-400";
  } else {
    return "text-red-400";
  }
}

/**
 * Get interpretation text for a score
 */
export function getScoreInterpretation(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "No data available yet";
  }

  if (score >= 80) {
    return "Excellent performance";
  } else if (score >= 60) {
    return "Good performance with room to improve";
  } else if (score >= 40) {
    return "Needs attention";
  } else {
    return "Requires immediate focus";
  }
}

/**
 * Get background color for score badge
 */
export function getScoreBgColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "bg-[var(--hud-border)]/20";
  }

  if (score >= 80) {
    return "bg-emerald-400/10";
  } else if (score >= 60) {
    return "bg-blue-400/10";
  } else if (score >= 40) {
    return "bg-amber-400/10";
  } else {
    return "bg-red-400/10";
  }
}

/**
 * Get border color for score badge
 */
export function getScoreBorderColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "border-[var(--hud-border)]";
  }

  if (score >= 80) {
    return "border-emerald-400/30";
  } else if (score >= 60) {
    return "border-blue-400/30";
  } else if (score >= 40) {
    return "border-amber-400/30";
  } else {
    return "border-red-400/30";
  }
}
