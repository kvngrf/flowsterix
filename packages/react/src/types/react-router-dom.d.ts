declare module 'react-router-dom' {
  export interface Location {
    pathname: string
    search: string
    hash: string
    state?: unknown
    key?: string
  }

  export function useLocation(): Location
}
