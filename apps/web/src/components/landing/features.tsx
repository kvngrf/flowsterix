"use client";

import {
  Workflow,
  MousePointerClick,
  GitBranch,
  Navigation,
  Accessibility,
  Database,
} from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Workflow,
    title: "Declarative Flows",
    description:
      "Define tours as data, not imperative code. Flows are serializable, versionable, and easy to maintain.",
    gradient: "from-primary-500 to-primary-600",
  },
  {
    icon: MousePointerClick,
    title: "5 Advance Rules",
    description:
      "Manual, Event, Delay, Predicate, and Route. Mix and match to create exactly the flow you need.",
    gradient: "from-secondary-400 to-secondary-500",
  },
  {
    icon: GitBranch,
    title: "Semantic Versioning",
    description:
      "Migrate users gracefully when tours change. Resume interrupted flows from exactly where they left off.",
    gradient: "from-tertiary-400 to-tertiary-500",
  },
  {
    icon: Navigation,
    title: "Router Integration",
    description:
      "Built-in adapters for TanStack Router, React Router, and Next.js. Route changes don't break your tours.",
    gradient: "from-primary-400 to-tertiary-400",
  },
  {
    icon: Accessibility,
    title: "Accessibility First",
    description:
      "Focus trapping, ARIA labels, keyboard navigation, and reduced motion support built-in.",
    gradient: "from-accent-500 to-accent-600",
  },
  {
    icon: Database,
    title: "Full Persistence",
    description:
      "localStorage, API, or custom adapters. State is automatically saved and restored.",
    gradient: "from-secondary-500 to-primary-500",
  },
];

export function Features() {
  return (
    <section className="relative py-28 lg:py-36">
      {/* Background gradient */}
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
            Features
          </motion.p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Built for production
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Everything you need to create product tours that survive the
            real-world chaos of async content, navigation, and interrupted
            sessions.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6" data-tour-target="features">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative"
            >
              <div className="relative h-full p-6 lg:p-8 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-[var(--glow-card)] hover:shadow-[var(--glow-card-hover)] hover:border-[var(--border-hover)] transition-all duration-500">
                {/* Icon with gradient background */}
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5 transition-transform duration-300 group-hover:scale-105`}
                >
                  <feature.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Subtle hover indicator */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary-500/0 to-transparent group-hover:via-primary-500/50 transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
