import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Settings = () => {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-tour-target="settings-card">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              The tour waits for this card to appear once the route is active.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary">Save changes</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>
              Route adapters keep step gating aligned and resume cleanly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
