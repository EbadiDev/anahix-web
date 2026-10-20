import { ArrowLeft } from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'

interface ArrowLinkProps {
  to: string
  children: React.ReactNode
  className?: string
  external?: boolean
  variant?: 'inline' | 'graphite'
}

export const ArrowLink: React.FC<ArrowLinkProps> = ({
  to,
  children,
  className = '',
  external = false,
  variant = 'graphite',
}) => {
  const commonClasses =
    variant === 'graphite'
      ? `group inline-flex items-center gap-2 h-8 sm:h-9 px-3.5 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-foreground text-xs font-bold transition-all shadow-control duration-motion active:scale-[0.98] select-none ${className}`
      : `group inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-brand transition-colors select-none ${className}`

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
      >
        <span>{children}</span>
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-muted-foreground group-hover:text-foreground" />
      </a>
    )
  }

  return (
    <Link to={to} className={commonClasses}>
      <span>{children}</span>
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-muted-foreground group-hover:text-foreground" />
    </Link>
  )
}
