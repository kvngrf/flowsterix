declare module '@tanstack/react-router' {
  export interface RouterLocation {
    href?: string
    pathname?: string
    search?: unknown
    hash?: string
    [key: string]: unknown
  }

  export interface RouterState {
    location: RouterLocation
    [key: string]: unknown
  }

  export function useRouterState<TSelected>(options: {
    select: (state: RouterState) => TSelected
  }): TSelected
}
