import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Code2,
  Crown,
  HelpCircle,
  Lock,
  LogIn,
  LogOut,
  Menu,
  PhoneCall,
  Radio,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../lib/cartStore'
import { api } from '../services/api'
import type {
  ContentCategory,
  CustomerNotificationItem,
  CustomerProfile,
  ThemeSettings,
} from '../types'
import { formatDisplayPhone } from '../utils/formatters'
import { AuthModal } from './AuthModal'
import { ThemeToggle } from './ThemeToggle'
import { HolidayThemeBanner } from './vibefarsi/HolidayThemeBanner'

interface HeaderProps {
  balance?: number
  activeOrdersCount?: number
  hideNavLinks?: boolean
  hideAnnouncementBar?: boolean
  onToggleMobileMenu?: () => void
  onOpenCart?: () => void
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const Header: React.FC<HeaderProps> = ({
  balance: propBalance,
  activeOrdersCount = 0,
  hideNavLinks = false,
  hideAnnouncementBar = false,
  onToggleMobileMenu,
  onOpenCart,
}) => {
  const location = useLocation()
  const pathname = location.pathname
  const isAdminPage = hideNavLinks || pathname.startsWith('/admin')

  const { itemCount } = useCart()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [dynamicCategories, setDynamicCategories] = useState<ContentCategory[]>(
    [],
  )
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>(
    'login',
  )
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [activeCategoryHover, setActiveCategoryHover] = useState<string | null>(
    null,
  )
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<
    string | null
  >(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [inAppNotifs, setInAppNotifs] = useState<CustomerNotificationItem[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getCustomerProfile().then((profile: CustomerProfile | null) => {
      if (profile) setCustomer(profile)
    })
    api
      .getThemeSettings()
      .then(setThemeSettings)
      .catch(() => {})
    api
      .getContentCategories('product')
      .then((cats: ContentCategory[]) => {
        if (cats && cats.length > 0) {
          setDynamicCategories(cats)
        }
      })
      .catch(() => {})

    if (api.isCustomerLoggedIn()) {
      api
        .getInAppNotifications()
        .then((res) => {
          if (res) {
            setInAppNotifs(res.items || [])
            setUnreadNotifCount(res.unread_count || 0)
          }
        })
        .catch(() => {})
    }
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false)
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false)
      }
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(e.target as Node)
      ) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    api.removeCustomerToken()
    setCustomer(null)
    setUserDropdownOpen(false)
  }

  const effectiveBalance =
    propBalance !== undefined
      ? propBalance
      : customer
        ? customer.balance_toman
        : 0

  const categoriesToRender =
    dynamicCategories.length > 0
      ? dynamicCategories.map((c) => ({
          id: c.slug,
          title: c.name,
          desc: c.description || 'مشاهده محصولات این دسته‌بندی',
          icon: <Bot className="h-4 w-4 text-brand" />,
          link: `/category/${c.slug}`,
          children: (c.children || []).map((sub) => ({
            id: sub.slug,
            title: sub.name,
            desc: sub.description || '',
            link: `/category/${sub.slug}`,
          })),
        }))
      : [
          {
            id: 'ai_chat',
            title: 'هوش مصنوعی و چت‌بات',
            desc: 'ChatGPT Plus، Claude 3.7 Sonnet، Gemini',
            icon: <Bot className="h-4 w-4 text-brand" />,
            link: '/category/ai_chat',
            children: [
              {
                id: 'chatgpt',
                title: 'چت‌جی‌پی‌تی پلاس (ChatGPT Plus)',
                desc: 'دسترسی به GPT-4o و مدل‌های o3',
                link: '/category/chatgpt',
              },
              {
                id: 'claude',
                title: 'انتروپیک کلود پرو (Claude 3.7)',
                desc: 'دستیار کدنویسی و تحلیل عمیق متن',
                link: '/category/claude',
              },
              {
                id: 'gemini',
                title: 'گوگل جمینای ادونس (Gemini Advanced)',
                desc: 'همراه با ۲ ترابایت فضای ابری گوگل وان',
                link: '/category/gemini',
              },
            ],
          },
          {
            id: 'coding_ai',
            title: 'دستیارهای کدنویسی',
            desc: 'Cursor AI، GitHub Copilot، Replit Pro',
            icon: <Code2 className="h-4 w-4 text-brand" />,
            link: '/category/coding_ai',
            children: [
              {
                id: 'cursor',
                title: 'کرسر پرو (Cursor AI Pro)',
                desc: 'ادیتور تخصصی کدنویسی با هوش مصنوعی',
                link: '/category/cursor',
              },
              {
                id: 'github_copilot',
                title: 'گیت‌هاب کوپایلوت (GitHub Copilot)',
                desc: 'دستیار رسمی برنامه‌نویسی مایکروسافت',
                link: '/category/github_copilot',
              },
            ],
          },
          {
            id: 'personal_upgrade',
            title: 'ارتقای اکانت شخصی',
            desc: 'فعال‌سازی بدون پسورد و با جیمیل خودتان',
            icon: <Zap className="h-4 w-4 text-brand" />,
            link: '/category/personal_upgrade',
            children: [],
          },
          {
            id: 'film_series',
            title: 'فیلم، سریال و استریم',
            desc: 'اشتراک‌های نتفلیکس، اسپاتیفای و یوتیوب پریمیوم',
            icon: <Radio className="h-4 w-4 text-brand" />,
            link: '/category/film_series',
            children: [
              {
                id: 'netflix',
                title: 'نتفلیکس پریمیوم (Netflix 4K)',
                desc: 'پخش فیلم و سریال بدون قطعی',
                link: '/category/netflix',
              },
              {
                id: 'spotify',
                title: 'اسپاتیفای پریمیوم (Spotify)',
                desc: 'موسیقی بدون محدودیت و تبلیغات',
                link: '/category/spotify',
              },
              {
                id: 'youtube',
                title: 'یوتیوب پریمیوم (YouTube Premium)',
                desc: 'حذف تبلیغات و دانلود ویدیوها',
                link: '/category/youtube',
              },
            ],
          },
        ]

  return (
    <div className="w-full relative z-40">
      {/* Top Single Banner: Holiday event if active, otherwise clean announcement */}
      {!isAdminPage &&
        (themeSettings?.event_active ? (
          <HolidayThemeBanner theme={themeSettings} />
        ) : !hideAnnouncementBar ? (
          <div className="border-b border-border/40 bg-popover/80 py-1.5 text-[11px] text-muted-foreground select-none">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center gap-1.5 text-foreground font-medium min-w-0">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-md lg:max-w-none">
                    {themeSettings?.header_announcement ||
                      'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است'}
                  </span>
                </span>
                <span className="hidden md:inline text-muted-foreground/70 shrink-0">
                  ارائه شماره‌های اختصاصی ۱۸۰ کشور با بازگشت وجه خودکار
                </span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://t.me/AnahixSupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
                >
                  <PhoneCall className="h-3 w-3 text-muted-foreground" />
                  <span>پشتیبانی تلگرام: @AnahixSupport</span>
                </a>
              </div>
            </div>
          </div>
        ) : null)}

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-popover/98 backdrop-blur-md transition-colors select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Mobile & Tablet menu trigger (Responsive: visible below xl to prevent text breaking) */}
            {!isAdminPage && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted duration-motion ease-motion transition-colors"
                aria-label="باز کردن منو"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            )}

            {onToggleMobileMenu && isAdminPage && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="باز کردن منوی مدیریت"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm shadow-blue-600/30 group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black tracking-tight text-foreground">
                    آناهیکس
                  </span>
                  <span className="font-latin text-xs font-bold text-blue-600 dark:text-blue-400">
                    ANAHIX
                  </span>
                  {isAdminPage && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold px-1.5 py-0.5 rounded-md mr-1">
                      پنل مدیریت
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-none">
                  {isAdminPage
                    ? 'داشبورد کنترل عملیات و سفارش‌ها'
                    : 'فروشگاه رسمی سرویس‌های بین‌المللی و شماره مجازی'}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links (Visible on xl screens to guarantee zero breaking) */}
            {!isAdminPage && (
              <nav className="hidden xl:flex items-center gap-1 text-xs font-bold whitespace-nowrap select-none">
                {/* Categories Dropdown */}
                <div className="relative" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryDropdownOpen(!categoryDropdownOpen)
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      categoryDropdownOpen
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>دسته‌بندی سرویس‌ها</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        categoryDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {categoryDropdownOpen && (
                    <div
                      onMouseLeave={() => setActiveCategoryHover(null)}
                      className="absolute right-0 mt-2 w-80 rounded-surface border border-border bg-popover p-2.5 shadow-2xl z-[100] animate-in fade-in zoom-in-95 space-y-1.5 opacity-100"
                    >
                      {categoriesToRender.map((item) => {
                        const hasChildren =
                          item.children && item.children.length > 0
                        const isHovered = activeCategoryHover === item.id

                        return (
                          <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() =>
                              hasChildren
                                ? setActiveCategoryHover(item.id)
                                : setActiveCategoryHover(null)
                            }
                          >
                            <Link
                              to={item.link}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="flex items-center justify-between p-2.5 rounded-control hover:bg-accent border border-transparent hover:border-border/80 transition-colors text-right group"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 rounded-control bg-secondary border border-border shrink-0 group-hover:scale-105 transition-transform">
                                  {item.icon}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-popover-foreground group-hover:text-foreground truncate">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                              {hasChildren && (
                                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-secondary-foreground shrink-0 mr-1.5 transition-transform" />
                              )}
                            </Link>

                            {/* Submenu Flyout to the Left */}
                            {hasChildren && isHovered && (
                              <div className="absolute right-full top-0 mr-2 w-72 rounded-surface border border-border bg-popover p-2 shadow-2xl z-[110] animate-in fade-in zoom-in-95 space-y-1">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-brand border-b border-border/80 mb-1">
                                  زیرمجموعه‌های {item.title}:
                                </div>
                                {item.children.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    to={sub.link}
                                    onClick={() => {
                                      setCategoryDropdownOpen(false)
                                      setActiveCategoryHover(null)
                                    }}
                                    className="block p-2 rounded-control hover:bg-accent text-right group/sub duration-motion ease-motion"
                                  >
                                    <div className="text-xs font-bold text-foreground group-hover/sub:text-foreground">
                                      {sub.title}
                                    </div>
                                    {sub.desc && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                        {sub.desc}
                                      </div>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Link
                  to="/virtual-numbers"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors relative ${
                    pathname === '/virtual-numbers'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Radio className="h-4 w-4" />
                  <span>شماره مجازی (SMS)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-600 text-white font-bold">
                    جدید
                  </span>
                </Link>

                <Link
                  to="/blog"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/blog')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>وبلاگ و آموزش‌ها</span>
                </Link>

                <Link
                  to="/help"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname.startsWith('/help')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>پایگاه دانش</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right Section: Auth, Wallet, Cart, Theme */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
            {/* Authenticated Customer & Wallet Profile */}
            {customer ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-control border border-border/60 bg-card hover:bg-muted/50 p-1 sm:px-2.5 text-xs transition-all shadow-control group cursor-pointer shrink-0"
                >
                  {/* Customer Avatar or Chip */}
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-control bg-secondary text-secondary-foreground font-bold shrink-0">
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={customer.full_name || 'کاربر'}
                        className="h-5 w-5 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-[10px] shrink-0">
                        {customer.full_name
                          ? customer.full_name.charAt(0)
                          : customer.phone.slice(-2)}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[85px] md:max-w-[110px] xl:max-w-[140px] truncate text-xs">
                      {customer.full_name ||
                        formatDisplayPhone(customer.phone, customer.email)}
                    </span>
                  </div>

                  {/* Divider - only on wide desktop (xl:) to avoid cramped overflow on laptops/tablets */}
                  <div className="hidden xl:block h-4 w-px bg-border/80 mx-0.5" />

                  {/* Integrated Wallet Balance - shown on xl: wide screens only */}
                  <div className="hidden xl:flex items-center gap-1.5 text-right font-medium shrink-0">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-bold text-foreground font-latin">
                      {toPersianDigits(effectiveBalance.toLocaleString())}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      تومان
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-3 w-3 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      userDropdownOpen ? 'rotate-180 text-foreground' : ''
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-surface border border-border bg-popover text-popover-foreground p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60 text-right space-y-0.5">
                      <p className="text-xs font-black text-foreground">
                        {customer.full_name || 'کاربر گرامی'}
                      </p>
                      <p
                        className="text-[11px] text-muted-foreground font-latin truncate"
                        dir="ltr"
                      >
                        {customer.email || formatDisplayPhone(customer.phone)}
                      </p>
                      <div className="mt-2 pt-2 border-t border-dashed border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          موجودی کیف پول:
                        </span>
                        <span className="font-bold text-amber-500 font-latin">
                          {toPersianDigits(effectiveBalance.toLocaleString())}{' '}
                          تومان
                        </span>
                      </div>
                    </div>

                    <div className="p-1 space-y-1">
                      <Link
                        to="/profile?tab=loyalty"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <Crown className="h-3.5 w-3.5" />
                          <span>باشگاه مشتریان و VIP</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-bold">
                          {customer.tier === 'gold'
                            ? 'طلایی 👑'
                            : customer.tier === 'silver'
                              ? 'نقره‌ای ⭐'
                              : customer.tier === 'diamond'
                                ? 'الماسی 💎'
                                : 'عضو VIP'}
                        </span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-control text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <User className="h-3.5 w-3.5 text-brand" />
                        <span>حساب کاربری و پروفایل</span>
                      </Link>

                      <Link
                        to="/track"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-control text-xs text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                        <span>پیگیری سفارش‌های من</span>
                      </Link>

                      {/* Small Mobile ONLY: Notifications & Theme Switcher (< 425px) */}
                      <div className="min-[425px]:hidden pt-1 mt-1 border-t border-border/40 space-y-1">
                        <Link
                          to="/profile?tab=notifications"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-bold text-foreground hover:bg-muted/80 transition-colors text-right"
                        >
                          <div className="flex items-center gap-2">
                            <Bell className="h-3.5 w-3.5 text-brand" />
                            <span>اعلان‌ها و پیام‌ها</span>
                          </div>
                          {unreadNotifCount > 0 ? (
                            <span className="px-1.5 py-0.2 rounded-control bg-brand text-brand-foreground text-[10px] font-black animate-pulse font-latin">
                              {toPersianDigits(unreadNotifCount)} جدید
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              خوانده‌شده
                            </span>
                          )}
                        </Link>

                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-bold text-foreground">
                          <span className="text-muted-foreground text-[11px]">
                            حالت شب / روز:
                          </span>
                          <ThemeToggle className="h-7 w-7" />
                        </div>
                      </div>

                      {/* Admin Portal Link - STRICTLY ONLY for Admin from DB (Never shown to normal users) */}
                      {(customer.is_admin || api.getAdminUser()) && (
                        <div className="pt-1 mt-1 border-t border-border/40">
                          {isAdminPage ? (
                            <Link
                              to="/"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-control text-xs font-semibold text-brand hover:bg-brand/10 transition-colors text-right"
                            >
                              <Store className="h-3.5 w-3.5" />
                              <span>بازگشت به فروشگاه</span>
                            </Link>
                          ) : (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-control text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors text-right"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>ورود به پنل مدیریت</span>
                            </Link>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-right cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="header-login-button"
                onClick={() => {
                  setAuthModalMode('login')
                  setIsAuthOpen(true)
                }}
                className="h-8 sm:h-9 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>ورود</span>
              </button>
            )}

            {/* Notifications Button & Dropdown Menu (Hidden on < 425px to prevent cramping, shown inside user dropdown) */}
            {!isAdminPage && (
              <div className="relative max-[424px]:hidden" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!customer) {
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    } else {
                      setNotifDropdownOpen((prev) => !prev)
                    }
                  }}
                  className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground transition shadow-control flex items-center justify-center group duration-motion ease-motion active:scale-[0.98] cursor-pointer shrink-0"
                  title="اعلان‌ها و اطلاعیه‌ها"
                  aria-label="اعلان‌ها و اطلاعیه‌ها"
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-control bg-brand text-brand-foreground text-[10px] font-black shadow-control animate-pulse">
                      {toPersianDigits(unreadNotifCount)}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Modal / Flyout */}
                {notifDropdownOpen && customer && (
                  <div
                    dir="rtl"
                    className="absolute left-0 mt-2 w-80 sm:w-96 rounded-surface border border-border bg-popover text-popover-foreground shadow-2xl z-[100] p-3 space-y-2 animate-in fade-in zoom-in-95 duration-motion ease-motion"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/60 px-1">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-brand" />
                        <span className="text-xs font-black text-foreground">
                          اعلان‌ها و پیام‌ها
                        </span>
                        {unreadNotifCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-brand/10 text-brand font-bold border border-brand/20">
                            {toPersianDigits(unreadNotifCount)} جدید
                          </span>
                        )}
                      </div>

                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            await api.markAllNotificationsAsRead()
                            setUnreadNotifCount(0)
                            setInAppNotifs((prev) =>
                              prev.map((n) => ({ ...n, is_read: true })),
                            )
                          }}
                          className="text-[10px] text-brand hover:underline cursor-pointer font-bold"
                        >
                          خوانده‌شدن همه
                        </button>
                      )}
                    </div>

                    {/* Notification Items List - Only display unread, clean empty state when read */}
                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                      {inAppNotifs.filter((n) => !n.is_read).length === 0 ? (
                        <div className="py-7 text-center space-y-2 select-none">
                          <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center mx-auto shadow-control">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <p className="text-xs font-black text-foreground">
                            تمامی اعلان‌ها خوانده شده‌اند
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            در حال حاضر پیام یا اطلاع‌رسانی جدیدی وجود ندارد.
                          </p>
                        </div>
                      ) : (
                        inAppNotifs
                          .filter((n) => !n.is_read)
                          .slice(0, 4)
                          .map((item) => (
                            <Link
                              key={item.id}
                              to="/profile?tab=notifications"
                              onClick={async () => {
                                setNotifDropdownOpen(false)
                                if (!item.is_read) {
                                  await api.markNotificationAsRead(item.id)
                                  setUnreadNotifCount((prev) =>
                                    Math.max(0, prev - 1),
                                  )
                                  setInAppNotifs((prev) =>
                                    prev.map((n) =>
                                      n.id === item.id
                                        ? { ...n, is_read: true }
                                        : n,
                                    ),
                                  )
                                }
                              }}
                              className={`block p-2.5 rounded-control transition-all border duration-motion ease-motion text-right group ${
                                !item.is_read
                                  ? 'bg-secondary border-border/80'
                                  : 'bg-muted/10 border-transparent hover:bg-muted/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {!item.is_read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse" />
                                  )}
                                  <h5 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {item.title}
                                  </h5>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0 font-latin">
                                  {new Date(item.created_at).toLocaleDateString(
                                    'fa-IR',
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1 truncate leading-relaxed">
                                {item.message}
                              </p>
                            </Link>
                          ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-border/60 text-center">
                      <Link
                        to="/profile?tab=notifications"
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-black text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>مشاهده همه اعلان‌ها در پروفایل</span>
                        <span>←</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart Button */}
            {!isAdminPage && (
              <button
                type="button"
                onClick={onOpenCart}
                id="header-cart-button"
                className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground transition shadow-control flex items-center justify-center group duration-motion ease-motion active:scale-[0.98] cursor-pointer shrink-0"
                title="سبد خرید"
                aria-label="سبد خرید"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -left-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-control bg-primary text-primary-foreground text-[10px] font-black shadow-control animate-pulse">
                    {toPersianDigits(itemCount)}
                  </span>
                )}
              </button>
            )}

            {/* Dark / Light Mode Toggle (Header & Admin Panel) - (Hidden on < 425px, shown inside user dropdown) */}
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 max-[424px]:hidden" />
          </div>
        </div>

        {/* Mobile & Tablet Full Drawer Menu (Portal to document.body with z-[99999] so it never renders under banners) */}
        {mobileMenuOpen &&
          !isAdminPage &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex" dir="rtl">
              {/* Fullscreen Backdrop */}
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Drawer Content Panel */}
              <div className="relative w-80 max-w-[85vw] h-full bg-popover border-l border-border shadow-2xl z-10 flex flex-col p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200 text-popover-foreground">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-primary-foreground font-black text-sm shadow-control">
                      A
                    </div>
                    <span className="font-black text-popover-foreground text-sm">
                      منوی فروشگاه آناهیکس
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    aria-label="بستن منو"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Auth Action */}
                {!customer ? (
                  <div className="p-3.5 rounded-control bg-secondary/80 border border-border space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthModalMode('login')
                        setIsAuthOpen(true)
                      }}
                      className="w-full py-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center justify-center gap-2 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>ورود به حساب کاربری</span>
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      ورود سریع با شماره موبایل، پیامک OTP یا گوگل
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-control bg-secondary border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-control bg-accent text-brand">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-popover-foreground">
                          {customer.full_name ||
                            formatDisplayPhone(customer.phone, customer.email)}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-latin">
                          موجودی:{' '}
                          {toPersianDigits(effectiveBalance.toLocaleString())}{' '}
                          تومان
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-black text-brand hover:underline"
                    >
                      پروفایل ←
                    </Link>
                  </div>
                )}

                {/* Dynamic Categories Group with Submenu Accordion */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground px-2 block mb-1">
                    دسته‌بندی‌های سرویس‌ها
                  </span>
                  {categoriesToRender.map((item) => {
                    const hasChildren =
                      item.children && item.children.length > 0
                    const isExpanded = expandedMobileCategory === item.id

                    return (
                      <div key={`drawer-cat-${item.id}`} className="space-y-1">
                        <div className="flex items-center justify-between rounded-control hover:bg-accent border border-transparent hover:border-border transition-colors">
                          <Link
                            to={item.link}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 p-2.5 flex-1 min-w-0 text-xs font-bold text-foreground hover:text-foreground"
                          >
                            <div className="p-1.5 rounded-control bg-secondary border border-border shrink-0">
                              {item.icon}
                            </div>
                            <span className="truncate">{item.title}</span>
                          </Link>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedMobileCategory(
                                  isExpanded ? null : item.id,
                                )
                              }}
                              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              aria-label="نمایش زیردسته‌ها"
                            >
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-brand' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Subcategories Accordion Content */}
                        {hasChildren && isExpanded && (
                          <div className="mr-8 pr-2.5 border-r border-border/80 space-y-1 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            {item.children.map((sub) => (
                              <Link
                                key={`drawer-sub-${sub.id}`}
                                to={sub.link}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center justify-between p-2 rounded-control text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent duration-motion ease-motion"
                              >
                                <span>{sub.title}</span>
                                <ChevronLeft className="h-3 w-3 opacity-40" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Main Nav Links */}
                <div className="border-t border-border pt-3 space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground px-2 block mb-1">
                    دسترسی سریع
                  </span>
                  <Link
                    to="/virtual-numbers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-control text-xs font-bold text-foreground hover:bg-accent hover:text-foreground duration-motion ease-motion"
                  >
                    <div className="flex items-center gap-2.5">
                      <Radio className="h-4 w-4 text-brand" />
                      <span>شماره مجازی (SMS)</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-control text-[9px] bg-brand/20 text-brand font-black border border-brand/30">
                      جدید
                    </span>
                  </Link>
                  <Link
                    to="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-control text-xs font-bold text-foreground hover:bg-accent hover:text-foreground duration-motion ease-motion"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>وبلاگ و آموزش‌ها</span>
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-control text-xs font-bold text-foreground hover:bg-accent hover:text-foreground duration-motion ease-motion"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>پایگاه دانش و راهنما</span>
                  </Link>
                  <Link
                    to="/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-control text-xs font-bold text-foreground hover:bg-accent hover:text-foreground duration-motion ease-motion"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>پیگیری سفارش</span>
                    </div>
                    {activeOrdersCount > 0 && (
                      <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-control bg-primary text-primary-foreground text-[10px] font-black">
                        {toPersianDigits(activeOrdersCount)}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </header>

      {/* Customer Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(profile) => {
          setCustomer(profile)
        }}
      />
    </div>
  )
}
