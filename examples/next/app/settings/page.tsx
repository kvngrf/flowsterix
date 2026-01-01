import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SettingsPage() {
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
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card data-tour-target="settings-panel">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                This card is the routed target for the tour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" type="button">
                Save changes
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
              <CardDescription>
                Tour steps can resume automatically after refresh.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </>
  )
}
