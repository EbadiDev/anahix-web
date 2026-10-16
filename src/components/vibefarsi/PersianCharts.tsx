import type React from 'react'
import { useState } from 'react'

export function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

// 1. Interactive Area Chart for Financial / Order Trends
interface AreaChartDataPoint {
  label: string
  value: number
  secondaryValue?: number
}

interface PersianAreaChartProps {
  data: AreaChartDataPoint[]
  title?: string
  height?: number
  valueSuffix?: string
  color?: string
}

export const PersianAreaChart: React.FC<PersianAreaChartProps> = ({
  data,
  title,
  height = 200,
  valueSuffix = 'تومان',
  color = '#2563eb',
}) => {
  const [activePoint, setActivePoint] = useState<AreaChartDataPoint | null>(
    null,
  )

  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const paddingX = 30
  const paddingY = 25
  const width = 600
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartWidth
    const y = paddingY + chartHeight - (d.value / maxValue) * chartHeight
    return { x, y, data: d }
  })

  // SVG Area path generator
  const areaPath =
    `M ${points[0].x} ${points[0].y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ') +
    ` L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  // SVG Line stroke generator
  const linePath =
    `M ${points[0].x} ${points[0].y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')

  return (
    <div dir="rtl" className="w-full space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-foreground">
            {title}
          </h4>
          {activePoint && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
              {activePoint.label}:{' '}
              {toPersianDigits(activePoint.value.toLocaleString())}{' '}
              {valueSuffix}
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-2xl bg-card border border-border p-2">
        <svg
          role="img"
          aria-label={title || 'نمودار تحلیل روند'}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <title>{title || 'نمودار تحلیل روند'}</title>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={`grid-line-${pct}`}
              x1={paddingX}
              y1={paddingY + chartHeight * pct}
              x2={width - paddingX}
              y2={paddingY + chartHeight * pct}
              stroke="currentColor"
              className="text-border/40 stroke-dashed"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p) => (
            <g
              key={`point-${p.data.label}`}
              className="cursor-pointer group"
              onMouseEnter={() => setActivePoint(p.data)}
              onMouseLeave={() => setActivePoint(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-background stroke-2 transition-all duration-200 group-hover:r-6"
                stroke={color}
              />
            </g>
          ))}
        </svg>

        {/* Labels under chart */}
        <div className="flex justify-between px-3 pt-2 text-[10px] text-muted-foreground">
          {data.map((d) => (
            <span key={`lbl-${d.label}`}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// 2. Interactive Bar Chart
interface PersianBarChartProps {
  data: { label: string; value: number; color?: string }[]
  title?: string
  height?: number
  valueSuffix?: string
}

export const PersianBarChart: React.FC<PersianBarChartProps> = ({
  data,
  title,
  height = 180,
  valueSuffix = 'سفارش',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div dir="rtl" className="w-full space-y-3">
      {title && (
        <h4 className="text-xs sm:text-sm font-bold text-foreground">
          {title}
        </h4>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div
          className="flex items-end justify-between gap-2 pt-6"
          style={{ height: `${height}px` }}
        >
          {data.map((item) => {
            const heightPct = Math.max((item.value / maxValue) * 100, 6)
            return (
              <div
                key={`bar-col-${item.label}`}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
              >
                <span className="text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {toPersianDigits(item.value)} {valueSuffix}
                </span>
                <div
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: item.color || '#2563eb',
                  }}
                  className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 hover:brightness-110 shadow-sm"
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 3. Interactive Donut Chart
interface PersianDonutChartProps {
  data: { label: string; value: number; color: string }[]
  title?: string
  size?: number
}

export const PersianDonutChart: React.FC<PersianDonutChartProps> = ({
  data,
  title,
  size = 180,
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1
  let cumulativePercent = 0

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent)
    const y = Math.sin(2 * Math.PI * percent)
    return [x, y]
  }

  return (
    <div dir="rtl" className="w-full space-y-3">
      {title && (
        <h4 className="text-xs sm:text-sm font-bold text-foreground">
          {title}
        </h4>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 rounded-2xl border border-border bg-card p-4">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            role="img"
            aria-label={title || 'نمودار دونات'}
            viewBox="-1 -1 2 2"
            className="w-full h-full -rotate-90"
          >
            <title>{title || 'نمودار دونات'}</title>
            {data.map((slice) => {
              const startPercent = cumulativePercent
              const slicePercent = slice.value / total
              cumulativePercent += slicePercent

              const [startX, startY] = getCoordinatesForPercent(startPercent)
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent)
              const largeArcFlag = slicePercent > 0.5 ? 1 : 0

              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'L 0 0',
              ].join(' ')

              return (
                <path
                  key={`donut-slice-${slice.label}`}
                  d={pathData}
                  fill={slice.color}
                  className="hover:opacity-90 transition-opacity"
                />
              )
            })}
            {/* Center cutout for donut hole */}
            <circle cx="0" cy="0" r="0.65" className="fill-card" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-muted-foreground">مجموع</span>
            <span className="text-sm font-black text-foreground">
              {toPersianDigits(total.toLocaleString())}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full max-w-[180px]">
          {data.map((item) => {
            const pct = Math.round((item.value / total) * 100)
            return (
              <div
                key={`donut-legend-${item.label}`}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground truncate">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-foreground">
                  {toPersianDigits(pct)}٪
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
