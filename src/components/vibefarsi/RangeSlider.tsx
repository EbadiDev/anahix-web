import type React from 'react'

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: string
  formatValue?: (val: number) => string
  className?: string
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 10000,
  value,
  onChange,
  label = 'سقف قیمت',
  formatValue,
  className = '',
}) => {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  )

  const displayVal = formatValue
    ? formatValue(value)
    : `${toPersianDigits(value.toLocaleString())} تومان`

  return (
    <div dir="rtl" className={`space-y-2 text-right ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-foreground">{label}</span>
        <span className="font-black text-blue-500 font-latin text-xs">
          {displayVal}
        </span>
      </div>

      <div className="relative flex items-center w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-blue-600 focus:outline-none"
          style={{
            background: `linear-gradient(to left, #2563eb ${percentage}%, var(--border) ${percentage}%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-latin">
        <span>{toPersianDigits(min.toLocaleString())}</span>
        <span>{toPersianDigits(max.toLocaleString())} تومان</span>
      </div>
    </div>
  )
}
