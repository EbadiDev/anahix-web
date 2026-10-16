import type React from 'react'

interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children: React.ReactNode
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  shimmerColor = '#ffffff',
  shimmerSize = '0.05em',
  shimmerDuration = '3s',
  borderRadius = '1rem',
  background = 'rgba(37, 99, 235, 1)',
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background,
        } as React.CSSProperties
      }
      className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white font-bold [background:var(--bg)] [border-radius:var(--radius)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 ${className}`}
      {...props}
    >
      {/* Sparkle beam reflection */}
      <div className="absolute inset-0 -z-10 overflow-hidden [border-radius:var(--radius)]">
        <div className="absolute -inset-[100%] animate-[shimmer_3s_infinite] bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
