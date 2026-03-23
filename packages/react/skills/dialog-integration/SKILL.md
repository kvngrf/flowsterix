---
name: dialog-integration
description: Radix dialog integration for Flowsterix tours using useRadixTourDialog and useRadixDialogAdapter. Use when tour steps target elements inside Radix UI dialogs, or when managing dialog open/close state during tours.
metadata:
  sources:
    - docs/guides/accessibility.md
---

# Dialog Integration

Use `useRadixTourDialog` for declarative dialog control during tours. This hooks automatically manages open/close state, focus trapping, and step-dialog coordination.

## Setup

```tsx
import { createFlow } from '@flowsterix/core'
import { useRadixTourDialog } from '@flowsterix/react'
import * as Dialog from '@radix-ui/react-dialog'

// 1. Configure dialogs in flow definition
const flow = createFlow({
  id: 'onboarding',
  version: { major: 1, minor: 0 },
  dialogs: {
    settings: {
      autoOpen: true,
      autoClose: 'differentDialog',
      onDismissGoToStepId: 'settings-trigger',
    },
  },
  steps: [
    { id: 'settings-trigger', target: '#settings-btn', content: 'Click here' },
    { id: 'settings-tab1', dialogId: 'settings', target: '#tab1', content: 'First tab' },
    { id: 'settings-tab2', dialogId: 'settings', target: '#tab2', content: 'Second tab' },
    // Dialog stays open for consecutive steps with same dialogId
    { id: 'done', target: 'screen', content: 'All done' },
    // Dialog auto-closes when entering 'done' (no dialogId)
  ],
})

// 2. Use hook in your dialog component
function SettingsDialog({ children }) {
  const {
    isStepActive,    // true when current step has this dialogId
    shouldBeOpen,    // computed open state
    onOpenChange,    // call when dialog state changes
    dialogProps,     // { open, onOpenChange, modal }
    contentProps,    // { trapFocus, onInteractOutside, onFocusOutside, onEscapeKeyDown }
  } = useRadixTourDialog({ dialogId: 'settings' })

  return (
    <Dialog.Root {...dialogProps}>
      <Dialog.Trigger data-tour-target="settings-trigger">Settings</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content {...contentProps} data-tour-target="settings-dialog">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

## Dialog Configuration Options

```tsx
dialogs: {
  myDialog: {
    // Auto-open behavior (default: true for both)
    autoOpen: {
      onEnter: true,   // Open when entering a step with this dialogId
      onResume: true,  // Open when resuming to a step with this dialogId
    },
    // Or simplified:
    autoOpen: true,    // Both onEnter and onResume
    autoOpen: false,   // Manual open only

    // Auto-close behavior (default: 'differentDialog')
    autoClose: 'differentDialog', // Close when next step has different/no dialogId
    autoClose: 'always',          // Always close on step exit
    autoClose: 'never',           // Manual close only

    // Required: where to navigate when user dismisses dialog
    onDismissGoToStepId: 'some-step-id',
  },
}
```

## Focus Management: useRadixDialogAdapter

For dialogs **without** tour integration that still need focus handling during tours:

```tsx
import { useRadixDialogAdapter } from '@flowsterix/react'

function SimpleDialog({ children }) {
  const { dialogProps, contentProps } = useRadixDialogAdapter({
    disableEscapeClose: true,
  })

  return (
    <Dialog.Root {...dialogProps}>
      <Dialog.Content {...contentProps}>{children}</Dialog.Content>
    </Dialog.Root>
  )
}
```

Use `useRadixDialogAdapter` when:
- A dialog is open during a tour but is NOT a tour step target
- You need the tour's focus trap to coexist with the dialog's focus trap
- You want to prevent ESC from closing the dialog while a tour is active
