import type React from 'react'

interface GridPatternProps {
  className?: string
  squares?: [number, number][]
}

export const GridPattern: React.FC<GridPatternProps> = ({
  className = '',
  squares = [],
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      {/* Optional illuminated glowing squares */}
      {squares.map(([x, y]) => (
        <div
          key={`${x}-${y}`}
          className="absolute h-8 w-8 rounded-sm bg-blue-500/10 blur-[1px] animate-pulse"
          style={{
            left: `${x * 32}px`,
            top: `${y * 32}px`,
          }}
        />
      ))}
    </div>
  )
}

export const DotPattern: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-dot-pattern opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
    </div>
  )
}
