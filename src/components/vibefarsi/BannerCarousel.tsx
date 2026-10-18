import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  return (
    <div
      dir="rtl"
      className={`group relative overflow-hidden rounded-surface border border-border/80 bg-card shadow-surface transition-all duration-200 select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-[260px] sm:h-[300px] md:h-[320px] overflow-hidden">
        {/* Full-bleed Background Image with smooth scale on hover */}
        {current.image_url ? (
          <img
            src={current.image_url}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-l ${
              current.bg_gradient || 'from-blue-600 via-indigo-700 to-slate-900'
            }`}
          />
        )}

        {/* High-contrast gradient scrim: Guarantees 100% text readability in both Light and Dark mode */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/80 via-transparent to-transparent opacity-80" />

        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Text & Action Content */}
        <div className="relative z-10 h-full p-5 sm:p-7 flex flex-col justify-end text-right text-white space-y-2 max-w-lg">
          {current.badge_text && (
            <div className="inline-flex self-start items-center gap-1.5 rounded-control bg-white/20 px-2.5 py-0.5 text-xs font-black backdrop-blur-md border border-white/30 text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{current.badge_text}</span>
            </div>
          )}

          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
            {current.title}
          </h2>

          {current.subtitle && (
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2 drop-shadow-xs font-normal">
              {current.subtitle}
            </p>
          )}

          {current.link_url && (
            <div className="pt-1.5">
              <Link
                to={current.link_url}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control transition-all"
              >
                <span>{current.button_text || 'مشاهده و خرید'}</span>
                <span>←</span>
              </Link>
            </div>
          )}
        </div>

        {/* Left/Right Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-control bg-slate-950/70 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-950 cursor-pointer shadow-control"
              title="بنر قبلی"
              aria-label="بنر قبلی"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-control bg-slate-950/70 border border-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-950 cursor-pointer shadow-control"
              title="بنر بعدی"
              aria-label="بنر بعدی"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Carousel Pagination Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={`dot-${b.id || idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                title={`اسلاید ${idx + 1}`}
                aria-label={`اسلاید ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
