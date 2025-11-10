declare module 'next/navigation' {
  export function usePathname(): string | null
  export function useSearchParams(): URLSearchParams | null
}
