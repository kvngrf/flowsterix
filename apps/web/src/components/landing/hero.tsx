"use client";

import { Github, ArrowRight } from "lucide-react";
import { CodeBlock } from "./code-block";
import { StartTourButton } from "./tour-wrapper";
import { motion } from "motion/react";

const heroCode = `import { createFlow } from "@flowsterix/core";

const onboardingFlow = createFlow({
  id: "welcome-tour",
  version: { major: 1, minor: 0 },
  steps: [
    {
      id: "welcome",
      target: { selector: "#welcome-banner" },
      advance: [{ type: "manual" }],
    },
    {
      id: "explore-features",
      target: { selector: "#features" },
      advance: [{ type: "delay", ms: 3000 }],
    },
    {
      id: "try-demo",
      target: { selector: "#demo-button" },
      advance: [{
        type: "event",
        event: "click",
        on: "target",
      }],
    },
  ],
});`;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 bg-[var(--gradient-hero)]"
        aria-hidden="true"
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px),
                           linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Floating orbs - Moss and Mint for flow feeling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-300/25 dark:bg-primary-400/15 blur-[120px]"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-tertiary-300/20 dark:bg-tertiary-400/12 blur-[120px]"
          animate={{
            y: [0, -40, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-[300px] h-[300px] rounded-full bg-secondary-300/15 dark:bg-secondary-400/10 blur-[100px]"
          animate={{
            y: [0, -20, 0],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/20 text-primary-700 dark:text-primary-400 text-sm font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              State-machine powered
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Product tours that{" "}
              <span className="gradient-text">feel native</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              A state-machine architecture that handles real-world complexity.
              Navigation changes, async content, and interrupted flows{" "}
              <span className="text-[var(--text-primary)] font-medium">
                just work
              </span>
              .
            </p>

            <div className="flex flex-wrap gap-3">
              <motion.a
                href="#getting-started"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <StartTourButton />
              <motion.a
                href="https://github.com/kvngrf/flowsterix"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Github className="w-5 h-5" />
                GitHub
              </motion.a>
            </div>
          </motion.div>

          {/* Right: Code */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
            data-tour-target="hero-code"
          >
            {/* Glow behind code block */}
            <div
              className="absolute -inset-4 bg-gradient-to-r from-primary-400/15 via-tertiary-300/15 to-primary-400/15 rounded-3xl blur-2xl opacity-70 dark:opacity-50"
              aria-hidden="true"
            />
            <div className="relative rounded-2xl border border-[var(--border-secondary)] shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden bg-[var(--bg-code)]">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs text-zinc-500 font-mono">flow.ts</span>
                <div className="w-[52px]" /> {/* Spacer for centering */}
              </div>
              <CodeBlock code={heroCode} showLineNumbers />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
