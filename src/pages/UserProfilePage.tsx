import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Gift,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  UserCheck,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { Header } from '../components/Header'
import { ProfileLoyaltyTab } from '../components/profile/ProfileLoyaltyTab'
import { ProfileNotificationsTab } from '../components/profile/ProfileNotificationsTab'
import { ProfileNumberSessionsTab } from '../components/profile/ProfileNumberSessionsTab'
import { ProfileOrdersTab } from '../components/profile/ProfileOrdersTab'
import { ProfileOverviewTab } from '../components/profile/ProfileOverviewTab'
import { ProfilePersonalTab } from '../components/profile/ProfilePersonalTab'
import { ProfileProductsTab } from '../components/profile/ProfileProductsTab'
import { ProfileReferralTab } from '../components/profile/ProfileReferralTab'
import { ProfileReviewsTab } from '../components/profile/ProfileReviewsTab'
import { ProfileSecurityTab } from '../components/profile/ProfileSecurityTab'
import { ProfileSettingsTab } from '../components/profile/ProfileSettingsTab'
import { ProfileSupportTab } from '../components/profile/ProfileSupportTab'
import { ProfileWalletTab } from '../components/profile/ProfileWalletTab'
import { WalletTopupModal } from '../components/profile/WalletTopupModal'
import { ThemeToggle } from '../components/ThemeToggle'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { apiService } from '../services/api'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../types'

type ProfileTabId =
  | 'overview'
  | 'loyalty'
  | 'personal'
  | 'security'
  | 'orders'
  | 'reviews'
  | 'numbers'
  | 'products'
  | 'wallet'
  | 'referral'
  | 'support'
  | 'notifications'
  | 'settings'

