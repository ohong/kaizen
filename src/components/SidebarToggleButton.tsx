"use client";

import { useEffect, useState } from "react";
import { useChatContext } from "@copilotkit/react-ui";
import { isMacOS } from "@copilotkit/shared";

export function SidebarToggleButton() {
  const { open, setOpen, icons } = useChatContext();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (open) {
      setHovered(false);
    }
  }, [open]);

  const shortcutHint = typeof window !== 'undefined' && isMacOS() ? "⌘K" : "Ctrl+K";
  const tooltipText = open ? "Close Copilot" : `Open Copilot (${shortcutHint})`;
  const showTooltip = !open && hovered;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={tooltipText}
        title={tooltipText}
        className={`copilotKitButton ${open ? "open" : ""}`}
      >
        <div className="copilotKitButtonIcon copilotKitButtonIconOpen">{icons.openIcon}</div>
        <div className="copilotKitButtonIcon copilotKitButtonIconClose">{icons.closeIcon}</div>
      </button>
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)] shadow-lg">
          {shortcutHint} to open
        </div>
      )}
    </div>
  );
}
