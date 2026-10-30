import { Flame } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { toPersianDigits } from '../../utils/formatters'

interface FlashSaleCountdownProps {
  endTime: string | Date
  title?: string
  subtitle?: string
  onExpire?: () => void
  className?: string
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
      className={`relative overflow-hidden rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface text-foreground ${className}`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-control bg-secondary text-brand border border-border/60 shadow-control shrink-0">
            <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Digital Counter Boxes - Crisp Graphite Contrast in Both Light and Dark */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 text-foreground font-latin"
          dir="ltr"
        >
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-control border border-border/80 bg-secondary/80 text-foreground text-sm sm:text-base font-black font-mono shadow-xs">
                  {toPersianDigits(String(timeLeft.days).padStart(2, '0'))}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground mt-1 font-sans">
                  روز
                </span>
              </div>
              <span className="text-base font-bold text-muted-foreground/60 mb-3">
                :
              </span>
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-control border border-border/80 bg-secondary/80 text-foreground text-sm sm:text-base font-black font-mono shadow-xs">
              {toPersianDigits(String(timeLeft.hours).padStart(2, '0'))}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground mt-1 font-sans">
              ساعت
            </span>
          </div>
          <span className="text-base font-bold text-muted-foreground/60 mb-3">
            :
          </span>

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-control border border-border/80 bg-secondary/80 text-foreground text-sm sm:text-base font-black font-mono shadow-xs">
              {toPersianDigits(String(timeLeft.minutes).padStart(2, '0'))}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground mt-1 font-sans">
              دقیقه
            </span>
          </div>
          <span className="text-base font-bold text-muted-foreground/60 mb-3">
            :
          </span>

          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-control border border-brand/40 bg-brand/10 text-brand text-sm sm:text-base font-black font-mono shadow-control animate-pulse">
              {toPersianDigits(String(timeLeft.seconds).padStart(2, '0'))}
            </div>
            <span className="text-[10px] font-bold text-brand mt-1 font-sans">
              ثانیه
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
