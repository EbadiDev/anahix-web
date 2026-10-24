import {
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FolderPlus,
  Globe,
  History,
  Image as ImageIcon,
  Key,
  KeyRound,
  LayoutTemplate,
  Link2,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { api, apiService } from '../../services/api'
import type { PaymentGateway, ThemeSettings } from '../../types'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminActionLogView } from './AdminActionLogView'
import { AdminBillingSettingsView } from './AdminBillingSettingsView'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { SMSGatewayView } from './SMSGatewayView'

export type SettingsSubTab =
  | 'branding-seo'
  | 'site-menus'
  | 'apikeys'
  | 'billing'
  | 'sms'
  | 'gateways'
  | 'auth'
  | 'audit-logs'

interface SubMenuItem {
  id: string
  title: string
  link: string
  desc?: string
}

interface HeaderMenuItem {
  id: string
  title: string
  link: string
  badge?: string
  is_active: boolean
  children?: SubMenuItem[]
}

interface FooterMenuItem {
  id: string
  title: string
  link: string
}

interface AdminCoreSettingsViewProps {
  initialSubTab?: SettingsSubTab
}

export const AdminCoreSettingsView: React.FC<AdminCoreSettingsViewProps> = ({
  initialSubTab = 'branding-seo',
}) => {
  const [activeSubTab, setActiveSubTab] =
    useState<SettingsSubTab>(initialSubTab)
  const { success: notifySuccess, error: notifyError } = useNotification()

  // General theme / branding / SEO / apikeys state
  const [themeSettings, setThemeSettings] = useState<Partial<ThemeSettings>>({})
  const [_loadingTheme, setLoadingTheme] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)

  // Payment Gateways state
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Multi-Auth System Settings state
  const [authSettings, setAuthSettings] = useState({
    auth_google_enabled: true,
    auth_github_enabled: true,
    auth_password_enabled: true,
    auth_otp_required: false,
  })
  const [authSaveLoading, setAuthSaveLoading] = useState(false)

  // Visibility states for masked secrets
  const [showSecrets, setShowSecrets] = useState<{ [k: string]: boolean }>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [expandedMenuIds, setExpandedMenuIds] = useState<
    Record<string, boolean>
  >({})

  // Header Menu Items state
  const [headerMenus, setHeaderMenus] = useState<HeaderMenuItem[]>([
    {
      id: 'vn',
      title: 'شماره مجازی (SMS)',
      link: '/virtual-numbers',
      badge: 'جدید',
      is_active: true,
    },
    {
      id: 'blog',
      title: 'وبلاگ و آموزش‌ها',
      link: '/blog',
      is_active: true,
    },
    {
      id: 'help',
      title: 'پایگاه دانش',
      link: '/help',
      is_active: true,
    },
    {
      id: 'offers',
      title: 'تخفیف‌ها و رویدادها',
      link: '/offers',
      badge: 'ویژه',
      is_active: true,
    },
  ])

  // Footer Quick Links state
  const [footerLinks, setFooterLinks] = useState<FooterMenuItem[]>([
    { id: '1', title: 'کاتالوگ اشتراک‌ها', link: '#products-catalog' },
    {
      id: '2',
      title: 'شماره مجازی (SMS Verification)',
      link: '/virtual-numbers',
    },
    { id: '3', title: 'وبلاگ و آموزش‌ها (SEO Engine)', link: '/blog' },
    {
      id: '4',
      title: 'پایگاه دانش و رفع ارورها (Help Center)',
      link: '/help',
    },
    { id: '5', title: 'پیگیری سفارش و فاکتورها', link: '/track' },
  ])

  const toggleSecretMask = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(field)
    setTimeout(() => setCopiedKey(null), 2000)
    notifySuccess('کپی شد', 'مقدار با موفقیت در حافظه کپی گردید.')
  }

  const loadThemeSettings = async () => {
    setLoadingTheme(true)
    try {
      const s = await api.getAdminThemeSettings()
      if (s) {
        setThemeSettings(s)
        setAuthSettings({
          auth_google_enabled: s.auth_google_enabled !== false,
          auth_github_enabled: s.auth_github_enabled !== false,
          auth_password_enabled: s.auth_password_enabled !== false,
          auth_otp_required: Boolean(s.auth_otp_required),
        })

        if (s.header_menu_json) {
          try {
            const parsed = JSON.parse(s.header_menu_json)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHeaderMenus(parsed)
            }
          } catch {}
        }

        if (s.footer_menu_json) {
          try {
            const parsed = JSON.parse(s.footer_menu_json)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFooterLinks(parsed)
            }
          } catch {}
        }
      }
    } catch {
    } finally {
      setLoadingTheme(false)
    }
  }

  const loadPayments = async () => {
    setLoadingPayments(true)
    try {
      const list = await apiService.getPayments()
      setPayments(list)
    } catch {
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => {
    loadThemeSettings()
    loadPayments()
  }, [])

  const handleSaveThemeField = async (payload: Partial<ThemeSettings>) => {
    setSavingTheme(true)
    try {
      const updated = { ...themeSettings, ...payload }
      await api.updateAdminThemeSettings(payload)
      setThemeSettings(updated)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: updated }),
      )
      notifySuccess(
        'ذخیره موفق',
        'تنظیمات با موفقیت ذخیره و در سیستم اعمال شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات', err.message)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleSaveAuthSettings = async () => {
    setAuthSaveLoading(true)
    try {
      await api.updateAdminThemeSettings(authSettings)
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: authSettings }),
      )
      notifySuccess(
        'تنظیمات ورود ذخیره شد',
        'پیکربندی روش‌های ورود و ثبت‌نام مشتریان با موفقیت ذخیره شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات ورود', err.message)
    } finally {
      setAuthSaveLoading(false)
    }
  }

  const handleSaveMenus = async () => {
    setSavingTheme(true)
    try {
      const payload: Partial<ThemeSettings> = {
        header_menu_json: JSON.stringify(headerMenus),
        footer_menu_json: JSON.stringify(footerLinks),
      }
      await api.updateAdminThemeSettings(payload)
      setThemeSettings((prev) => ({ ...prev, ...payload }))
      window.dispatchEvent(
        new CustomEvent('anahix:theme:updated', { detail: payload }),
      )
      notifySuccess(
        'منوهای سایت ذخیره شد',
        'پیکربندی ناوبری هدر و پیوندهای فوتر در سرور و دیتابیس ثبت شد.',
      )
    } catch (err: any) {
      notifyError('خطا در ذخیره منوها', err.message)
    } finally {
      setSavingTheme(false)
    }
  }

  const subTabs = [
    {
      id: 'branding-seo' as const,
      label: 'هویت برند، فاوآیکون و سئو',
      icon: Globe,
    },
    {
      id: 'site-menus' as const,
      label: 'مدیریت منوها و ناوبری سایت',
      icon: LayoutTemplate,
    },
    {
      id: 'apikeys' as const,
      label: 'مرکز کلیدهای دسترسی (API Keys)',
      icon: Key,
    },
    {
      id: 'billing' as const,
      label: 'فاکتور رسمی و مشخصات حقوقی',
      icon: ReceiptText,
    },
    {
      id: 'sms' as const,
      label: 'سامانه پیامک و اعتبارسنجی',
      icon: Smartphone,
    },
    {
      id: 'gateways' as const,
      label: 'درگاه‌های پرداخت و سیستم',
      icon: CreditCard,
    },
    {
      id: 'auth' as const,
      label: 'روش‌های ورود و ثبت‌نام (Multi-Auth)',
      icon: KeyRound,
    },
    {
      id: 'audit-logs' as const,
      label: 'لاگ فعالیت مدیران',
      icon: History,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" dir="rtl">
      {/* Top Banner Header */}
      <AdminHeaderBanner
        icon={Settings}
        title="تنظیمات و پیکربندی سیستم"
        subtitle="مدیریت متمرکز هویت برند، فاوآیکون، سئو، منوهای سایت، کلیدهای وب‌سرویس، فاکتور رسمی، درگاه‌های پرداخت و احراز هویت"
        badgeText="پیکربندی هسته سیستم"
      />

      {/* Modern Subtabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-surface border border-border/60 overflow-x-auto scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-control'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT 0: BRANDING, FAVICON & ADVANCED SEO */}
      {activeSubTab === 'branding-seo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    هویت برند، فاوآیکون و تنظیمات پیشرفته موتورهای جستجو (SEO)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تغییر نام فروشگاه، فاوآیکون مرورگر، لوگوی رسمی، کلمات کلیدی،
                    شعار و عنوان متای تب مرورگر بدون نیاز به تغییر کد
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveThemeField(themeSettings)}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme
                    ? 'در حال ذخیره‌سازی...'
                    : 'ذخیره کل تغییرات برند'}
                </span>
              </button>
            </div>

            {/* Visual Brand Assets (FavIcon & Logo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-surface border border-border/60 bg-muted/20">
              {/* Favicon Settings & Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    <span>آیکون مرورگر (FavIcon URL):</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    فرمت‌های SVG یا PNG (اندازه ۳۲×۳۲)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-control bg-card border border-border/80 flex items-center justify-center shrink-0 shadow-xs p-1">
                    {themeSettings.site_favicon_url ? (
                      <img
                        src={themeSettings.site_favicon_url}
                        alt="پیش‌نمایش FavIcon"
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <Globe className="w-6 h-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={themeSettings.site_favicon_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        site_favicon_url: e.target.value,
                      }))
                    }
                    placeholder="/favicon.svg یا https://..."
                    className="flex-1 h-10 px-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  این آیکون در نوار زبانه (Tab) مرورگر خریداران و بوک‌مارک‌ها
                  نمایش داده می‌شود.
                </p>
              </div>

              {/* Logo Settings & Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand" />
                    <span>لوگوی رسمی فروشگاه (Site Logo URL):</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    تصویر افقی ترنسپرنت (PNG / WebP)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 rounded-control bg-card border border-border/80 flex items-center justify-center shrink-0 shadow-xs p-1">
                    {themeSettings.site_logo_url ? (
                      <img
                        src={themeSettings.site_logo_url}
                        alt="پیش‌نمایش لوگو"
                        className="max-h-8 max-w-full object-contain"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        بدون تصویر
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={themeSettings.site_logo_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        site_logo_url: e.target.value,
                      }))
                    }
                    placeholder="/images/logo.png یا https://..."
                    className="flex-1 h-10 px-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  در صورت خالی بودن، لوگوی متنی استاندارد آناهیکس نمایش داده
                  خواهد شد.
                </p>
              </div>
            </div>

            {/* Names & Slogans */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground">
                  نام فارسی وب‌سایت:
                </label>
                <input
                  type="text"
                  value={themeSettings.site_name_fa || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_name_fa: e.target.value,
                    }))
                  }
                  placeholder="مثلاً: آناهیکس"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground">
                  نام لاتین برند:
                </label>
                <input
                  type="text"
                  value={themeSettings.site_name_en || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_name_en: e.target.value,
                    }))
                  }
                  placeholder="e.g. ANAHIX"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground">
                  شعار و زیرعنوان هدر:
                </label>
                <input
                  type="text"
                  value={themeSettings.site_subtitle || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      site_subtitle: e.target.value,
                    }))
                  }
                  placeholder="فروشگاه رسمی سرویس‌های بین‌المللی و شماره مجازی"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-medium"
                />
              </div>
            </div>

            {/* Advanced SEO Metadata */}
            <div className="pt-4 border-t border-border/60 space-y-4">
              <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>
                  تنظیمات متای سئو و شبکه‌های اجتماعی (OpenGraph Meta Tags)
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان سئو صفحه اصلی (Meta Title):
                  </label>
                  <input
                    type="text"
                    value={themeSettings.meta_title || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        meta_title: e.target.value,
                      }))
                    }
                    placeholder="آناهیکس | پلتفرم تحویل فوری اشتراک‌های هوش مصنوعی"
                    className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    تصویر اشتراک‌گذاری در شبکه‌های اجتماعی (OG Image URL):
                  </label>
                  <input
                    type="text"
                    value={themeSettings.og_image_url || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        og_image_url: e.target.value,
                      }))
                    }
                    placeholder="/images/og-share.png یا https://..."
                    className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  توضیحات متا برای موتورهای جستجو (Meta Description):
                </label>
                <textarea
                  rows={2}
                  value={themeSettings.meta_description || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  placeholder="آناهیکس - تحویل آنی و هوشمند اشتراک‌های Gemini Pro، ChatGPT Plus، Claude Pro، Cursor و ابزارهای پریمیوم با پرداخت ریالی و رمزارز"
                  className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  کلمات کلیدی سئو (با کاما جدا کنید):
                </label>
                <input
                  type="text"
                  value={themeSettings.meta_keywords || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      meta_keywords: e.target.value,
                    }))
                  }
                  placeholder="خرید اکانت chatgpt, اکانت کلود پرو, جمینای ادونسد, شماره مجازی ۵sim, اکانت cursor"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Support and Social Channels */}
            <div className="pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  شماره تماس رسمی پشتیبانی:
                </label>
                <input
                  type="text"
                  value={themeSettings.support_phone || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      support_phone: e.target.value,
                    }))
                  }
                  placeholder="۰۲۱-۹۱۰۰۰۰۰۰"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  آیدی کانال / پشتیبانی تلگرام:
                </label>
                <input
                  type="text"
                  value={themeSettings.support_telegram || ''}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({
                      ...prev,
                      support_telegram: e.target.value,
                    }))
                  }
                  placeholder="@AnahixSupport"
                  className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: SITE MENUS AND NAVIGATION MANAGER */}
      {activeSubTab === 'site-menus' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <LayoutTemplate className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    مدیریت منوها و پیوندهای ناوبری فروشگاه (Header & Footer
                    Links)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    افزودن، ویرایش، حذف و فعال/غیرفعال کردن لینک‌های منوی بالای
                    سایت و پاورقی
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMenus}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme ? 'در حال ذخیره‌سازی...' : 'ذخیره کل منوها'}
                </span>
              </button>
            </div>

            {/* Header Navigation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-brand" />
                  <span>
                    پیوندهای منوی اصلی بالای سایت (Desktop Header Navigation)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setHeaderMenus((prev) => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        title: 'لینک جدید',
                        link: '/',
                        is_active: true,
                      },
                    ])
                  }
                  className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 border border-border/60 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن آیتم جدید</span>
                </button>
              </div>

              <div className="space-y-3">
                {headerMenus.map((item, idx) => {
                  const isExpanded = expandedMenuIds[item.id] ?? false
                  const childrenCount = item.children?.length || 0
                  return (
                    <div
                      key={item.id}
                      className="rounded-surface border border-border/60 bg-muted/20 overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-card/60">
                        <div className="w-7 h-7 rounded-control bg-secondary border border-border/60 flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 font-latin">
                          {idx + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, title: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="عنوان منو"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={item.link}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, link: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="آدرس مسیر (e.g. /category/ai_chat)"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand"
                          />
                          <input
                            type="text"
                            value={item.badge || ''}
                            onChange={(e) =>
                              setHeaderMenus((prev) =>
                                prev.map((m, i) =>
                                  i === idx
                                    ? { ...m, badge: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            placeholder="بج اختیاری (مثلاً: جدید)"
                            className="h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand"
                          />
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Toggle Submenu Expand Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMenuIds((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                            className={`h-8 px-2.5 rounded-control border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              childrenCount > 0
                                ? 'bg-brand/10 text-brand border-brand/30'
                                : 'bg-secondary text-muted-foreground border-border/60 hover:text-foreground'
                            }`}
                            title="مشاهده و مدیریت زیرمنوها (Dropdown/Flyout)"
                          >
                            <span>زیرمنوها ({childrenCount})</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              نمایش:
                            </span>
                            <ToggleSwitch
                              size="sm"
                              checked={item.is_active}
                              onChange={(checked) =>
                                setHeaderMenus((prev) =>
                                  prev.map((m, i) =>
                                    i === idx
                                      ? { ...m, is_active: checked }
                                      : m,
                                  ),
                                )
                              }
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setHeaderMenus((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-1.5 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="حذف آیتم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Submenus & Dropdown Links Builder */}
                      {isExpanded && (
                        <div className="p-3.5 bg-muted/30 border-t border-border/60 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                              <LayoutTemplate className="w-3.5 h-3.5 text-brand" />
                              <span>
                                زیرمنوهای شناور «{item.title || 'منو'}»
                                (Dropdown / Submenus):
                              </span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const presets: SubMenuItem[] = [
                                    {
                                      id: `${Date.now()}-1`,
                                      title: 'هوش مصنوعی چت (ChatGPT, Claude)',
                                      link: '/category/ai_chat',
                                      desc: 'دسترسی به قدرتمندترین مدل‌های زبانی',
                                    },
                                    {
                                      id: `${Date.now()}-2`,
                                      title:
                                        'دستیارهای کدنویسی (Cursor, Copilot)',
                                      link: '/category/coding_ai',
                                      desc: 'ابزارهای هوشمند توسعه‌دهندگان',
                                    },
                                    {
                                      id: `${Date.now()}-3`,
                                      title: 'ارتقای اکانت و لایسنس اختصاصی',
                                      link: '/category/personal_upgrade',
                                      desc: 'فعال‌سازی روی ایمیل شخصی',
                                    },
                                    {
                                      id: `${Date.now()}-4`,
                                      title: 'ابزارهای شبکه و امنیت',
                                      link: '/category/vpn',
                                      desc: 'اتصال پایدار و امن',
                                    },
                                  ]
                                  setHeaderMenus((prev) =>
                                    prev.map((m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            children: [
                                              ...(m.children || []),
                                              ...presets,
                                            ],
                                          }
                                        : m,
                                    ),
                                  )
                                  notifySuccess(
                                    'دسته‌ها اضافه شدند',
                                    '۴ زیرمنوی دسته‌بندی با موفقیت اضافه شد.',
                                  )
                                }}
                                className="h-7 px-2.5 rounded-control bg-secondary text-brand hover:bg-muted text-[11px] font-bold border border-border/60 transition flex items-center gap-1 cursor-pointer"
                              >
                                <FolderPlus className="w-3 h-3" />
                                <span>درج دسته‌های کاتالوگ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const newChild: SubMenuItem = {
                                    id: String(Date.now()),
                                    title: 'زیرمنوی جدید',
                                    link: '/',
                                    desc: '',
                                  }
                                  setHeaderMenus((prev) =>
                                    prev.map((m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            children: [
                                              ...(m.children || []),
                                              newChild,
                                            ],
                                          }
                                        : m,
                                    ),
                                  )
                                }}
                                className="h-7 px-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>افزودن زیرمنو</span>
                              </button>
                            </div>
                          </div>

                          {!item.children || item.children.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground bg-card/60 p-3 rounded-control border border-border/40 text-center">
                              هنوز زیرمنویی برای این آیتم تعریف نشده است. با زدن
                              دکمه «افزودن زیرمنو» یا «درج دسته‌های کاتالوگ»،
                              منوی کشویی بسازید.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {item.children.map((sub, sIdx) => (
                                <div
                                  key={sub.id}
                                  className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-control bg-card border border-border/60"
                                >
                                  <div className="text-[10px] text-muted-foreground font-mono font-latin px-1.5 shrink-0">
                                    #{sIdx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        title: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="عنوان زیرمنو (مثلاً: ChatGPT Plus)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs font-bold text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <input
                                    type="text"
                                    value={sub.link}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        link: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="آدرس مسیر (e.g. /products/chatgpt-plus)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <input
                                    type="text"
                                    value={sub.desc || ''}
                                    onChange={(e) =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).map((c, ci) =>
                                                  ci === sIdx
                                                    ? {
                                                        ...c,
                                                        desc: e.target.value,
                                                      }
                                                    : c,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    placeholder="توضیح کوتاه (اختیاری)"
                                    className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand flex-1 w-full"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setHeaderMenus((prev) =>
                                        prev.map((m, i) =>
                                          i === idx
                                            ? {
                                                ...m,
                                                children: (
                                                  m.children || []
                                                ).filter(
                                                  (_, ci) => ci !== sIdx,
                                                ),
                                              }
                                            : m,
                                        ),
                                      )
                                    }
                                    className="p-1 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                    title="حذف زیرمنو"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Links Section */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-brand" />
                  <span>
                    پیوندهای دسترسی سریع فوتر سایت (Footer Quick Links)
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setFooterLinks((prev) => [
                      ...prev,
                      {
                        id: String(Date.now()),
                        title: 'لینک جدید فوتر',
                        link: '/',
                      },
                    ])
                  }
                  className="h-8 px-3 rounded-control bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 border border-border/60 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن لینک فوتر</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {footerLinks.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2.5 rounded-surface border border-border/60 bg-muted/20"
                  >
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        setFooterLinks((prev) =>
                          prev.map((f, i) =>
                            i === idx ? { ...f, title: e.target.value } : f,
                          ),
                        )
                      }
                      className="flex-1 h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-bold text-foreground focus:outline-none focus:border-brand"
                    />
                    <input
                      type="text"
                      value={item.link}
                      onChange={(e) =>
                        setFooterLinks((prev) =>
                          prev.map((f, i) =>
                            i === idx ? { ...f, link: e.target.value } : f,
                          ),
                        )
                      }
                      className="flex-1 h-8 px-2.5 rounded-field border border-border/60 bg-card text-xs font-mono font-latin dir-ltr text-left text-foreground focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFooterLinks((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-1 rounded-control text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CENTRALIZED API KEYS & SECRETS */}
      {activeSubTab === 'apikeys' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    مرکز دریافت و مدیریت کلیدهای وب‌سرویس و API Keyها
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    مدیریت کلیدهای اتصال به سامانه پیامک، درگاه زرین‌پال، سامانه
                    شماره مجازی ۵SIM و اعتبارسنجی اجتماعی
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveThemeField(themeSettings)}
                disabled={savingTheme}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingTheme ? 'در حال ذخیره‌سازی...' : 'ذخیره کلیه کلیدها'}
                </span>
              </button>
            </div>

            {/* Secret Field Component */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMS.ir API Key */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand" />
                    <span>کلید وب‌سرویس سامانه پیامک (SMS.ir API Key):</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-brand/10 text-brand font-latin">
                    SMS Gateway
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.sms_api_key ? 'text' : 'password'}
                    value={themeSettings.sms_api_key || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        sms_api_key: e.target.value,
                      }))
                    }
                    placeholder="API Key سامانه پیامک..."
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('sms_api_key')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title={showSecrets.sms_api_key ? 'مخفی‌سازی' : 'نمایش'}
                    >
                      {showSecrets.sms_api_key ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.sms_api_key || '',
                          'sms_api_key',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                      title="کپی در کلیپ‌بورد"
                    >
                      {copiedKey === 'sms_api_key' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    شماره خط فرستنده اختصاصی پیامک:
                  </label>
                  <input
                    type="text"
                    value={themeSettings.sms_line_number || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        sms_line_number: e.target.value,
                      }))
                    }
                    placeholder="3000..."
                    className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>

              {/* ZarinPal Merchant ID */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>مرچنت کد درگاه زرین‌پال / شاپرک:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-emerald-500/10 text-emerald-500 font-latin">
                    Payment Gateway
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.zarinpal ? 'text' : 'password'}
                    value={themeSettings.zarinpal_merchant_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        zarinpal_merchant_id: e.target.value,
                      }))
                    }
                    placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('zarinpal')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.zarinpal ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.zarinpal_merchant_id || '',
                          'zarinpal',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'zarinpal' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  شناسه مرچنت اختصاصی درگاه زرین‌پال جهت پرداخت آنلاین متصل به
                  شاپرک.
                </p>
              </div>

              {/* 5SIM Virtual Numbers API Key */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span>کلید وب‌سرویس سامانه شماره مجازی ۵SIM:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-purple-500/10 text-purple-500 font-latin">
                    5SIM.net API
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.fivesim ? 'text' : 'password'}
                    value={themeSettings.fivesim_api_key || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        fivesim_api_key: e.target.value,
                      }))
                    }
                    placeholder="Bearer eyJhbGciOi..."
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('fivesim')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.fivesim ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.fivesim_api_key || '',
                          'fivesim',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'fivesim' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  جهت خرید خودکار شماره و دریافت پیامک‌های کد تایید در ماژول
                  شماره مجازی.
                </p>
              </div>

              {/* OAuth Client Keys */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-500" />
                    <span>شناسه کلاینت Google OAuth Client ID:</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-control text-[9px] font-bold bg-blue-500/10 text-blue-500 font-latin">
                    Google Sign-In
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showSecrets.google ? 'text' : 'password'}
                    value={themeSettings.google_client_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        google_client_id: e.target.value,
                      }))
                    }
                    placeholder="client_id.apps.googleusercontent.com"
                    className="w-full h-10 pl-20 pr-3.5 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                  <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSecretMask('google')}
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showSecrets.google ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          themeSettings.google_client_id || '',
                          'google',
                        )
                      }
                      className="p-1.5 rounded-control text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'google' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-muted-foreground">
                    شناسه GitHub OAuth Client ID:
                  </label>
                  <input
                    type="text"
                    value={themeSettings.github_client_id || ''}
                    onChange={(e) =>
                      setThemeSettings((prev) => ({
                        ...prev,
                        github_client_id: e.target.value,
                      }))
                    }
                    placeholder="Iv1..."
                    className="w-full h-9 px-3 rounded-field border border-border/60 bg-card text-xs text-foreground focus:outline-none focus:border-brand font-mono font-latin dir-ltr text-left"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: BILLING & OFFICIAL INVOICE */}
      {activeSubTab === 'billing' && <AdminBillingSettingsView />}

      {/* TAB CONTENT 4: SMS GATEWAY */}
      {activeSubTab === 'sms' && <SMSGatewayView />}

      {/* TAB CONTENT 5: PAYMENT GATEWAYS & SYSTEM PARAMETERS */}
      {activeSubTab === 'gateways' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand" />
                  <span>درگاه‌های پرداخت فعال سیستم (ذخیره شده در دیتابیس)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تمام تراکنش‌های فروشگاه از طریق این درگاه‌ها پردازش می‌شوند.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPayments}
                disabled={loadingPayments}
                className="p-2 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition shadow-control cursor-pointer"
                title="به‌روزرسانی درگاه‌ها"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin text-brand' : ''}`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Balance Gateway */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-foreground">
                      کیف پول آناهیکس (Balance)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    پیش‌فرض
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  پرداخت سریع درون‌برنامه‌ای با کارمزد ۰٪ و تحویل فوق‌سریع کمتر از
                  ۱ ثانیه.
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>شناسه فنی:</span>
                  <span className="font-mono font-bold text-foreground font-latin">
                    balance (-1)
                  </span>
                </div>
              </div>

              {/* Online Gateway (ZarinPal / Shaparak) */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand" />
                    <span className="font-bold text-foreground">
                      درگاه بانکی شتاب / شاپرک
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                    فعال
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  اتصال به سوئیچ رسمی شاپرک از طریق زرین‌پال و تمامی کارت‌های
                  بانکی عضو شبکه شتاب.
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>وضعیت اتصال:</span>
                  <span className="font-bold text-emerald-500">
                    برخط و آماده دریافت
                  </span>
                </div>
              </div>

              {/* Smart Card to Card */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-foreground">
                      کارت به کارت هوشمند
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-control text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    پشتیبان
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  انتقال کارت به کارت بانکی، پایا و ساتنا با ثبت شماره پیگیری و
                  تایید سیستمی فاکتور.
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>تایید سفارش:</span>
                  <span className="font-bold text-foreground">
                    خودکار / اپراتوری
                  </span>
                </div>
              </div>
            </div>

            {payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-2">
                  درگاه‌های بارگذاری شده از پایگاه‌داده:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {payments.map((p) => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 rounded-control bg-secondary text-foreground text-xs font-bold border border-border/60 flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {p.name}
                      <span className="text-[10px] text-muted-foreground font-latin">
                        ({p.platform})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: MULTI-AUTH SYSTEM CONTROLS */}
      {activeSubTab === 'auth' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-surface border border-border/80 bg-card p-6 shadow-surface space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    تنظیمات روش‌های ورود و ثبت‌نام مشتریان (Multi-Auth System)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    فعال‌سازی و غیرفعال‌سازی گزینه‌های احراز هویت در مدال ورود
                    فروشگاه (گوگل، گیت‌هاب، کلمه عبور ثابت و کد پیامکی OTP)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAuthSettings}
                disabled={authSaveLoading}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {authSaveLoading
                    ? 'در حال ذخیره...'
                    : 'ذخیره تنظیمات احراز هویت'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Google OAuth */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود سریع با Google
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_google_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_google_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    امکان ورود و ثبت‌نام با ۱ کلیک از طریق حساب جیمیل با آواتار و
                    نام خودکار.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  OAuth 2.0 Client
                </div>
              </div>

              {/* GitHub OAuth */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود توسعه‌دهندگان GitHub
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_github_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_github_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ورود آسان ویژه برنامه‌نویسان و خریداران ابزارهای هوش مصنوعی و
                    سرویس‌های فنی.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  OAuth 2.0 GitHub
                </div>
              </div>

              {/* Static Password Login */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      ورود با کلمه عبور
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_password_enabled}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_password_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ورود با شماره موبایل یا ایمیل به همراه رمز عبور رمزنگاری‌شده
                    BCrypt.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  BCrypt Auth Flow
                </div>
              </div>

              {/* SMS OTP Mandatory */}
              <div className="p-4 rounded-surface border border-border/60 bg-muted/20 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground">
                      الزام پیامک تایید OTP
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={authSettings.auth_otp_required}
                      onChange={(checked) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          auth_otp_required: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    ارسال کد تایید یکبار مصرف پیامکی ۵ رقمی به تلفن همراه قبل از
                    دسترسی به حساب.
                  </p>
                </div>
                <div className="text-[10px] font-bold text-brand">
                  SMS Gateway OTP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: ADMIN AUDIT & ACTIVITY LOGS */}
      {activeSubTab === 'audit-logs' && <AdminActionLogView />}
    </div>
  )
}
