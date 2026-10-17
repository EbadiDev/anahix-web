import {
  Bell,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  Mail,
  Package,
  Send,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { CustomerNotificationItem } from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'

export const ProfileNotificationsTab: React.FC = () => {
  const { success, error } = useNotification()

  // Real In-App Notifications state
  const [notifications, setNotifications] = useState<
    CustomerNotificationItem[]
  >([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Channels Preferences state
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    smsOrders: true,
    smsVirtualNumbers: true,
    smsSecurity: true,
    smsMarketing: false,
    tgOrders: true,
    tgVirtualNumbers: true,
    tgExpiration: true,
    tgMarketing: false,
    emailInvoices: true,
    emailCredentials: true,
    emailSecurity: true,
    emailNewsletter: false,
  })

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await apiService.getInAppNotifications()
      setNotifications(res.items || [])
      setUnreadCount(res.unread_count || 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      success('اعلان خوانده شد', 'این پیام به عنوان خوانده شده ثبت گردید.')
    } catch (err: any) {
      error('خطا', err.message || 'ثبت وضعیت ناموفق بود')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      success(
        'همه اعلان‌ها خوانده شدند',
        'کلیه پیام‌های شما به وضعیت خوانده شده تغییر یافتند.',
      )
    } catch (err: any) {
      error('خطا', err.message || 'ثبت وضعیت ناموفق بود')
    }
  }

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    return true
  })

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
            <h3 className="text-base font-bold text-foreground">
              صندوق اعلان‌ها و اطلاع‌رسانی سیستم (In-App Notifications)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            پیام‌های تحویل سفارش، هشدارهای امنیتی سشن و تخفیف‌های خودکار باشگاه
            مشتریان
          </p>
        </div>

        {unreadCount > 0 && (
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

      {/* 2. In-App Notifications List from Database */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4 duration-motion ease-motion">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">
              پیام‌های دریافتی شما
            </h4>
            {unreadCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20">
                {toPersianDigits(unreadCount)} خوانده نشده
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              همه ({toPersianDigits(notifications.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              خوانده نشده ({toPersianDigits(unreadCount)})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
            <p>در حال دریافت اعلان‌های شما از سرور...</p>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="py-12 text-center bg-muted/10 border border-dashed border-border/60 rounded-control p-8 space-y-2">
            <Bell className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              اعلانی در این دسته‌بندی وجود ندارد
            </p>
            <p className="text-[11px] text-muted-foreground">
              رویدادهای جدید و وضعیت سفارش‌ها بلافاصله در اینجا نمایش داده خواهند
              شد.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifs.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-control border transition-all duration-motion ease-motion space-y-2.5 ${
                  !item.is_read
                    ? 'border-brand/40 bg-secondary shadow-control'
                    : 'border-border/40 bg-muted/20 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-control bg-card border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                      {getNotifIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                        )}
                        <h5 className="text-xs sm:text-sm font-black text-foreground truncate">
                          {item.title}
                        </h5>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono font-latin block mt-0.5">
                        {new Date(item.created_at).toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-[11px] font-bold text-brand hover:underline px-2 py-1 rounded-control bg-card border border-border/40 cursor-pointer"
                      >
                        علامت به عنوان خوانده شده
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pr-12">
                  {item.message}
                </p>

                {item.link && (
                  <div className="pr-12 pt-1">
                    <Link
                      to={item.link}
                      className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"
                    >
                      <span>مشاهده بخش مربوطه</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Channels Notification Preferences */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4 duration-motion ease-motion">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>تنظیمات کانال‌های پیامکی و ایمیل</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              انتخاب کانال‌های مورد نظر برای دریافت پیامک و هشدارهای امنیتی
            </p>
          </div>

          {saved && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-control border border-emerald-500/20 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              ذخیره شد
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SMS Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Smartphone className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                پیامک خدماتی (SMS)
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">تکمیل سفارش‌ها</span>
                <input
                  type="checkbox"
                  checked={prefs.smsOrders}
                  onChange={() => togglePref('smsOrders')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  دریافت پیامک شماره مجازی
                </span>
                <input
                  type="checkbox"
                  checked={prefs.smsVirtualNumbers}
                  onChange={() => togglePref('smsVirtualNumbers')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  هشدارهای امنیتی ورود
                </span>
                <input
                  type="checkbox"
                  checked={prefs.smsSecurity}
                  onChange={() => togglePref('smsSecurity')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
            </div>
          </div>

          {/* Telegram Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Send className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                ربات تلگرام آناهیکس
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">تحویل لایسنس‌ها</span>
                <input
                  type="checkbox"
                  checked={prefs.tgOrders}
                  onChange={() => togglePref('tgOrders')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  کدهای OTP شماره موقت
                </span>
                <input
                  type="checkbox"
                  checked={prefs.tgVirtualNumbers}
                  onChange={() => togglePref('tgVirtualNumbers')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  یادآوری تمدید اشتراک
                </span>
                <input
                  type="checkbox"
                  checked={prefs.tgExpiration}
                  onChange={() => togglePref('tgExpiration')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
            </div>
          </div>

          {/* Email Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Mail className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                پست الکترونیک (Email)
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">ارسال فاکتور رسمی</span>
                <input
                  type="checkbox"
                  checked={prefs.emailInvoices}
                  onChange={() => togglePref('emailInvoices')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  اطلاعات اکانت شخصی
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailCredentials}
                  onChange={() => togglePref('emailCredentials')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  هشدارهای تغییر رمز
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailSecurity}
                  onChange={() => togglePref('emailSecurity')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
