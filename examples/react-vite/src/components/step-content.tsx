'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export interface StepContentProps
  extends React.ComponentPropsWithoutRef<typeof motion.div> {}

export function StepContent({ className, ...props }: StepContentProps) {
  return (
    <motion.div layout className={cn('grid gap-3', className)} {...props} />
  )
}

export interface StepTitleProps
  extends React.ComponentPropsWithoutRef<typeof motion.h2> {
  size?: 'md' | 'lg'
}

export function StepTitle({
  className,
  size = 'md',
  ...props
}: StepTitleProps) {
  return (
    <motion.h2
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
  extends React.ComponentPropsWithoutRef<typeof motion.p> {}

export function StepText({ className, ...props }: StepTextProps) {
  return (
    <motion.p
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
}

export interface StepHintProps
  extends React.ComponentPropsWithoutRef<typeof motion.p> {}

export function StepHint({ className, ...props }: StepHintProps) {
  return (
    <motion.p
      className={cn(
        'text-sm text-muted-foreground leading-relaxed italic',
        className,
      )}
      {...props}
    />
  )
}
