import {
  Check,
  Flame,
  Gift,
  Loader2,
  Palette,
  Save,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { ThemeSettings } from '../../types'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ShimmerButton } from '../vibefarsi/ShimmerButton'
import {
  useVibeTheme,
  VIBE_THEMES,
  type VibeFarsiThemeKey,
} from '../vibefarsi/ThemeContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

type ThemeSubTab = 'palette' | 'festivals' | 'offers-header'

export const AdminThemeSettingsView: React.FC = () => {
  const { success, error } = useNotification()
  const { setTheme, setCustomColors } = useVibeTheme()

  const [activeSubTab, setActiveSubTab] = useState<ThemeSubTab>('palette')
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
    offers_badge_text: 'جشنواره سراسری تخفیف‌های زمان‌دار آناهیکس',
    offers_title: 'آفرها و اشتراک‌های دارای تخفیف ویژه',
    offers_subtitle:
      'کلیه لایسنس‌ها و اشتراک‌های هوش مصنوعی که هم‌اکنون با تخفیف نقدی ویژه ۲۰٪ تا ۵۰٪ از پنل مدیریت عرضه شده‌اند.',
    auth_google_enabled: true,
    auth_github_enabled: true,
    auth_password_enabled: true,
    auth_otp_required: false,
  })

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminThemeSettings()
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          offers_badge_text:
            data.offers_badge_text || 'جشنواره سراسری تخفیف‌های زمان‌دار آناهیکس',
          offers_title:
            data.offers_title || 'آفرها و اشتراک‌های دارای تخفیف ویژه',
          offers_subtitle:
            data.offers_subtitle ||
            'کلیه لایسنس‌ها و اشتراک‌های هوش مصنوعی که هم‌اکنون با تخفیف نقدی ویژه ۲۰٪ تا ۵۰٪ از پنل مدیریت عرضه شده‌اند.',
        }))
      }
    } catch (err: any) {
      error('خطا در بارگذاری تنظیمات تم و رویدادها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaveLoading(true)
    try {
      await api.updateAdminThemeSettings(settings)
      success(
        'تنظیمات با موفقیت ذخیره شد',
        'تغییرات تم، جشنواره‌ها و هدر آفرها در سراسر سایت اعمال گردید.',
      )

      // Apply to active theme context
      if (settings.default_theme) {
        if (settings.default_theme === 'custom') {
          setCustomColors(settings.primary_color, settings.accent_color)
        } else {
          setTheme(settings.default_theme as VibeFarsiThemeKey)
        }
      }

      // Apply live colors to root
      if (settings.primary_color) {
        document.documentElement.style.setProperty(
          '--brand',
          settings.primary_color,
        )
        document.documentElement.style.setProperty(
          '--primary-color',
          settings.primary_color,
        )
      }
      if (settings.accent_color) {
        document.documentElement.style.setProperty(
          '--accent',
          settings.accent_color,
        )
        document.documentElement.style.setProperty(
          '--accent-color',
          settings.accent_color,
        )
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

      // Broadcast event for real-time header and pages synchronization
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: settings }),
      )
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
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 text-brand animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground font-bold">
          در حال بارگذاری تنظیمات سیستم...
        </p>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Header Bar without duplicate action button */}
      <AdminHeaderBanner
        icon={Palette}
        title="سیستم تم و جشنواره‌های مناسبتی (Themes & Holiday Events)"
        subtitle="شخصی‌سازی آنی تم پیش‌فرض فروشگاه، رنگ‌های سازمانی برند، افکت‌های نوری و هدر آفرها"
        badgeText="سیستم طراحی گرافیت"
      />

      {/* Sub-Tabs Pill Navigation */}
      <div className="bg-card rounded-surface border border-border/80 p-2 shadow-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('palette')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'palette'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span>۱. پالت رنگ و تم وایب‌فارسی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('festivals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'festivals'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>۲. جشنواره‌های مناسبتی و نوار اعلان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('offers-header')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'offers-header'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Flame className="w-4 h-4 shrink-0" />
          <span>۳. شخصی‌سازی هدر صفحه آفرها (/offers)</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: VIBE FARSI DESIGN SYSTEM & COLOR PALETTE */}
        {activeSubTab === 'palette' && (
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-brand" />
                  <span>تم سیستم طراحی سراسری (Vibe Farsi Design System)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تم گرافیت (Graphite) سیستم پیش‌فرض و استاندارد است. می‌توانید
                  تم‌های دیگر یا تم دلخواه سازمانی را انتخاب نمایید.
                </p>
              </div>
              <span className="rounded-control bg-secondary px-3 py-1 text-xs font-bold text-brand border border-brand/20">
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
                            themeKey !== 'custom'
                              ? t.accent
                              : prev.accent_color,
                        }))
                      }}
                      className={`p-4 rounded-surface border text-right transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-brand bg-brand/10 shadow-surface ring-1 ring-brand/40'
                          : 'border-border/60 bg-muted/20 hover:bg-muted/40'
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
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
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

            {/* Custom Theme Color Pickers */}
            <div className="p-4 rounded-surface border border-border/80 bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>تنظیم رنگ‌های تم دلخواه سازمانی (Custom Palette)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-[11px] font-bold text-foreground">
                    رنگ اصلی تم (Primary Brand Color)
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
                      className="h-9 w-10 rounded-control cursor-pointer border border-border/60 bg-card p-1"
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
                      className="flex-1 h-9 px-3 rounded-control border border-border/60 bg-card font-mono text-xs uppercase text-foreground outline-none focus:border-brand"
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
                      className="h-9 w-10 rounded-control cursor-pointer border border-border/60 bg-card p-1"
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
                      className="flex-1 h-9 px-3 rounded-control border border-border/60 bg-card font-mono text-xs uppercase text-foreground outline-none focus:border-brand"
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
                    className="px-3 py-1 rounded-control text-xs font-bold border"
                    style={{
                      backgroundColor: `${settings.primary_color}20`,
                      borderColor: `${settings.primary_color}40`,
                      color: settings.primary_color,
                    }}
                  >
                    برچسب نمونه لایسنس
                  </span>

                  <span className="text-xs text-muted-foreground">
                    کنتراست و جذابیت بصری در تمامی حالات لایت و دارک تضمین شده
                    است.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FESTIVE CAMPAIGNS & ANNOUNCEMENT BAR */}
        {activeSubTab === 'festivals' && (
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Gift className="h-4 w-4 text-brand" />
                <span>رویدادهای مناسبتی و اعیاد (Agent-Centric Campaigns)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                اعمال بنر و افکت‌های ویژه مناسبتی (نوروز، یلدا، بلک فرایدی) روی
                هدر و سراسر سایت
              </p>
            </div>

            {/* Quick preset events */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground block">
                انتخاب سریع از میان جشنواره‌های آماده:
              </label>
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
                    className="flex flex-col justify-between p-3.5 rounded-surface border border-border/60 bg-muted/20 hover:bg-muted/40 text-right transition-all hover:scale-[1.01] cursor-pointer"
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
                    <span className="text-[10px] font-bold text-brand pt-2">
                      اعمال سریع رویداد ←
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Event Toggle using unified ToggleSwitch */}
            <div className="flex items-center justify-between p-4 rounded-surface border border-border/60 bg-muted/20">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  وضعیت انتشار نوار و افکت مناسبتی در هدر سایت
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  در صورت فعال‌بودن، نوار بالا با رنگ رویداد و افکت انتخابی در
                  دیدرس خریداران قرار می‌گیرد.
                </p>
              </div>
              <ToggleSwitch
                checked={settings.event_active}
                onChange={(val) =>
                  setSettings((prev) => ({ ...prev, event_active: val }))
                }
                variant="primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
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
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand"
                  placeholder="مثلاً نوروز ۱۴۰۵ یا بلک فرایدی"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
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
                  className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold cursor-pointer"
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
              <label className="text-xs font-bold text-foreground block">
                متن پیام نوار اعلان هدر
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
                className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand"
                placeholder="متن پیام نوار اعلان بالای سایت..."
              />
            </div>
          </div>
        )}

        {/* TAB 3: OFFERS PAGE HEADER CUSTOMIZATION */}
        {activeSubTab === 'offers-header' && (
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-4 animate-in fade-in duration-200">
            <div className="border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" />
                <span>شخصی‌سازی هدر صفحه جشنواره آفرها و تخفیف‌ها (/offers)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                مدیریت و تغییر داینامیک عنوان نشان، تیتر اصلی و توضیحات صفحه
                تخفیف‌ها بدون نیاز به کدنویسی
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5 text-right">
                <label className="font-bold text-foreground block">
                  عنوان نشان بالای هدر (Badge)
                </label>
                <input
                  type="text"
                  value={
                    settings.offers_badge_text ||
                    'جشنواره سراسری تخفیف‌های زمان‌دار آناهیکس'
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      offers_badge_text: e.target.value,
                    }))
                  }
                  placeholder="جشنواره سراسری تخفیف‌های زمان‌دار آناهیکس"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="font-bold text-foreground block">
                  تیتر اصلی صفحه آفرها (Title)
                </label>
                <input
                  type="text"
                  value={
                    settings.offers_title ||
                    'آفرها و اشتراک‌های دارای تخفیف ویژه'
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      offers_title: e.target.value,
                    }))
                  }
                  placeholder="آفرها و اشتراک‌های دارای تخفیف ویژه"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="font-bold text-foreground block">
                  متن توضیحات زیرعنوان (Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={
                    settings.offers_subtitle ||
                    'کلیه لایسنس‌ها و اشتراک‌های هوش مصنوعی که هم‌اکنون با تخفیف نقدی ویژه ۲۰٪ تا ۵۰٪ از پنل مدیریت عرضه شده‌اند.'
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      offers_subtitle: e.target.value,
                    }))
                  }
                  placeholder="توضیحات معرفی آفرها..."
                  className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand resize-none text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Single Unified Save Button at bottom */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="w-full sm:w-auto min-w-[220px] h-11 px-8 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>ذخیره تغییرات تم و جشنواره‌ها</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
