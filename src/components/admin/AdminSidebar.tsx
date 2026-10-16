import {
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
  ExternalLink,
  History,
  Image as ImageIcon,
  Layers,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Palette,
  Radio,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'

export type AdminTabType =
  | 'bi-analytics'
  | 'calendar'
  | 'banners'
  | 'theme-settings'
  | 'loyalty-tiers'
  | 'users'
  | 'all-orders'
  | 'queue'
  | 'tickets'
  | 'reviews'
  | 'content'
  | 'delivery'
  | 'virtual-numbers'
  | 'products'
  | 'sms-gateway'
  | 'billing'
  | 'transactions'
  | 'audit-logs'
  | 'system'

interface AdminSidebarProps {
  activeTab: AdminTabType
  onSelectTab: (tab: AdminTabType) => void
  adminUser: any
  queueCount: number
  ticketsPendingCount?: number
  reviewsPendingCount?: number
  vnEnabled?: boolean
  deliveryEnabled?: boolean
  onLogout: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

interface NavItem {
  id: AdminTabType
  title: string
  subtitle: string
  icon: React.ElementType
  badge?: number | string
  pulse?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  adminUser,
  queueCount,
  ticketsPendingCount,
  reviewsPendingCount,
  vnEnabled,
  deliveryEnabled,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const groups: NavGroup[] = [
    {
      label: 'هوش تجاری و سیستم طراحی (Vibe Farsi)',
      items: [
        {
          id: 'bi-analytics',
          title: 'داشبورد هوش تجاری (BI Analytics)',
          subtitle: 'سود ناخالص، فروش، AOV و نرخ تبدیل',
          icon: TrendingUp,
        },
        {
          id: 'calendar',
          title: 'تقویم شمسی رویدادها و جشنواره‌ها',
          subtitle: 'مناسبت‌های رسمی و زمان‌بندی تخفیف‌ها',
          icon: CalendarIcon,
        },
        {
          id: 'banners',
          title: 'مدیریت بنرها و اسلایدرها',
          subtitle: 'اسلایدر هیرو، بنرهای جشنواره و تخفیف',
          icon: ImageIcon,
        },
        {
          id: 'theme-settings',
          title: 'سیستم تم و روش‌های احراز هویت',
          subtitle: 'افکت‌های نوری، تم دلخواه و ورود گوگل',
          icon: Palette,
        },
        {
          id: 'loyalty-tiers',
          title: 'باشگاه مشتریان و سطوح VIP',
          subtitle: 'سطوح طلایی، نقره‌ای، الماسی و اولویت صف',
          icon: Crown,
        },
      ],
    },
    {
      label: 'مدیریت کاربران و پردازش سفارشات',
      items: [
        {
          id: 'users',
          title: 'مدیریت کاربران (User 360°)',
          subtitle: 'پرونده ۳۶۰ درجه، کیف پول و دسترسی‌ها',
          icon: Users,
        },
        {
          id: 'all-orders',
          title: 'جدول جامع سفارش‌ها',
          subtitle: 'تایید، در صف، لغو و پیگیری مرجوعی',
          icon: ReceiptText,
        },
        {
          id: 'queue',
          title: 'صف سفارشات اپراتور',
          subtitle: 'پردازش دستی Mode C و تبادل ۲FA',
          icon: Layers,
          badge: queueCount > 0 ? queueCount : undefined,
        },
        {
          id: 'tickets',
          title: 'میزکار پشتیبانی و تیکت‌ها',
          subtitle: 'پاسخگویی، اعلان پیامکی و پیوست‌ها',
          icon: LifeBuoy,
          badge:
            ticketsPendingCount && ticketsPendingCount > 0
              ? ticketsPendingCount
              : undefined,
          pulse: Boolean(ticketsPendingCount && ticketsPendingCount > 0),
        },
        {
          id: 'reviews',
          title: 'مدیریت نظرات و بازخوردها',
          subtitle: 'بررسی، تایید و پاسخ به خریداران',
          icon: MessageSquare,
          badge:
            reviewsPendingCount && reviewsPendingCount > 0
              ? reviewsPendingCount
              : undefined,
          pulse: Boolean(reviewsPendingCount && reviewsPendingCount > 0),
        },
        {
          id: 'content',
          title: 'وبلاگ و پایگاه دانش (SEO)',
          subtitle: 'مقالات سئو، رفع ارورها و آموزش‌ها',
          icon: BookOpen,
        },
        {
          id: 'delivery',
          title: 'موتور تحویل آنی',
          subtitle: 'اتصال هوشمند به انبار لایسنس‌ها',
          icon: Zap,
          pulse: deliveryEnabled,
        },
        {
          id: 'virtual-numbers',
          title: 'شماره‌های مجازی',
          subtitle: 'سرویس پیامک و نرخ ارز زنده',
          icon: Radio,
          pulse: vnEnabled,
        },
        {
          id: 'products',
          title: 'کاتالوگ و انبار اکانت‌ها',
          subtitle: 'مدیریت محصولات، عکس و تخفیف‌ها',
          icon: Sliders,
        },
      ],
    },
    {
      label: 'گزارش‌ها و حسابرسی دقیق',
      items: [
        {
          id: 'transactions',
          title: 'لاگ تراکنش‌های مالی',
          subtitle: 'تمام پرداخت‌ها، کسر و مرجوعی‌ها',
          icon: ReceiptText,
        },
        {
          id: 'audit-logs',
          title: 'لاگ فعالیت مدیران',
          subtitle: 'ثبت رویدادها، تغییرات و دسترسی‌ها',
          icon: History,
        },
      ],
    },
    {
      label: 'پیکربندی هسته سیستم',
      items: [
        {
          id: 'billing',
          title: 'فاکتور رسمی و مشخصات حقوقی',
          subtitle: 'شناسه ملی، ارزش افزوده و مهر شرکت',
          icon: ReceiptText,
        },
        {
          id: 'sms-gateway',
          title: 'سامانه پیامک و اعتبارسنجی',
          subtitle: 'کد تایید OTP، خطوط و اعتبار ریالی',
          icon: Smartphone,
        },
        {
          id: 'system',
          title: 'درگاه‌های پرداخت و سیستم',
          subtitle: 'کیف پول، زرین‌پال و پارامترها',
          icon: Settings,
        },
      ],
    },
  ]

  const handleNavClick = (tabId: AdminTabType) => {
    onSelectTab(tabId)
    onCloseMobile()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80 text-zinc-100 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">
                  آناهیکس
                </span>
                <span className="text-[10px] bg-blue-950/80 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-900 font-latin">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                پنل مدیریت و امنیت سازمانی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Link to Storefront */}
        <Link
          to="/"
          target="_blank"
          className="mt-3.5 flex items-center justify-between px-3 py-2 rounded-control border-line bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] shadow-control transition-all group"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand group-hover:rotate-12 transition-transform" />
            <span>مشاهده ویترین فروشگاه</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Navigation Groups - Clean, Readable and Free of Truncate Cuts */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2.5 pb-1 text-[11px] font-bold text-zinc-400 tracking-wider">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-control text-right duration-motion ease-motion transition-all group relative cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="text-xs font-bold leading-tight">
                          {item.title}
                        </div>
                        <div
                          className={`text-[10px] leading-tight mt-0.5 truncate ${
                            isActive
                              ? 'text-primary-foreground/75'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pr-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-control text-[10px] font-bold ${
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-brand/20 text-brand border border-brand/30 font-black'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.pulse && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Profile & Server Status */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 space-y-2.5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-900/60">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-right">
              <div className="text-xs font-bold text-white truncate">
                {adminUser?.full_name || 'مدیر سیستم'}
              </div>
              <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1 font-latin">
                <span>@{adminUser?.username || 'admin'}</span>
                <span>•</span>
                <span className="text-blue-400 font-semibold font-sans">
                  {adminUser?.role === 'super_admin' ? 'مدیر کل' : 'اپراتور'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="خروج از پنل مدیریت"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>سرور آنلاین (:8080)</span>
          </span>
          <span className="font-latin text-[10px] text-zinc-500">v2.5 Pro</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 sm:w-80 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
