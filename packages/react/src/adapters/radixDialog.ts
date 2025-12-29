import type { UseTourFocusDominanceOptions } from '../hooks/useTourFocusDominance'
import { useTourFocusDominance } from '../hooks/useTourFocusDominance'

export interface UseRadixDialogAdapterOptions
  extends UseTourFocusDominanceOptions {}

export interface RadixDialogAdapterResult {
  dialogProps: {
    modal: boolean
  }
  contentProps: {
    trapFocus: boolean
    onInteractOutside: (event: Event) => void
    onFocusOutside: (event: Event) => void
  }
  suspendExternalFocusTrap: boolean
}

export const useRadixDialogAdapter = (
  options: UseRadixDialogAdapterOptions = {},
): RadixDialogAdapterResult => {
  const { suspendExternalFocusTrap } = useTourFocusDominance(options)
  const preventDismiss = (event: Event) => {
    if (suspendExternalFocusTrap) {
      event.preventDefault()
    }
  }

  return {
    dialogProps: {
      modal: !suspendExternalFocusTrap,
    },
    contentProps: {
      trapFocus: !suspendExternalFocusTrap,
      onInteractOutside: preventDismiss,
      onFocusOutside: preventDismiss,
    },
    suspendExternalFocusTrap,
  }
}
