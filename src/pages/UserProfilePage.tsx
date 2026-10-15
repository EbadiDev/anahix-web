import {
  Bell,
  CheckCircle2,
  ChevronLeft,
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
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { apiService } from '../services/api'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../types'

type ProfileTabId =
  | 'overview'
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
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
              <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>در حال بارگذاری اطلاعات حساب کاربری...</span>
            </div>
          </div>
        ) : customer ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
            {/* Top decorative gradient mesh */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Left/Start: Avatar + Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">
                    {customer.full_name
                      ? customer.full_name.charAt(0).toUpperCase()
                      : customer.phone.slice(-4)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center"
                    title="حساب فعال و تایید شده"
                  >
                    <ShieldCheck className="h-3 w-3 text-white" />
                  </span>
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                      {customer.full_name || 'کاربر گرامی آناهیکس'}
                    </h1>
                    {/* Real Role & Verification Badges */}
                    {(customer.is_admin || apiService.getAdminUser()) && (
                      <Link
                        to="/admin/dashboard"
                        title="ورود به پنل مدیریت"
                        className="inline-flex"
                      >
                        <Badge
                          variant="outline"
                          className="border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 text-[11px] gap-1 px-2 py-0.5 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <span>مدیر سیستم</span>
                        </Badge>
                      </Link>
                    )}

                    {customer.is_active && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[11px] gap-1 px-2 py-0.5"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>حساب تاییدشده</span>
                      </Badge>
                    )}

                    {orders.length > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 text-[11px] gap-1 px-2 py-0.5"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>
                          {orders.length.toLocaleString('fa-IR')} سفارش
                        </span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 text-[11px] gap-1 px-2 py-0.5"
                      >
                        <User className="h-3 w-3" />
                        <span>کاربر جدید</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono text-foreground font-bold">
                      <Phone className="h-3 w-3 text-blue-600" />
                      <span dir="ltr">{customer.phone}</span>
                    </div>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      حساب کاربری فعال و تایید شده
                    </span>
                  </div>
                </div>
              </div>

              {/* Right/End: Wallet Snapshot & Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border/60 pt-4 md:pt-0">
                {/* Unified Wallet & Top-up Component (Matched h-10 with logout button) */}
                <div className="h-10 flex items-center gap-2.5 px-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-right">
                    <span className="text-[11px] text-muted-foreground">
                      موجودی:
                    </span>
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {customer.balance_toman.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      تومان
                    </span>
                  </div>

                  <div className="h-4 w-px bg-blue-200/80 dark:bg-blue-800/60" />

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsWalletModalOpen(true)}
                    className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 shadow-xs shadow-blue-600/20"
                  >
                    <Plus className="h-3 w-3" />
                    <span>افزایش موجودی</span>
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="h-10 px-3.5 rounded-xl text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>خروج</span>
                </Button>
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
