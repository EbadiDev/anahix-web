import {
  BookOpen,
  Bot,
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
  UserPlus,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../lib/cartStore'
import { api } from '../services/api'
import type { ContentCategory, CustomerProfile, ThemeSettings } from '../types'
import { AuthModal } from './AuthModal'
import { GithubIcon, GoogleIcon } from './SocialIcons'
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

  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoryMenuRef = useRef<HTMLDivElement>(null)

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
          <div className="border-b border-border/40 bg-zinc-950/80 py-1.5 text-[11px] text-muted-foreground select-none">
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
                  className="flex items-center gap-1 hover:text-white transition-colors font-medium"
                >
                  <PhoneCall className="h-3 w-3 text-muted-foreground" />
                  <span>پشتیبانی تلگرام: @AnahixSupport</span>
                </a>
              </div>
            </div>
          </div>
        ) : null)}

      {/* Main Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-zinc-950/98 backdrop-blur-md transition-colors select-none">
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
                      className="absolute right-0 mt-2 w-80 rounded-surface border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl z-[100] animate-in fade-in zoom-in-95 space-y-1.5 opacity-100"
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
                              hasChildren && setActiveCategoryHover(item.id)
                            }
                          >
                            <Link
                              to={item.link}
                              onClick={() => setCategoryDropdownOpen(false)}
                              className="flex items-center justify-between p-2.5 rounded-control hover:bg-zinc-900 border border-transparent hover:border-zinc-800/80 transition-colors text-right group"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="p-2 rounded-control bg-zinc-900 border border-zinc-800 shrink-0 group-hover:scale-105 transition-transform">
                                  {item.icon}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">
                                    {item.title}
                                  </h4>
                                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed truncate">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                              {hasChildren && (
                                <ChevronLeft className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0 mr-1.5 transition-transform" />
                              )}
                            </Link>

                            {/* Submenu Flyout to the Left */}
                            {hasChildren && isHovered && (
                              <div className="absolute right-full top-0 mr-2 w-72 rounded-surface border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-[110] animate-in fade-in zoom-in-95 space-y-1">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-brand border-b border-zinc-800/80 mb-1">
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
                                    className="block p-2 rounded-control hover:bg-zinc-900 text-right group/sub duration-motion ease-motion"
                                  >
                                    <div className="text-xs font-bold text-zinc-200 group-hover/sub:text-white">
                                      {sub.title}
                                    </div>
                                    {sub.desc && (
                                      <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
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

                <Link
                  to="/track"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                    pathname === '/track'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>پیگیری سفارش</span>
                  {activeOrdersCount > 0 && (
                    <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {toPersianDigits(activeOrdersCount)}
                    </span>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Right Section: Auth, Wallet, Cart, Theme */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
            {/* Authenticated Customer & Wallet Profile */}
            {customer ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-control border border-border/60 bg-card hover:bg-muted/50 p-1 sm:pl-2.5 text-xs transition-all shadow-control group cursor-pointer"
                >
                  {/* Customer Avatar or Chip */}
                  <div className="flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-control bg-secondary text-secondary-foreground font-bold">
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={customer.full_name || 'کاربر'}
                        className="h-5 w-5 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-[10px]">
                        {customer.full_name
                          ? customer.full_name.charAt(0)
                          : customer.phone.slice(-2)}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[110px] sm:max-w-[140px] truncate text-xs">
                      {customer.full_name || customer.phone}
                    </span>
                  </div>

                  {/* Divider - hidden on small mobile to avoid overflow */}
                  <div className="hidden sm:block h-4 w-px bg-border/80 mx-0.5" />

                  {/* Integrated Wallet Balance - shown on sm screens */}
                  <div className="hidden sm:flex items-center gap-1.5 text-right font-medium">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs font-bold text-foreground font-latin">
                      {toPersianDigits(effectiveBalance.toLocaleString())}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      تومان
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-foreground' : ''
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60 text-right">
                      <p className="text-xs font-bold text-foreground">
                        {customer.full_name || 'کاربر آناهیکس'}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {customer.phone}
                      </p>
                      <div className="mt-2 pt-2 border-t border-dashed border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          موجودی کیف پول:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {toPersianDigits(effectiveBalance.toLocaleString())}{' '}
                          تومان
                        </span>
                      </div>
                    </div>

                    <div className="p-1 space-y-1">
                      <Link
                        to="/profile?tab=loyalty"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right border border-amber-500/20"
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
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <User className="h-3.5 w-3.5 text-blue-600" />
                        <span>حساب کاربری و پروفایل</span>
                      </Link>

                      <Link
                        to="/track"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>پیگیری سفارش‌های من</span>
                      </Link>

                      {(customer.is_admin || api.getAdminUser()) &&
                        (isAdminPage ? (
                          <Link
                            to="/"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-right"
                          >
                            <Store className="h-3.5 w-3.5" />
                            <span>بازگشت به فروشگاه</span>
                          </Link>
                        ) : (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-right"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>ورود به پنل مدیریت</span>
                          </Link>
                        ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-right"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* One-click social quick login triggers */}
                <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-border/80">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    }}
                    className="p-2 rounded-xl border border-border hover:bg-muted/80 text-foreground transition-all shadow-xs"
                    title="ورود سریع با Google"
                  >
                    <GoogleIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    }}
                    className="p-2 rounded-xl border border-border hover:bg-muted/80 text-foreground transition-all shadow-xs"
                    title="ورود سریع با GitHub"
                  >
                    <GithubIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="button"
                  id="header-login-button"
                  onClick={() => {
                    setAuthModalMode('login')
                    setIsAuthOpen(true)
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground px-3 py-1.5 text-xs font-bold transition-all shadow-xs hover:border-blue-500/40"
                >
                  <LogIn className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>ورود</span>
                </button>

                {/* Register Button */}
                <button
                  type="button"
                  id="header-register-button"
                  onClick={() => {
                    setAuthModalMode('register')
                    setIsAuthOpen(true)
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>ثبت‌نام</span>
                </button>
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

            {/* Dark / Light Mode Toggle - Only in Header */}
            {!isAdminPage && (
              <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
            )}
          </div>
        </div>

        {/* Mobile & Tablet Full Drawer Menu (Responsive & Smooth Overlay) */}
        {mobileMenuOpen && !isAdminPage && (
          <div className="fixed inset-0 z-[100] xl:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content Panel */}
            <div
              dir="rtl"
              className="relative w-80 max-w-[85vw] h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl z-10 flex flex-col p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200 text-zinc-100"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-primary-foreground font-black text-sm shadow-control">
                    A
                  </div>
                  <span className="font-black text-white text-sm">
                    منوی فروشگاه آناهیکس
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-control text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  aria-label="بستن منو"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Auth Actions */}
              {!customer ? (
                <div className="p-3.5 rounded-control bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthModalMode('login')
                        setIsAuthOpen(true)
                      }}
                      className="flex-1 py-2 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center justify-center gap-1.5 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>ورود به سیستم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthModalMode('register')
                        setIsAuthOpen(true)
                      }}
                      className="flex-1 py-2 rounded-control border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>ثبت‌نام</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthModalMode('login')
                        setIsAuthOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-control border border-zinc-800 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 cursor-pointer"
                    >
                      <GoogleIcon className="h-3.5 w-3.5" />
                      <span>گوگل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthModalMode('login')
                        setIsAuthOpen(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-control border border-zinc-800 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 cursor-pointer"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span>گیت‌هاب</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-control bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-control bg-zinc-800 text-brand">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {customer.full_name || customer.phone}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-latin">
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
                <span className="text-[11px] font-bold text-zinc-400 px-2 block mb-1">
                  دسته‌بندی‌های سرویس‌ها
                </span>
                {categoriesToRender.map((item) => {
                  const hasChildren = item.children && item.children.length > 0
                  const isExpanded = expandedMobileCategory === item.id

                  return (
                    <div key={`drawer-cat-${item.id}`} className="space-y-1">
                      <div className="flex items-center justify-between rounded-control hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors">
                        <Link
                          to={item.link}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 p-2.5 flex-1 min-w-0 text-xs font-bold text-zinc-200 hover:text-white"
                        >
                          <div className="p-1.5 rounded-control bg-zinc-900 border border-zinc-800 shrink-0">
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
                            className="p-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                        <div className="mr-8 pr-2.5 border-r border-zinc-800/80 space-y-1 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                          {item.children.map((sub) => (
                            <Link
                              key={`drawer-sub-${sub.id}`}
                              to={sub.link}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between p-2 rounded-control text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 duration-motion ease-motion"
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
              <div className="border-t border-zinc-800 pt-3 space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 px-2 block mb-1">
                  دسترسی سریع
                </span>
                <Link
                  to="/virtual-numbers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-control text-xs font-bold text-zinc-200 hover:bg-zinc-900 hover:text-white duration-motion ease-motion"
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
                  className="flex items-center gap-2.5 p-2.5 rounded-control text-xs font-bold text-zinc-200 hover:bg-zinc-900 hover:text-white duration-motion ease-motion"
                >
                  <BookOpen className="h-4 w-4 text-zinc-400" />
                  <span>وبلاگ و آموزش‌ها</span>
                </Link>
                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-control text-xs font-bold text-zinc-200 hover:bg-zinc-900 hover:text-white duration-motion ease-motion"
                >
                  <HelpCircle className="h-4 w-4 text-zinc-400" />
                  <span>پایگاه دانش و راهنما</span>
                </Link>
                <Link
                  to="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-control text-xs font-bold text-zinc-200 hover:bg-zinc-900 hover:text-white duration-motion ease-motion"
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
          </div>
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
