import { createFileRoute } from '@tanstack/react-router'
import {
  Route as RouteIcon,
  Server,
  Shield,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const features = [
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: 'Powerful Server Functions',
      description:
        'Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.',
    },
    {
      icon: <Server className="w-12 h-12 text-cyan-400" />,
      title: 'Flexible Server Side Rendering',
      description:
        'Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.',
    },
    {
      icon: <RouteIcon className="w-12 h-12 text-cyan-400" />,
      title: 'API Routes',
      description:
        'Build type-safe API endpoints alongside your application. No separate backend needed.',
    },
    {
      icon: <Shield className="w-12 h-12 text-cyan-400" />,
      title: 'Strongly Typed Everything',
      description:
        'End-to-end type safety from server to client. Catch errors before they reach production.',
    },
    {
      icon: <Waves className="w-12 h-12 text-cyan-400" />,
      title: 'Full Streaming Support',
      description:
        'Stream data from server to client progressively. Perfect for AI applications and real-time updates.',
    },
    {
      icon: <Sparkles className="w-12 h-12 text-cyan-400" />,
      title: 'Next Generation Ready',
      description:
        'Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.',
    },
  ]

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      <section
        id="hero-section"
        className="relative py-20 px-6 text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src="/tanstack-circle-logo.png"
              alt="TanStack Logo"
              className="w-24 h-24 md:w-32 md:h-32"
            />
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-[-0.08em]">
              <span className="text-gray-300">TANSTACK</span>{' '}
              <span className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                START
              </span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            The framework for next generation AI applications
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Full-stack framework powered by TanStack Router for React and Solid.
            Build modern applications with server functions, streaming, and type
            safety.
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Documentation
            </a>
            <p className="text-gray-400 text-sm mt-2">
              Begin your TanStack Start journey by editing{' '}
              <code className="px-2 py-1 bg-slate-700 rounded text-cyan-400">
                /src/routes/index.tsx
              </code>
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div
          id="feature-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950/60 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto grid gap-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Deep dive
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Build onboarding that floats above sticky navbars
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            This callout sits far enough down the page to require scrolling. It
            makes a perfect target for verifying Flowster&apos;s scroll margin
            offsets when a sticky header hugs the top of the viewport.
          </p>
          <div
            id="sticky-cta-card"
            data-tour-target="sticky-cta-card"
            className="bg-linear-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 border border-cyan-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur"
          >
            <p className="text-sm font-semibold text-cyan-200 mb-2">
              Sticky header friendly
            </p>
            <h3 className="text-2xl font-semibold text-white mb-4">
              The popover won&apos;t hide behind the navigation anymore.
            </h3>
            <p className="text-gray-100/80 mb-6 leading-relaxed">
              Scroll to this card manually or let the tour auto-scroll. A
              top-only scroll margin keeps the highlight just below the sticky
              header, making the sticky chrome feel intentional instead of
              obstructive.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://flowster.dev/docs"
                className="px-5 py-2 rounded-full bg-white/90 text-slate-900 font-semibold shadow-lg hover:bg-white"
                target="_blank"
                rel="noreferrer"
              >
                Read the docs
              </a>
              <span className="px-4 py-2 rounded-full border border-white/40 text-white/80 text-sm">
                Scroll offset demo
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="h-screen py-12 px-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} TanStack, LLC. All rights reserved.
      </section>
    </div>
  )
}
