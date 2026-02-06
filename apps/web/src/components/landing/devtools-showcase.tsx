'use client'

import {
  Crosshair,
  GripVertical,
  Keyboard,
  Layers,
  MousePointerClick,
  Power,
  PowerOff,
  FileJson,
  Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useDevToolsToggle } from './tour-wrapper'
import { CodeBlock } from './code-block'

const capabilities = [
  {
    icon: MousePointerClick,
    title: 'Element Grabber',
    description:
      'Click any element on the page to capture its CSS selector, React component tree, and source file location. Build tour steps visually.',
    gradient: 'from-primary-500 to-primary-600',
    shortcut: 'Ctrl+Shift+G',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop Reorder',
    description:
      'Rearrange captured steps with drag-and-drop. Export the step order as JSON or copy it to your clipboard.',
    gradient: 'from-secondary-400 to-secondary-500',
  },
  {
    icon: Layers,
    title: 'Flow Inspector',
    description:
      'View all registered flows, their status (running, paused, completed), current step, and version. Edit flow state as JSON in real time.',
    gradient: 'from-tertiary-400 to-tertiary-500',
  },
  {
    icon: FileJson,
    title: 'Export & Copy',
    description:
      'Download captured steps as a versioned JSON file or copy to clipboard. Includes selectors, component hierarchy, and source locations.',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    icon: Eye,
    title: 'Source Tracking',
    description:
      'See exactly which file and line number each element comes from. Click to open in VS Code. Traces the full React component hierarchy.',
    gradient: 'from-primary-400 to-tertiary-400',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description:
      'Ctrl+Shift+M to collapse, Ctrl+Shift+G to grab, Escape to cancel. Fully keyboard-navigable with accessibility support.',
    gradient: 'from-secondary-500 to-primary-500',
  },
]

const setupCode = `import { DevToolsProvider } from '@flowsterix/react/devtools'

function App() {
  return (
    <TourProvider flows={[myFlow]}>
      <DevToolsProvider enabled={process.env.NODE_ENV === 'development'}>
        <YourApp />
        <TourHUD />
      </DevToolsProvider>
    </TourProvider>
  )
}`

export function DevToolsShowcase() {
  const { enabled, setEnabled } = useDevToolsToggle()

  return (
    <section id="devtools" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-500/5 via-transparent to-transparent"
        aria-hidden="true"
      />

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
            className="text-sm font-medium text-accent-600 dark:text-accent-400 mb-4 tracking-wide uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Developer Tools
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Build tours{' '}
            <span className="gradient-text">visually</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Grab elements, reorder steps, inspect flows, and export
            configurations — all from a draggable panel that lives in your app.
          </p>
        </motion.div>

        {/* Live Toggle */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            onClick={() => setEnabled(!enabled)}
            className={`group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 cursor-pointer ${
              enabled
                ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/25'
                : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-accent-500/40 shadow-[var(--glow-card)] hover:shadow-[var(--glow-card-hover)]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {enabled ? (
                <motion.span
                  key="on"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Power className="w-4 h-4" />
                  DevTools Active — Check the top right corner
                </motion.span>
              ) : (
                <motion.span
                  key="off"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <PowerOff className="w-4 h-4" />
                  Try DevTools Live
                </motion.span>
              )}
            </AnimatePresence>

            {/* Pulse ring when inactive */}
            {!enabled && (
              <motion.span
                className="absolute inset-0 rounded-2xl border-2 border-accent-500/40"
                animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.button>
        </motion.div>

        {/* Capability Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-20">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative"
            >
              <div className="relative h-full p-6 lg:p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-[var(--glow-card)] hover:shadow-[var(--glow-card-hover)] hover:border-[var(--border-hover)] transition-all duration-500">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${cap.gradient} transition-transform duration-300 group-hover:scale-105`}
                  >
                    <cap.icon
                      className="w-5 h-5 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  {cap.shortcut && (
                    <kbd className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-[var(--text-tertiary)]">
                      {cap.shortcut}
                    </kbd>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                  {cap.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {cap.description}
                </p>

                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent-500/0 to-transparent group-hover:via-accent-500/50 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Setup Code + Info */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Code Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative rounded-2xl border border-[var(--border-secondary)] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 bg-[var(--bg-code)]">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent-400/10 via-primary-400/10 to-accent-400/10 rounded-3xl blur-2xl opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    providers.tsx
                  </span>
                  <div className="w-[52px]" />
                </div>
                <CodeBlock code={setupCode} showLineNumbers />
              </div>
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-3 mb-3">
                <Crosshair className="w-5 h-5 text-accent-500" />
                <h4 className="font-semibold">Zero production overhead</h4>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                DevTools ship as a separate entry point{' '}
                <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">
                  @flowsterix/react/devtools
                </code>
                . If you don&apos;t import it, it&apos;s not in your bundle. Conditional{' '}
                <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono">
                  enabled
                </code>{' '}
                prop keeps the DOM clean when disabled.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-3 mb-3">
                <Layers className="w-5 h-5 text-primary-500" />
                <h4 className="font-semibold">Shadow DOM isolation</h4>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                The DevTools panel renders in a Shadow DOM so your app&apos;s CSS never
                conflicts with the panel, and the panel&apos;s styles never leak into
                your app.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-3 mb-3">
                <Keyboard className="w-5 h-5 text-secondary-500" />
                <h4 className="font-semibold">Keyboard-first workflow</h4>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Toggle grab mode with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono">
                  Ctrl+Shift+G
                </kbd>
                , collapse the panel with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono">
                  Ctrl+Shift+M
                </kbd>
                , and save edits with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono">
                  Ctrl+S
                </kbd>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
