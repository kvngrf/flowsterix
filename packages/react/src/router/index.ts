export {
  getCurrentRoutePath,
  matchRoute,
  notifyRouteChange,
  routeGatingChannel,
  subscribeToRouteChanges,
} from './routeGating'

export { createPathString } from './utils'

// Router-specific adapters are available via separate entry points:
// - TanStack Router: import from '@flowsterix/react/router/tanstack'
// - React Router: import from '@flowsterix/react/router/react-router'
// - Next.js App Router: import from '@flowsterix/react/router/next-app'
// - Next.js Pages Router: import from '@flowsterix/react/router/next-pages'
