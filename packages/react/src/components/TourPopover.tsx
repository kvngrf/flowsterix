import type { ReactNode } from 'react'

import { AnimatePresence } from 'motion/react'

import { cn } from '../utils/cn'
import type {
  TourPopoverPortalProps,
  TourPopoverPortalRenderProps,
} from './TourPopoverPortal'
import { TourPopoverPortal } from './TourPopoverPortal'

export interface TourPopoverProps
  extends Omit<
    TourPopoverPortalProps,
    | 'children'
    | 'containerComponent'
    | 'contentComponent'
    | 'transitionsOverride'
  > {
  className?: string
  children: ReactNode
}

const renderDefaultShell = (
  props: TourPopoverPortalRenderProps,
  className: string | undefined,
  children: ReactNode,
) => {
  const {
    Container,
    Content,
    containerProps,
    contentProps,
    showDragHandle,
    dragHandleProps,
    descriptionProps,
    layoutMode,
    isDragging,
  } = props

  const { key: contentKey, ...restContentProps } = contentProps

  return (
    <Container
      {...containerProps}
      className={cn(
        'fixed w-max pointer-events-auto overflow-hidden',
        layoutMode === 'docked' ? 'tour-popover--docked' : null,
        layoutMode === 'manual' ? 'tour-popover--manual' : null,
        layoutMode === 'mobile' ? 'tour-popover--mobile' : null,
        className,
      )}
    >
      {descriptionProps.id && descriptionProps.text ? (
        <span id={descriptionProps.id} className="sr-only">
          {descriptionProps.text}
        </span>
      ) : null}
      <div className="relative " data-tour-popover-shell="">
        {showDragHandle ? (
          <button
            {...dragHandleProps}
            className={cn(
              'group absolute z-10 -right-3 -top-3 flex h-8 w-8 select-none items-center justify-center rounded-full bg-transparent transition-colors',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
              'hover:bg-slate-100/40',
            )}
            style={dragHandleProps.style}
            data-tour-popover-handle=""
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-400/90"
            >
              <path d="M12 2v20" />
              <path d="m15 19-3 3-3-3" />
              <path d="m19 9 3 3-3 3" />
              <path d="M2 12h20" />
              <path d="m5 9-3 3 3 3" />
              <path d="m9 5 3-3 3 3" />
            </svg>
          </button>
        ) : null}
        <AnimatePresence mode="popLayout">
          <Content key={contentKey} {...restContentProps}>
            {children}
          </Content>
        </AnimatePresence>
      </div>
    </Container>
  )
}

export const TourPopover = ({
  className,
  children,
  ...rest
}: TourPopoverProps) => {
  return (
    <TourPopoverPortal {...rest}>
      {(portalProps) => renderDefaultShell(portalProps, className, children)}
    </TourPopoverPortal>
  )
}

export type {
  TourPopoverLayoutMode,
  TourPopoverPortalProps,
  TourPopoverPortalRenderProps,
} from './TourPopoverPortal'
export { TourPopoverPortal }
