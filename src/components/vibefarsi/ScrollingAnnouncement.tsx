import type React from 'react'
import { useRef, useState } from 'react'

interface ScrollingAnnouncementProps {
  text: string
  icon?: React.ReactNode
  prefix?: React.ReactNode
  className?: string
  textClassName?: string
}

export const ScrollingAnnouncement: React.FC<ScrollingAnnouncementProps> = ({
  text,
  icon,
  prefix,
  className = '',
  textClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Mouse drag handlers for desktop/tablet
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // multiplier for smooth feel
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  return (
    <div
      dir="rtl"
      className={`relative flex items-center min-w-0 overflow-hidden select-none ${className}`}
    >
      {/* Icon & Prefix (Fixed at right in RTL) */}
      {(icon || prefix) && (
        <div className="flex items-center gap-1.5 shrink-0 z-10 pl-2">
          {icon}
          {prefix}
        </div>
      )}

      {/* Manual Touch/Drag Scrollable Area */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 min-w-0 overflow-x-auto scrollbar-none touch-pan-x whitespace-nowrap cursor-grab active:cursor-grabbing transition-all ${
          isDragging ? 'select-none' : ''
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <span
          className={`inline-block whitespace-nowrap font-medium text-xs ${textClassName}`}
        >
          {text}
        </span>
      </div>
    </div>
  )
}
