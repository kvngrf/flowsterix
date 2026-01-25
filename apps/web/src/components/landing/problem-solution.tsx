"use client";

import { motion } from "motion/react";
import { X, Check } from "lucide-react";

const problems = [
  "Tours break when users navigate",
  "State lost on page refresh",
  "Can't handle async content",
  "No graceful error recovery",
];

const solutions = [
  "Router-aware step transitions",
  "Full state persistence built-in",
  "Predicate rules wait for content",
  "State machine handles edge cases",
];

export function ProblemSolution() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why another tour library?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Most tour libraries work great in demos. Then your users start
            navigating, refreshing, and doing things you didn&apos;t expect.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Problems - Burgundy */}
          <motion.div
            className="p-6 lg:p-8 rounded-2xl bg-accent-500/5 border border-accent-500/20"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-6 text-accent-700 dark:text-accent-400">
              The Problem
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-500/20 flex items-center justify-center mt-0.5">
                    <X className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                  </span>
                  <span className="text-[var(--text-secondary)]">{problem}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions - Moss/Mint */}
          <motion.div
            className="p-6 lg:p-8 rounded-2xl bg-primary-500/5 border border-primary-500/20"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-6 text-primary-700 dark:text-primary-400">
              The Solution
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {solution}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
