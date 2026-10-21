import {
  AlertCircle,
  Calendar as CalendarIcon,
  Gift,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, apiService } from '../../services/api'
import type { CouponItem } from '../../types'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import {
  type CalendarEvent,
  gregorianToJalali,
  PersianJalaliCalendar,
  toPersianDigits,
} from '../vibefarsi/PersianJalaliCalendar'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

interface CampaignCalendarEvent extends CalendarEvent {
  id?: string
  color?: string
  couponCode?: string
  couponLabel?: string
  discountPercent?: number
  syncWithBanner?: boolean
  isActive?: boolean
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
  const {
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
  } = useNotification()
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
        couponLabel: '۲۵٪ تخفیف نوروزی',
        discountPercent: 25,
        isActive: true,
      },
      {
        id: 'evt-2',
        date: '1405/01/02',
        title: 'تخفیف شگفت‌انگیز ۳۵٪ لایسنس‌های ChatGPT Plus',
        type: 'sale',
        badge: 'شگفت‌انگیز',
        color: '#f43f5e',
        couponCode: 'ANAHIX50',
        couponLabel: '۳۵٪ تخفیف ویژه',
        discountPercent: 35,
        isActive: true,
      },
      {
        id: 'evt-3',
        date: '1405/01/13',
        title: 'روز طبیعت و کمپین شارژ هدیه کیف پول',
        type: 'holiday',
        badge: 'هدیه شارژ',
        color: '#10b981',
        discountPercent: 15,
        isActive: true,
      },
      {
        id: 'evt-4',
        date: '1405/07/25',
        title: 'تمدید دوره‌ای سرورهای اختصاصی و پشتیبانی ۲۴ ساعته',
        type: 'maintenance',
        badge: 'عملیاتی',
        color: '#3b82f6',
        isActive: true,
      },
      {
        id: 'evt-5',
        date: '1405/09/30',
        title: 'جشنواره شب یلدا و تخفیف اکانت‌های ۱۸ ماهه Gemini',
        type: 'sale',
        badge: 'یلدا',
        color: '#f43f5e',
        couponCode: 'TELEGRAM20',
        couponLabel: '۲۰٪ تخفیف یلدایی',
        discountPercent: 20,
        isActive: true,
      },
    ]
  })

  const [dbCoupons, setDbCoupons] = useState<CouponItem[]>([])
  const [, setLoadingCoupons] = useState(false)
  const [themeSettings, setThemeSettings] = useState<any>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<
    'sale' | 'event' | 'holiday' | 'maintenance'
  >('sale')
  const [newBadge, setNewBadge] = useState('')
  const [newColor, setNewColor] = useState('#f43f5e')
  const [newCouponCode, setNewCouponCode] = useState('')
  const [newCouponLabel, setNewCouponLabel] = useState('')
  const [newDiscountPercent, setNewDiscountPercent] = useState<number>(20)
  const [newIsActive, setNewIsActive] = useState<boolean>(true)
  const [syncWithBanner, setSyncWithBanner] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    type: 'event' | 'coupon'
    id?: string
    title?: string
    couponCode?: string
  }>({ isOpen: false, type: 'event' })
  const [tableFilter, setTableFilter] = useState<
    'all' | 'active' | 'reserved' | 'with_coupon'
  >('all')
  const [tableSearch, setTableSearch] = useState('')

  // Compute today's Jalali date (YYYY/MM/DD)
  const todayJalaliDate = useMemo(() => {
    const now = new Date()
    const j = gregorianToJalali(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    )
    return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`
  }, [])

  const getEventSchedulingStatus = (evt: CampaignCalendarEvent) => {
    if (evt.isActive === false) {
      return {
        status: 'disabled' as const,
        label: 'غیرفعال',
        badgeClass: 'bg-muted text-muted-foreground border-border/60',
      }
    }
    if (evt.date > todayJalaliDate) {
      return {
        status: 'reserved' as const,
        label: 'رزرو شده (آینده)',
        badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      }
    }
    return {
      status: 'active' as const,
      label: 'فعال',
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    }
  }

  // Persist events to localStorage
  useEffect(() => {
    localStorage.setItem('anahix_calendar_events', JSON.stringify(events))
  }, [events])

  const loadCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const list = await apiService.listCoupons()
      setDbCoupons(list)
    } catch {
    } finally {
      setLoadingCoupons(false)
    }
  }

  // Load available coupons and theme settings
  useEffect(() => {
    loadCoupons()
    api
      .getThemeSettings()
      .then(setThemeSettings)
      .catch(() => {})

    const handleThemeSync = (e: any) => {
      if (e.detail) {
        setThemeSettings((prev: any) => ({ ...prev, ...e.detail }))
      } else {
        api
          .getThemeSettings()
          .then(setThemeSettings)
          .catch(() => {})
      }
    }
    window.addEventListener('anahix:theme:updated', handleThemeSync)
    return () =>
      window.removeEventListener('anahix:theme:updated', handleThemeSync)
  }, [])

  const handleOpenEdit = (evt: CampaignCalendarEvent) => {
    setEditingEventId(evt.id || null)
    setSelectedDate(evt.date)
    setNewTitle(evt.title)
    setNewType((evt.type as any) || 'sale')
    setNewBadge(evt.badge || '')
    setNewColor(evt.color || '#f43f5e')
    setNewCouponCode(evt.couponCode || '')
    setNewCouponLabel(evt.couponLabel || '')
    setNewDiscountPercent(evt.discountPercent || 20)
    setNewIsActive(evt.isActive !== false)
    setSyncWithBanner(false)
    setShowAddModal(true)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setModalError('لطفاً عنوان رویداد یا کمپین را وارد نمایید')
      setTimeout(() => setModalError(null), 4000)
      return
    }

    const cCode = newCouponCode.trim().toUpperCase()
    const cLabel = newCouponLabel.trim()

    // If new coupon entered and doesn't exist in DB, create it automatically!
    if (cCode && !dbCoupons.some((c) => c.code.toUpperCase() === cCode)) {
      try {
        await apiService.createCoupon({
          code: cCode,
          discount_type: 'percentage',
          discount_value: newDiscountPercent || 20,
          label: cLabel || undefined,
          is_active: true,
        })
        await loadCoupons()
      } catch {}
    }

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
                couponCode: cCode || undefined,
                couponLabel: cLabel || undefined,
                discountPercent:
                  newDiscountPercent > 0 ? newDiscountPercent : undefined,
                isActive: newIsActive,
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
        couponCode: cCode || undefined,
        couponLabel: cLabel || undefined,
        discountPercent:
          newDiscountPercent > 0 ? newDiscountPercent : undefined,
        isActive: newIsActive,
      }
      setEvents((prev) => [newEvt, ...prev])
    }

    // If sync with banner was checked, sync with active theme settings in DB!
    if (syncWithBanner) {
      try {
        const payload = {
          event_name: newTitle.trim(),
          event_active: true,
          primary_color: newColor,
          header_announcement: `${newTitle.trim()} ${newDiscountPercent > 0 ? `با ${newDiscountPercent}٪ تخفیف ویژه` : ''} در فروشگاه آناهیکس برقرار است`,
        }
        await api.updateAdminThemeSettings(payload)
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', { detail: payload }),
        )
        notifySuccess(
          'همگام‌سازی نوار اعلان',
          `کمپین «${newTitle.trim()}» با نوار اعلان و تم بالای سایت همگام‌سازی شد.`,
        )
      } catch {}
    }

    setNewTitle('')
    setNewBadge('')
    setNewCouponCode('')
    setNewCouponLabel('')
    setSyncWithBanner(false)
    setShowAddModal(false)
  }

  const handleDeleteEvent = (id?: string, title?: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'event',
      id,
      title: title || 'این رویداد',
    })
  }

  const handleToggleEventActive = (id?: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isActive: e.isActive === false } : e,
      ),
    )
  }

  const handleToggleCouponActive = async (couponCode: string) => {
    const c = dbCoupons.find(
      (item) => item.code.toUpperCase() === couponCode.toUpperCase(),
    )
    if (!c) return
    try {
      await apiService.adminToggleCoupon(c.id)
      await loadCoupons()
      notifySuccess(
        'تغییر وضعیت کد تخفیف',
        `وضعیت فعال‌بودن کد تخفیف «${c.code}» با موفقیت تغییر یافت.`,
      )
      window.dispatchEvent(
        new CustomEvent('anahix:coupon:changed', {
          detail: { code: c.code, action: 'toggled' },
        }),
      )
    } catch (err: any) {
      notifyError('خطا در تغییر وضعیت کوپن', err.message)
    }
  }

  const handleDeleteCouponByCode = (couponCode: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'coupon',
      couponCode,
      title: `کد تخفیف ${couponCode}`,
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirm.type === 'event') {
      const targetId = deleteConfirm.id
      const targetTitle = deleteConfirm.title
      setEvents((prev) =>
        prev.filter((e) =>
          targetId ? e.id !== targetId : e.title !== targetTitle,
        ),
      )
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
      notifySuccess('حذف رویداد', 'رویداد با موفقیت از تقویم حذف شد.')
    } else if (deleteConfirm.type === 'coupon' && deleteConfirm.couponCode) {
      const code = deleteConfirm.couponCode
      const c = dbCoupons.find(
        (item) => item.code.toUpperCase() === code.toUpperCase(),
      )
      if (c) {
        try {
          await apiService.adminDeleteCoupon(c.id)
          await loadCoupons()
          notifySuccess(
            'حذف کد تخفیف',
            `کد تخفیف «${c.code}» با موفقیت از پایگاه‌داده حذف شد.`,
          )
          window.dispatchEvent(
            new CustomEvent('anahix:coupon:changed', {
              detail: { code: c.code, action: 'deleted' },
            }),
          )
        } catch (err: any) {
          notifyError('خطا در حذف کوپن', err.message)
        }
      }
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))
    }
  }

  const handleToggleHeaderAnnouncement = async (evt: CampaignCalendarEvent) => {
    const isCurrentlyActive = Boolean(
      themeSettings?.event_active &&
        (themeSettings?.event_name === evt.title ||
          (evt.couponCode &&
            themeSettings?.header_announcement?.includes(evt.couponCode))),
    )

    if (isCurrentlyActive) {
      try {
        const payload = {
          event_name: 'حالت عادی و پایدار',
          event_active: false,
          primary_color: '#2563eb',
          header_announcement:
            'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است',
        }
        await api.updateAdminThemeSettings(payload)
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', { detail: payload }),
        )
        setThemeSettings((prev: any) => ({ ...prev, ...payload }))
        notifyInfo(
          'غیرفعال‌سازی نوار اعلان',
          `نمایش رویداد «${evt.title}» در نوار بالای سایت لغو شد.`,
        )
      } catch (err: any) {
        notifyError('خطا در به‌روزرسانی نوار اعلان', err.message)
      }
    } else {
      try {
        const payload = {
          event_name: evt.title,
          event_active: true,
          primary_color: evt.color || '#2563eb',
          header_announcement: `${evt.title} ${evt.discountPercent ? `با ${evt.discountPercent}٪ تخفیف ویژه` : ''} در فروشگاه آناهیکس برقرار است`,
        }
        await api.updateAdminThemeSettings(payload)
        window.dispatchEvent(
          new CustomEvent('anahix:theme:updated', { detail: payload }),
        )
        setThemeSettings((prev: any) => ({ ...prev, ...payload }))
        notifySuccess(
          'فعال‌سازی در نوار اعلان سایت',
          `کمپین «${evt.title}» هم‌اکنون در بالای سایت در حال نمایش است.`,
        )
      } catch (err: any) {
        notifyError('خطا در فعال‌سازی بنر هدر', err.message)
      }
    }
  }

  const filteredEventsForTable = useMemo(() => {
    return events.filter((e) => {
      const sched = getEventSchedulingStatus(e)
      if (tableFilter === 'active' && sched.status !== 'active') return false
      if (tableFilter === 'reserved' && sched.status !== 'reserved')
        return false
      if (tableFilter === 'with_coupon' && !e.couponCode) return false

      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim()
        const matchTitle = (e.title || '').toLowerCase().includes(q)
        const matchCode = (e.couponCode || '').toLowerCase().includes(q)
        const matchDate = (e.date || '').includes(q)
        if (!matchTitle && !matchCode && !matchDate) return false
      }

      return true
    })
  }, [events, tableFilter, tableSearch, todayJalaliDate])

  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDate)
  }, [events, selectedDate])

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Admin Header Banner (Top button removed per user request) */}
      <AdminHeaderBanner
        icon={CalendarIcon}
        title="تقویم شمسی رویدادها، جشنواره‌ها و کمپین‌های تخفیف"
        subtitle="برنامه‌ریزی تخفیف‌ها، اتصال کمپین به کدهای تخفیف دیتابیس، نظارت بر کدهای فعال و همگام‌سازی با هدر سایت"
        badgeText="کمپین‌های تقویمی"
      />

      {/* Top Section: Interactive Calendar & Side Campaign Panel */}
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

        {/* Selected Date Information & Action Card (Non-redundant, Focused on Date) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-surface border border-border/80 bg-card p-5 shadow-surface flex flex-col h-full min-h-[500px] space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <span>رویدادهای روز {toPersianDigits(selectedDate)}</span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {selectedDateEvents.length > 0
                    ? `${toPersianDigits(selectedDateEvents.length)} رویداد برای این روز تعریف شده است`
                    : 'هیچ مناسبت یا جشنواره‌ای برای این تاریخ ثبت نشده است'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingEventId(null)
                  setNewTitle('')
                  setNewBadge('')
                  setNewCouponCode('')
                  setNewCouponLabel('')
                  setNewIsActive(true)
                  setShowAddModal(true)
                }}
                className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-[11px] flex items-center gap-1 shadow-control cursor-pointer duration-motion active:scale-[0.98] shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت برای این روز</span>
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pl-1 scrollbar-thin">
              {selectedDateEvents.length === 0 ? (
                <div className="py-14 text-center text-muted-foreground space-y-3">
                  <div className="w-12 h-12 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-xs">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      مناسبتی در این روز نیست
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      برای ثبت کمپین تخفیف، یادآوری یا مناسبت در تاریخ{' '}
                      {toPersianDigits(selectedDate)} بر روی دکمه بالا کلیک
                      کنید.
                    </p>
                  </div>
                </div>
              ) : (
                selectedDateEvents.map((evt) => (
                  <div
                    key={`selected-evt-${evt.id || evt.title}-${evt.date}`}
                    className="p-4 rounded-surface border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2.5 text-right relative group shadow-xs"
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
                        {(() => {
                          const sched = getEventSchedulingStatus(evt)
                          return (
                            <button
                              type="button"
                              onClick={() => handleToggleEventActive(evt.id)}
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold border transition-colors cursor-pointer ${sched.badgeClass}`}
                              title="تغییر وضعیت فعال/غیرفعال"
                            >
                              {sched.label}
                            </button>
                          )
                        })()}
                      </div>
                    </div>

                    <h4 className="text-xs font-black text-foreground leading-relaxed">
                      {evt.title}
                    </h4>

                    {evt.couponCode && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-brand" />
                        <span>کد تخفیف:</span>
                        <span className="font-mono font-bold text-foreground bg-card border border-border/60 px-1.5 py-0.2 rounded-control font-latin">
                          {evt.couponCode}
                        </span>
                        {evt.couponLabel && (
                          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-control font-bold">
                            {evt.couponLabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                      {(() => {
                        const isCurrentlyInHeader = Boolean(
                          themeSettings?.event_active &&
                            (themeSettings?.event_name === evt.title ||
                              (evt.couponCode &&
                                themeSettings?.header_announcement?.includes(
                                  evt.couponCode,
                                ))),
                        )
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleHeaderAnnouncement(evt)}
                            className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-control border cursor-pointer transition-all ${
                              isCurrentlyInHeader
                                ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-black shadow-xs'
                                : 'text-muted-foreground hover:text-foreground border-border/40 hover:bg-muted/40'
                            }`}
                            title={
                              isCurrentlyInHeader
                                ? 'در حال نمایش در نوار بالای سایت (کلیک جهت غیرفعال‌سازی)'
                                : 'فعال‌سازی این رویداد در بنر مناسبتی بالای سایت'
                            }
                          >
                            <Zap
                              className={`w-3.5 h-3.5 ${
                                isCurrentlyInHeader
                                  ? 'fill-amber-500 text-amber-500 animate-pulse'
                                  : 'text-brand'
                              }`}
                            />
                            <span>
                              {isCurrentlyInHeader
                                ? 'در حال نمایش در هدر ✓'
                                : 'فعال‌سازی در بنر هدر'}
                            </span>
                          </button>
                        )
                      })()}

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-control text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                          title="ویرایش رویداد"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          className="p-1.5 rounded-control text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="حذف رویداد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick KPI Overview Card at bottom of side panel */}
            <div className="pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-control bg-muted/20 border border-border/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">
                  کل رویدادها
                </span>
                <span className="font-black text-foreground text-sm font-latin">
                  {toPersianDigits(events.length)}
                </span>
              </div>
              <div className="p-2.5 rounded-control bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] text-emerald-500 block">
                  فعال‌ها
                </span>
                <span className="font-black text-emerald-500 text-sm font-latin">
                  {toPersianDigits(
                    events.filter((e) => e.isActive !== false).length,
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-control bg-muted/20 border border-border/40 space-y-0.5">
                <span className="text-[10px] text-muted-foreground block">
                  کوپن‌های متصل
                </span>
                <span className="font-black text-foreground text-sm font-latin">
                  {toPersianDigits(
                    events.filter((e) => Boolean(e.couponCode)).length,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH SECTION: COMPREHENSIVE ACTIVE CAMPAIGNS & COUPONS TABLE (Graphite Tokens) */}
      <section className="space-y-4">
        <div className="rounded-surface border border-border/80 bg-card p-4 sm:p-5 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand" />
              <span>میز مدیریت کمپین‌ها و کدهای تخفیف فعال</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              مدیریت و نظارت یکپارچه بر رویدادهای تقویم، کدهای تخفیف متصل به سبد
              خرید و حذف یا غیرفعال‌سازی سریع
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time search box with debounce & action buttons */}
            <div className="w-44 sm:w-60">
              <SearchInput
                value={tableSearch}
                onChange={setTableSearch}
                placeholder="جستجو در عنوان یا کوپن..."
                debounceMs={300}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-control border border-border/60">
              <button
                type="button"
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1 rounded-control font-bold text-xs transition-colors cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                همه ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('active')}
                className={`px-3 py-1 rounded-control font-bold text-xs transition-colors cursor-pointer ${
                  tableFilter === 'active'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                فعال‌ها (
                {
                  events.filter(
                    (e) => getEventSchedulingStatus(e).status === 'active',
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('reserved')}
                className={`px-3 py-1 rounded-control font-bold text-xs transition-colors cursor-pointer ${
                  tableFilter === 'reserved'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                رزرو شده‌ها (
                {
                  events.filter(
                    (e) => getEventSchedulingStatus(e).status === 'reserved',
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setTableFilter('with_coupon')}
                className={`px-3 py-1 rounded-control font-bold text-xs transition-colors cursor-pointer ${
                  tableFilter === 'with_coupon'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                دارای کوپن ({events.filter((e) => Boolean(e.couponCode)).length}
                )
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5 text-center">عنوان رویداد / جشنواره</th>
                  <th className="p-3.5 text-center">تاریخ برگزاری</th>
                  <th className="p-3.5 text-center">برچسب و نوع</th>
                  <th className="p-3.5 text-center">کد تخفیف و برچسب سبد</th>
                  <th className="p-3.5 text-center">وضعیت کمپین</th>
                  <th className="p-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEventsForTable.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground text-xs"
                    >
                      رویدادی با فیلتر انتخابی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredEventsForTable.map((evt) => {
                    const matchedDbCoupon = dbCoupons.find(
                      (c) =>
                        c.code.toUpperCase() ===
                        (evt.couponCode || '').toUpperCase(),
                    )
                    const isCurrentlyInHeader = Boolean(
                      themeSettings?.event_active &&
                        (themeSettings?.event_name === evt.title ||
                          (evt.couponCode &&
                            themeSettings?.header_announcement?.includes(
                              evt.couponCode,
                            ))),
                    )
                    return (
                      <tr
                        key={`tbl-evt-${evt.id || evt.title}`}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-foreground text-center">
                          {evt.title}
                        </td>
                        <td className="p-3.5 font-mono text-brand font-bold font-latin text-center">
                          {toPersianDigits(evt.date)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center">
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
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {evt.couponCode ? (
                              <>
                                <span className="font-mono font-bold text-foreground bg-muted/40 border border-border/60 px-2 py-0.5 rounded-control font-latin">
                                  {evt.couponCode}
                                </span>
                                {(evt.couponLabel ||
                                  matchedDbCoupon?.label) && (
                                  <span className="text-[10px] text-emerald-500 font-bold">
                                    ({evt.couponLabel || matchedDbCoupon?.label}
                                    )
                                  </span>
                                )}
                                {matchedDbCoupon && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleCouponActive(
                                        matchedDbCoupon.code,
                                      )
                                    }
                                    className={`px-1.5 py-0.2 rounded-control text-[9px] font-bold border cursor-pointer ${
                                      matchedDbCoupon.is_active
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    }`}
                                    title="تغییر وضعیت فعال‌بودن کوپن در دیتابیس"
                                  >
                                    {matchedDbCoupon.is_active
                                      ? 'کوپن فعال'
                                      : 'کوپن غیرفعال'}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                بدون کوپن
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center">
                            {(() => {
                              const sched = getEventSchedulingStatus(evt)
                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleEventActive(evt.id)
                                  }
                                  className={`px-2.5 py-0.5 rounded-control text-[10px] font-black cursor-pointer transition-transform active:scale-95 border ${sched.badgeClass}`}
                                  title="برای تغییر وضعیت رویداد کلیک کنید"
                                >
                                  {sched.label}
                                </button>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleHeaderAnnouncement(evt)
                              }
                              className={`p-1.5 rounded-control border transition-all cursor-pointer shadow-xs ${
                                isCurrentlyInHeader
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-control ring-1 ring-amber-400/50'
                                  : 'border-border/60 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                              title={
                                isCurrentlyInHeader
                                  ? 'در حال نمایش در نوار بالای سایت (کلیک برای غیرفعال‌سازی)'
                                  : 'فعال‌سازی این رویداد در نوار اعلان هدر سایت'
                              }
                            >
                              <Zap
                                className={`w-3.5 h-3.5 ${
                                  isCurrentlyInHeader
                                    ? 'fill-current animate-pulse'
                                    : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(evt)}
                              className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition-colors cursor-pointer shadow-xs"
                              title="ویرایش رویداد"
                            >
                              <Pencil className="w-3.5 h-3.5 text-brand" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteEvent(evt.id, evt.title)
                              }
                              className="p-1.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="حذف کامل این رویداد از تقویم"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {matchedDbCoupon && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCouponByCode(matchedDbCoupon.code)
                                }
                                className="px-2 py-1 rounded-control border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[10px] font-bold cursor-pointer transition-colors"
                                title="حذف کامل کوپن متصل از پایگاه‌داده"
                              >
                                حذف کوپن
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
              <div className="relative w-full max-w-lg my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Gift className="w-5 h-5 text-brand" />
                    <span>
                      {editingEventId
                        ? `ویرایش رویداد: ${newTitle}`
                        : `ثبت رویداد یا کمپین برای ${toPersianDigits(selectedDate)}`}
                    </span>
                  </h3>
                  <ModalCloseButton
                    onClick={() => setShowAddModal(false)}
                    size="sm"
                  />
                </div>

                {modalError && (
                  <div className="p-3 rounded-control bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

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
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand cursor-pointer font-bold"
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

                  {/* Discount & Coupon Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
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
                    </div>
                  </div>

                  {/* Coupon Label in Cart Drawer */}
                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-foreground block">
                      برچسب نمایشی کد تخفیف در سبد خرید (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={newCouponLabel}
                      onChange={(e) => setNewCouponLabel(e.target.value)}
                      placeholder="مثال: ۲۵٪ تخفیف نوروزی یا ۵۰ هزار تومان تخفیف"
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                    />
                    {dbCoupons.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-muted-foreground font-bold">
                          کدهای موجود در دیتابیس:
                        </span>
                        {dbCoupons.slice(0, 4).map((cc) => (
                          <button
                            key={cc.code}
                            type="button"
                            onClick={() => {
                              setNewCouponCode(cc.code)
                              if (cc.label) setNewCouponLabel(cc.label)
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-control bg-secondary text-brand hover:bg-brand/10 border border-brand/20 cursor-pointer"
                          >
                            {cc.code} {cc.label ? `(${cc.label})` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">
                        وضعیت فعال بودن رویداد
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        در صورت فعال بودن، رویداد در تقویم و نوار اعلان فعال
                        خواهد بود.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={newIsActive}
                      onChange={setNewIsActive}
                      variant="primary"
                    />
                  </div>

                  {/* Auto-sync with holiday banner */}
                  <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">
                        همگام‌سازی و فعال‌سازی در نوار اعلان بالای سایت
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

                  {/* Full-width action button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      {editingEventId
                        ? 'ذخیره تغییرات رویداد'
                        : 'ثبت و ذخیره کمپین جدید'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Unified Confirm Modal for Delete Actions */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={
          deleteConfirm.type === 'event'
            ? 'حذف رویداد از تقویم'
            : 'حذف کامل کد تخفیف از دیتابیس'
        }
        description={
          deleteConfirm.type === 'event'
            ? `آیا از حذف رویداد «${deleteConfirm.title}» از تقویم اطمینان دارید؟`
            : `آیا از حذف کامل کد تخفیف «${deleteConfirm.couponCode}» از پایگاه‌داده اطمینان دارید؟ این کوپن دیگر در سبد خرید معتبر نخواهد بود.`
        }
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        variant="danger"
      />
    </div>
  )
}
