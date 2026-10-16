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
      className={`relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-red-900/30 to-slate-900/40 p-5 sm:p-6 backdrop-blur-xl shadow-lg shadow-rose-950/20 ${className}`}
    >
      {/* Background flare */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-600/30 shrink-0">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white">
                {title}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                <Sparkles className="h-2.5 w-2.5" />
                <span>فرصت ویژه</span>
              </span>
            </div>
            <p className="text-xs text-rose-200/80 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Digital Counter Boxes */}
        <div
          className="flex items-center gap-2 sm:gap-3 text-white font-latin"
          dir="ltr"
        >
          {timeLeft.days > 0 && (
            <>
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-black/40 text-lg font-black text-white shadow-inner backdrop-blur-md">
                  {toPersianDigits(String(timeLeft.days).padStart(2, '0'))}
                </div>
                <span className="text-[10px] text-rose-200/70 mt-1 font-sans">
                  روز
                </span>
              </div>
              <span className="text-xl font-bold text-rose-400 mb-4">:</span>
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-black/40 text-lg font-black text-white shadow-inner backdrop-blur-md">
              {toPersianDigits(String(timeLeft.hours).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-rose-200/70 mt-1 font-sans">
              ساعت
            </span>
          </div>
          <span className="text-xl font-bold text-rose-400 mb-4">:</span>

          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-black/40 text-lg font-black text-white shadow-inner backdrop-blur-md">
              {toPersianDigits(String(timeLeft.minutes).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-rose-200/70 mt-1 font-sans">
              دقیقه
            </span>
          </div>
          <span className="text-xl font-bold text-rose-400 mb-4">:</span>

          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-600/30 text-lg font-black text-rose-200 shadow-inner backdrop-blur-md animate-pulse">
              {toPersianDigits(String(timeLeft.seconds).padStart(2, '0'))}
            </div>
            <span className="text-[10px] text-rose-200/70 mt-1 font-sans">
              ثانیه
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
