import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'

export type AlertVariant =
  | 'graphite'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  icon?: React.ReactNode
  onClose?: () => void
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'graphite',
  title,
  children,
  icon,
  onClose,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'graphite':
        return {
          wrapper:
            'border-border/60 bg-card text-card-foreground shadow-surface',
          iconWrapper: 'bg-secondary text-brand border border-border/60',
          titleColor: 'text-foreground',
          bodyColor: 'text-muted-foreground',
          defaultIcon: <Sparkles className="h-4 w-4 text-brand" />,
        }
      case 'success':
        return {
          wrapper:
            'border-emerald-500/40 bg-emerald-500/10 text-foreground backdrop-blur-md',
          iconWrapper: 'bg-emerald-500/20 text-emerald-400',
          titleColor: 'text-emerald-500 dark:text-emerald-400',
          bodyColor: 'text-foreground/90',
          defaultIcon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        }
      case 'warning':
        return {
          wrapper:
            'border-amber-500/40 bg-amber-500/10 text-foreground backdrop-blur-md',
          iconWrapper: 'bg-amber-500/20 text-amber-500',
          titleColor: 'text-amber-500 dark:text-amber-400',
          bodyColor: 'text-foreground/90',
          defaultIcon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        }
      case 'danger':
        return {
          wrapper:
            'border-rose-500/40 bg-rose-500/10 text-foreground backdrop-blur-md',
          iconWrapper: 'bg-rose-500/20 text-rose-500',
          titleColor: 'text-rose-500 dark:text-rose-400',
          bodyColor: 'text-foreground/90',
          defaultIcon: <AlertCircle className="h-4 w-4 text-rose-500" />,
        }
      default:
        return {
          wrapper:
            'border-brand/40 bg-brand/10 text-foreground backdrop-blur-md',
          iconWrapper: 'bg-brand/20 text-brand',
          titleColor: 'text-brand',
          bodyColor: 'text-foreground/90',
          defaultIcon: <Info className="h-4 w-4 text-brand" />,
        }
    }
  }

  const s = getVariantStyles()

  return (
    <div
      dir="rtl"
      className={`relative flex items-start gap-3 rounded-2xl border p-4 text-xs transition-all ${s.wrapper} ${className}`}
    >
      <div className={`p-1.5 rounded-xl shrink-0 ${s.iconWrapper}`}>
        {icon || s.defaultIcon}
      </div>

      <div className="flex-1 space-y-0.5 text-right">
        {title && (
          <h4 className={`text-xs font-black leading-tight ${s.titleColor}`}>
            {title}
          </h4>
        )}
        <div className={`text-[11px] leading-relaxed ${s.bodyColor}`}>
          {children}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title="بستن پیام"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
