import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

export interface CalendarEvent {
  date: string // format: YYYY/MM/DD e.g. 1405/07/25
  endDate?: string // format: YYYY/MM/DD e.g. 1405/07/30 (optional multi-day festival end date)
  title: string
  type: 'sale' | 'event' | 'holiday' | 'maintenance'
  badge?: string
}

interface PersianJalaliCalendarProps {
  events?: CalendarEvent[]
  selectedDate?: string
  onSelectDate?: (date: string) => void
  className?: string
  compact?: boolean
}

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export function gregorianToJalali(gy: number, gm: number, gd: number) {
  const gDM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDM[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm: number
  let jd: number
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }
  return { jy, jm, jd }
}

export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  jy += 1595
  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
  let gy = 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let gd = days + 1
  const salA = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  let gm = 0
  while (gm < 13 && gd > salA[gm]) {
    gd -= salA[gm]
    gm++
  }
  return { gy, gm, gd }
}

export function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const PersianJalaliCalendar: React.FC<PersianJalaliCalendarProps> = ({
  events = [],
  selectedDate: _selectedDate,
  onSelectDate,
  className = '',
  compact = false,
}) => {
  const now = new Date()
  const todayJalali = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  )

  const [currentYear, setCurrentYear] = useState(todayJalali.jy)
  const [currentMonth, setCurrentMonth] = useState(todayJalali.jm)
  const [selectedDay, setSelectedDay] = useState<number>(todayJalali.jd)

  // Calculate days in month
  const daysInCurrentMonth =
    currentMonth <= 6
      ? 31
      : currentMonth <= 11
        ? 30
        : // Esfand: check leap year
          [1, 5, 9, 13, 17, 22, 26, 30].includes(currentYear % 33)
          ? 30
          : 29

  // Day of week for 1st day of month
  const firstDayGreg = jalaliToGregorian(currentYear, currentMonth, 1)
  const firstDayDate = new Date(
    firstDayGreg.gy,
    firstDayGreg.gm - 1,
    firstDayGreg.gd,
  )
  // Saturday is index 0 in Persian calendar
  // getDay(): Sunday is 0, Monday 1, ..., Saturday 6
  const startDayOfWeek = (firstDayDate.getDay() + 1) % 7

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
    const formatted = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    if (onSelectDate) {
      onSelectDate(formatted)
    }
  }

  const isEventInDay = (e: CalendarEvent, dayStr: string) => {
    if (e.date === dayStr) return true
    if (e.endDate && dayStr >= e.date && dayStr <= e.endDate) return true
    return false
  }

  const currentFormatted = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(selectedDay).padStart(2, '0')}`
  const selectedDayEvents = events.filter((e) =>
    isEventInDay(e, currentFormatted),
  )

  return (
    <div
      dir="rtl"
      className={`rounded-3xl border border-border bg-card p-5 shadow-sm text-foreground space-y-4 ${className}`}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black">
              {PERSIAN_MONTHS[currentMonth - 1]} {toPersianDigits(currentYear)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              امروز: {toPersianDigits(todayJalali.jd)}{' '}
              {PERSIAN_MONTHS[todayJalali.jm - 1]}{' '}
              {toPersianDigits(todayJalali.jy)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="ماه قبل"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentYear(todayJalali.jy)
              setCurrentMonth(todayJalali.jm)
              setSelectedDay(todayJalali.jd)
            }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            امروز
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="ماه بعد"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week days row */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground">
        {WEEK_DAYS.map((d, idx) => (
          <div
            key={d}
            className={`py-1.5 rounded-lg ${idx === 6 ? 'text-rose-500' : ''}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Blank days before start */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => {
          const blankKey = `blank-${currentYear}-${currentMonth}-${i}`
          return <div key={blankKey} className="h-9 w-full" />
        })}

        {/* Days of current month */}
        {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
          const day = i + 1
          const isToday =
            todayJalali.jy === currentYear &&
            todayJalali.jm === currentMonth &&
            todayJalali.jd === day
          const isSelected = selectedDay === day
          const dayOfWeek = (startDayOfWeek + i) % 7
          const isFriday = dayOfWeek === 6

          const dayFormatted = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`
          const hasEvent = events.some((e) => isEventInDay(e, dayFormatted))

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`relative h-9 w-full rounded-xl flex items-center justify-center font-bold transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : isToday
                    ? 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                    : isFriday
                      ? 'text-rose-500 hover:bg-rose-500/10'
                      : 'hover:bg-muted/70 text-foreground'
              }`}
            >
              <span>{toPersianDigits(day)}</span>

              {/* Event Dot */}
              {hasEvent && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-500'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Day Events & Activities */}
      {!compact && (
        <div className="pt-3 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              رویدادهای {toPersianDigits(selectedDay)}{' '}
              {PERSIAN_MONTHS[currentMonth - 1]}:
            </span>
            <span>{toPersianDigits(selectedDayEvents.length)} رویداد</span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              رویداد یا جشنواره‌ای برای این تاریخ ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedDayEvents.map((evt) => (
                <div
                  key={`day-event-${evt.title}-${evt.date}`}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-foreground">
                      {evt.title}
                    </span>
                  </div>
                  {evt.badge && (
                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {evt.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
