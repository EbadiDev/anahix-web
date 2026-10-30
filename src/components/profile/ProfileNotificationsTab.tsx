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

  const handleMarkAsUnread = (
    id: string,
    kind: 'personal' | 'announcement',
  ) => {
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
      success('وضعیت تغییر کرد', 'اطلاعیه به عنوان خوانده‌نشده تنظیم شد.')
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      )
      setUnreadCount((prev) => prev + 1)
      window.dispatchEvent(new CustomEvent('anahix:notifications:read'))
      success('وضعیت تغییر کرد', 'پیام به عنوان خوانده‌نشده تنظیم شد.')
    }
  }

  const handleMarkAllAsRead = async () => {
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
                setCurrentPage(1)
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
                setCurrentPage(1)
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
                setCurrentPage(1)
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
                setCurrentPage(1)
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
          <div className="space-y-3.5">
            {filteredItems
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((item) => {
                const isAnnounce = item.kind === 'announcement'
                const ann = isAnnounce ? item.data : null
                const n = !isAnnounce ? item.data : null
                const dateTime = formatJalaliDateTime(item.date)

                return (
                  <div
                    key={isAnnounce ? `ann-${ann?.id}` : `notif-${n?.id}`}
                    className={`p-4 rounded-surface border transition-all duration-motion ease-motion space-y-3 ${
                      !item.isRead
                        ? 'border-brand/40 bg-brand/5 shadow-control'
                        : 'border-border/60 bg-card hover:bg-muted/20'
                    }`}
                  >
                    {/* Header Row: Title & Badges on Right, Persian Date & Time on Left */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/40 pb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {isAnnounce && ann?.image_url ? (
                          <img
                            src={ann.image_url}
                            alt=""
                            className="w-11 h-11 rounded-control object-cover border border-border/60 shrink-0 shadow-xs cursor-pointer hover:opacity-90"
                            onClick={() => setSelectedDetailItem(item)}
                          />
                        ) : isAnnounce ? (
                          <div
                            onClick={() => setSelectedDetailItem(item)}
                            className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-control cursor-pointer hover:bg-brand/10 transition-colors"
                          >
                            <Megaphone className="w-5 h-5 text-brand" />
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedDetailItem(item)}
                            className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0 shadow-control cursor-pointer hover:bg-brand/10 transition-colors"
                          >
                            {getNotifIcon(n?.type || 'system')}
                          </div>
                        )}

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5
                              onClick={() => setSelectedDetailItem(item)}
                              className="text-xs sm:text-sm font-black text-foreground hover:text-brand transition-colors cursor-pointer"
                            >
                              {isAnnounce ? ann?.title : n?.title}
                            </h5>

                            {/* Unified Modern Badges */}
                            {isAnnounce ? (
                              <>
                                <span className="text-[10px] px-2 py-0.5 rounded-control font-black bg-brand/10 text-brand border border-brand/20">
                                  📢 اطلاعیه سراسری
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-control font-bold border font-sans ${
                                    ann?.severity === 'discount'
                                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                      : ann?.severity === 'warning'
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                        : ann?.severity === 'success'
                                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                          : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  }`}
                                >
                                  {ann?.severity === 'discount'
                                    ? '🔥 تخفیف ویژه'
                                    : ann?.severity === 'warning'
                                      ? '⚠️ هشدار'
                                      : ann?.severity === 'success'
                                        ? '✅ موفق'
                                        : '📢 اطلاع‌رسانی'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] px-2 py-0.5 rounded-control font-black bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                                  👤 پیام حساب
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-control font-bold bg-muted text-muted-foreground border border-border/40">
                                  {n?.type === 'security'
                                    ? '🛡️ امنیت'
                                    : n?.type === 'loyalty'
                                      ? '⭐ وفاداری'
                                      : n?.type === 'order'
                                        ? '📦 سفارش'
                                        : '🔔 سیستم'}
                                </span>
                              </>
                            )}

                            {/* Read / Unread Status Badge */}
                            {item.isRead ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-control font-bold bg-muted/60 text-muted-foreground border border-border/40">
                                ✓ مشاهده شده
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-control font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 animate-pulse">
                                ● جدید
                              </span>
                            )}
                          </div>

                          {isAnnounce &&
                            ann?.target_pages &&
                            ann.target_pages !== 'all' && (
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-sans">
                                <Globe2 className="w-3 h-3 text-brand" />
                                <span>مربوط به صفحه {ann.target_pages}</span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Date & Time with Persian Digits - Clean Position at Top-Left */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 sm:gap-0.5 text-left shrink-0 bg-muted/30 sm:bg-transparent p-2 sm:p-0 rounded-control border sm:border-0 border-border/40">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-latin">
                          <Calendar className="w-3.5 h-3.5 text-brand" />
                          <span>{dateTime.dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-latin">
                          <Clock className="w-3 h-3 text-muted-foreground/80" />
                          <span>ساعت {dateTime.timeStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="text-xs text-muted-foreground leading-relaxed sm:pr-14 line-clamp-3">
                      {isAnnounce && ann?.content ? (
                        <MarkdownRenderer content={ann.content} />
                      ) : (
                        <p>{n?.message}</p>
                      )}
                    </div>

                    {/* Bottom Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 sm:pr-14">
                      <div className="flex items-center gap-2">
                        {/* Open in Full Modal Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(item)}
                          className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="مشاهده متن کامل و جزئیات پیام در مدال"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand" />
                          <span>مشاهده متن کامل</span>
                        </button>

                        {/* Read / Unread Status Toggle Button */}
                        {item.isRead ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkAsUnread(
                                (isAnnounce ? ann?.id : n?.id) || '',
                                item.kind,
                              )
                            }
                            className="h-8 px-2.5 rounded-control bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                            title="علامت‌گذاری به عنوان خوانده نشده"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>نشان به عنوان خوانده‌نشده</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              isAnnounce
                                ? ann && handleMarkAnnounceAsRead(ann.id)
                                : n && handleMarkAsRead(n.id)
                            }
                            className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-[11px] flex items-center gap-1 transition shadow-control cursor-pointer"
                            title="علامت‌گذاری به عنوان خوانده شده"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>خوانده شد ✓</span>
                          </button>
                        )}
                      </div>

                      {!isAnnounce && n?.link && (
                        <Link
                          to={n.link}
                          className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
                        >
                          <span>مشاهده بخش مربوطه</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}

            {/* Pagination Controls */}
            {filteredItems.length > pageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60 text-xs">
                <span className="text-muted-foreground font-bold font-latin">
                  نمایش {toPersianDigits((currentPage - 1) * pageSize + 1)} تا{' '}
                  {toPersianDigits(
                    Math.min(currentPage * pageSize, filteredItems.length),
                  )}{' '}
                  از {toPersianDigits(filteredItems.length)} پیام
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>صفحه قبل</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      {
                        length: Math.ceil(filteredItems.length / pageSize),
                      },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={`page-${page}`}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-control font-black text-xs font-latin cursor-pointer transition ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground shadow-control'
                            : 'bg-secondary hover:bg-muted text-foreground border border-border/40'
                        }`}
                      >
                        {toPersianDigits(page)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          Math.ceil(filteredItems.length / pageSize),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(filteredItems.length / pageSize)
                    }
                    className="h-8 px-3 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition"
                  >
                    <span>صفحه بعد</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal for Viewing Announcement or Notification */}
      {selectedDetailItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483600] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
            dir="rtl"
          >
            <div className="w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground max-h-[90vh] overflow-y-auto">
              {selectedDetailItem.kind === 'announcement' &&
                selectedDetailItem.data.image_url && (
                  <div className="w-full h-44 sm:h-52 overflow-hidden bg-muted relative">
                    <img
                      src={selectedDetailItem.data.image_url}
                      alt={selectedDetailItem.data.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <ModalCloseButton
                        onClick={() => setSelectedDetailItem(null)}
                        size="sm"
                      />
                    </div>
                  </div>
                )}

              <div className="p-5 sm:p-6 space-y-4 pt-3">
                {(!selectedDetailItem.kind ||
                  selectedDetailItem.kind !== 'announcement' ||
                  !selectedDetailItem.data.image_url) && (
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shadow-xs">
                        {selectedDetailItem.kind === 'announcement' ? (
                          <Megaphone className="w-5 h-5 text-brand" />
                        ) : (
                          getNotifIcon(selectedDetailItem.data.type)
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-foreground">
                          {selectedDetailItem.kind === 'announcement'
                            ? selectedDetailItem.data.title
                            : selectedDetailItem.data.title}
                        </h4>
                      </div>
                    </div>
                    <ModalCloseButton
                      onClick={() => setSelectedDetailItem(null)}
                      size="sm"
                    />
                  </div>
                )}

                {/* Badges & Timestamp Row inside Modal */}
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-control bg-muted/20 border border-border/40 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedDetailItem.kind === 'announcement' ? (
                      <>
                        <span className="text-[10px] px-2 py-0.5 rounded-control font-black bg-brand/10 text-brand border border-brand/20">
                          📢 اطلاعیه سراسری
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-control font-bold bg-muted text-muted-foreground border border-border/40">
                          {selectedDetailItem.data.severity === 'discount'
                            ? '🔥 تخفیف ویژه'
                            : selectedDetailItem.data.severity === 'warning'
                              ? '⚠️ هشدار مهم'
                              : '✅ اطلاعیه'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] px-2 py-0.5 rounded-control font-black bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                          👤 پیام اختصاصی
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-control font-bold bg-muted text-muted-foreground border border-border/40">
                          {selectedDetailItem.data.type === 'security'
                            ? '🛡️ امنیت'
                            : '🔔 سیستم'}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-latin">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatJalaliDateTime(selectedDetailItem.date).dateStr} -{' '}
                      {formatJalaliDateTime(selectedDetailItem.date).timeStr}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="text-xs text-muted-foreground leading-relaxed max-h-60 overflow-y-auto pr-1">
                  {selectedDetailItem.kind === 'announcement' ? (
                    <MarkdownRenderer
                      content={selectedDetailItem.data.content}
                    />
                  ) : (
                    <p className="leading-relaxed">
                      {selectedDetailItem.data.message}
                    </p>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {selectedDetailItem.isRead ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkAsUnread(
                            selectedDetailItem.data.id,
                            selectedDetailItem.kind,
                          )
                          setSelectedDetailItem((prev) =>
                            prev ? { ...prev, isRead: false } : null,
                          )
                        }}
                        className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>نشان به عنوان خوانده نشده</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedDetailItem.kind === 'announcement') {
                            handleMarkAnnounceAsRead(selectedDetailItem.data.id)
                          } else {
                            handleMarkAsRead(selectedDetailItem.data.id)
                          }
                          setSelectedDetailItem((prev) =>
                            prev ? { ...prev, isRead: true } : null,
                          )
                        }}
                        className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs flex items-center gap-1 transition shadow-control cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>خوانده شد ✓</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailItem(null)}
                    className="h-9 px-5 rounded-control border border-border/60 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