interface TabDefinition {
  id: ProfileTabId
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  group: 'general' | 'services' | 'financial' | 'system'
}

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  // Orders and Virtual numbers state
  const [orders, _setOrders] = useState<Order[]>(() =>
    apiService.getCustomerOrders(),
  )
  const [virtualOrders, setVirtualOrders] = useState<VirtualNumberOrder[]>(() =>
    apiService.getCustomerVirtualOrders(),
  )

  // Active Tab from URL query param or default 'overview'
  const tabParam = searchParams.get('tab') as ProfileTabId | null
  const validTabs: ProfileTabId[] = [
    'overview',
    'loyalty',
    'personal',
    'security',
    'orders',
    'reviews',
    'numbers',
    'products',
    'wallet',
    'referral',
    'support',
    'notifications',
    'settings',
  ]
  const [activeTab, setActiveTab] = useState<ProfileTabId>(() => {
    if (tabParam && validTabs.includes(tabParam)) return tabParam
    return 'overview'
  })

  // Sync tab with URL
  const handleSelectTab = (tabId: string) => {
    const valid = tabId as ProfileTabId
    if (validTabs.includes(valid)) {
      setActiveTab(valid)
      setSearchParams({ tab: valid })
    }
  }

  // Load customer profile
  const refreshProfile = async () => {
    try {
      const p = await apiService.getCustomerProfile()
      setCustomer(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  // Listen to tabParam changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Count active number sessions
  const activeNumbersCount = useMemo(() => {
    return virtualOrders.filter(
      (v) => v.status === 'PENDING' || v.status === 'RECEIVED',
    ).length
  }, [virtualOrders])

  // Count pending product orders
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'PENDING_PAYMENT' ||
        o.status === 'PROCESSING' ||
        o.status === 'OPERATOR_QUEUE' ||
        o.status === 'WAITING_CUSTOMER_2FA',
    ).length
  }, [orders])

  const [supportBadgeCount, setSupportBadgeCount] = useState<number>(0)

  useEffect(() => {
    if (customer) {
      apiService
        .getMyTickets()
        .then((tList) => {
          const count = tList.filter((t) => t.status === 'awaiting_user').length
          setSupportBadgeCount(count)
        })
        .catch(() => {})
    }
  }, [customer])

  const handleLogout = () => {
    apiService.removeCustomerToken()
    setCustomer(null)
    navigate('/')
  }

  const handleWalletSuccess = (newBalance: number) => {
    if (customer) {
      setCustomer({ ...customer, balance_toman: newBalance })
    }
  }

  const tabs: TabDefinition[] = [
    {
      id: 'overview',
      label: 'نمای کلی حساب',
      shortLabel: 'نمای کلی',
      icon: LayoutDashboard,
      group: 'general',
    },
    {
      id: 'personal',
      label: 'اطلاعات کاربری',
      shortLabel: 'اطلاعات',
      icon: UserCheck,
      group: 'general',
    },
    {
      id: 'security',
      label: 'امنیت و نشست‌ها',
      shortLabel: 'امنیت',
      icon: Shield,
      group: 'general',
    },
    {
      id: 'orders',
      label: 'سفارش‌ها و تاریخچه',
      shortLabel: 'سفارش‌ها',
      icon: Package,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      group: 'services',
    },
    {
      id: 'reviews',
      label: 'نظرات و بازخوردهای من',
      shortLabel: 'نظرات من',
      icon: Star,
      group: 'services',
    },
    {
      id: 'numbers',
      label: 'شماره‌های مجازی من',
      shortLabel: 'شماره مجازی',
      icon: Radio,
      badge: activeNumbersCount > 0 ? activeNumbersCount : undefined,
      group: 'services',
    },
    {
      id: 'products',
      label: 'اشتراک‌ها و لایسنس‌ها',
      shortLabel: 'لایسنس‌ها',
      icon: Sparkles,
      group: 'services',
    },
    {
      id: 'wallet',
      label: 'کیف پول و موجودی',
      shortLabel: 'کیف پول',
      icon: Wallet,
      group: 'financial',
    },
    {
      id: 'loyalty',
      label: 'باشگاه مشتریان و VIP',
      shortLabel: 'باشگاه VIP',
      icon: Crown,
      badge:
        customer?.tier === 'gold'
          ? 'طلایی 👑'
          : customer?.tier === 'silver'
            ? 'نقره‌ای ⭐'
            : customer?.tier === 'diamond'
              ? 'الماسی 💎'
              : 'VIP',
      group: 'financial',
    },
    {
      id: 'referral',
      label: 'همکاری در فروش و معرف',
      shortLabel: 'معرف',
      icon: Gift,
      badge: '۱۰٪',
      group: 'financial',
    },
    {
      id: 'support',
      label: 'پشتیبانی و تیکت‌ها',
      shortLabel: 'پشتیبانی',
      icon: MessageSquare,
      badge: supportBadgeCount > 0 ? supportBadgeCount : undefined,
      group: 'system',
    },
    {
      id: 'notifications',
      label: 'اعلان‌ها و اطلاع‌رسانی',
      shortLabel: 'اعلان‌ها',
      icon: Bell,
      group: 'system',
    },
    {
      id: 'settings',
      label: 'تنظیمات سامانه',
      shortLabel: 'تنظیمات',
      icon: Settings,
      group: 'system',
    },
  ]

  const activeTabDef = tabs.find((t) => t.id === activeTab) || tabs[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-20">
      <Header activeOrdersCount={pendingOrdersCount + activeNumbersCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Navigation helper */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              خانه
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">حساب کاربری</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {activeTabDef.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/virtual-numbers"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              <Radio className="h-3 w-3" />
              <span>خرید شماره جدید</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              <ShoppingBag className="h-3 w-3" />
              <span>کاتالوگ سرویس‌ها</span>
            </Link>
          </div>
        </div>

        {/* Profile Hero Header Card */}
        {loading ? (
          <div
            className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center"
            style={{ boxShadow: 'var(--depth-surface)' }}
          >
            <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
              <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>در حال بارگذاری اطلاعات حساب کاربری...</span>
            </div>
          </div>
        ) : customer ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6"
            style={{ boxShadow: 'var(--depth-surface)' }}
          >
            {/* Top decorative gradient line in Graphite style */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              {/* Left/Start: Avatar + Info */}
              <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto">
                <div className="relative shrink-0">
                  {customer.avatar_url ? (
                    <img
                      src={customer.avatar_url}
                      alt={customer.full_name || 'کاربر'}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-blue-500/30"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md">
                      {customer.full_name
                        ? customer.full_name.charAt(0).toUpperCase()
                        : customer.phone.slice(-4)}
                    </div>
                  )}
                  <span
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center"
                    title="حساب فعال و تایید شده"
                  >
                    <ShieldCheck className="h-3 w-3 text-white" />
                  </span>
                </div>

                <div className="space-y-1 text-right flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-foreground truncate">
                      {customer.full_name || 'کاربر گرامی آناهیکس'}
                    </h1>

                    {/* Role & Badges */}
                    {(customer.is_admin || apiService.getAdminUser()) && (
                      <Link
                        to="/admin/dashboard"
                        title="ورود به پنل مدیریت"
                        className="inline-flex shrink-0"
                      >
                        <Badge
                          variant="outline"
                          className="border-red-500/40 text-red-500 bg-red-500/10 text-[10px] gap-1 px-1.5 py-0.5"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>مدیر سیستم</span>
                        </Badge>
                      </Link>
                    )}

                    {customer.is_active && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] gap-1 px-1.5 py-0.5 shrink-0"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>تاییدشده</span>
                      </Badge>
                    )}

                    {orders.length > 0 && (
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] gap-1 px-1.5 py-0.5 shrink-0"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>
                          {orders.length.toLocaleString('fa-IR')} سفارش
                        </span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono text-foreground font-bold">
                      <Phone className="h-3 w-3 text-blue-500" />
                      <span dir="ltr">{customer.phone}</span>
                    </div>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium text-[11px]">
                      فعال و رسمی
                    </span>
                  </div>
                </div>
              </div>

              {/* Right/End: Responsive Wallet & Actions (Clean 2-row / responsive grid) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto border-t md:border-t-0 border-border/80 pt-3 md:pt-0">
                {/* Unified Wallet Component */}
                <div className="flex items-center justify-between sm:justify-start gap-2.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs text-right">
                    <span className="text-[11px] text-zinc-400">موجودی:</span>
                    <span className="font-black text-blue-400 font-latin text-sm">
                      {customer.balance_toman.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-zinc-400">تومان</span>
                  </div>

                  <div className="h-4 w-px bg-zinc-800" />

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsWalletModalOpen(true)}
                    className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 shadow-xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>شارژ</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="h-9 px-3.5 rounded-xl text-xs text-red-400 border-red-900/40 hover:bg-red-950/30 gap-1.5 shrink-0 justify-center flex-1 sm:flex-initial"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>خروج از حساب</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Unauthenticated Banner */
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right space-y-1">
              <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">
                شما هنوز وارد حساب کاربری خود نشده‌اید
              </h2>
              <p className="text-xs text-muted-foreground">
                برای مدیریت سفارش‌ها، دریافت لایسنس‌ها و مشاهده کد پیامک‌های شماره
                مجازی، وارد شوید.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shrink-0 shadow-md shadow-blue-600/20"
            >
              <LogIn className="h-4 w-4" />
              <span>ورود با شماره موبایل</span>
            </Button>
          </div>
        )}

        {/* Mobile Horizontal Pill Scroll Navigation */}
        <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                  />
                  <span>{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop 2-Column Grid Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-sm space-y-4">
              {/* General Group */}
              <div>
                <span className="px-3 text-[10px] font-bold text-muted-foreground tracking-wider uppercase block mb-1.5">
                  بخش عمومی
                </span>
                <div className="space-y-0.5">
                  {tabs
                    .filter((t) => t.group === 'general')
                    .map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          <ChevronLeft
                            className={`h-3.5 w-3.5 opacity-60 ${
                              isActive ? 'text-white' : ''
                            }`}
                          />
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Services & Orders Group */}
              <div className="pt-2 border-t border-border/60">
                <span className="px-3 text-[10px] font-bold text-muted-foreground tracking-wider uppercase block mb-1.5">
                  سرویس‌ها و سفارش‌ها
                </span>
                <div className="space-y-0.5">
                  {tabs
                    .filter((t) => t.group === 'services')
                    .map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          ) : (
                            <ChevronLeft
                              className={`h-3.5 w-3.5 opacity-60 ${
                                isActive ? 'text-white' : ''
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Financial Group */}
              <div className="pt-2 border-t border-border/60">
                <span className="px-3 text-[10px] font-bold text-muted-foreground tracking-wider uppercase block mb-1.5">
                  بخش مالی و درآمد
                </span>
                <div className="space-y-0.5">
                  {tabs
                    .filter((t) => t.group === 'financial')
                    .map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          ) : (
                            <ChevronLeft
                              className={`h-3.5 w-3.5 opacity-60 ${
                                isActive ? 'text-white' : ''
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* System & Support Group */}
              <div className="pt-2 border-t border-border/60">
                <span className="px-3 text-[10px] font-bold text-muted-foreground tracking-wider uppercase block mb-1.5">
                  پشتیبانی و تنظیمات
                </span>
                <div className="space-y-0.5">
                  {tabs
                    .filter((t) => t.group === 'system')
                    .map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSelectTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          <ChevronLeft
                            className={`h-3.5 w-3.5 opacity-60 ${
                              isActive ? 'text-white' : ''
                            }`}
                          />
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-card p-4 text-right space-y-2.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <MessageSquare className="h-4 w-4" />
                <span>پشتیبانی شبانه‌روزی ۲۴/۷</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                سوالی دارید یا در دریافت شماره مجازی نیاز به راهنمایی دارید؟ تیم
                پشتیبانی تلگرام آماده پاسخگویی است.
              </p>
              <a
                href="https://t.me/AnahixSupport"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm shadow-blue-600/20"
              >
                ارتباط با پشتیبان در تلگرام
              </a>
            </div>
          </aside>

          {/* Main Tab Content */}
          <section className="col-span-12 lg:col-span-9">
            {customer ? (
              <>
                {activeTab === 'overview' && (
                  <ProfileOverviewTab
                    customer={customer}
                    orders={orders}
                    virtualOrders={virtualOrders}
                    onSelectTab={handleSelectTab}
                    onOpenWalletModal={() => setIsWalletModalOpen(true)}
                  />
                )}

                {activeTab === 'personal' && (
                  <ProfilePersonalTab
                    customer={customer}
                    onProfileUpdated={(updated) => setCustomer(updated)}
                  />
                )}

                {activeTab === 'security' && (
                  <ProfileSecurityTab
                    customer={customer}
                    onLogout={handleLogout}
                  />
                )}

                {activeTab === 'orders' && (
                  <ProfileOrdersTab
                    orders={orders}
                    virtualOrders={virtualOrders}
                    customer={customer}
                  />
                )}

                {activeTab === 'reviews' && <ProfileReviewsTab />}

                {activeTab === 'numbers' && (
                  <ProfileNumberSessionsTab
                    virtualOrders={virtualOrders}
                    onUpdateVirtualOrders={(updatedList) =>
                      setVirtualOrders(updatedList)
                    }
                  />
                )}

                {activeTab === 'products' && (
                  <ProfileProductsTab orders={orders} />
                )}

                {activeTab === 'wallet' && (
                  <ProfileWalletTab
                    customer={customer}
                    onOpenTopupModal={() => setIsWalletModalOpen(true)}
                  />
                )}

                {activeTab === 'loyalty' && (
                  <ProfileLoyaltyTab
                    customer={customer}
                    onReloadCustomer={refreshProfile}
                  />
                )}

                {activeTab === 'referral' && (
                  <ProfileReferralTab
                    customer={customer}
                    onBalanceUpdated={(newBal) =>
                      setCustomer((prev) =>
                        prev ? { ...prev, balance_toman: newBal } : null,
                      )
                    }
                  />
                )}

                {activeTab === 'support' && (
                  <ProfileSupportTab
                    orders={orders}
                    virtualOrders={virtualOrders}
                  />
                )}

                {activeTab === 'notifications' && <ProfileNotificationsTab />}

                {activeTab === 'settings' && (
                  <ProfileSettingsTab onLogout={handleLogout} />
                )}
              </>
            ) : (
              /* If customer is null, show guest placeholder with call to action */
              <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-foreground">
                    ورود به حساب کاربری آناهیکس
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    جهت مشاهده سفارشات، موجودی کیف پول و بخش‌های مختلف حساب
                    کاربری لطفا وارد شوید.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 px-6"
                >
                  <LogIn className="h-4 w-4" />
                  <span>ورود یا ثبت‌نام فوری</span>
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Online Wallet Top-Up Modal */}
      {customer && (
        <WalletTopupModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          currentBalance={customer.balance_toman}
          onSuccess={handleWalletSuccess}
        />
      )}

      {/* Auth Modal for guest state */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(profile) => {
          setCustomer(profile)
          refreshProfile()
        }}
      />
    </div>
  )
}

export default UserProfilePage
