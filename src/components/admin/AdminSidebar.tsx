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
import { ThemeToggle } from '../ThemeToggle'

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
          subtitle: 'سود ناخالص، فروش تومان/تتر، AOV و نرخ تبدیل',
          icon: TrendingUp,
        },
        {
          id: 'calendar',
          title: 'تقویم شمسی و رویدادها (Calendar)',
          subtitle: 'مناسبت‌ها، جشنواره‌ها و زمان‌بندی تخفیف‌ها',
          icon: CalendarIcon,
        },
        {
          id: 'banners',
          title: 'مدیریت بنرها و اسلایدرها',
          subtitle: 'اسلایدر هیرو، بنرهای جشنواره و تخفیف‌ها',
          icon: ImageIcon,
        },
        {
          id: 'theme-settings',
          title: 'تم مناسبتی و روش‌های ورود',
          subtitle: 'افکت‌های نوری، رنگ برند، ورود گوگل و پسورد',
          icon: Palette,
        },
        {
          id: 'loyalty-tiers',
          title: 'باشگاه مشتریان و سطوح VIP',
          subtitle: 'سطوح برنزی، نقره‌ای، طلایی و اولویت صف',
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
          subtitle: 'پرونده ۳۶۰ درجه، کیف پول و دسترسی',
          icon: Users,
        },
        {
          id: 'all-orders',
          title: 'جدول جامع سفارش‌ها',
          subtitle: 'تایید، در صف، لغو و مرجوعی',
          icon: ReceiptText,
        },
        {
          id: 'queue',
          title: 'صف سفارشات اپراتور',
          subtitle: 'پردازش دستی Mode C و کد ۲FA',
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
          subtitle: 'مقالات سئو، رفع ارورها، آموزش و دیدگاه‌ها',
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
          subtitle: 'مدیریت محصولات، نرخ‌ها و دسته‌ها',
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
    <div className="flex flex-col h-full bg-white dark:bg-[#020817] border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  آناهیکس
                </span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                پنل مدیریت و امنیت سازمانی
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Link to Storefront */}
        <Link
          to="/"
          target="_blank"
          className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform" />
            مشاهده ویترین فروشگاه
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all group relative ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20 ring-1 ring-blue-500'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 text-right">
                        <div className="text-xs font-bold truncate leading-tight">
                          {item.title}
                        </div>
                        <div
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isActive
                              ? 'text-blue-100'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pr-2">
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-white text-blue-600'
                              : 'bg-amber-500 text-white'
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

      {/* Admin Profile & Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-900/60">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {adminUser?.full_name || 'مدیر سیستم'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                <span>@{adminUser?.username || 'admin'}</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {adminUser?.role === 'super_admin' ? 'مدیر ارشد' : 'اپراتور'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="خروج از پنل مدیریت"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle & Status Row */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            سرور آنلاین (:8080)
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
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
