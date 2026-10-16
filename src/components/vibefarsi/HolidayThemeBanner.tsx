import { Gift, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

export interface EventThemeConfig {
  event_name: string
  event_active: boolean
  primary_color: string
  accent_color: string
  header_announcement: string
  event_effect: 'none' | 'snow' | 'confetti' | 'stars'
  event_icon?: string
}

interface HolidayThemeBannerProps {
  theme?: EventThemeConfig | null
}

export const HolidayThemeBanner: React.FC<HolidayThemeBannerProps> = ({
  theme,
}) => {
  const [dismissed, setDismissed] = useState(false)

  // Dynamically inject primary color CSS variable if active
  useEffect(() => {
    if (theme?.event_active && theme.primary_color) {
      document.documentElement.style.setProperty(
        '--event-primary',
        theme.primary_color,
      )
    } else {
      document.documentElement.style.removeProperty('--event-primary')
    }
  }, [theme])

  if (!theme?.event_active || dismissed) return null

  return (
    <div
      dir="rtl"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-4 py-2 text-xs font-medium shadow-md transition-all"
      style={{
        background: theme.primary_color
          ? `linear-gradient(90deg, ${theme.primary_color}, #1e1b4b)`
          : undefined,
      }}
    >
      {/* Decorative Particles effect */}
      {theme.event_effect === 'snow' && <SnowEffect />}
      {theme.event_effect === 'confetti' && <ConfettiEffect />}
      {theme.event_effect === 'stars' && <StarsEffect />}

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
            <Gift className="h-3.5 w-3.5 animate-bounce" />
          </span>
          <span className="font-bold">{theme.event_name}:</span>
          <span className="opacity-90">{theme.header_announcement}</span>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          title="بستن اعلان مناسبت"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

const SnowEffect: React.FC = () => {
  const particles = [
    'snow-p1',
    'snow-p2',
    'snow-p3',
    'snow-p4',
    'snow-p5',
    'snow-p6',
    'snow-p7',
    'snow-p8',
    'snow-p9',
    'snow-p10',
    'snow-p11',
    'snow-p12',
    'snow-p13',
    'snow-p14',
    'snow-p15',
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      {particles.map((key, i) => (
        <span
          key={key}
          className="absolute -top-2 text-white text-[10px] animate-fade-in-up"
          style={{
            left: `${(i * 7) % 100}%`,
            animationDuration: `${3 + (i % 3)}s`,
            animationIterationCount: 'infinite',
          }}
        >
          ❄
        </span>
      ))}
    </div>
  )
}

const ConfettiEffect: React.FC = () => {
  const pieces = [
    'confetti-1',
    'confetti-2',
    'confetti-3',
    'confetti-4',
    'confetti-5',
    'confetti-6',
    'confetti-7',
    'confetti-8',
    'confetti-9',
    'confetti-10',
    'confetti-11',
    'confetti-12',
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
      {pieces.map((key, i) => (
        <span
          key={key}
          className="absolute h-1.5 w-1.5 rounded-full animate-float"
          style={{
            backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'][
              i % 4
            ],
            left: `${(i * 8) % 100}%`,
            top: `${(i * 20) % 80}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

const StarsEffect: React.FC = () => {
  const stars = [
    'star-1',
    'star-2',
    'star-3',
    'star-4',
    'star-5',
    'star-6',
    'star-7',
    'star-8',
    'star-9',
    'star-10',
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
      {stars.map((key, i) => (
        <span
          key={key}
          className="absolute text-amber-300 text-[10px] animate-pulse"
          style={{
            left: `${(i * 10) % 100}%`,
            top: `${(i * 15) % 80}%`,
            animationDuration: `${1.5 + (i % 2)}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}
