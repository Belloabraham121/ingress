import type React from "react"
import { px } from "./utils"

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  highlight?: boolean
}

export function FeatureCard({ title, description, icon, highlight = false }: FeatureCardProps) {
  const polyRoundness = 0
  const hypotenuse = 12
  const hypotenuseHalf = 6 - 1.5

  return (
    <div
      style={
        {
          "--poly-roundness": px(polyRoundness),
        } as React.CSSProperties
      }
      className={`relative p-8 border transition-all duration-300 ${
        highlight
          ? "border-primary bg-primary/5 hover:bg-primary/10 hover:shadow-glow hover:shadow-primary/30"
          : "border-border bg-background/50 hover:border-primary/50 hover:bg-background/80"
      }`}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary/50" />

      {/* Icon */}
      <div className="mb-6 text-primary text-3xl">{icon}</div>

      {/* Content */}
      <h3 className="text-xl font-sentient mb-3">{title}</h3>
      <p className="font-mono text-sm text-foreground/70 leading-relaxed">{description}</p>
    </div>
  )
}
