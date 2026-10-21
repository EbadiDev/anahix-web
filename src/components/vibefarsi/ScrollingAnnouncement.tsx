import type React from 'react'
import { useEffect, useRef, useState } from 'react'

interface ScrollingAnnouncementProps {
  text: string
  icon?: React.ReactNode
  prefix?: React.ReactNode
  className?: string
  textClassName?: string
  speedSeconds?: number
}

export const ScrollingAnnouncement: React.FC<ScrollingAnnouncementProps> = ({
  text,
  icon,
  prefix,
  className = '',
  textClassName = '',
  speedSeconds = 18,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)

  // Measure if content overflows on the current screen size
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // If content is wider than container or text length is long on tablet/mobile
        const isOverflow =
          textRef.current.scrollWidth > containerRef.current.clientWidth + 8
        setShouldScroll(isOverflow)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [text, prefix])

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className={`relative flex items-center min-w-0 overflow-hidden select-none ${className}`}
    >
      {/* Icon & Prefix (Fixed at the right in RTL) */}
      <div className="flex items-center gap-1.5 shrink-0 z-10 pl-2">
        {icon}
        {prefix}
      </div>

      {/* Text Area */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {/* Fallback & Desktop static text */}
        <span
          ref={textRef}
          className={`inline-block whitespace-nowrap transition-transform ${
            shouldScroll ? 'hidden lg:inline-block' : 'inline-block'
          } ${textClassName}`}
        >
          {text}
        </span>

        {/* Mobile/Tablet Auto-scrolling Ticker when overflowing */}
        {shouldScroll && (
          <div
            className="lg:hidden flex items-center whitespace-nowrap overflow-hidden group hover:[animation-play-state:paused]"
            style={{
              maskImage:
                'linear-gradient(to left, black 85%, transparent 100%)',
            }}
          >
            <div
              className="inline-flex items-center gap-8 shrink-0 animate-marquee-rtl group-hover:[animation-play-state:paused]"
              style={{
                animationDuration: `${speedSeconds}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            >
              <span className={`inline-block shrink-0 ${textClassName}`}>
                {text}
              </span>
              <span className="opacity-40 select-none">•</span>
              <span className={`inline-block shrink-0 ${textClassName}`}>
                {text}
              </span>
              <span className="opacity-40 select-none">•</span>
            </div>

            <div
              className="inline-flex items-center gap-8 shrink-0 animate-marquee-rtl group-hover:[animation-play-state:paused]"
              style={{
                animationDuration: `${speedSeconds}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
              aria-hidden="true"
            >
              <span className={`inline-block shrink-0 ${textClassName}`}>
                {text}
              </span>
              <span className="opacity-40 select-none">•</span>
              <span className={`inline-block shrink-0 ${textClassName}`}>
                {text}
              </span>
              <span className="opacity-40 select-none">•</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
