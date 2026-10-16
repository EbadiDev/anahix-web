import { Calendar as CalendarIcon, Plus, Sparkles } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import {
  type CalendarEvent,
  PersianJalaliCalendar,
  toPersianDigits,
} from '../vibefarsi/PersianJalaliCalendar'
import { ShimmerButton } from '../vibefarsi/ShimmerButton'

export const AdminCalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('1405/01/01')
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      date: '1405/01/01',
      title: 'آغاز سال نو و جشنواره نوروزی آناهیکس',
      type: 'holiday',
      badge: 'تعطیل رسمی',
    },
    {
      date: '1405/01/02',
      title: 'تخفیف شگفت‌انگیز ۳۵٪ لایسنس‌های ChatGPT Plus',
      type: 'sale',
      badge: 'تخفیف زمان‌دار',
    },
    {
      date: '1405/01/13',
      title: 'روز طبیعت و کمپین شارژ هدیه کیف پول',
      type: 'holiday',
      badge: 'جشنواره',
    },
    {
      date: '1405/07/25',
      title: 'تمدید دوره‌ای سرورهای اختصاصی و پشتیبانی ۲۴ ساعته',
      type: 'maintenance',
      badge: 'عملیاتی',
    },
    {
      date: '1405/09/30',
      title: 'جشنواره شب یلدا و تخفیف اکانت‌های ۱۸ ماهه Gemini',
      type: 'sale',
      badge: 'یلدا',
    },
  ])

  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'sale' | 'event' | 'holiday'>('event')
  const [newBadge, setNewBadge] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newEvt: CalendarEvent = {
      date: selectedDate,
      title: newTitle.trim(),
      type: newType,
      badge: newBadge.trim() || undefined,
    }

    setEvents((prev) => [newEvt, ...prev])
    setNewTitle('')
    setNewBadge('')
    setShowAddModal(false)
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>تقویم شمسی رویدادها، جشنواره‌ها و مناسبت‌های فروشگاه</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            برنامه‌ریزی تخفیف‌های زمان‌دار، تقویم تعطیلات رسمی و مناسبت‌های تجاری
            آناهیکس
          </p>
        </div>

        <ShimmerButton
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold px-4 py-2.5 rounded-2xl"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن رویداد به {toPersianDigits(selectedDate)}</span>
        </ShimmerButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Jalali Calendar Component */}
        <div className="lg:col-span-7">
          <PersianJalaliCalendar
            events={events}
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        </div>

        {/* Upcoming Events and Campaign Schedule */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>لیست رویدادها و کمپین‌های زمان‌بندی‌شده</span>
              </h3>
              <span className="text-xs font-bold text-muted-foreground">
                {toPersianDigits(events.length)} مورد
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pl-1">
              {events.map((evt) => (
                <div
                  key={`evt-admin-${evt.title}-${evt.date}`}
                  className="p-3 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5 text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-latin text-xs font-bold text-blue-600 dark:text-blue-400">
                      {toPersianDigits(evt.date)}
                    </span>
                    {evt.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          evt.type === 'sale'
                            ? 'bg-rose-500/10 text-rose-500'
                            : evt.type === 'holiday'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {evt.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-foreground">
                    {evt.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl text-foreground">
            <h3 className="text-base font-black text-foreground mb-4">
              ثبت رویداد جدید برای {toPersianDigits(selectedDate)}
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-foreground">
                  عنوان رویداد یا کمپین *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً آغاز تخفیف‌های عید فطر"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    نوع رویداد
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  >
                    <option value="event">رویداد عادی</option>
                    <option value="sale">جشنواره تخفیف فروش</option>
                    <option value="holiday">مناسبت / تعطیلی</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    برچسب رویداد (Badge)
                  </label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="مثلاً تخفیف ۴۰٪"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground"
                >
                  انصراف
                </button>
                <ShimmerButton
                  type="submit"
                  className="text-xs font-bold px-6 py-2 rounded-xl"
                >
                  افزودن رویداد
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
