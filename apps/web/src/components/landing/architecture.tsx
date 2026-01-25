"use client";

import { motion } from "motion/react";
import { Pause, Play, RefreshCw, Zap, Shield, Smartphone } from "lucide-react";

export function Architecture() {
  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16 lg:mb-20"
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
            State Machine Architecture
          </motion.p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="gradient-text">Pause. Navigate. Resume.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Large Feature Card - Animated Visualization */}
          <motion.div
            className="md:col-span-2 lg:col-span-2 row-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            data-tour-target="architecture"
          >
            <div className="relative h-full min-h-[400px] lg:min-h-[480px] p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-[#1a1f1c] via-[#1a1f1c] to-[#1d221e] border border-primary-800/30 overflow-hidden group">
              {/* Animated background grid - Moss tinted */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(90, 124, 101, 0.15) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(90, 124, 101, 0.15) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Glowing orb - Moss */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary-400/15 rounded-full blur-[100px]" />

              {/* Content */}
              <div className="relative z-10">
                <p className="text-zinc-400 text-sm font-medium mb-3">Live State Flow</p>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8">
                  Your tour state survives<br />
                  <span className="text-primary-400">anything</span>
                </h3>
              </div>

              {/* Animated State Visualization */}
              <div className="relative z-10 flex items-center justify-center mt-8">
                <div className="flex items-center gap-4 lg:gap-6">
                  {/* State 1: Running - Mint */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-tertiary-400/20 border border-tertiary-400/30 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-8 h-8 lg:w-10 lg:h-10 text-tertiary-300" fill="currentColor" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-primary-300/60 whitespace-nowrap">Running</span>
                    {/* Pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-tertiary-300"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>

                  {/* Arrow 1 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <svg width="40" height="20" viewBox="0 0 40 20" className="text-zinc-600">
                      <motion.path
                        d="M0 10 H30 M30 10 L24 5 M30 10 L24 15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      />
                    </svg>
                  </motion.div>

                  {/* State 2: Paused - Moss */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-primary-400/20 border border-primary-400/30 flex items-center justify-center backdrop-blur-sm">
                      <Pause className="w-8 h-8 lg:w-10 lg:h-10 text-primary-300" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-primary-300/60 whitespace-nowrap">Paused</span>
                    {/* Save indicator */}
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Shield className="w-3 h-3 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Arrow 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    <svg width="40" height="20" viewBox="0 0 40 20" className="text-zinc-600">
                      <motion.path
                        d="M0 10 H30 M30 10 L24 5 M30 10 L24 15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                      />
                    </svg>
                  </motion.div>

                  {/* State 3: Resumed - Mustard */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-secondary-400/20 border border-secondary-400/30 flex items-center justify-center backdrop-blur-sm">
                      <RefreshCw className="w-8 h-8 lg:w-10 lg:h-10 text-secondary-300" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-primary-300/60 whitespace-nowrap">Resumed</span>
                  </motion.div>
                </div>
              </div>

              {/* Floating data packets - Japandi tones */}
              <motion.div
                className="absolute bottom-20 left-20 w-3 h-3 rounded-full bg-tertiary-300"
                animate={{
                  x: [0, 100, 200, 200],
                  y: [0, -30, 0, 0],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-32 left-32 w-2 h-2 rounded-full bg-secondary-300"
                animate={{
                  x: [0, 80, 160, 160],
                  y: [0, 20, 0, 0],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Pause Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="group relative h-full p-6 lg:p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:border-primary-500/30 transition-all duration-500 overflow-hidden">
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-5  group-hover:scale-110 transition-transform duration-300">
                  <Pause className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-bold mb-2">Pause Anywhere</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Close the browser mid-tour. State persists to localStorage, API, or custom storage.
                </p>
              </div>

              {/* Corner decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors" />
            </div>
          </motion.div>

          {/* Navigate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="group relative h-full p-6 lg:p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:border-accent-500/30 transition-all duration-500 overflow-hidden">
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/0 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-5  group-hover:scale-110 transition-transform duration-300">
                  <RefreshCw className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-bold mb-2">Handle Chaos</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Route changes, refreshes, async content loading. The state machine adapts.
                </p>
              </div>

              {/* Corner decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent-500/5 rounded-full blur-2xl group-hover:bg-accent-500/10 transition-colors" />
            </div>
          </motion.div>

          {/* Wide Card - Cross Device */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="group relative h-full p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-tertiary-400/10 via-[var(--bg-elevated)] to-secondary-400/10 border border-[var(--border-primary)] hover:border-tertiary-400/30 transition-all duration-500 overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tertiary-400 to-tertiary-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Smartphone className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>

                  <h3 className="text-xl font-bold mb-2">Resume on Any Device</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Started a tour on desktop? Continue on mobile. State syncs across devices with custom persistence adapters.
                  </p>
                </div>

                {/* Device mockups */}
                <div className="flex items-end gap-3 lg:gap-4">
                  <motion.div
                    className="w-16 h-24 lg:w-20 lg:h-32 rounded-xl bg-[var(--bg-tertiary)] dark:bg-zinc-800 border border-[var(--border-secondary)] p-1"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-full h-full rounded-lg bg-[var(--bg-secondary)] dark:bg-zinc-900 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-tertiary-400 animate-pulse" />
                    </div>
                  </motion.div>
                  <motion.div
                    className="w-24 h-16 lg:w-32 lg:h-20 rounded-xl bg-[var(--bg-tertiary)] dark:bg-zinc-800 border border-[var(--border-secondary)] p-1"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  >
                    <div className="w-full h-full rounded-lg bg-[var(--bg-secondary)] dark:bg-zinc-900 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-tertiary-400 animate-pulse" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Resume Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="group relative h-full p-6 lg:p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:border-tertiary-400/30 transition-all duration-500 overflow-hidden">
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary-400/0 to-tertiary-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tertiary-400 to-tertiary-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-5 h-5 text-white" strokeWidth={2.5} fill="white" />
                </div>

                <h3 className="text-xl font-bold mb-2">Instant Resume</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Pick up exactly where users left off. No lost progress, no confusion.
                </p>

                {/* Animated checkmark */}
                <div className="mt-4 flex items-center gap-2 text-tertiary-500 dark:text-tertiary-400 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Zero-latency restore</span>
                </div>
              </div>

              {/* Corner decoration */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-tertiary-400/5 rounded-full blur-2xl group-hover:bg-tertiary-400/10 transition-colors" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
