import Link from 'next/link'

import { LaunchTourButton } from './components/launch-tour'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4"
          data-tour-target="header"
        >
          <div>
            <div className="text-sm text-muted-foreground">Flowsterix</div>
            <div className="text-lg font-semibold">Next.js App Router demo</div>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link className="text-muted-foreground hover:text-foreground" href="/">
              Home
            </Link>
            <Link
              className="text-muted-foreground hover:text-foreground"
              href="/settings"
            >
              Settings
            </Link>
          </nav>
          <LaunchTourButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Route-aware tours</CardTitle>
            <CardDescription>
              The Next.js adapter reports navigation so steps wait on the right
              path.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/settings">Go to Settings</Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Use tour targets to keep steps stable.
            </span>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tour tips</CardTitle>
              <CardDescription>
                Match the shadcn demo styling with shared UI primitives.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consistent HUD</CardTitle>
              <CardDescription>
                The registry components mirror the shadcn demo’s HUD.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </>
  )
}
