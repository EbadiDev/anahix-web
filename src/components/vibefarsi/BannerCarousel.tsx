import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShimmerButton } from './ShimmerButton'

export interface BannerData {
  id: string
  title: string
  subtitle?: string
  badge_text?: string
  image_url: string
  link_url?: string
  position?: string
  bg_gradient?: string
  button_text?: string
}

interface BannerCarouselProps {
  banners: BannerData[]
  className?: string
  autoPlayInterval?: number
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  className = '',
  autoPlayInterval = 6000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!banners || banners.length <= 1 || isPaused) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, autoPlayInterval)
    return () => clearInterval(timer)
  }, [banners, autoPlayInterval, isPaused])

  if (!banners || banners.length === 0) return null

  const current = banners[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  return (
    <div
      dir="rtl"
      className={`group relative overflow-hidden rounded-3xl border border-border shadow-md transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner background container */}
      <div
        className={`relative min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center justify-between p-6 sm:p-10 bg-gradient-to-l ${
          current.bg_gradient || 'from-blue-600 via-indigo-700 to-slate-900'
        } text-white`}
      >
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

        {/* Text Content */}
        <div className="relative z-10 max-w-xl space-y-3.5 text-right">
          {current.badge_text && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{current.badge_text}</span>
            </div>
          )}

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
            {current.title}
          </h2>

          {current.subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed max-w-md line-clamp-2">
              {current.subtitle}
            </p>
          )}

          {current.link_url && (
            <div className="pt-2">
              <Link to={current.link_url}>
                <ShimmerButton
                  background="rgba(255, 255, 255, 0.2)"
                  shimmerColor="#ffffff"
                  borderRadius="0.75rem"
                  className="backdrop-blur-md border border-white/30 text-xs sm:text-sm font-bold text-white shadow-lg px-4 py-2"
                >
                  <span>{current.button_text || 'مشاهده و خرید'}</span>
                  <span>←</span>
                </ShimmerButton>
              </Link>
            </div>
          )}
        </div>

        {/* Banner image illustration */}
        {current.image_url && (
          <div className="hidden sm:block relative z-10 shrink-0 w-48 md:w-72 lg:w-96 h-40 sm:h-56 md:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
            <img
              src={current.image_url}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
              title="بنر قبلی"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
              title="بنر بعدی"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {banners.map((b, idx) => {
              const dotKey = `carousel-dot-${b.id || idx}`
              return (
                <button
                  key={dotKey}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`اسلاید ${idx + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
