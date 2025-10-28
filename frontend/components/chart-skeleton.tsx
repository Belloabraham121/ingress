"use client"

import { cn } from "@/lib/utils"

interface ChartSkeletonProps {
  className?: string
  height?: string
  showLegend?: boolean
  showGrid?: boolean
  animated?: boolean
}

export function ChartSkeleton({
  className,
  height = "h-[400px]",
  showLegend = true,
  showGrid = true,
  animated = true,
}: ChartSkeletonProps) {
  return (
    <div className={cn("w-full", height, className)}>
      <div className="w-full h-full flex flex-col justify-between p-4">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-full">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={`y-axis-${i}`} className="flex items-center gap-3 w-full">
              {/* Y-axis label skeleton */}
              <div
                className={cn(
                  "w-8 h-4 rounded bg-gradient-to-r from-border/20 to-border/40",
                  animated && "animate-pulse",
                )}
              />
              {/* Grid line skeleton */}
              <div className="flex-1 h-px bg-gradient-to-r from-border/30 via-border/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-border/30">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={`x-axis-${i}`}
              className={cn(
                "flex-1 h-3 rounded bg-gradient-to-r from-border/20 to-border/40",
                animated && "animate-pulse",
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Legend Skeleton */}
      {showLegend && (
        <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-border/30">
          {[0, 1].map((i) => (
            <div key={`legend-${i}`} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-sm bg-gradient-to-r from-border/30 to-border/50",
                  animated && "animate-pulse",
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div
                className={cn(
                  "w-20 h-3 rounded bg-gradient-to-r from-border/20 to-border/40",
                  animated && "animate-pulse",
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
  animated?: boolean
}

export function TableSkeleton({ rows = 5, columns = 8, className, animated = true }: TableSkeletonProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={`header-${i}`} className="p-3 text-left">
                <div
                  className={cn(
                    "h-4 rounded bg-gradient-to-r from-border/20 to-border/40",
                    animated && "animate-pulse",
                  )}
                  style={{
                    width: `${60 + Math.random() * 40}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={`row-${rowIdx}`} className="border-b border-border/50">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={`cell-${rowIdx}-${colIdx}`} className="p-3">
                  <div
                    className={cn(
                      "h-4 rounded bg-gradient-to-r from-border/20 to-border/40",
                      animated && "animate-pulse",
                    )}
                    style={{
                      width: `${70 + Math.random() * 30}%`,
                      animationDelay: `${(rowIdx + colIdx) * 30}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
  animated?: boolean
}

export function CardSkeleton({ className, animated = true }: CardSkeletonProps) {
  return (
    <div className={cn("border border-border bg-background p-6", className)}>
      <div
        className={cn(
          "h-6 w-32 rounded bg-gradient-to-r from-border/20 to-border/40 mb-6",
          animated && "animate-pulse",
        )}
      />

      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={`line-${i}`} className="space-y-2">
            <div
              className={cn("h-4 rounded bg-gradient-to-r from-border/20 to-border/40", animated && "animate-pulse")}
              style={{
                width: `${80 + Math.random() * 20}%`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface SummaryCardsSkeletonProps {
  count?: number
  className?: string
  animated?: boolean
}

export function SummaryCardsSkeleton({ count = 4, className, animated = true }: SummaryCardsSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`summary-${i}`} className="border border-border bg-background p-6">
          <div
            className={cn(
              "h-3 w-24 rounded bg-gradient-to-r from-border/20 to-border/40 mb-3",
              animated && "animate-pulse",
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          />

          <div
            className={cn("h-8 w-32 rounded bg-gradient-to-r from-border/20 to-border/40", animated && "animate-pulse")}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        </div>
      ))}
    </div>
  )
}
