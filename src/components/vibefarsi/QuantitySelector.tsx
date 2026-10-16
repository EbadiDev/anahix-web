import { Minus, Plus, Trash2 } from 'lucide-react'
import type React from 'react'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  allowZero?: boolean
  className?: string
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
  allowZero = true,
  className = '',
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (value < max) {
      onChange(value + 1)
    }
  }

  const isAtMin = value <= min
  const isDeleteAction = value === 1 && allowZero

  const heightClasses = {
    sm: 'h-8 px-1 text-xs',
    md: 'h-9 px-1 text-xs',
    lg: 'h-11 px-1.5 text-sm',
  }

  const btnSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  }

  return (
    <div
      dir="ltr"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-between rounded-control border border-border/80 bg-zinc-900/95 text-zinc-100 shadow-control duration-motion ease-motion select-none ${heightClasses[size]} ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isAtMin && !allowZero}
        title={isDeleteAction ? 'حذف از سبد خرید' : 'کاهش تعداد'}
        aria-label={isDeleteAction ? 'حذف از سبد خرید' : 'کاهش تعداد'}
        className={`flex items-center justify-center rounded-control transition-all duration-motion ease-motion active:scale-[0.92] cursor-pointer ${
          btnSizes[size]
        } ${
          isDeleteAction
            ? 'hover:bg-rose-500/20 text-rose-400 hover:text-rose-300'
            : 'hover:bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
        }`}
      >
        {isDeleteAction ? (
          <Trash2 className="w-3.5 h-3.5" />
        ) : (
          <Minus className="w-3.5 h-3.5" />
        )}
      </button>

      <span className="min-w-[28px] text-center font-black font-latin text-white px-1">
        {toPersianDigits(value)}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        title="افزایش تعداد"
        aria-label="افزایش تعداد"
        className={`flex items-center justify-center rounded-control hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all duration-motion ease-motion active:scale-[0.92] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btnSizes[size]}`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
