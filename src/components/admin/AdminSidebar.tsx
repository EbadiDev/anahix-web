import {
  BookOpen,
  Calendar as CalendarIcon,
  Crown,
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
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { createPortal } from 'react-dom'

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
  vnStatus?: 'active' | 'error' | 'disabled'
  deliveryEnabled?: boolean
  deliveryStatus?: 'active' | 'error' | 'disabled'
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
  pulseColor?: 'emerald' | 'rose' | 'amber'
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
  vnStatus = 'active',
  deliveryEnabled,
  deliveryStatus = 'active',
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const groups: NavGroup[] = [
    {
      label: 'هوش تجاری و بازاریابی',
      items: [
        {
          id: 'bi-analytics',
          title: 'داشبورد هوش تجاری (BI)',
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
          title: 'سیستم تم و جشنواره‌های مناسبتی',
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
      label: 'سفارش‌ها و پردازش عملیات',
      items: [
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
          id: 'delivery',
          title: 'موتور تحویل آنی (Instant)',
          subtitle: 'اتصال هوشمند به انبار لایسنس‌ها',
          icon: Zap,
          pulse: deliveryEnabled,
          pulseColor: deliveryStatus === 'error' ? 'rose' : 'emerald',
        },
        {
          id: 'virtual-numbers',
          title: 'شماره‌های مجازی',
          subtitle: 'سرویس پیامک و نرخ ارز زنده',
          icon: Radio,
          pulse: vnEnabled,
          pulseColor: vnStatus === 'error' ? 'rose' : 'emerald',
        },
      ],
    },
    {
      label: 'محصولات و کاتالوگ',
      items: [
        {
          id: 'products',
          title: 'کاتالوگ و انبار اکانت‌ها',
          subtitle: 'مدیریت محصولات، عکس و تخفیف‌ها',
          icon: Sliders,
        },
      ],
    },
    {
      label: 'کاربران و پشتیبانی مشتریان',
      items: [
        {
          id: 'users',
          title: 'مدیریت کاربران (User 360°)',
          subtitle: 'پرونده ۳۶۰ درجه، کیف پول و دسترسی‌ها',
          icon: Users,
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
      ],
    },
    {
      label: 'محتوا، سئو و مقالات',
      items: [
        {
          id: 'content',
          title: 'وبلاگ و پایگاه دانش (SEO)',
          subtitle: 'مقالات سئو، رفع ارورها و آموزش‌ها',
          icon: BookOpen,
        },
      ],
    },
    {
      label: 'پیکربندی هسته و حسابرسی مالی',
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
  ]

  const handleNavClick = (tabId: AdminTabType) => {
    onSelectTab(tabId)
    onCloseMobile()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-l border-border/80 text-foreground select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center font-bold text-lg shadow-control shrink-0">
              <ShieldCheck className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-foreground">
                  آناهیکس
                </span>
                <span className="text-[10px] bg-brand/10 text-brand font-bold px-2 py-0.5 rounded-control border border-brand/20 font-latin">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                پنل مدیریت و عملیات سازمانی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Groups - Clean, Readable and Free of Truncate Cuts */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2.5 pb-1 text-[11px] font-black text-muted-foreground tracking-wider">
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
                        className={`w-7 h-7 rounded-control flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-primary-foreground/15 text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground border border-border/40 group-hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <div className="text-xs font-bold leading-tight truncate">
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
                        <span
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            item.pulseColor === 'rose'
                              ? 'bg-rose-500 shadow-xs shadow-rose-500/50'
                              : item.pulseColor === 'amber'
                                ? 'bg-amber-500 shadow-xs shadow-amber-500/50'
                                : 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                          }`}
                        />
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
      <div className="p-3 border-t border-border/60 bg-muted/20 space-y-2.5">
        <div className="flex items-center justify-between p-2 rounded-control bg-card border border-border/60 shadow-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-control bg-secondary text-brand flex items-center justify-center font-bold text-xs shrink-0 border border-border/60 shadow-control">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 text-right">
              <div className="text-xs font-bold text-foreground truncate">
                {adminUser?.full_name || 'مدیر سیستم'}
              </div>
              <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 font-latin">
                <span>@{adminUser?.username || 'admin'}</span>
                <span>•</span>
                <span className="text-brand font-semibold font-sans">
                  {adminUser?.role === 'super_admin' ? 'مدیر کل' : 'اپراتور'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="خروج از پنل مدیریت"
            className="p-1.5 rounded-control text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>سرور آنلاین (:8080)</span>
          </span>
          <span className="font-latin text-[10px] text-muted-foreground">
            v2.5 Pro
          </span>
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
      {isMobileOpen &&
        createPortal(
          <div
            className="fixed inset-0 lg:hidden flex"
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
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in"
              onClick={onCloseMobile}
            />
            <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-right duration-200">
              {sidebarContent}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
