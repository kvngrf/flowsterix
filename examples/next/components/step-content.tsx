'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function StepContent({ className, ...props }: StepContentProps) {
  return <div className={cn('grid gap-3', className)} {...props} />
}

export interface StepTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'md' | 'lg'
}

export function StepTitle({
  className,
  size = 'md',
  ...props
}: StepTitleProps) {
  return (
    <h2
      className={cn(
        size === 'lg' ? 'text-xl' : 'text-lg',
        'font-semibold leading-tight',
        className,
      )}
      {...props}
    />
  )
}

export interface StepTextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function StepText({ className, ...props }: StepTextProps) {
  return (
    <p
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
}

export interface StepHintProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function StepHint({ className, ...props }: StepHintProps) {
  return (
    <p
      className={cn(
        'text-sm text-muted-foreground leading-relaxed italic',
        className,
      )}
      {...props}
    />
  )
}
