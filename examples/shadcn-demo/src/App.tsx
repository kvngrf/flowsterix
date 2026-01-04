'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

import { createFlow } from '@flowsterix/core'
import { useRadixDialogAdapter, useTour } from '@flowsterix/react'
import { Bell, Settings, User, Zap } from 'lucide-react'

import { StepContent, StepText, StepTitle } from '@/components/step-content'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { DelayProgressBar } from './components/delay-progress-bar'
import { TourHUD } from './components/tour-hud'
import { TourProvider } from './components/tour-provider'
import { Button } from './components/ui/button'

// Helper to wait for next animation frame + microtask flush
const waitForDom = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0)),
  )

// Helper functions to interact with the dialog via DOM
const isDialogOpen = () =>
  document.querySelector('#dialog-settings-content') !== null

const openDialog = async () => {
  if (isDialogOpen()) return
  // Give any in-flight UI click a frame to open the dialog before toggling.
  await waitForDom()
  if (isDialogOpen()) return
  const trigger = document.querySelector<HTMLButtonElement>('#settings-trigger')
  trigger?.click()
  await waitForDom()
}

const closeDialog = async () => {
  if (isDialogOpen()) {
    // Press Escape to close the Radix dialog
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await waitForDom()
  }
}

// Create flow with DOM-based dialog control
const demoFlow = createFlow<ReactNode>({
  id: 'demo-onboarding',
  hud: {
    behavior: { lockBodyScroll: true },
    backdrop: { interaction: 'block' },
  },
  resumeStrategy: 'current',
  autoStart: true,
  version: 1,
  steps: [
    {
      id: 'welcome',
      target: 'screen',
      content: (
        <StepContent>
          <StepTitle size="lg">Welcome to Flowsterix! 🎉</StepTitle>
          <StepText>
            Let&apos;s take a quick tour of the features. This will only take a
            minute.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'header',
      target: { selector: '#demo-header' },
      content: (
        <StepContent>
          <StepTitle>Navigation Header</StepTitle>
          <StepText>
            Your main navigation hub. Quick access to all features from here.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'user-avatar',
      target: { selector: '#user-avatar' },
      content: (
        <StepContent>
          <StepTitle>Your Profile</StepTitle>
          <StepText>
            Click your avatar to access profile settings, preferences, and sign
            out.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'notifications',
      target: { selector: '#notifications-btn' },
      content: (
        <StepContent>
          <StepTitle>Notifications</StepTitle>
          <StepText>
            Stay updated with real-time notifications. The badge shows unread
            count.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'stats-cards',
      target: { selector: '#stats-section' },
      content: (
        <StepContent>
          <StepTitle>Dashboard Stats</StepTitle>
          <StepText>
            Monitor your key metrics at a glance. Cards update in real-time.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'tabs-demo',
      target: { selector: '#content-tabs' },
      content: (
        <StepContent>
          <StepTitle>Content Tabs</StepTitle>
          <StepText>
            Switch between different views. Try clicking the tabs!
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'settings-dialog',
      target: { selector: '#settings-trigger' },
      content: (
        <StepContent>
          <StepTitle>Settings</StepTitle>
          <StepText>
            Click this button to open the settings dialog. Tours can guide users
            through modals too!
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'event', event: 'click', on: 'target' }],
    },
    {
      id: 'inside-dialog',
      target: { selector: '#dialog-settings-content' },
      content: (
        <StepContent>
          <StepTitle>Inside the Modal</StepTitle>
          <StepText>
            Flowsterix can highlight elements inside dialogs and modals
            seamlessly. Click Next to continue.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
      onEnter: openDialog,
      onResume: openDialog,
      onExit: closeDialog,
    },
    {
      id: 'auto-progress',
      target: 'screen',
      content: (
        <StepContent>
          <StepTitle>Auto-Advance Demo ⏱️</StepTitle>
          <StepText>
            This step auto-advances after 3 seconds. Great for announcements or
            tips!
          </StepText>
          <DelayProgressBar />
        </StepContent>
      ),
      advance: [{ type: 'delay', ms: 3000 }],
      onResume: closeDialog,
    },
    {
      id: 'feature-card',
      target: { selector: '#feature-card' },
      content: (
        <StepContent>
          <StepTitle>Feature Highlights</StepTitle>
          <StepText>
            Key features are showcased here. Hover for more details.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
    {
      id: 'cta-button',
      target: { selector: '#cta-button' },
      content: (
        <StepContent>
          <StepTitle>Ready to Go!</StepTitle>
          <StepText>
            That&apos;s it! Click &quot;Get Started&quot; to begin using the
            app, or finish this tour.
          </StepText>
        </StepContent>
      ),
      advance: [{ type: 'manual' }],
    },
  ],
})

function StartTourButton() {
  const { startFlow, state } = useTour()
  const isRunning = state?.status === 'running'

  return (
    <Button
      onClick={() => startFlow('demo-onboarding', { resume: true })}
      disabled={isRunning}
      size="sm"
    >
      <Zap className="size-4" />
      Start Tour
    </Button>
  )
}

function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const { dialogProps, contentProps } = useRadixDialogAdapter({
    disableEscapeClose: true,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...dialogProps}>
      <DialogTrigger asChild>
        <Button id="settings-trigger" variant="outline" size="icon-sm">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" {...contentProps}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your experience with these options.
          </DialogDescription>
        </DialogHeader>
        <div id="dialog-settings-content" className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Dark Mode</label>
              <p className="text-muted-foreground text-xs">
                Switch to dark theme
              </p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Notifications</label>
              <p className="text-muted-foreground text-xs">
                Receive push notifications
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Storage Used</label>
            <Progress value={68} className="h-2" />
            <p className="text-muted-foreground text-xs">68% of 10GB used</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <TourProvider flows={[demoFlow]}>
      <div className="bg-background text-foreground min-h-screen">
        {/* Header */}
        <header id="demo-header" className="bg-card border-b px-6 py-3">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Flowsterix</h1>
              <Badge variant="secondary">Demo</Badge>
            </div>
            <div className="flex items-center gap-3">
              <StartTourButton />
              <Button
                id="notifications-btn"
                variant="outline"
                size="icon-sm"
                className="relative"
              >
                <Bell className="size-4" />
                <span className="bg-destructive absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] text-white">
                  3
                </span>
              </Button>
              <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              />
              <Avatar id="user-avatar" className="size-8 cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-5xl space-y-8 p-6">
          {/* Hero section */}
          <section className="space-y-4 text-center">
            <h2 className="text-3xl font-bold">Shadcn Registry Components</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Build beautiful product tours using copy-paste components from the
              Flowsterix shadcn registry. Click "Start Tour" to see it in
              action!
            </p>
          </section>

          {/* Stats cards */}
          <section id="stats-section" className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl">12,543</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Tours</CardDescription>
                <CardTitle className="text-2xl">847</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  +5% from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completion Rate</CardDescription>
                <CardTitle className="text-2xl">94.2%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  Above industry avg
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Tabs section */}
          <Tabs id="content-tabs" defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back!</CardTitle>
                  <CardDescription>
                    Here's what's happening with your tours today.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Onboarding Tour</span>
                      <Badge>Active</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Feature Announcement</span>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Help Guide</span>
                      <Badge variant="secondary">Paused</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Tour performance metrics and insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Analytics content goes here...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    Download and schedule reports.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Reports content goes here...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Feature card */}
          <Card id="feature-card">
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
              <CardDescription>
                Everything you need to build amazing product tours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    ✓
                  </Badge>
                  Headless architecture - full styling control
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    ✓
                  </Badge>
                  Smart positioning with Floating UI
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    ✓
                  </Badge>
                  Smooth animations with Motion
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    ✓
                  </Badge>
                  Accessibility built-in (ARIA, keyboard nav)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">
                    ✓
                  </Badge>
                  Modal & dialog support
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button id="cta-button" size="lg">
              <Zap className="size-4" />
              Get Started
            </Button>
          </div>
        </main>

        {/* Tour HUD */}
        <TourHUD overlay={{ showRing: true }} controls={{ skipMode: 'hold' }} />
      </div>
    </TourProvider>
  )
}

export default App
