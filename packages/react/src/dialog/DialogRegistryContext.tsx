import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'

export interface DialogController {
  open: () => void
  close: () => void
  isOpen: () => boolean
}

export interface DialogRegistryContextValue {
  register: (dialogId: string, controller: DialogController) => void
  unregister: (dialogId: string) => void
  getController: (dialogId: string) => DialogController | undefined
  isRegistered: (dialogId: string) => boolean
}

const DialogRegistryContext = createContext<
  DialogRegistryContextValue | undefined
>(undefined)

export const DialogRegistryProvider = ({ children }: PropsWithChildren) => {
  const controllersRef = useRef<Map<string, DialogController>>(new Map())

  const register = useCallback(
    (dialogId: string, controller: DialogController) => {
      controllersRef.current.set(dialogId, controller)
    },
    [],
  )

  const unregister = useCallback((dialogId: string) => {
    controllersRef.current.delete(dialogId)
  }, [])

  const getController = useCallback((dialogId: string) => {
    return controllersRef.current.get(dialogId)
  }, [])

  const isRegistered = useCallback((dialogId: string) => {
    return controllersRef.current.has(dialogId)
  }, [])

  const value = useMemo<DialogRegistryContextValue>(
    () => ({
      register,
      unregister,
      getController,
      isRegistered,
    }),
    [register, unregister, getController, isRegistered],
  )

  return (
    <DialogRegistryContext.Provider value={value}>
      {children}
    </DialogRegistryContext.Provider>
  )
}

export const useDialogRegistry = (): DialogRegistryContextValue => {
  const context = useContext(DialogRegistryContext)
  if (!context) {
    throw new Error(
      'useDialogRegistry must be used within a DialogRegistryProvider',
    )
  }
  return context
}

export const useDialogRegistryOptional = ():
  | DialogRegistryContextValue
  | undefined => {
  return useContext(DialogRegistryContext)
}
