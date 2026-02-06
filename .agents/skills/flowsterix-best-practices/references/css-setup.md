# CSS Setup for Flowsterix

The shadcn tour components require specific CSS variables to work correctly. These follow the shadcn/ui convention.

## Required Variables

Add these to your global CSS file. The tour components use:

- `--background` / `--foreground` - Base colors
- `--popover` / `--popover-foreground` - Popover panel
- `--border` / `--input` - Border colors
- `--accent` / `--accent-foreground` - Hover states
- `--destructive` - Skip button hold state
- `--ring` - Focus rings

## Focus Ring Customization

The focus trap uses hidden guard elements to keep focus within the tour. When these elements receive focus, a visible ring is rendered around the target or popover. Customize the ring appearance through the flow's HUD options:

```ts
const flow = createFlow({
  id: 'my-tour',
  version: { major: 1, minor: 0 },
  hud: {
    guardElementFocusRing: {
      boxShadow: '0 0 0 2px white, 0 0 0 4px blue',
    },
  },
  steps: [/* ... */],
})
```

The default `boxShadow` uses `--primary` with a subtle outer glow: `0 0 0 2px var(--primary), 0 0 8px 2px color-mix(in srgb, var(--primary) 40%, transparent)`.

## Minimal Setup (Tailwind v4)

```css
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-ring: var(--ring);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## Hex Fallback (Non-oklch)

If your project doesn't support oklch:

```css
:root {
  --background: #ffffff;
  --foreground: #09090b;
  --popover: #ffffff;
  --popover-foreground: #09090b;
  --border: rgba(0, 0, 0, 0.1);
  --input: rgba(0, 0, 0, 0.1);
  --accent: #f4f4f5;
  --accent-foreground: #09090b;
  --destructive: #dc2626;
  --ring: rgba(0, 0, 0, 0.2);
}

.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --popover: #18181b;
  --popover-foreground: #fafafa;
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.15);
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #ef4444;
  --ring: rgba(255, 255, 255, 0.2);
}
```

## Common Issues

### Transparent popover background

**Symptom**: Tour popover has no background, content hard to read.

**Fix**: Add `--popover` variable:
```css
:root {
  --popover: #ffffff;
}
.dark {
  --popover: #18181b;
}
```

### Destructive color not red

**Symptom**: Hold-to-skip button doesn't show red when holding.

**Fix**: Add `--destructive` variable:
```css
:root {
  --destructive: #dc2626;
}
.dark {
  --destructive: #ef4444;
}
```

### Mismatched button borders

**Symptom**: Back button and Skip button have different border styles.

**Fix**: Ensure both `--border` and `--input` are defined with similar values for light mode:
```css
:root {
  --border: rgba(0, 0, 0, 0.1);
  --input: rgba(0, 0, 0, 0.1);
}
```

## Using with Existing shadcn/ui

If you already have shadcn/ui installed, you likely have all required variables. The tour components are designed to match your existing theme automatically.
