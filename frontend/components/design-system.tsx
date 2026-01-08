/**
 * SKAL VENTURES DESIGN SYSTEM
 *
 * This file documents the consistent design patterns used throughout the application.
 * All components should follow these guidelines to maintain visual cohesion.
 */

/**
 * COLOR PALETTE
 * Primary: #FFC700 (Gold/Yellow) - Used for primary actions, highlights, and key metrics
 * Background: #000000 (Black) - Main background color
 * Foreground: #FFFFFF (White) - Primary text color
 * Border: #424242 (Dark Gray) - Border and divider color
 * Success: #22C55E (Green) - Positive metrics, gains, active status
 * Warning: #EAB308 (Yellow) - Caution, pending status
 * Danger: #EF4444 (Red) - Losses, errors, high risk
 * Info: #3B82F6 (Blue) - Informational content
 */

/**
 * TYPOGRAPHY
 * Font Family: Sentient (headings), Geist Mono (body/mono)
 * Heading Sizes:
 *   - h1: text-5xl md:text-6xl lg:text-7xl (font-sentient)
 *   - h2: text-4xl md:text-5xl (font-sentient)
 *   - h3: text-lg (font-sentient)
 * Body Text: font-mono text-sm (for labels and descriptions)
 * Line Height: leading-relaxed (1.6) for body text
 */

/**
 * SPACING SCALE
 * Uses Tailwind's default spacing scale:
 * 2 (0.5rem), 3 (0.75rem), 4 (1rem), 6 (1.5rem), 8 (2rem), 12 (3rem), 16 (4rem)
 *
 * Common patterns:
 * - Page padding: px-4 md:px-8 lg:px-12
 * - Section spacing: py-24 (top/bottom), mb-12 (bottom margin)
 * - Component padding: p-6
 * - Gap between items: gap-4, gap-6
 */

/**
 * COMPONENT PATTERNS
 *
 * Cards:
 * - border border-border bg-background p-6
 * - Used for all content containers
 *
 * Buttons:
 * - Primary: [ACTION TEXT] (with brackets)
 * - Outline: variant="outline" [ACTION TEXT]
 * - Disabled state: disabled={condition}
 *
 * Input Fields:
 * - border border-border bg-background text-foreground placeholder:text-foreground/40
 * - focus:border-primary focus:outline-none
 *
 * Status Indicators:
 * - Active: text-green-500
 * - Pending: text-yellow-500
 * - Error: text-red-500
 * - Info: text-primary (gold)
 *
 * Tables:
 * - Header: border-b border-border/50, text-foreground/60
 * - Rows: border-b border-border/50 last:border-0 hover:bg-primary/5
 * - Data: font-mono text-sm
 */

/**
 * LAYOUT PATTERNS
 *
 * Page Structure:
 * 1. Header with logo and navigation
 * 2. Main content area with container
 * 3. Page title and description
 * 4. Summary cards (grid layout)
 * 5. Charts/visualizations
 * 6. Detailed tables
 * 7. Individual cards/breakdown
 * 8. Action buttons
 *
 * Grid Layouts:
 * - Summary cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
 * - Content cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
 * - Dashboard: lg:grid-cols-3 gap-6 (main content + sidebar)
 */

/**
 * RESPONSIVE DESIGN
 * Mobile-first approach:
 * - Base styles for mobile
 * - md: (768px) - Tablet
 * - lg: (1024px) - Desktop
 *
 * Common breakpoints:
 * - Text sizes: text-sm md:text-base lg:text-lg
 * - Grid columns: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 * - Padding: px-4 md:px-8 lg:px-12
 */

/**
 * INTERACTION PATTERNS
 *
 * Hover States:
 * - Cards: hover:bg-primary/5 transition-colors
 * - Links: hover:text-primary/80 transition-colors
 * - Buttons: Built-in via shadcn/ui
 *
 * Focus States:
 * - Inputs: focus:border-primary focus:outline-none
 * - Buttons: Built-in via shadcn/ui
 *
 * Transitions:
 * - Default: transition-colors duration-300
 * - Smooth: transition-all duration-300
 */

/**
 * ACCESSIBILITY
 * - Use semantic HTML (main, header, section, article)
 * - Include proper ARIA labels and roles
 * - Ensure color contrast meets WCAG standards
 * - Use sr-only class for screen reader only text
 * - Include alt text for all images
 * - Use proper heading hierarchy
 */

export const designSystemGuide = {
  colors: {
    primary: "#FFC700",
    background: "#000000",
    foreground: "#FFFFFF",
    border: "#424242",
    success: "#22C55E",
    warning: "#EAB308",
    danger: "#EF4444",
    info: "#3B82F6",
  },
  typography: {
    headings: "font-sentient",
    body: "font-mono",
    sizes: {
      h1: "text-5xl md:text-6xl lg:text-7xl",
      h2: "text-4xl md:text-5xl",
      h3: "text-lg",
      body: "text-sm",
    },
  },
  spacing: {
    pageX: "px-4 md:px-8 lg:px-12",
    pageY: "py-24",
    sectionGap: "gap-6",
    componentPadding: "p-6",
  },
}
