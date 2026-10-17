import {
  Bell,
  ChevronLeft,
  Crown,
  Gift,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Package,
  Radio,
  Settings,
  Shield,
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
import { CartDrawer } from '../components/CartDrawer'
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
import { SidebarProfileAvatar } from '../components/profile/SidebarProfileAvatar'
import { WalletTopupModal } from '../components/profile/WalletTopupModal'
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
  const [, setLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-20 transition-colors duration-200">
      <Header
        activeOrdersCount={pendingOrdersCount + activeNumbersCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Clean Breadcrumb Navigation (Without duplicate buttons or harsh border) */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground flex items-center gap-2"
        >
          <Link to="/" className="hover:text-foreground transition-colors">
            خانه
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground font-medium">حساب کاربری</span>
          <span className="opacity-40">/</span>
          <span className="text-brand font-bold">{activeTabDef.label}</span>
        </nav>

        {/* Mobile & Tablet Profile Avatar Card (Responsive - Visible on mobile/tablet) */}
        {customer && (
          <div className="lg:hidden">
            <SidebarProfileAvatar
              customer={customer}
              onProfileUpdated={(updated) => setCustomer(updated)}
              onNavigateToPersonal={() => handleSelectTab('personal')}
            />
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-control text-xs font-bold transition-all duration-motion ease-motion active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'border-line bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  />
                  <span>{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-control text-[9px] font-mono ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-foreground font-bold border-line'
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
          {/* Sidebar Navigation with Vibe Farsi Avatar Card on Top */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
            {customer && (
              <SidebarProfileAvatar
                customer={customer}
                onProfileUpdated={(updated) => setCustomer(updated)}
                onNavigateToPersonal={() => handleSelectTab('personal')}
              />
            )}

            <div className="rounded-surface border border-border/60 bg-card p-3 shadow-surface space-y-4 duration-motion ease-motion">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-all text-right duration-motion ease-motion active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-black shadow-control'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          <ChevronLeft
                            className={`h-3.5 w-3.5 opacity-60 ${
                              isActive ? 'text-primary-foreground' : ''
                            }`}
                          />
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Services & Orders Group */}
              <div className="pt-2">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-all text-right duration-motion ease-motion active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-black shadow-control'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge ? (
                            <span
                              className={`px-2 py-0.5 rounded-control text-[10px] font-mono ${
                                isActive
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : 'border-line bg-muted text-foreground'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          ) : (
                            <ChevronLeft
                              className={`h-3.5 w-3.5 opacity-60 ${
                                isActive ? 'text-primary-foreground' : ''
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Financial Group */}
              <div className="pt-2">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-all text-right duration-motion ease-motion active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-black shadow-control'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          {tab.badge ? (
                            <span
                              className={`px-2 py-0.5 rounded-control text-[10px] font-bold ${
                                isActive
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : 'border-brand/30 bg-brand/10 text-brand'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          ) : (
                            <ChevronLeft
                              className={`h-3.5 w-3.5 opacity-60 ${
                                isActive ? 'text-primary-foreground' : ''
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* System & Support Group */}
              <div className="pt-2">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-control text-xs font-bold transition-all text-right duration-motion ease-motion active:scale-[0.98] ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-black shadow-control'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? 'text-primary-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span>{tab.label}</span>
                          </div>
                          <ChevronLeft
                            className={`h-3.5 w-3.5 opacity-60 ${
                              isActive ? 'text-primary-foreground' : ''
                            }`}
                          />
                        </button>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="rounded-surface border-line bg-card p-4 text-right space-y-2.5 shadow-surface duration-motion ease-motion">
              <div className="flex items-center gap-2 text-brand font-bold text-xs">
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
                className="inline-flex items-center justify-center w-full py-2 px-3 rounded-control bg-primary text-primary-foreground font-black text-xs duration-motion ease-motion hover:bg-primary-hover active:scale-[0.98] shadow-control"
              >
                ارتباط با پشتیبان در تلگرام
              </a>
            </div>
          </aside>

          {/* Main Tab Content Panel */}
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

      {/* Cart Drawer for Profile Header Action */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        payments={[]}
        onSubmit={async () => {
          setIsCartOpen(false)
          refreshProfile()
        }}
      />
    </div>
  )
}

export default UserProfilePage
