import {
  Check,
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
import {
  useVibeTheme,
  VIBE_THEMES,
  type VibeFarsiThemeKey,
} from '../vibefarsi/ThemeContext'

export const AdminThemeSettingsView: React.FC = () => {
  const { success, error } = useNotification()
  const { setTheme, setCustomColors } = useVibeTheme()

  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [settings, setSettings] = useState<ThemeSettings>({
    default_theme: 'graphite',
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
      if (data) setSettings(data)
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

      // Apply to active theme context
      if (settings.default_theme) {
        if (settings.default_theme === 'custom') {
          setCustomColors(settings.primary_color, settings.accent_color)
        } else {
          setTheme(settings.default_theme as VibeFarsiThemeKey)
        }
      }

      // Apply dynamic event primary color if active
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
          <span>
            مدیریت سیستم طراحی وایب‌فارسی، تم‌های دلخواه و روش‌های احراز هویت
          </span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          شخصی‌سازی آنی تم پیش‌فرض فروشگاه (گرافیت، لاجوردی، فیروزه‌ای و...)، تعریف
          تم‌های دلخواه سازمانی، افکت‌های مناسبتی ایجنت‌محور و کنترل گزینه‌های ورود
          مشتریان
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: VIBE FARSI DESIGN SYSTEM & THEMES */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <span>تم سیستم طراحی سراسری (Vibe Farsi Design System)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تم گرافیت (Graphite) سیستم پیش‌فرض و استاندارد است. می‌توانید
                تم‌های دیگر یا تم دلخواه را انتخاب کنید.
              </p>
            </div>
            <span className="rounded-xl bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              تم فعال:{' '}
              {VIBE_THEMES[
                (settings.default_theme as VibeFarsiThemeKey) || 'graphite'
              ]?.nameFA || 'گرافیت'}
            </span>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(Object.keys(VIBE_THEMES) as VibeFarsiThemeKey[]).map(
              (themeKey) => {
                const t = VIBE_THEMES[themeKey]
                const isSelected =
                  (settings.default_theme || 'graphite') === themeKey
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({
                        ...prev,
                        default_theme: themeKey,
                        primary_color:
                          themeKey !== 'custom'
                            ? t.primary
                            : prev.primary_color,
                        accent_color:
                          themeKey !== 'custom' ? t.accent : prev.accent_color,
                      }))
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/30'
                        : 'border-border/80 bg-muted/20 hover:bg-muted/50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full shadow-xs"
                            style={{
                              backgroundColor:
                                themeKey === 'custom'
                                  ? settings.primary_color
                                  : t.primary,
                            }}
                          />
                          <h4 className="text-xs font-black text-foreground">
                            {t.nameFA}
                          </h4>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                    <div className="pt-3 flex items-center gap-2">
                      <span
                        className="h-2 w-8 rounded-full"
                        style={{
                          backgroundColor:
                            themeKey === 'custom'
                              ? settings.primary_color
                              : t.primary,
                        }}
                      />
                      <span
                        className="h-2 w-4 rounded-full"
                        style={{
                          backgroundColor:
                            themeKey === 'custom'
                              ? settings.accent_color
                              : t.accent,
                        }}
                      />
                    </div>
                  </button>
                )
              },
            )}
          </div>

          {/* Custom Theme Color Pickers (Visible when custom or adjusting) */}
          <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>تنظیم رنگ‌های تم دلخواه سازمانی (Custom Palette)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-right">
                <label className="text-[11px] font-bold text-foreground">
                  رنگ اصلی تم (Primary Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        default_theme: 'custom',
                        primary_color: e.target.value,
                      }))
                    }
                    className="h-9 w-10 rounded-xl cursor-pointer border border-border bg-background p-1"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.primary_color}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        default_theme: 'custom',
                        primary_color: e.target.value,
                      }))
                    }
                    className="flex-1 h-9 px-3 rounded-xl border border-border bg-background font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[11px] font-bold text-foreground">
                  رنگ تاکیدی و ثانویه (Accent Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accent_color}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        default_theme: 'custom',
                        accent_color: e.target.value,
                      }))
                    }
                    className="h-9 w-10 rounded-xl cursor-pointer border border-border bg-background p-1"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.accent_color}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        default_theme: 'custom',
                        accent_color: e.target.value,
                      }))
                    }
                    className="flex-1 h-9 px-3 rounded-xl border border-border bg-background font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Live Component Preview */}
            <div className="pt-3 border-t border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground block mb-2">
                پیش‌نمایش زنده المان‌ها با رنگ انتخابی:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <ShimmerButton
                  background={settings.primary_color}
                  className="text-xs font-bold px-4 py-2"
                >
                  <span>دکمه نمونه خرید</span>
                  <span>←</span>
                </ShimmerButton>

                <span
                  className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: `${settings.primary_color}20`,
                    borderColor: `${settings.primary_color}40`,
                    color: settings.primary_color,
                  }}
                >
                  برچسب نمونه لایسنس
                </span>

                <span className="text-xs text-muted-foreground">
                  کنتراست و جذابیت بصری در تمامی حالات لایت/دارک تضمین شده است.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: EVENT & HOLIDAY CAMPAIGNS (AGENT-CENTRIC) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-600" />
              <span>رویدادهای مناسبتی و اعیاد (Agent-Centric Campaigns)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              اعمال بنر و افکت‌های ویژه مناسبتی (نوروز، یلدا، بلک فرایدی) روی هدر
              و سراسر سایت
            </p>
          </div>

          {/* Quick preset events */}
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
                className="flex flex-col justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/60 text-right transition-all hover:scale-[1.01] cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
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
                <span className="text-[10px] font-bold text-blue-600 pt-2">
                  اعمال سریع رویداد ←
                </span>
              </button>
            ))}
          </div>

          {/* Active Event Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/20">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                فعال‌سازی نوار و افکت مناسبتی
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                با فعال‌سازی، بنر مناسبت و افکت انتخابی در بالای صفحه نمایش داده
                می‌شود.
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
              className={`p-1 rounded-2xl transition-colors cursor-pointer ${
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

          {/* Header Announcement message */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-foreground">
              متن نوار اعلان هدر
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

        {/* SECTION 3: MULTI-AUTH METHODS CONTROL */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                مدیریت روش‌های ورود و ثبت‌نام مشتریان (Multi-Auth System)
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              تعیین روش‌های ورود فعال در مدال ورود/ثبت‌نام (گوگل، گیت‌هاب، کلمه
              عبور، پیامک OTP)
            </p>
          </div>

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
                className={`p-1 rounded-2xl transition-colors cursor-pointer ${
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
                className={`p-1 rounded-2xl transition-colors cursor-pointer ${
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
                className={`p-1 rounded-2xl transition-colors cursor-pointer ${
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
                className={`p-1 rounded-2xl transition-colors cursor-pointer ${
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

        {/* Submit Bar: Graphite technical minimal - Primary white button with black text */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saveLoading}
            className="h-10 px-8 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>ذخیره تمامی تنظیمات</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
