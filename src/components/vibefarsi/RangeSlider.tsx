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
    : `${Number(value).toLocaleString('fa-IR')} تومان`

  return (
    <div dir="rtl" className={`space-y-2 text-right ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-foreground">{label}</span>
        <span className="font-black text-brand font-latin text-xs">
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
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-brand focus:outline-none"
          style={{
            background: `linear-gradient(to left, #2563eb ${percentage}%, var(--border) ${percentage}%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-latin">
        <span>{Number(min).toLocaleString('fa-IR')} تومان</span>
        <span>{Number(max).toLocaleString('fa-IR')} تومان</span>
      </div>
    </div>
  )
}
