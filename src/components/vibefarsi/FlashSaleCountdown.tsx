import { Flame, Sparkles } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

interface FlashSaleCountdownProps {
  endTime: string | Date
  title?: string
  subtitle?: string
  onExpire?: () => void
  className?: string
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const FlashSaleCountdown: React.FC<FlashSaleCountdownProps> = ({
  endTime,
  title = 'تخفیف‌های شگفت‌انگیز زمان‌دار',
  subtitle = 'فرصت محدود تا پایان جشنواره فروش ویژه لایسنس‌های هوش مصنوعی',
  onExpire,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  })

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(endTime).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        })
        if (onExpire) onExpire()
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      )
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, expired: false })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [endTime, onExpire])

  if (timeLeft.expired) return null

  return (
    <div
      dir="rtl"
      className={`relative overflow-hidden rounded-surface border border-rose-500/30 bg-card p-5 sm:p-6 shadow-surface text-foreground ${className}`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-control bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-control shrink-0">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-foreground">
                {title}
              </span>
              <span className="inline-flex items-center gap-1 rounded-control bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-500">
                <Sparkles className="h-3 w-3" />
                <span>فرصت ویژه</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Digital Counter Boxes */}
        <div
          className="flex items-center gap-2 sm:gap-3 text-foreground font-latin"
          dir="ltr"
        >
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-control border border-border/80 bg-secondary text-foreground text-base font-black shadow-control">
                  {toPersianDigits(String(timeLeft.days).padStart(2, '0'))}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 font-sans">
                  روز
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground mb-3">
                :
              </span>
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-control border border-border/80 bg-secondary text-foreground text-base font-black shadow-control">
              {toPersianDigits(String(timeLeft.hours).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-sans">
              ساعت
            </span>
          </div>
          <span className="text-lg font-bold text-muted-foreground mb-3">
            :
          </span>

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-control border border-border/80 bg-secondary text-foreground text-base font-black shadow-control">
              {toPersianDigits(String(timeLeft.minutes).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-sans">
              دقیقه
            </span>
          </div>
          <span className="text-lg font-bold text-muted-foreground mb-3">
            :
          </span>

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-control border border-rose-500/40 bg-rose-500/15 text-rose-500 text-base font-black shadow-control animate-pulse">
              {toPersianDigits(String(timeLeft.seconds).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 font-sans">
              ثانیه
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
