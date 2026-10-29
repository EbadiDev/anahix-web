import { Loader2 } from 'lucide-react'
import type React from 'react'

interface LoadingStateProps {
  message?: string
  subMessage?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  minHeight?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'در حال بارگذاری اطلاعات...',
  subMessage,
  size = 'md',
  className = '',
  minHeight,
}) => {
  const spinnerSize =
    size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'

  return (
    <div
      dir="rtl"
      style={minHeight ? { minHeight } : undefined}
      className={`p-8 sm:p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 select-none ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shadow-xs">
          <Loader2 className={`${spinnerSize} animate-spin text-brand`} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-foreground">{message}</p>
        {subMessage && (
          <p className="text-[11px] text-muted-foreground font-normal">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  )
}
