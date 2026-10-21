import { X } from 'lucide-react'
import type React from 'react'

interface ModalCloseButtonProps {
  onClick: () => void
  className?: string
  size?: 'sm' | 'md'
  title?: string
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
  onClick,
  className = '',
  size = 'md',
  title = 'بستن پنجره',
}) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
  const padding = size === 'sm' ? 'p-1.5' : 'p-1.5 sm:p-2'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`${padding} rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60 cursor-pointer flex items-center justify-center shrink-0 duration-motion ease-motion active:scale-95 ${className}`}
    >
      <X className={iconSize} />
    </button>
  )
}
