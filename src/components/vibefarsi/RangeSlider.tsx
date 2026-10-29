import { SlidersHorizontal } from 'lucide-react'
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
  presets?: { label: string; value: number }[]
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 100000,
  value,
  onChange,
  label = 'فیلتر بر اساس سقف قیمت:',
  formatValue,
  className = '',
  presets,
}) => {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  )

  const displayVal = formatValue
    ? formatValue(value)
    : `${Number(value).toLocaleString('fa-IR')} تومان`

  return (
    <div dir="rtl" className={`space-y-3 text-right select-none ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-control bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shadow-xs shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-foreground">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            حداکثر بودجه:
          </span>
          <span className="px-2.5 py-1 rounded-control bg-brand/10 border border-brand/20 font-black text-brand font-latin text-xs">
            {displayVal}
          </span>
        </div>
      </div>

      {/* Range Input Slider Track */}
      <div className="relative flex items-center w-full py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-brand focus:outline-none transition-all"
          style={{
            background: `linear-gradient(to left, var(--brand) ${percentage}%, color-mix(in oklch, var(--muted) 80%, transparent) ${percentage}%)`,
          }}
          aria-label={label}
        />
      </div>

      {/* Min / Max & Quick Presets Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
        <div className="flex items-center gap-3 text-muted-foreground font-latin">
          <span>حداقل: {Number(min).toLocaleString('fa-IR')} تومان</span>
          <span>•</span>
          <span>حداکثر: {Number(max).toLocaleString('fa-IR')} تومان</span>
        </div>

        {presets && presets.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-bold ml-1">
              انتخاب سریع:
            </span>
            {presets.map((p) => {
              const isActive = value === p.value
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange(p.value)}
                  className={`px-2.5 py-1 rounded-control font-bold text-[10px] duration-motion ease-motion transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand text-brand-foreground font-black shadow-brand/20'
                      : 'border border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
