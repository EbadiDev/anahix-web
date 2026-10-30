import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Flame,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import type { SystemAnnouncement } from '../types'
import { MarkdownRenderer } from './content/MarkdownRenderer'
import { ModalCloseButton } from './vibefarsi/ModalCloseButton'

export const AnnouncementPopupModal: React.FC = () => {
  const location = useLocation()
  const [activePopup, setActivePopup] = useState<SystemAnnouncement | null>(
    null,
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Strictly suppress storefront marketing popups on administrative routes
    if (location.pathname.startsWith('/admin')) {
      setIsOpen(false)
      setActivePopup(null)
      return
    }

    let isMounted = true
    apiService.getAnnouncements().then((list) => {
      if (!isMounted || !list || list.length === 0) return
      const currentPath = location.pathname

      const popupItem = list.find((item) => {
        if (!item.is_active) return false
        if (
          item.display_type !== 'popup_first_load' &&
          item.display_type !== 'bell_and_popup'
        )
          return false

        // Check if dismissed in localStorage within the configured duration (24h, 7d, 30d, etc.)
        const dismissedKey = `dismissed_announcement_${item.id}`
        const rawDismiss = localStorage.getItem(dismissedKey)
        if (rawDismiss) {
          try {
            const parsed = JSON.parse(rawDismiss)
            if (parsed?.expiresAt && Date.now() < parsed.expiresAt) {
              return false // Still dismissed
            }
          } catch {
            // If legacy string was stored
            if (rawDismiss === 'true') {
              return false
            }
          }
        }

        // Match target pages
        const pages = (item.target_pages || 'all')
          .split(',')
          .map((p) => p.trim())
        if (pages.includes('all')) return true
        if (pages.includes(currentPath)) return true
        if (currentPath.startsWith('/products') && pages.includes('/products'))
          return true
        if (currentPath.startsWith('/category') && pages.includes('/category'))
          return true
        if (currentPath.startsWith('/profile') && pages.includes('/profile'))
          return true
        return false
      })

      if (popupItem) {
        setActivePopup(popupItem)
        setIsOpen(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  const handleDismiss = () => {
    if (activePopup) {
      const duration = activePopup.dismiss_duration || '7d'
      let ttlMs = 7 * 24 * 60 * 60 * 1000 // default 7 days
      if (duration === '24h') {
        ttlMs = 24 * 60 * 60 * 1000 // 24 hours
      } else if (duration === '7d') {
        ttlMs = 7 * 24 * 60 * 60 * 1000 // 7 days
      } else if (duration === '30d') {
        ttlMs = 30 * 24 * 60 * 60 * 1000 // 30 days
      } else if (duration === 'forever') {
        ttlMs = 365 * 24 * 60 * 60 * 1000 // 1 year (permanent)
      } else if (duration === 'every_load') {
        ttlMs = 2 * 60 * 60 * 1000 // 2 hours temporary dismissal
      }

      const dismissData = {
        announcementId: activePopup.id,
        dismissedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        duration,
      }
      try {
        localStorage.setItem(
          `dismissed_announcement_${activePopup.id}`,
          JSON.stringify(dismissData),
        )
      } catch {}
    }
    setIsOpen(false)
  }

  if (!isOpen || !activePopup) return null

  const getSeverityDetails = (sev: string) => {
    switch (sev) {
      case 'discount':
        return {
          icon: <Flame className="w-5 h-5 text-rose-500" />,
          badge: 'تخفیف و جشنواره',
          badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        }
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
          badge: 'هشدار مهم',
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        }
      case 'success':
        return {
          icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
          badge: 'بروزرسانی',
          badgeClass:
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        }
      default:
        return {
          icon: <Bell className="w-5 h-5 text-brand" />,
          badge: 'اطلاعیه',
          badgeClass: 'bg-brand/10 text-brand border-brand/20',
        }
    }
  }

  const sev = getSeverityDetails(activePopup.severity)

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground"
      >
        {activePopup.image_url && (
          <div className="w-full h-44 sm:h-52 overflow-hidden bg-muted relative">
            <img
              src={activePopup.image_url}
              alt={activePopup.title}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950 cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4 pt-2">
          {!activePopup.image_url && (
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-control bg-secondary flex items-center justify-center border border-border/60 shadow-xs">
                  {sev.icon}
                </div>
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${sev.badgeClass}`}
                  >
                    {sev.badge}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
                    {activePopup.title}
                  </h3>
                </div>
              </div>
              <ModalCloseButton onClick={handleDismiss} size="sm" />
            </div>
          )}

          {activePopup.image_url && (
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {activePopup.title}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${sev.badgeClass}`}
              >
                {sev.badge}
              </span>
            </div>
          )}

          <div className="text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto">
            <MarkdownRenderer content={activePopup.content} />
          </div>

          <div className="pt-3 border-t border-border/60 flex justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>متوجه شدم</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
