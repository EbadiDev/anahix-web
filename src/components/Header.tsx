import {
  BookOpen,
  Bot,
  ChevronDown,
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
import type { CustomerProfile, ThemeSettings } from '../types'
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
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>(
    'login',
  )
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
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

  const categoriesList = [
    {
      id: 'ai_chat',
      title: 'هوش مصنوعی و چت‌بات',
      desc: 'ChatGPT Plus، Claude 3.7 Sonnet، Gemini',
      icon: <Bot className="h-4 w-4 text-emerald-500" />,
      link: '/?category=ai_chat',
    },
    {
      id: 'coding_ai',
      title: 'دستیارهای کدنویسی',
      desc: 'Cursor AI، GitHub Copilot، Replit Pro',
      icon: <Code2 className="h-4 w-4 text-purple-500" />,
      link: '/?category=coding_ai',
    },
    {
      id: 'personal_upgrade',
      title: 'ارتقای اکانت شخصی',
      desc: 'فعال‌سازی بدون پسورد و با جیمیل خودتان',
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      link: '/?category=personal_upgrade',
    },
    {
      id: 'vnums',
      title: 'شماره مجازی ۱۸۰ کشور',
      desc: 'دریافت فوری پیامک تایید تلگرام، گوگل و اوپن‌ای‌آی',
      icon: <Radio className="h-4 w-4 text-cyan-500" />,
      link: '/virtual-numbers',
    },
  ]

  return (
    <div className="w-full relative z-40">
      {/* Holiday Event Dynamic Banner */}
      {!isAdminPage && <HolidayThemeBanner theme={themeSettings} />}

      {/* Top Announcement Bar */}
      {!hideAnnouncementBar && !isAdminPage && (
        <div className="border-b border-border/60 bg-muted/40 py-1.5 text-[11px] text-muted-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {themeSettings?.header_announcement ||
                    'تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی ۰ ثانیه‌ای برقرار است'}
                </span>
              </span>
              <span className="hidden md:inline text-muted-foreground/80">
                ارائه شماره‌های اختصاصی ۱۸۰ کشور با بازگشت وجه خودکار
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://t.me/AnahixSupport"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium"
              >
                <PhoneCall className="h-3 w-3 text-blue-600" />
                <span>پشتیبانی تلگرام: @AnahixSupport</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Mobile menu trigger */}
            {!isAdminPage && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
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

            {/* Desktop Navigation Links */}
            {!isAdminPage && (
              <nav className="hidden md:flex items-center gap-1 text-xs sm:text-sm font-medium">
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
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 space-y-1">
                      {categoriesList.map((item) => (
                        <Link
                          key={item.id}
                          to={item.link}
                          onClick={() => setCategoryDropdownOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-right"
                        >
                          <div className="p-2 rounded-xl bg-muted/60 border border-border/80 shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-foreground">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Authenticated Customer & Wallet Profile */}
            {customer ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card hover:bg-muted/50 p-1 pl-2.5 text-xs transition-all shadow-sm group"
                >
                  {/* Customer Avatar or Chip */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                    {customer.avatar_url ? (
                      <img
                        src={customer.avatar_url}
                        alt={customer.full_name || 'کاربر'}
                        className="h-5 w-5 rounded-full object-cover border border-blue-500/30"
                      />
                    ) : (
                      <User className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="max-w-[110px] sm:max-w-[140px] truncate text-xs">
                      {customer.full_name || customer.phone}
                    </span>
                  </div>

                  {/* Divider - hidden on small mobile to avoid overflow */}
                  <div className="hidden sm:block h-4 w-px bg-border/80 mx-0.5" />

                  {/* Integrated Wallet Balance - shown on sm screens, inside dropdown for mobile */}
                  <div className="hidden sm:flex items-center gap-1.5 text-right font-medium">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs font-bold text-foreground">
                      {toPersianDigits(effectiveBalance.toLocaleString())}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      تومان
                    </span>
                  </div>

                  <ChevronDown
                    className={`h-3 w-3 mr-0.5 text-muted-foreground transition-transform duration-200 ${
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
                className="relative p-2 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground transition shadow-xs flex items-center justify-center group"
                title="سبد خرید"
                aria-label="سبد خرید"
              >
                <ShoppingCart className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs animate-pulse">
                    {toPersianDigits(itemCount)}
                  </span>
                )}
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && !isAdminPage && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-top-4">
            {/* Mobile Auth Actions (Clear & Prominent) */}
            {!customer ? (
              <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogIn className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>ورود به سیستم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setAuthModalMode('register')
                      setIsAuthOpen(true)
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>ثبت‌نام جدید</span>
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl border border-border/80 bg-card text-[11px] font-bold text-foreground"
                  >
                    <GoogleIcon className="h-3.5 w-3.5" />
                    <span>ورود با Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setAuthModalMode('login')
                      setIsAuthOpen(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl border border-border/80 bg-card text-[11px] font-bold text-foreground"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                    <span>ورود با GitHub</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {customer.full_name || customer.phone}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      موجودی:{' '}
                      {toPersianDigits(effectiveBalance.toLocaleString())} تومان
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  پروفایل ←
                </Link>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground px-2">
                دسته‌بندی‌های سریع
              </span>
              {categoriesList.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/70 text-xs font-bold text-foreground"
                >
                  <div className="p-1.5 rounded-lg bg-muted border border-border">
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-border/60 pt-2 space-y-1">
              <Link
                to="/virtual-numbers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted"
              >
                <Radio className="h-4 w-4 text-cyan-500" />
                <span>شماره مجازی (SMS)</span>
              </Link>
              <Link
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted"
              >
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>وبلاگ و آموزش‌ها</span>
              </Link>
              <Link
                to="/help"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4 text-purple-500" />
                <span>پایگاه دانش</span>
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>پیگیری سفارش</span>
              </Link>
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
