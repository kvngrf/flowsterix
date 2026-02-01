# @flowsterix/devtools

A React devtools panel for visually selecting DOM elements and building tour steps. Captures element info, CSS selectors, and React component hierarchy for AI-assisted flow generation.

## Installation

```bash
npm install @flowsterix/devtools
```

**Peer dependencies:** `react`, `react-dom`, `motion`

## Quick Start

```tsx
import { DevToolsProvider } from '@flowsterix/devtools'

function App() {
  return (
    <DevToolsProvider enabled={process.env.NODE_ENV === 'development'}>
      <YourApp />
    </DevToolsProvider>
  )
}
```

## Usage

1. **Toggle grab mode**: Press `Ctrl+Shift+G` or click the "Grab Element" button
2. **Select elements**: Hover to highlight, click to capture
3. **Reorder steps**: Drag and drop in the panel
4. **Export**: Click "Copy" to get JSON for AI, or "Export" to download

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+G` | Toggle grab mode |
| `Esc` | Cancel grab mode |
| `Ctrl+Shift+M` | Collapse/expand panel |

## Export Format

The exported JSON provides element and component context for AI code generation:

```json
{
  "version": "1.0",
  "createdAt": "2026-02-01T12:00:00.000Z",
  "steps": [
    {
      "order": 0,
      "element": "<button class=\"btn-primary\" type=\"submit\">Get Started</button>",
      "componentTree": ["button", "Button", "div", "Header", "App"]
    },
    {
      "order": 1,
      "element": "<input class=\"form-input\" type=\"email\" placeholder>Enter email</input>",
      "componentTree": ["input", "FormField", "SignupForm", "App"]
    }
  ]
}
```

### Export Fields

| Field | Description |
|-------|-------------|
| `order` | Step sequence number |
| `element` | HTML representation with class, style, text content |
| `componentTree` | React component hierarchy from element to root |

## Props

### DevToolsProvider

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable devtools |
| `children` | `ReactNode` | - | App content |

## Features

- **Shadow DOM isolation** - Styles don't conflict with your app
- **Drag-and-drop reordering** - Powered by @dnd-kit
- **localStorage persistence** - Steps survive page refresh
- **Component hierarchy extraction** - Uses React fiber inspection
- **Selector generation** - Prefers `data-tour-target`, falls back to unique selectors

## Workflow

1. Run your app in development mode
2. Enable devtools with `Ctrl+Shift+G`
3. Click elements to capture tour steps
4. Reorder as needed
5. Copy JSON and paste into AI (Claude, ChatGPT, etc.)
6. AI generates flow definition with proper selectors and step content

## API

### Exports

```tsx
// Provider
export { DevToolsProvider } from '@flowsterix/devtools'

// Components (for custom UIs)
export { GrabberOverlay, StepList, StepItem, Toolbar } from '@flowsterix/devtools'

// Hooks
export { useGrabMode, useStepStore, useElementInfo } from '@flowsterix/devtools'

// Utils
export { generateSelector, extractSource, extractComponentHierarchy } from '@flowsterix/devtools'
```
