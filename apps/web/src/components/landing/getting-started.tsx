'use client'

import {
  Bot,
  Check,
  Copy,
  Palette,
  Sparkles,
  Terminal,
  Wrench,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

const installCommands = [
  {
    id: 'pnpm',
    label: 'pnpm',
    command: 'pnpm add @flowsterix/core@latest @flowsterix/react@latest motion',
  },
  {
    id: 'npm',
    label: 'npm',
    command: 'npm install @flowsterix/core@latest @flowsterix/react@latest motion',
  },
  {
    id: 'yarn',
    label: 'yarn',
    command: 'yarn add @flowsterix/core@latest @flowsterix/react@latest motion',
  },
]

export function GettingStarted() {
  const [activeManager, setActiveManager] = useState('pnpm')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const currentCommand =
    installCommands.find((pm) => pm.id === activeManager)?.command || ''

  const copyToClipboard = async ({
    text,
    index,
  }: {
    text: string
    index: number
  }) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <section id="getting-started" className="relative py-28 lg:py-36">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />

      <div className="relative max-w-7xl mx-auto px-6">
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
            Quick Start
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Get started in minutes
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Install the packages, add UI components via shadcn, and start
            building tours.
          </p>
        </motion.div>

        {/* Installation Steps */}
        <div
          className="max-w-3xl mx-auto space-y-6"
          data-tour-target="getting-started"
        >
          {/* Step 1: Install packages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--gradient-primary)] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                  Step 1
                </span>
                <h3 className="font-semibold">Install the packages</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden bg-[var(--bg-code)]">
              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-zinc-900/50">
                {installCommands.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setActiveManager(pm.id)}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                      activeManager === pm.id
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>

              {/* Command */}
              <div className="flex items-center justify-between p-4">
                <code className="text-sm text-zinc-100 font-mono">
                  <span className="text-zinc-500">$</span> {currentCommand}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard({ text: currentCommand, index: 0 })
                  }
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Copy command"
                >
                  {copiedIndex === 0 ? (
                    <Check className="w-4 h-4 text-tertiary-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Add shadcn components */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
                  Step 2
                </span>
                <h3 className="font-semibold">Add UI components via shadcn</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden bg-[var(--bg-code)]">
              <div className="flex items-center justify-between p-4">
                <code className="text-sm text-zinc-100 font-mono">
                  <span className="text-zinc-500">$</span> npx shadcn@latest add
                  https://flowsterix.com/r/tour-hud.json
                </code>
                <button
                  onClick={() =>
                    copyToClipboard({
                      text: 'npx shadcn@latest add https://flowsterix.com/r/tour-hud.json',
                      index: 1,
                    })
                  }
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Copy command"
                >
                  {copiedIndex === 1 ? (
                    <Check className="w-4 h-4 text-tertiary-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
              <div className="px-4 pb-4">
                <p className="text-xs text-zinc-500">
                  Installs overlay, popover, controls, progress, and step
                  content primitives.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 3: AI Skill (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tertiary-400 to-tertiary-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-tertiary-600 dark:text-tertiary-400">
                  Step 3 (Optional)
                </span>
                <h3 className="font-semibold">Add the AI skill</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden bg-[var(--bg-code)]">
              <div className="flex items-center justify-between p-4">
                <code className="text-sm text-zinc-100 font-mono">
                  <span className="text-zinc-500">$</span> npx skills add
                  kvngrf/flowsterix --skill flowsterix-best-practices
                </code>
                <button
                  onClick={() =>
                    copyToClipboard({
                      text: 'npx skills add kvngrf/flowsterix --skill flowsterix-best-practices',
                      index: 2,
                    })
                  }
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                  aria-label="Copy command"
                >
                  {copiedIndex === 2 ? (
                    <Check className="w-4 h-4 text-tertiary-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>
              <div className="px-4 pb-4">
                <p className="text-xs text-zinc-500">
                  Works with Claude Code, Cursor, and other AI coding
                  assistants. Provides patterns for step definitions, advance
                  rules, lifecycle hooks, and more.
                </p>
              </div>
            </div>
          </motion.div>
          {/* Step 4: DevTools (optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                  Step 4 (Optional)
                </span>
                <h3 className="font-semibold">Add DevTools for development</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden bg-[var(--bg-code)]">
              <div className="p-4">
                <code className="text-sm text-zinc-100 font-mono whitespace-pre leading-relaxed block">
                  <span className="text-zinc-500">{'// Wrap your app with DevToolsProvider'}</span>
                  {'\n'}
                  <span className="text-[#c678dd]">import</span>
                  {' { DevToolsProvider } '}
                  <span className="text-[#c678dd]">from</span>
                  {' '}
                  <span className="text-[#98c379]">{`'@flowsterix/react/devtools'`}</span>
                  {'\n\n'}
                  <span className="text-[#e5c07b]">{'<TourProvider>'}</span>
                  {'\n  '}
                  <span className="text-[#e5c07b]">{'<DevToolsProvider>'}</span>
                  {'\n    '}
                  <span className="text-zinc-400">{'<App />'}</span>
                  {'\n  '}
                  <span className="text-[#e5c07b]">{'</DevToolsProvider>'}</span>
                  {'\n'}
                  <span className="text-[#e5c07b]">{'</TourProvider>'}</span>
                </code>
              </div>
              <div className="px-4 pb-4">
                <p className="text-xs text-zinc-500">
                  Element grabber, step reordering, flow inspector, and JSON export. Tree-shakeable — zero
                  bytes in production when not imported.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[
            {
              label: 'TypeScript-first',
              color: 'bg-primary-500/10 text-primary-700 dark:text-primary-400',
            },
            {
              label: 'Tree-shakeable',
              color:
                'bg-tertiary-400/10 text-tertiary-600 dark:text-tertiary-400',
            },
            {
              label: 'shadcn compatible',
              color:
                'bg-secondary-400/10 text-secondary-700 dark:text-secondary-400',
            },
            {
              label: 'AI-ready',
              color: 'bg-accent-500/10 text-accent-700 dark:text-accent-400',
            },
          ].map((badge) => (
            <span
              key={badge.label}
              className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}
            >
              {badge.label}
            </span>
          ))}
        </motion.div>

        {/* Start Building CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-[var(--text-secondary)] mb-6">
            That&apos;s it. Start defining flows and watch tours come to life.
          </p>
          <motion.a
            href="https://github.com/kvngrf/flowsterix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--gradient-primary)] text-white font-semibold hover:brightness-110 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-4 h-4" />
            View Documentation
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
