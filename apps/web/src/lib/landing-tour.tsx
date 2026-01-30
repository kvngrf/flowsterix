"use client";

import { createFlow } from "@flowsterix/core";
import type { ReactNode } from "react";
import {
  StepContent,
  StepTitle,
  StepText,
  StepHint,
} from "@/components/step-content";

export const landingTourFlow = createFlow<ReactNode>({
  id: "landing-page-tour",
  version: { major: 1, minor: 0 },
  autoStart: true,
  hud: {
    backdrop: {
      interaction: "block",
    },
    behavior: {
      lockBodyScroll: true,
    },
  },
  steps: [
    // Step 1: Welcome (screen target, manual)
    {
      id: "welcome",
      target: "screen",
      advance: [{ type: "manual" }],
      content: (
        <StepContent>
          <StepTitle size="lg">Welcome to Flowsterix</StepTitle>
          <StepText>
            Experience a product tour built with Flowsterix. This tour will
            showcase different advance rules and features.
          </StepText>
          <StepHint>Click &quot;Next&quot; to begin the tour.</StepHint>
        </StepContent>
      ),
    },

    // Step 2: Hero code block (delay auto-advance)
    {
      id: "hero-code",
      target: { selector: "[data-tour-target='hero-code']" },
      placement: "left",
      targetBehavior: { scrollMargin: { top: 64 } },
      advance: [{ type: "delay", ms: 6000 }, { type: "manual" }],
      content: (
        <StepContent>
          <StepTitle>Declarative Flow Definition</StepTitle>
          <StepText>
            Tours are defined as simple configuration objects. No imperative
            code needed - just describe your steps and rules.
          </StepText>
          <StepHint>
            ⏱️ This step auto-advances in 6 seconds (delay rule), or click Next.
          </StepHint>
        </StepContent>
      ),
    },

    // Step 3: Features section (manual)
    {
      id: "features",
      target: { selector: "[data-tour-target='features']" },
      placement: "top",
      targetBehavior: { scrollMargin: { top: 64 } },
      advance: [{ type: "manual" }],
      content: (
        <StepContent>
          <StepTitle>Production-Ready Features</StepTitle>
          <StepText>
            5 advance rules, router integration, persistence, accessibility, and
            semantic versioning - all built-in.
          </StepText>
        </StepContent>
      ),
    },

    // Step 4: Architecture bento (event - click anywhere on target)
    {
      id: "architecture",
      target: { selector: "[data-tour-target='architecture']" },
      placement: "bottom",
      targetBehavior: { scrollMargin: { top: 64 } },
      advance: [{ type: "event", event: "click", on: "target" }, { type: "manual" }],
      content: (
        <StepContent>
          <StepTitle>State Machine Architecture</StepTitle>
          <StepText>
            Pause, navigate, resume. The state machine ensures your tours
            survive anything - refreshes, route changes, even closing the
            browser.
          </StepText>
          <StepHint>
            👆 Click anywhere on this card to continue (event rule), or use
            Next.
          </StepHint>
        </StepContent>
      ),
    },

    // Step 5: Code examples (advanceStep - component triggers advance on tab click)
    {
      id: "code-examples",
      target: { selector: "[data-tour-target='code-tabs']" },
      placement: "bottom",
      targetBehavior: { scrollMargin: { top: 64 } },
      advance: [{ type: "manual" }],
      controls: {
        next: "hidden",
      },
      content: (
        <StepContent>
          <StepTitle>Expressive API</StepTitle>
          <StepText>
            Explore the different API examples. The tabs use{" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              advanceStep()
            </code>{" "}
            to advance the tour when clicked.
          </StepText>
          <StepHint>
            👆 Click a different tab to continue.
          </StepHint>
        </StepContent>
      ),
    },

    // Step 6: Getting started (manual)
    {
      id: "getting-started",
      target: { selector: "[data-tour-target='getting-started']" },
      placement: "top",
      targetBehavior: { scrollMargin: { top: 64 } },
      advance: [{ type: "manual" }],
      content: (
        <StepContent>
          <StepTitle>Quick Installation</StepTitle>
          <StepText>
            Three simple steps: install packages, add shadcn components, and
            optionally add the AI skill for your coding assistant.
          </StepText>
        </StepContent>
      ),
    },

    // Step 7: Finish (screen target)
    {
      id: "finish",
      target: "screen",
      advance: [{ type: "manual" }],
      controls: {
        next: "hidden",
      },
      content: (
        <StepContent>
          <StepTitle size="lg">That&apos;s Flowsterix!</StepTitle>
          <StepText>
            You just experienced a tour built entirely with Flowsterix. Notice
            how the tour handled scroll, maintained state, and used different
            advance rules.
          </StepText>
          <StepText className="font-medium text-primary-600 dark:text-primary-400">
            Ready to build your own? Check out the documentation or install the
            package to get started.
          </StepText>
        </StepContent>
      ),
    },
  ],
});
