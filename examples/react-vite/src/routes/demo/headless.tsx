import { createFileRoute } from '@tanstack/react-router'
import { Play, Sparkles, Wand2 } from 'lucide-react'
import { useMemo } from 'react'

import { useTour } from '@flowsterix/headless'

import { HeadlessHUD } from '../../tour/HeadlessHUD'

export const Route = createFileRoute('/demo/headless')({
  component: HeadlessDemoPage,
})

function HeadlessDemoPage() {
  const { startFlow, activeFlowId, state } = useTour()

  const isRunning =
    state?.status === 'running' && activeFlowId === 'headless-demo'

  const cards = useMemo(
    () => [
      {
        icon: <Sparkles className="w-6 h-6 text-emerald-300" />,
        title: 'Design system ready',
        body: 'Render whatever markup and typography fits your product. Flowsterix only supplies the logic.',
        target: 'panel',
      },
      {
        icon: <Wand2 className="w-6 h-6 text-emerald-300" />,
        title: 'Extend the controls',
        body: 'Drop in your own buttons, context menus, or conditionally show multiple actions.',
        target: 'cta',
      },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 py-16 px-6">
      <HeadlessHUD />
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-6">
          <p className="text-emerald-300 uppercase tracking-[0.4em] text-sm">
            Headless mode
          </p>
          <h1 className="text-4xl md:text-5xl font-black">
            Compose your own tour HUD
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            The `@flowsterix/headless` package exposes the provider, hooks, and
            router helpers without shipping styles. Use it to draw highlights,
            popovers, and controls that perfectly match your brand.
          </p>
          <button
            type="button"
            onClick={() => startFlow('headless-demo')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-300 text-slate-900 font-semibold shadow-lg hover:bg-emerald-200 transition"
          >
            <Play className="w-5 h-5" />
            {isRunning ? 'Restart demo' : 'Start headless demo'}
          </button>
        </header>
        <div className="grid md:grid-cols-2 gap-8">
          {cards.map((card) => (
            <article
              key={card.title}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3"
              data-headless-target={
                card.target === 'panel' ? 'panel' : undefined
              }
            >
              <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center">
                {card.icon}
              </div>
              <h2 className="text-2xl font-semibold">{card.title}</h2>
              <p className="text-slate-300 leading-relaxed">{card.body}</p>
            </article>
          ))}
        </div>
        <section
          className="p-8 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-cyan-500/15 to-blue-500/10 space-y-4"
          data-headless-target="cta"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Custom CTA
          </p>
          <h2 className="text-3xl font-bold">Bring your imagination</h2>
          <p className="text-slate-100/90 text-lg leading-relaxed">
            The headless bindings keep Flowsterix&apos;s targeting and
            progression in sync, but leave the visuals to you. Render multi-step
            forms, embed videos, or hook into analytics however you like.
          </p>
        </section>
      </div>
    </div>
  )
}
