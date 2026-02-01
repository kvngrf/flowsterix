'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ShadowRootProps {
  children: ReactNode
}

export function ShadowRoot(props: ShadowRootProps) {
  const { children } = props
  const hostRef = useRef<HTMLDivElement>(null)
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    if (hostRef.current.shadowRoot) {
      setShadowRoot(hostRef.current.shadowRoot)
      return
    }

    const shadow = hostRef.current.attachShadow({ mode: 'open' })

    // Add reset styles to shadow root
    const style = document.createElement('style')
    style.textContent = `
      :host {
        all: initial;
        display: contents;
      }
      * {
        box-sizing: border-box;
      }
    `
    shadow.appendChild(style)

    setShadowRoot(shadow)
  }, [])

  return (
    <div ref={hostRef} style={{ display: 'contents' }} data-devtools-shadow="">
      {shadowRoot && createPortal(children, shadowRoot)}
    </div>
  )
}
