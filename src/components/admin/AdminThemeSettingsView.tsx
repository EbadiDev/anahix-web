import {
  Gift,
  KeyRound,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { ThemeSettings } from '../../types'
import { GithubIcon, GoogleIcon } from '../SocialIcons'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ShimmerButton } from '../vibefarsi/ShimmerButton'

export const AdminThemeSettingsView: React.FC = () => {
  const { success, error } = useNotification()
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [settings, setSettings] = useState<ThemeSettings>({
    event_name: 'عادی',
    event_active: false,
    primary_color: '#2563eb',
    accent_color: '#3b82f6',
    header_announcement:
      'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است',
    event_effect: 'none',
    event_icon: 'sparkles',
    auth_google_enabled: true,
    auth_github_enabled: true,
    auth_password_enabled: true,
    auth_otp_required: false,
  })

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminThemeSettings()
      setSettings(data)
    } catch (err: any) {
      error('خطا در بارگذاری تنظیمات تم و رویدادها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    try {
      await api.updateAdminThemeSettings(settings)
      success('تنظیمات تم و روش‌های ورود با موفقیت ذخیره شد')
      // Apply immediately
      if (settings.event_active && settings.primary_color) {
        document.documentElement.style.setProperty(
          '--event-primary',
          settings.primary_color,
        )
      } else {
        document.documentElement.style.removeProperty('--event-primary')
      }
    } catch (err: any) {
      error('خطا در ذخیره تنظیمات', err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  const presetColors = [
    { label: 'رویال بلو سازمانی', color: '#2563eb' },
    { label: 'سبز بهاری نوروز', color: '#059669' },
    { label: 'قرمز یاقوتی یلدا', color: '#dc2626' },
    { label: 'مشکی طلایی بلک فرایدی', color: '#d97706' },
    { label: 'بنفش نئونی مدرن', color: '#7c3aed' },
    { label: 'فیروزه‌ای سایبرپانک', color: '#0891b2' },
  ]

  const presetEvents = [
    {
      name: 'جشنواره نوروز ۱۴۰۵',
      color: '#059669',
      effect: 'confetti',
      announcement:
        '🌱 سال نو مبارک! تخفیف ویژه بهاره روی تمامی اکانت‌های هوش مصنوعی فعال شد',
    },
    {
      name: 'جشنواره شب یلدا',
      color: '#dc2626',
      effect: 'stars',
      announcement:
        '🍉 بلندترین تخفیف‌های سال در جشنواره یلدای شگفت‌انگیز آناهیکس',
    },
    {
      name: 'جمعه سیاه (Black Friday)',
      color: '#d97706',
      effect: 'stars',
      announcement: '⚡ حراج بزرگ بلک فرایدی: تا ۵۰٪ تخفیف لایسنس‌های بین‌المللی',
    },
    {
      name: 'حالت عادی و پایدار',
      color: '#2563eb',
      effect: 'none',
      announcement:
        'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است',
    },
  ]

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">
          در حال بارگذاری تنظیمات سیستم...
        </p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>مدیریت هوشمند تم رویدادها، مناسبت‌ها و روش‌های احراز هویت</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          شخصی‌سازی آنی ظاهر فروشگاه برای اعیاد و مناسبت‌ها، افکت‌های گرافیکی
          وایب‌فارسی و تعیین گزینه‌های فعال ورود مشتریان
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Preset Events Quick Switcher */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>قالب‌های آماده مناسبت‌های تقویمی</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presetEvents.map((evt) => (
              <button
                key={evt.name}
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    event_name: evt.name,
                    event_active: evt.name !== 'حالت عادی و پایدار',
                    primary_color: evt.color,
                    event_effect: evt.effect as any,
                    header_announcement: evt.announcement,
                  }))
                }
                className="flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-muted/30 hover:bg-muted/70 text-right transition-all hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: evt.color }}
                    />
                    <h4 className="text-xs font-bold text-foreground">
                      {evt.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {evt.announcement}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-600 pt-3">
                  اعمال سریع قالب ←
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Event & Visual Theme Customization */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Gift className="h-4 w-4 text-blue-600" />
            <span>تنظیمات رویداد و مناسبت فعال</span>
          </h3>

          {/* Active Event Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                فعال‌سازی رویداد و بنر ویژه مناسبتی
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                با فعال‌سازی، نوار اعلان رنگی و افکت گرافیکی در سراسر سایت نمایش
                داده می‌شود.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  event_active: !prev.event_active,
                }))
              }
              className={`p-1 rounded-2xl transition-colors ${
                settings.event_active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground'
              }`}
            >
              {settings.event_active ? (
                <ToggleRight className="h-8 w-8" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                عنوان مناسبت / رویداد
              </label>
              <input
                type="text"
                value={settings.event_name}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    event_name: e.target.value,
                  }))
                }
                className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs outline-none focus:border-blue-500"
                placeholder="مثلاً نوروز ۱۴۰۵ یا بلک فرایدی"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                افکت انیمیشنی وایب‌فارسی
              </label>
              <select
                value={settings.event_effect}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    event_effect: e.target.value as any,
                  }))
                }
                className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs outline-none focus:border-blue-500"
              >
                <option value="none">بدون افکت اضافه (عادی)</option>
                <option value="snow">بارش برف زمستانی (Snow Effect)</option>
                <option value="confetti">
                  کاغذ رنگی و جشن شاد (Confetti Effect)
                </option>
                <option value="stars">
                  ستاره‌ها و درخشش نئونی (Stars Glow)
                </option>
              </select>
            </div>
          </div>

          {/* Color palette picker */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-bold text-foreground">
              رنگ اصلی مناسبت و برند سازمانی
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {presetColors.map((pc) => (
                <button
                  key={pc.color}
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      primary_color: pc.color,
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    settings.primary_color === pc.color
                      ? 'border-foreground shadow-sm'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: pc.color }}
                  />
                  <span>{pc.label}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 border border-border rounded-xl px-2.5 py-1">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      primary_color: e.target.value,
                    }))
                  }
                  className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-xs uppercase">
                  {settings.primary_color}
                </span>
              </div>
            </div>
          </div>

          {/* Header Announcement message */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-foreground">
              پیام نوار اعلان بالای سایت
            </label>
            <input
              type="text"
              value={settings.header_announcement}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  header_announcement: e.target.value,
                }))
              }
              className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs outline-none focus:border-blue-500"
              placeholder="متن پیام متحرک نوار هدر..."
            />
          </div>
        </div>

        {/* Section 2: Customer Authentication Methods Control */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>مدیریت روش‌های ورود و ثبت‌نام مشتریان (Multi-Auth System)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google OAuth */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-center">
                  <GoogleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    ورود سریع با حساب Google
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    همگام‌سازی مستقیم جیمیل و آواتار خریدار
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    auth_google_enabled: !prev.auth_google_enabled,
                  }))
                }
                className={`p-1 rounded-2xl transition-colors ${
                  settings.auth_google_enabled
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground'
                }`}
              >
                {settings.auth_google_enabled ? (
                  <ToggleRight className="h-7 w-7" />
                ) : (
                  <ToggleLeft className="h-7 w-7" />
                )}
              </button>
            </div>

            {/* GitHub OAuth */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-center">
                  <GithubIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    ورود مستقیم با GitHub
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ویژه برنامه‌نویسان و خریداران ابزارهای کدنویسی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    auth_github_enabled: !prev.auth_github_enabled,
                  }))
                }
                className={`p-1 rounded-2xl transition-colors ${
                  settings.auth_github_enabled
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground'
                }`}
              >
                {settings.auth_github_enabled ? (
                  <ToggleRight className="h-7 w-7" />
                ) : (
                  <ToggleLeft className="h-7 w-7" />
                )}
              </button>
            </div>

            {/* Password Login */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    ورود با نام کاربری و کلمه عبور
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    امکان انتخاب ورود با رمز عبور به جای OTP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    auth_password_enabled: !prev.auth_password_enabled,
                  }))
                }
                className={`p-1 rounded-2xl transition-colors ${
                  settings.auth_password_enabled
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground'
                }`}
              >
                {settings.auth_password_enabled ? (
                  <ToggleRight className="h-7 w-7" />
                ) : (
                  <ToggleLeft className="h-7 w-7" />
                )}
              </button>
            </div>

            {/* Mobile OTP SMS */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    الزام احراز هویت دومرحله‌ای پیامکی (OTP)
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ارسال کد تایید پیامکی برای تمام ورودها
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    auth_otp_required: !prev.auth_otp_required,
                  }))
                }
                className={`p-1 rounded-2xl transition-colors ${
                  settings.auth_otp_required
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground'
                }`}
              >
                {settings.auth_otp_required ? (
                  <ToggleRight className="h-7 w-7" />
                ) : (
                  <ToggleLeft className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <ShimmerButton
            type="submit"
            disabled={saveLoading}
            className="text-xs sm:text-sm font-bold px-8 py-3 rounded-2xl"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>ذخیره تمامی تنظیمات</span>
              </div>
            )}
          </ShimmerButton>
        </div>
      </form>
    </div>
  )
}
