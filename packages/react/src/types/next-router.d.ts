declare module 'next/router' {
  export interface NextRouter {
    asPath?: string
    pathname?: string
    isReady?: boolean
  }

  export function useRouter(): NextRouter
}
