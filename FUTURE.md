# Future Ideas

Ideas for future implementation. Not prioritized.

---

## Mobile Landscape Side-Panel

**Context**: When implementing mobile drawer for tours, landscape orientation was deferred.

**Idea**: In landscape mobile orientation, a bottom drawer may not be optimal since vertical space is limited. Consider a side-panel approach instead:

```
┌────────────────────────────────────────────────────────┐
│                                      │  Step 2/5      │
│    Highlighted Element               │                │
│        (main content)                │  Welcome!      │
│                                      │  Description   │
│                                      │                │
│                                      │  [Back] [Next] │
└────────────────────────────────────────────────────────┘
```

**Considerations**:
- Detect `orientation: landscape` + mobile viewport
- Side panel from right edge (40-50% width)
- Swipe left to minimize, swipe right to expand
- May need different snap points (minimized, expanded only - no peek)
- Content layout may need to be more compact

**Related**: Mobile drawer implementation in `MobileDrawer` component.
