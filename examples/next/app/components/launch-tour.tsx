'use client'

import { useTour } from '@/hooks/use-tour'
import { Button } from '@/components/ui/button'

export const LaunchTourButton = () => {
  const { startFlow, state } = useTour()

  return (
    <Button onClick={() => startFlow('next-demo')} type="button">
      {state?.status === 'running' ? 'Tour Running' : 'Start Tour'}
    </Button>
  )
}
