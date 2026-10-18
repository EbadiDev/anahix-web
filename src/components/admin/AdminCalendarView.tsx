import {
  Calendar as CalendarIcon,
  Gift,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../services/api'
import {
  type CalendarEvent,
  PersianJalaliCalendar,
  toPersianDigits,
} from '../vibefarsi/PersianJalaliCalendar'
import { AdminHeaderBanner } from './AdminHeaderBanner'

interface CampaignCalendarEvent extends CalendarEvent {
  id?: string
  color?: string
  couponCode?: string
  discountPercent?: number
  syncWithBanner?: boolean
}

const PRESET_COLORS = [
  {
    label: 'زمردی',
    hex: '#10b981',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    label: 'یاقوتی',
    hex: '#f43f5e',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10 text-rose-500',
  },
  {
    label: 'طلایی',
    hex: '#f59e0b',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10 text-amber-500',
  },
  {
    label: 'بنفش',
    hex: '#a855f7',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10 text-purple-400',
  },
  {
    label: 'لاجوردی',
    hex: '#3b82f6',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10 text-blue-400',
  },
  {
    label: 'فیروزه‌ای',
    hex: '#06b6d4',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10 text-cyan-400',
  },
]

export const AdminCalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('1405/01/01')
  const [events, setEvents] = useState<CampaignCalendarEvent[]>(() => {
    const raw = localStorage.getItem('anahix_calendar_events')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    return [
      {
        id: 'evt-1',
        date: '1405/01/01',
        title: 'آغاز سال نو و جشنواره بهاره نوروزی آناهیکس',
        type: 'holiday',
        badge: 'جشنواره نوروز',
        color: '#10b981',
        couponCode: 'NOROOZ1405',
        discountPercent: 25,
      },
      {
        id: 'evt-2',
        date: '1405/01/02',
        title: 'تخفیف شگفت‌انگیز ۳۵٪ لایسنس‌های ChatGPT Plus',
        type: 'sale',
        badge: 'شگفت‌انگیز',
        color: '#f43f5e',
        couponCode: 'ANAHIX50',
        discountPercent: 35,
      },
      {
        id: 'evt-3',
        date: '1405/01/13',
        title: 'روز طبیعت و کمپین شارژ هدیه کیف پول',
        type: 'holiday',
        badge: 'هدیه شارژ',
        color: '#10b981',
        discountPercent: 15,
      },
      {
        id: 'evt-4',
        date: '1405/07/25',
        title: 'تمدید دوره‌ای سرورهای اختصاصی و پشتیبانی ۲۴ ساعته',
        type: 'maintenance',
        badge: 'عملیاتی',
        color: '#3b82f6',
      },
      {
        id: 'evt-5',
        date: '1405/09/30',
        title: 'جشنواره شب یلدا و تخفیف اکانت‌های ۱۸ ماهه Gemini',
        type: 'sale',
        badge: 'یلدا',
        color: '#f43f5e',
        couponCode: 'TELEGRAM20',
        discountPercent: 20,
      },
    ]
  })

  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<
    'sale' | 'event' | 'holiday' | 'maintenance'
  >('sale')
  const [newBadge, setNewBadge] = useState('')
  const [newColor, setNewColor] = useState('#f43f5e')
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(20)
  const [syncWithBanner, setSyncWithBanner] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [availableCoupons, setAvailableCoupons] = useState<string[]>([])
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null)

  // Persist events to localStorage
  useEffect(() => {
    localStorage.setItem('anahix_calendar_events', JSON.stringify(events))
  }, [events])

  // Load available coupons from database
  useEffect(() => {
    api
      .getPublicCoupons()
      .then((list) => {
        if (list && Array.isArray(list)) {
          setAvailableCoupons(list.map((c) => c.code))
        }
      })
      .catch(() => {})
  }, [])

  const handleOpenEdit = (evt: CampaignCalendarEvent) => {
    setEditingEventId(evt.id || null)
    setSelectedDate(evt.date)
    setNewTitle(evt.title)
    setNewType((evt.type as any) || 'sale')
    setNewBadge(evt.badge || '')
    setNewColor(evt.color || '#f43f5e')
    setNewCouponCode(evt.couponCode || '')
    setNewDiscountPercent(evt.discountPercent || 20)
    setSyncWithBanner(false)
    setShowAddModal(true)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEventId
            ? {
                ...e,
                date: selectedDate,
                title: newTitle.trim(),
                type: newType,
                badge: newBadge.trim() || undefined,
                color: newColor,
                couponCode: newCouponCode.trim() || undefined,
                discountPercent:
                  newDiscountPercent > 0 ? newDiscountPercent : undefined,
              }
            : e,
        ),
      )
      setEditingEventId(null)
    } else {
      const newEvt: CampaignCalendarEvent = {
        id: `evt-${Date.now()}`,
        date: selectedDate,
        title: newTitle.trim(),
        type: newType,
        badge: newBadge.trim() || undefined,
        color: newColor,
        couponCode: newCouponCode.trim() || undefined,
        discountPercent:
          newDiscountPercent > 0 ? newDiscountPercent : undefined,
      }
      setEvents((prev) => [newEvt, ...prev])
    }

    // If sync with banner was checked, sync with active theme settings in DB!
    if (syncWithBanner) {
      try {
        await api.updateAdminThemeSettings({
          event_name: newTitle.trim(),
          event_active: true,
          primary_color: newColor,
          header_announcement: `${newTitle.trim()} ${newDiscountPercent > 0 ? `با ${newDiscountPercent}٪ تخفیف ویژه` : ''} در فروشگاه آناهیکس برقرار است`,
        })
        setSyncSuccessMsg(
          `کمپین «${newTitle.trim()}» با نوار اعلان و تم بالای سایت همگام‌سازی شد.`,
        )
        setTimeout(() => setSyncSuccessMsg(null), 5000)
      } catch {}
    }

    setNewTitle('')
    setNewBadge('')
    setNewCouponCode('')
    setSyncWithBanner(false)
    setShowAddModal(false)
  }

  const handleDeleteEvent = (id?: string, title?: string) => {
    setEvents((prev) =>
      prev.filter((e) => (id ? e.id !== id : e.title !== title)),
    )
  }

  const handleSyncEventToBanner = async (evt: CampaignCalendarEvent) => {
    try {
      await api.updateAdminThemeSettings({
        event_name: evt.title,
        event_active: true,
        primary_color: evt.color || '#2563eb',
        header_announcement: `${evt.title} ${evt.discountPercent ? `با ${evt.discountPercent}٪ تخفیف` : ''} در فروشگاه آناهیکس برقرار است`,
      })
      setSyncSuccessMsg(
        `کمپین «${evt.title}» در نوار مناسبتی بالای سایت فعال شد!`,
      )
      setTimeout(() => setSyncSuccessMsg(null), 5000)
    } catch {}
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Admin Header Banner */}
      <AdminHeaderBanner
        icon={CalendarIcon}
        title="تقویم شمسی رویدادها، جشنواره‌ها و کمپین‌های تخفیف"
        subtitle="برنامه‌ریزی تخفیف‌ها، اتصال کمپین به کدهای تخفیف دیتابیس، انتخاب رنگ نشان و همگام‌سازی با نوار مناسبت سایت"
        badgeText="کمپین‌های تقویمی"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewTitle('')
                setNewBadge('')
                setNewCouponCode('')
                setShowAddModal(true)
              }}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>ثبت رویداد برای {toPersianDigits(selectedDate)}</span>
            </button>
          </div>
        }
      />

      {syncSuccessMsg && (
        <div className="p-3.5 rounded-surface bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncSuccessMsg(null)}
            className="p-1 rounded-control text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Interactive Jalali Calendar */}
        <div className="lg:col-span-7 flex flex-col">
          <PersianJalaliCalendar
            events={events}
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
            className="h-full min-h-[500px]"
          />
        </div>

        {/* Scheduled Campaigns List */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-surface border border-border/80 bg-card p-5 shadow-surface flex flex-col h-full min-h-[500px] space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>لیست کمپین‌ها و مناسبت‌های ثبت‌شده</span>
              </h3>
              <span className="text-xs font-bold text-muted-foreground font-latin">
                {toPersianDigits(events.length)} مورد
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pl-1 scrollbar-thin">
              {events.map((evt) => (
                <div
                  key={`evt-admin-${evt.id || evt.title}-${evt.date}`}
                  className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2.5 text-right relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-brand font-latin">
                      {toPersianDigits(evt.date)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {evt.badge && (
                        <span
                          className="px-2 py-0.5 rounded-control text-[10px] font-bold border"
                          style={{
                            backgroundColor: evt.color
                              ? `${evt.color}15`
                              : undefined,
                            color: evt.color || undefined,
                            borderColor: evt.color
                              ? `${evt.color}35`
                              : undefined,
                          }}
                        >
                          {evt.badge}
                        </span>
                      )}
                      {evt.discountPercent && (
                        <span className="px-2 py-0.5 rounded-control bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black font-latin">
                          {evt.discountPercent}٪ تخفیف
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-foreground leading-relaxed">
                    {evt.title}
                  </h4>

                  {evt.couponCode && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Tag className="w-3.5 h-3.5 text-brand" />
                      <span>کد تخفیف متصل:</span>
                      <span className="font-mono font-bold text-foreground bg-card border border-border/60 px-1.5 py-0.2 rounded-control font-latin">
                        {evt.couponCode}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSyncEventToBanner(evt)}
                      className="text-[11px] text-brand hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      title="فعال‌سازی این رویداد در بنر مناسبتی بالای سایت"
                    >
                      <Zap className="w-3.5 h-3.5 text-brand" />
                      <span>فعال‌سازی در بنر هدر</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(evt)}
                        className="p-1 rounded-control text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                        title="ویرایش رویداد"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="p-1 rounded-control text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="حذف رویداد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT EVENT MODAL */}
      {showAddModal &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Gift className="w-5 h-5 text-brand" />
                    <span>
                      {editingEventId
                        ? `ویرایش رویداد: ${newTitle}`
                        : `ثبت رویداد یا کمپین برای ${toPersianDigits(selectedDate)}`}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-foreground block">
                      عنوان رویداد یا کمپین *
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="مثال: جشنواره عید فطر و تخفیف اکانت‌های هوش مصنوعی"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        نوع مناسبت
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      >
                        <option value="sale">جشنواره تخفیف فروش</option>
                        <option value="holiday">مناسبت رسمی / تعطیلی</option>
                        <option value="event">کمپین ویژه اعضا</option>
                        <option value="maintenance">به‌روزرسانی و سرور</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        متن نشان (Badge)
                      </label>
                      <input
                        type="text"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                        placeholder="مثال: عیدانه ۲۵٪"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Color Palette Selector */}
                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-foreground block">
                      رنگ تم نشان و هایلایت رویداد:
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setNewColor(c.hex)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-control border text-[11px] font-bold cursor-pointer transition-all ${
                            newColor === c.hex
                              ? `${c.border} ${c.bg} ring-2 ring-brand/30 shadow-control`
                              : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discount & Coupon link */}
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        درصد تخفیف پیشنهادی (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newDiscountPercent}
                        onChange={(e) =>
                          setNewDiscountPercent(Number(e.target.value))
                        }
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground block">
                        کد تخفیف متصل
                      </label>
                      <input
                        type="text"
                        value={newCouponCode}
                        onChange={(e) =>
                          setNewCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="مثال: NOROOZ1405"
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin uppercase outline-none focus:border-brand"
                      />
                      {availableCoupons.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {availableCoupons.slice(0, 3).map((cc) => (
                            <button
                              key={cc}
                              type="button"
                              onClick={() => setNewCouponCode(cc)}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded-control bg-secondary text-brand hover:bg-brand/10 border border-brand/20 cursor-pointer"
                            >
                              {cc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auto-sync with holiday banner */}
                  <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">
                        فعال‌سازی در نوار اعلان و مناسبت بالای سایت
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        با انتخاب این گزینه، پیام این رویداد در بنر متحرک بالای
                        سایت به نمایش درمی‌آید.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncWithBanner}
                      onChange={(e) => setSyncWithBanner(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="h-10 px-4 rounded-control border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      ثبت کمپین و ذخیره
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
