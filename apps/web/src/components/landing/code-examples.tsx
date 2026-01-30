"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTour } from "@flowsterix/react";
import { CodeBlock } from "./code-block";

const examples = [
  {
    id: "basic",
    label: "Basic Flow",
    filename: "app.tsx",
    code: `import { TourProvider } from "@flowsterix/react";
import { TourHUD } from "@/components/tour-hud";
import { createFlow } from "@flowsterix/core";

const welcomeFlow = createFlow({
  id: "welcome",
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: "step-1",
      target: { selector: "#welcome-message" },
      advance: [{ type: "manual" }],
    },
    {
      id: "step-2",
      target: { selector: "#main-feature" },
      advance: [{ type: "manual" }],
    },
  ],
});

function App() {
  return (
    <TourProvider flows={[welcomeFlow]}>
      <YourApp />
      <TourHUD />
    </TourProvider>
  );
}`,
  },
  {
    id: "advance-rules",
    label: "Advance Rules",
    filename: "rules.ts",
    code: `// Manual - user clicks "Next"
advance: [{ type: "manual" }]

// Event - waits for DOM event
advance: [{
  type: "event",
  event: "click",
  on: "target",
}]

// Delay - auto-advances after time
advance: [{ type: "delay", ms: 5000 }]

// Predicate - advances when condition is true
advance: [{
  type: "predicate",
  check: () => formData.email !== "",
}]

// Route - waits for navigation
advance: [{
  type: "route",
  to: "/dashboard",
}]

// Programmatic - component triggers advance
const { advanceStep } = useTour()
advanceStep("step-id") // only if on that step`,
  },
  {
    id: "lifecycle",
    label: "Lifecycle Hooks",
    filename: "hooks.ts",
    code: `const flow = createFlow({
  id: "feature-tour",
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: "intro",
      target: { selector: "#feature-intro" },
      advance: [{ type: "manual" }],
      onEnter: async () => {
        // Track analytics
        analytics.track("tour_step_viewed", {
          step: "intro",
        });
      },
      onExit: async () => {
        // Cleanup or prepare next step
        await preloadNextStepContent();
      },
    },
  ],
});`,
  },
  {
    id: "router",
    label: "Router Integration",
    filename: "router.tsx",
    code: `// Next.js App Router
import { useNextAppRouterAdapter } from "@flowsterix/react";

function Providers({ children }) {
  const routerAdapter = useNextAppRouterAdapter();

  return (
    <TourProvider
      flows={[myFlow]}
      routerAdapter={routerAdapter}
    >
      {children}
    </TourProvider>
  );
}

// TanStack Router
import { useTanStackRouterAdapter } from "@flowsterix/react";

const routerAdapter = useTanStackRouterAdapter(router);

// React Router
import { useReactRouterAdapter } from "@flowsterix/react";

const routerAdapter = useReactRouterAdapter();`,
  },
];

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState("basic");
  const { advanceStep } = useTour();

  const activeExample = examples.find((e) => e.id === activeTab);

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTab) {
      // Advance the tour if on the "code-examples" step
      advanceStep("code-examples");
    }
    setActiveTab(tabId);
  };

  return (
    <section className="relative py-28 lg:py-36 bg-[var(--bg-secondary)]">
      {/* Background gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-500/5 via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.p
            className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-4 tracking-wide uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Developer Experience
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Expressive, declarative API
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Write tours as configuration, not imperative code. Everything is
            TypeScript-first with full autocompletion.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
          data-tour-target="code-section"
        >
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6" data-tour-target="code-tabs">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => handleTabClick(example.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === example.id
                    ? "bg-[var(--gradient-primary)] text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-[var(--text-secondary)] hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-[var(--text-primary)]"
                }`}
              >
                {example.label}
              </button>
            ))}
          </div>

          {/* Code panel */}
          <div className="relative rounded-2xl border border-[var(--border-secondary)] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 bg-[var(--bg-code)]" data-tour-target="code-examples">
            {/* Glow effect */}
            <div
              className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />

            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {activeExample?.filename}
              </span>
              <div className="w-[52px]" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CodeBlock
                  code={activeExample?.code || ""}
                  showLineNumbers
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
