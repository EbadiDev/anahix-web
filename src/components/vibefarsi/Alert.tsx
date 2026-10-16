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
            'border-zinc-700/60 bg-zinc-900/80 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-xl',
          iconWrapper: 'bg-zinc-800 text-blue-400 border border-zinc-700/80',
          titleColor: 'text-zinc-100',
          bodyColor: 'text-zinc-300/90',
          defaultIcon: <Sparkles className="h-4 w-4 text-blue-400" />,
        }
      case 'success':
        return {
          wrapper:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 backdrop-blur-md',
          iconWrapper:
            'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
          titleColor: 'text-emerald-700 dark:text-emerald-300',
          bodyColor: 'text-emerald-800/90 dark:text-emerald-200/90',
          defaultIcon: <CheckCircle2 className="h-4 w-4" />,
        }
      case 'warning':
        return {
          wrapper:
            'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100 backdrop-blur-md',
          iconWrapper: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
          titleColor: 'text-amber-700 dark:text-amber-300',
          bodyColor: 'text-amber-800/90 dark:text-amber-200/90',
          defaultIcon: <AlertTriangle className="h-4 w-4" />,
        }
      case 'danger':
        return {
          wrapper:
            'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100 backdrop-blur-md',
          iconWrapper: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
          titleColor: 'text-rose-700 dark:text-rose-300',
          bodyColor: 'text-rose-800/90 dark:text-rose-200/90',
          defaultIcon: <AlertCircle className="h-4 w-4" />,
        }
      default:
        return {
          wrapper:
            'border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100 backdrop-blur-md',
          iconWrapper: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-700 dark:text-blue-300',
          bodyColor: 'text-blue-800/90 dark:text-blue-200/90',
          defaultIcon: <Info className="h-4 w-4" />,
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
