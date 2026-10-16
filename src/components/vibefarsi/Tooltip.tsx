import type React from 'react'
import { useState } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [visible, setVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          dir="rtl"
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-950/95 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 shadow-xl backdrop-blur-xl animate-fade-in-up pointer-events-none ${positionClasses[position]}`}
          style={{ boxShadow: 'var(--depth-surface)' }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
