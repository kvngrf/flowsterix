'use client'

import { useTour } from '@flowsterix/react'
import { Button } from '@/components/ui/button'

export const LaunchTourButton = () => {
  const { startFlow, state } = useTour()

  return (
    <Button onClick={() => startFlow('next-demo')} type="button">
      {state?.status === 'running' ? 'Tour Running' : 'Start Tour'}
    </Button>
  )
}
