import { ArrowLeft } from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'

interface ArrowLinkProps {
  to: string
  children: React.ReactNode
  className?: string
  external?: boolean
}

export const ArrowLink: React.FC<ArrowLinkProps> = ({
  to,
  children,
  className = '',
  external = false,
}) => {
  const commonClasses = `group inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors select-none ${className}`

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
      >
        <span>{children}</span>
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
      </a>
    )
  }

  return (
    <Link to={to} className={commonClasses}>
      <span>{children}</span>
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
    </Link>
  )
}
