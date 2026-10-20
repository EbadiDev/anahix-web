import {
  Check,
  ChevronDown,
  Columns2,
  Flame,
  LayoutGrid,
  LayoutTemplate,
  Sidebar,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export interface BannerPositionOption {
  id: string
  label: string
  desc: string
  icon: React.ElementType
  tag: string
}

export const BANNER_POSITIONS: BannerPositionOption[] = [
  {
    id: 'main_slider',
    label: 'اسلایدر اصلی هیرو',
    desc: 'کاروسل بزرگ و متحرک بالای صفحه اصلی فروشگاه',
    icon: LayoutTemplate,
    tag: 'هیرو اصلی',
  },
  {
    id: 'middle_strip',
    label: 'نوار تبلیغاتی میانی (دوقلو)',
    desc: 'بنرهای عریض پروموشن اسکرولی بین کاتالوگ و مقالات وبلاگ',
    icon: Columns2,
    tag: 'نوار میانی',
  },
  {
    id: 'hero_side',
    label: 'کنار هیرو (پروموشن اختصاصی)',
    desc: 'بنرهای مکمل در ستون کنار اسلایدر هیرو با قابلیت اسکرول',
    icon: Sidebar,
    tag: 'ستون کناری',
  },
  {
    id: 'flash_sale',
    label: 'بنر جشنواره تخفیف شگفت‌انگیز',
    desc: 'باکس کمپین تخفیف‌های زمان‌دار و مناسبت‌های ویژه فروشگاه',
    icon: Flame,
    tag: 'جشنواره تخفیف',
  },
  {
    id: 'category_header',
    label: 'بنر هدر دسته‌بندی‌ها',
    desc: 'نمایش در بالای صفحات کاتالوگ و دسته‌بندی سرویس‌ها',
    icon: LayoutGrid,
    tag: 'صفحات دسته‌بندی',
  },
]

interface BannerPositionSelectProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export const BannerPositionSelect: React.FC<BannerPositionSelectProps> = ({
  value = 'main_slider',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeOption =
    BANNER_POSITIONS.find((p) => p.id === value) || BANNER_POSITIONS[0]
  const ActiveIcon = activeOption.icon

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      <label className="text-xs font-bold text-foreground block">
        موقعیت نمایش بنر *
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-field border border-border/60 bg-muted/20 hover:bg-muted/30 text-foreground text-xs font-bold flex items-center justify-between transition-colors cursor-pointer outline-none focus:border-brand"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-xs">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <span className="font-black text-xs text-foreground whitespace-nowrap">
            {activeOption.label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 font-bold whitespace-nowrap">
            {activeOption.tag}
          </span>
          <span className="text-[11px] text-muted-foreground truncate hidden md:inline mr-2">
            ({activeOption.desc})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 mr-1.5 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-1.5 z-50 rounded-surface border border-border/80 bg-card p-1.5 shadow-overlay space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto scrollbar-thin">
          {BANNER_POSITIONS.map((pos) => {
            const Icon = pos.icon
            const isSelected = value === pos.id
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => {
                  onChange(pos.id)
                  setIsOpen(false)
                }}
                className={`w-full p-2.5 rounded-control text-right flex items-center justify-between gap-2.5 transition-colors cursor-pointer duration-motion active:scale-[0.99] ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'bg-secondary text-brand border border-border/60 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-right flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black">{pos.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-control font-bold ${
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30'
                            : 'bg-secondary text-brand border border-border/60'
                        }`}
                      >
                        {pos.tag}
                      </span>
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        isSelected
                          ? 'text-primary-foreground/90'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {pos.desc}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 shrink-0 text-primary-foreground" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
