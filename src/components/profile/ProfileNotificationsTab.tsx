import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Globe2,
  Megaphone,
  Package,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { CustomerNotificationItem, SystemAnnouncement } from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { MarkdownRenderer } from '../content/MarkdownRenderer'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'

export const ProfileNotificationsTab: React.FC = () => {
  const { success, error } = useNotification()

  // Real In-App Notifications state
  const [notifications, setNotifications] = useState<
    CustomerNotificationItem[]
  >([])
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<
    'all' | 'system' | 'personal' | 'unread'
  >('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 5
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<UnifiedNotif | null>(null)

  const [seenAnnounceIds, setSeenAnnounceIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('anahix_seen_announcements')
      if (raw) return new Set(JSON.parse(raw))
    } catch {}
    return new Set()
  })

  const loadAllNotifications = async () => {
    setLoading(true)
    try {
      const [notifsRes, annList] = await Promise.all([
        apiService
          .getInAppNotifications()
          .catch(() => ({ items: [], unread_count: 0 })),
        apiService.getAnnouncements().catch(() => []),
      ])
      setNotifications(notifsRes?.items || [])
      setUnreadCount(notifsRes?.unread_count || 0)
      setAnnouncements(annList || [])
    } catch {
      setNotifications([])
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
      success('اعلان خوانده شد', 'این پیام به عنوان خوانده شده ثبت گردید.')
    } catch (err: any) {
      error('خطا', err.message || 'ثبت وضعیت ناموفق بود')
    }
  }

  const handleMarkAnnounceAsRead = (id: string) => {
    const updated = new Set([...seenAnnounceIds, String(id)])
    setSeenAnnounceIds(updated)
    try {
      localStorage.setItem(
        'anahix_seen_announcements',
        JSON.stringify(Array.from(updated)),
      )
    } catch {}
    window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
    success(
      'اطلاعیه مشاهده شد',
      'این پیام سراسری به عنوان خوانده شده علامت‌گذاری شد.',
    )
  }

  const formatJalaliDateTime = (d: Date) => {
    const dateStr = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const timeStr = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return { dateStr, timeStr }
  }

  const handleMarkAsUnread = (id: string, kind: 'personal' | 'announcement') => {
    if (kind === 'announcement') {
      const updated = new Set(seenAnnounceIds)
      updated.delete(String(id))
      setSeenAnnounceIds(updated)
      try {
        localStorage.setItem(
          'anahix_seen_announcements',
          JSON.stringify(Array.from(updated)),
        )
      } catch {}
      window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
      success(
        'وضعیت تغییر کرد',
        'اطلاعیه به عنوان خوانده‌نشده تنظیم شد.',
      )
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      )
      setUnreadCount((prev) => prev + 1)
      window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
      success('وضعیت تغییر کرد', 'پیام به عنوان خوانده‌نشده تنظیم شد.')
    }
  }
    try {
      if (unreadCount > 0) {
        await apiService.markAllNotificationsAsRead().catch(() => {})
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
      const allAnnounceIds = announcements.map((a) => String(a.id))
      const updated = new Set([...seenAnnounceIds, ...allAnnounceIds])
      setSeenAnnounceIds(updated)
      try {
        localStorage.setItem(
          'anahix_seen_announcements',
          JSON.stringify(Array.from(updated)),
        )
      } catch {}
      window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
      success(
        'همه اعلان‌ها خوانده شدند',
        'کلیه پیام‌ها و اطلاعیه‌های سراسری به وضعیت خوانده شده تغییر یافتند.',
      )
    } catch (err: any) {
      error('خطا', err.message || 'ثبت وضعیت ناموفق بود')
    }
  }

  // Unified items
  type UnifiedNotif =
    | {
        kind: 'personal'
        data: CustomerNotificationItem
        date: Date
        isRead: boolean
      }
    | {
        kind: 'announcement'
        data: SystemAnnouncement
        date: Date
        isRead: boolean
      }

  const unifiedList = useMemo<UnifiedNotif[]>(() => {
    const p: UnifiedNotif[] = notifications.map((n) => ({
      kind: 'personal',
      data: n,
      date: new Date(n.created_at || Date.now()),
      isRead: n.is_read,
    }))
    const a: UnifiedNotif[] = announcements.map((ann) => ({
      kind: 'announcement',
      data: ann,
      date: new Date((ann as any).created_at || Date.now()),
      isRead: seenAnnounceIds.has(String(ann.id)),
    }))
    return [...p, ...a].sort((x, y) => y.date.getTime() - x.date.getTime())
  }, [notifications, announcements, seenAnnounceIds])

  const filteredItems = useMemo(() => {
    return unifiedList.filter((item) => {
      if (filter === 'unread') return !item.isRead
      if (filter === 'system') return item.kind === 'announcement'
      if (filter === 'personal') return item.kind === 'personal'
      return true
    })
  }, [unifiedList, filter])

  const totalUnreadAll =
    unreadCount +
    announcements.filter((a) => !seenAnnounceIds.has(String(a.id))).length

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-brand" />
      case 'security':
        return <Shield className="w-5 h-5 text-emerald-400" />
      case 'loyalty':
        return <Sparkles className="w-5 h-5 text-brand" />
      default:
        return <Bell className="w-5 h-5 text-brand" />
    }
  }

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 max-w-4xl text-right"
      dir="rtl"
    >
      {/* 1. Header Banner */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 duration-motion ease-motion">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Bell className="w-4 h-4 text-brand" />
            </div>
            <h3 className="text-base font-black text-foreground">
              صندوق اعلان‌ها و اطلاع‌رسانی سیستم (In-App Notifications)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            پیام‌های تحویل سفارش، هشدارهای امنیتی سشن و تخفیف‌های خودکار باشگاه
            مشتریان
          </p>
        </div>

        {totalUnreadAll > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>علامت‌گذاری همه به عنوان خوانده شده</span>
          </button>
        )}
      </div>

      {/* 2. Notifications & Announcements List */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4 duration-motion ease-motion">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">
              صندوق پیام‌ها و اطلاعیه‌های دریافتی
            </h4>
            {totalUnreadAll > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 font-latin">
                {toPersianDigits(totalUnreadAll)} خوانده نشده
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFilter('all')
                setVisibleCount(6)
              }}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              همه ({toPersianDigits(unifiedList.length)})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('system')
                setVisibleCount(6)
              }}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'system'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              اطلاعیه‌های سراسری ({toPersianDigits(announcements.length)})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('personal')
                setVisibleCount(6)
              }}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'personal'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              پیام‌های حساب ({toPersianDigits(notifications.length)})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('unread')
                setVisibleCount(6)
              }}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              خوانده نشده ({toPersianDigits(totalUnreadAll)})
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="در حال دریافت اعلان‌ها و پیام‌های سیستم از سرور..." />
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center bg-muted/10 border border-dashed border-border/60 rounded-control p-8 space-y-2">
            <Bell className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              پیام یا اعلانی در این دسته‌بندی وجود ندارد
            </p>
            <p className="text-[11px] text-muted-foreground">
              رویدادهای جدید، اطلاعیه‌های سراسری و وضعیت سفارش‌ها بلافاصله در
              اینجا نمایش داده خواهند شد.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.slice(0, visibleCount).map((item) => {
              if (item.kind === 'announcement') {
                const ann = item.data
                return (
                  <div
                    key={`ann-${ann.id}`}
                    className={`p-4 rounded-control border transition-all duration-motion ease-motion space-y-3 ${
                      !item.isRead
                        ? 'border-brand/40 bg-brand/5 shadow-control'
                        : 'border-border/40 bg-muted/20 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {ann.image_url ? (
                          <img
                            src={ann.image_url}
                            alt=""
                            className="w-11 h-11 rounded-control object-cover border border-border/60 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                            <Megaphone className="w-5 h-5 text-brand" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                            )}
                            <h5 className="text-xs sm:text-sm font-black text-foreground">
                              {ann.title}
                            </h5>
                            <span className="text-[9px] px-2 py-0.5 rounded-control font-black bg-primary/10 text-primary border border-primary/20">
                              اطلاعیه سراسری
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-control font-bold border font-sans ${
                                ann.severity === 'discount'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  : ann.severity === 'warning'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : ann.severity === 'success'
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              }`}
                            >
                              {ann.severity === 'discount'
                                ? '🔥 تخفیف ویژه'
                                : ann.severity === 'warning'
                                  ? '⚠️ هشدار'
                                  : ann.severity === 'success'
                                    ? '✅ موفق'
                                    : '📢 اطلاع‌رسانی'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-sans mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>
                                {item.date.toLocaleDateString('fa-IR')}
                              </span>
                            </span>
                            {ann.target_pages && ann.target_pages !== 'all' && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Globe2 className="w-3 h-3 text-brand" />
                                  <span>صفحه {ann.target_pages}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAnnounceAsRead(ann.id)}
                            className="text-[11px] font-bold text-brand hover:underline px-2.5 py-1 rounded-control bg-card border border-border/40 cursor-pointer shadow-xs"
                          >
                            مشاهده شد ✓
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground leading-relaxed sm:pr-14">
                      <MarkdownRenderer content={ann.content} />
                    </div>
                  </div>
                )
              }

              // Personal Notification
              const n = item.data
              return (
                <div
                  key={`notif-${n.id}`}
                  className={`p-4 rounded-control border transition-all duration-motion ease-motion space-y-2.5 ${
                    !item.isRead
                      ? 'border-brand/40 bg-secondary shadow-control'
                      : 'border-border/40 bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-control bg-card border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                          )}
                          <h5 className="text-xs sm:text-sm font-black text-foreground truncate">
                            {n.title}
                          </h5>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-control font-bold bg-muted text-muted-foreground border border-border/40">
                            پیام حساب
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono font-latin block mt-0.5">
                          {item.date.toLocaleString('fa-IR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[11px] font-bold text-brand hover:underline px-2.5 py-1 rounded-control bg-card border border-border/40 cursor-pointer shadow-xs"
                        >
                          خوانده شد ✓
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pr-12">
                    {n.message}
                  </p>

                  {n.link && (
                    <div className="pr-12 pt-1">
                      <Link
                        to={n.link}
                        className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>مشاهده بخش مربوطه</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Load More Notifications Button */}
            {visibleCount < filteredItems.length && (
              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
                >
                  <span>بارگذاری پیام‌های بیشتر</span>
                  <span className="text-[11px] text-muted-foreground font-latin">
                    (نمایش{' '}
                    {toPersianDigits(
                      Math.min(visibleCount, filteredItems.length),
                    )}{' '}
                    از {toPersianDigits(filteredItems.length)})
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
