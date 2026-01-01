import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Home = () => {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Guide users across routes</CardTitle>
          <CardDescription>
            This example shows how tours stay in sync with navigation when you
            mount the React Router adapter.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Tip: Try the tour after switching routes.
          </span>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route-aware steps</CardTitle>
            <CardDescription>
              Wait for the correct path before resuming a step.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Targeted highlights</CardTitle>
            <CardDescription>
              Use data attributes for stable targeting across views.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </section>
  )
}
