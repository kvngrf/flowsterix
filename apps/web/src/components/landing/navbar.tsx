"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/70 border-b border-[var(--border-primary)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold gradient-text">
            Flowsterix
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/kvngrf/flowsterix"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
