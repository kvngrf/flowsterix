export interface ElementSource {
  fileName: string
  lineNumber: number
  columnNumber: number
}

export interface GrabbedStep {
  id: string
  order: number
  selector: string
  selectorType: 'auto' | 'data-attr' | 'custom'
  elementTag: string
  elementText?: string
  elementClassName?: string
  elementStyle?: string
  existingAttrs: string[]
  suggestedAttrName?: string
  componentHierarchy: string[]
  rect: {
    top: number
    left: number
    width: number
    height: number
  }
  source?: ElementSource
  label?: string
  notes?: string
  createdAt: number
}

export type GrabMode = 'idle' | 'grabbing' | 'preview'

export interface DevToolsState {
  steps: GrabbedStep[]
  grabMode: GrabMode
  hoveredElement: Element | null
  selectedStepId: string | null
  panelVisible: boolean
  panelPosition: { x: number; y: number }
}

export interface DevToolsExport {
  version: '1.0'
  createdAt: string
  steps: Array<{
    order: number
    element: string // e.g. '<button class="btn">Click me</button>'
    componentTree: string[] // e.g. ['h2', 'StepTitle', 'div', 'StepContent']
    source?: string // e.g. 'src/components/Button.tsx:45'
  }>
}

export interface ElementInfo {
  element: Element
  selector: string
  selectorType: 'auto' | 'data-attr' | 'custom'
  suggestedAttrName: string
  tag: string
  text?: string
  className?: string
  style?: string
  existingAttrs: string[]
  componentHierarchy: string[]
  rect: DOMRect
  source?: ElementSource
}
