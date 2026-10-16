import {
  BookOpen,
  ChevronDown,
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
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../lib/cartStore'
import { api } from '../services/api'
import type { CustomerProfile } from '../types'
import { AuthModal } from './AuthModal'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  balance?: number
  activeOrdersCount?: number
  hideNavLinks?: boolean
  hideAnnouncementBar?: boolean
  onToggleMobileMenu?: () => void
  onOpenCart?: () => void
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
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getCustomerProfile().then((profile: CustomerProfile | null) => {
      if (profile) setCustomer(profile)
    })
  }, [])

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false)
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

  return (
    <div className="w-full">
      {/* Top Announcement Bar */}
      {!hideAnnouncementBar && !isAdminPage && (
        <div className="border-b border-border/60 bg-muted/40 py-1.5 text-[11px] text-muted-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                تمامی سرویس‌ها و شماره‌های مجازی فعال و تحویل آنی برقرار است
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
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
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
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="باز کردن منوی مدیریت"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-sm shadow-blue-600/30">
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

            {/* Navigation Links */}
            {!isAdminPage && (
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link
                  to="/"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>اشتراک‌ها و پلن‌ها</span>
                </Link>

                <Link
                  to="/virtual-numbers"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors relative ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    pathname.startsWith('/help')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>پایگاه دانش و ارورها</span>
                </Link>

                <Link
                  to="/track"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/track'
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>پیگیری سفارش</span>
                  {activeOrdersCount > 0 && (
                    <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {activeOrdersCount}
                    </span>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Right Section: Customer Auth, Wallet, Admin Portal Link & ThemeToggle */}
          <div className="flex items-center gap-2.5">
            {/* Customer Authentication & Unified Wallet Badge */}
            {customer ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted/50 p-1 pl-2.5 text-xs transition-all shadow-sm group"
                >
                  {/* Customer Full Name Chip */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span
                      className={`max-w-[130px] sm:max-w-[160px] truncate text-xs ${
                        !customer.full_name ? 'font-mono' : ''
                      }`}
                    >
                      {customer.full_name || customer.phone}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-4 w-px bg-border/80 mx-0.5" />

                  {/* Integrated Wallet Balance */}
                  <div className="flex items-center gap-1.5 text-right font-medium">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs font-bold text-foreground">
                      {effectiveBalance.toLocaleString('fa-IR')}
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
                  <div className="absolute left-0 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
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
                          {effectiveBalance.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <Link
                        to="/profile?tab=loyalty"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right border border-amber-500/20"
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
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <User className="h-3.5 w-3.5 text-blue-600" />
                        <span>حساب کاربری و پروفایل</span>
                      </Link>

                      <Link
                        to="/track"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/80 transition-colors text-right"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>پیگیری سفارش‌های من</span>
                      </Link>

                      {(customer.is_admin || api.getAdminUser()) &&
                        (isAdminPage ? (
                          <Link
                            to="/"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-right"
                          >
                            <Store className="h-3.5 w-3.5" />
                            <span>بازگشت به فروشگاه</span>
                          </Link>
                        ) : (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-right"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>ورود به پنل مدیریت</span>
                          </Link>
                        ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-right"
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
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shadow-blue-600/20 transition-all active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>ورود / ثبت‌نام</span>
              </button>
            )}

            {/* Shopping Cart Button (Digital Products) */}
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
                  <span className="absolute -top-1.5 -left-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs animate-in zoom-in">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Customer Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(profile) => {
          setCustomer(profile)
        }}
      />
    </div>
  )
}
