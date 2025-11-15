import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect } from 'react'

import type { TourTokens } from './tokens'
import { applyTokensToDocument, defaultTokens } from './tokens'

const TokensContext = createContext<TourTokens>(defaultTokens)

export interface TokensProviderProps {
  tokens: TourTokens
}

export const TokensProvider = ({
  tokens,
  children,
}: PropsWithChildren<TokensProviderProps>) => {
  useEffect(() => {
    const cleanup = applyTokensToDocument(tokens)
    return cleanup
  }, [tokens])

  return (
    <TokensContext.Provider value={tokens}>{children}</TokensContext.Provider>
  )
}

export const useTourTokens = () => useContext(TokensContext)
