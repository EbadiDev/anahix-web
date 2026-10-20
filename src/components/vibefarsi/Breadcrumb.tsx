import type React from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs text-muted-foreground flex items-center gap-2 flex-wrap select-none ${className}`}
    >
      <Link to="/" className="hover:text-foreground transition-colors">
        خانه
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={item.to || item.label} className="flex items-center gap-2">
            <span className="opacity-40 text-muted-foreground">/</span>
            {isLast || !item.to ? (
              <span className="text-brand font-bold truncate max-w-xs sm:max-w-md">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-foreground transition-colors truncate max-w-[180px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
