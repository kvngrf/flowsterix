import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

import { TourHUD } from '@/components/tour-hud'
import { TourProvider } from '@/components/tour-provider'
import { Button } from '@/components/ui/button'
import { useTour } from '@flowsterix/react'
import { Home } from './routes/Home'
import { Settings } from './routes/Settings'
import { demoFlow } from './tour/flows'
import { ReactRouterSync } from './tour/RouterSync'

const Header = () => {
  const { startFlow, state } = useTour()

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4"
        data-tour-target="nav"
      >
        <div>
          <div className="text-sm text-muted-foreground">Flowsterix</div>
          <div className="text-lg font-semibold">React Router Demo</div>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link className="text-muted-foreground hover:text-foreground" to="/">
            Home
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground"
            to="/settings"
          >
            Settings
          </Link>
        </nav>
        <Button onClick={() => startFlow('react-router-demo')}>
          {state?.status === 'running' ? 'Tour Running' : 'Start Tour'}
        </Button>
      </div>
    </header>
  )
}

export const App = () => {
  return (
    <TourProvider flows={[demoFlow]} storageNamespace="flowsterix-react-router">
      <BrowserRouter>
        <ReactRouterSync />
        <Header />
        <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <TourHUD overlay={{ showRing: true }} controls={{ skipMode: 'hold' }} />
      </BrowserRouter>
    </TourProvider>
  )
}
