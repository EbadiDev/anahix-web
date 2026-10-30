import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Alert } from '../../components/vibefarsi/Alert'
import { BorderBeam } from '../../components/vibefarsi/BorderBeam'
import { GridPattern } from '../../components/vibefarsi/GridPattern'
import { useNotification } from '../../components/vibefarsi/NotificationContext'
import { PasswordInput } from '../../components/vibefarsi/PasswordInput'
import { api, apiService } from '../../services/api'
import type { ThemeSettings } from '../../types'
import { cleanMediaUrl, getSiteBrandName } from '../../utils/brand'

const toFaDigits = (val: number | string): string => {
  const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(val).replace(/[0-9]/g, (w) => faDigits[+w] || w)
}

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [hasActiveSession, setHasActiveSession] = useState(false)

  // Track failed attempts and lockout/ban state
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return Number(sessionStorage.getItem('admin_login_fails') || '0')
    } catch {
      return 0
    }
  })

  const [isBanned, setIsBanned] = useState<boolean>(false)

  // Clear ban state if username changes
  const handleUsernameChange = (val: string) => {
    setUsername(val)
    if (error) setError(null)
    setIsBanned(false)
  }

  // Fetch theme settings and check IP ban status
  useEffect(() => {
    // 1. Check IP status immediately on load
    apiService.checkAdminLoginIP().then((ipStatus) => {
      if (ipStatus.is_banned) {
        if (ipStatus.kick_out) {
          // Non-site user who was banned: kick out to storefront immediately
          notifyError(
            'دسترسی غیرمجاز',
            'شما اجازه دسترسی به این صفحه را ندارید.',
          )
          navigate('/', { replace: true })
          return
        }
        // Registered user who was banned: show disabled ban status
        setIsBanned(true)
        const reason = ipStatus.reason || 'ورود غیرمجاز'
        setError(`حساب کاربری شما مسدود شده است. علت: ${reason}`)
      }
    })

    // 2. Check active admin session
    const existingToken = apiService.getAdminToken()
    if (existingToken) {
      setHasActiveSession(true)
    }

    // 3. Theme settings
    api
      .getThemeSettings()
      .then((settings) => {
        if (settings) setThemeSettings(settings)
      })
      .catch(() => {})

    const handleThemeSync = (e: any) => {
      if (e?.detail) {
        setThemeSettings((prev) => (prev ? { ...prev, ...e.detail } : e.detail))
      }
    }
    window.addEventListener('anahix:theme:updated', handleThemeSync)
    return () =>
      window.removeEventListener('anahix:theme:updated', handleThemeSync)
  }, [navigate, notifyError])

  const siteName = themeSettings?.site_name_fa || getSiteBrandName('آناهیکس')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isBanned) {
      const banMsg =
        'حساب کاربری شما به علت بیش از ۳ بار تلاش ناموفق غیرفعال و مسدود شد. علت: ورود غیرمجاز'
      setError(banMsg)
      return
    }

    const trimmedUser = username.trim()
    if (!trimmedUser || !password) {
      const msg = 'لطفاً نام کاربری و کلمه عبور را وارد کنید'
      setError(msg)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await apiService.adminLogin(trimmedUser, password)

      // Clear any failed attempts upon successful login
      setSuccess(true)
      setFailedAttempts(0)
      setIsBanned(false)
      try {
        sessionStorage.removeItem('admin_login_fails')
      } catch {}

      notifySuccess(
        'ورود موفقیت‌آمیز بود',
        'در حال انتقال امن به میز کار مدیریت...',
      )
      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 600)
    } catch (err: any) {
      // If user is not a user of the site at all, kick them out of this page
      const isKickOut = err?.data?.kick_out === true
      if (isKickOut) {
        notifyError(
          'دسترسی غیرمجاز',
          'شما کاربر این سامانه نیستید و دسترسی شما به این صفحه مسدود شد.',
        )
        navigate('/', { replace: true })
        return
      }

      const nextFails = failedAttempts + 1
      setFailedAttempts(nextFails)
      try {
        sessionStorage.setItem('admin_login_fails', String(nextFails))
      } catch {}

      const rawMsg =
        err?.message || 'نام کاربری یا کلمه عبور وارد شده نادرست است'
      const localizedMsg = toFaDigits(rawMsg)

      // Check if banned by threshold or server response
      const isServerBanned =
        err?.data?.is_banned === true ||
        rawMsg.includes('علت: ورود غیرمجاز') ||
        rawMsg.includes('مسدود شد') ||
        rawMsg.includes('مسدود شده است') ||
        nextFails >= 3

      if (isServerBanned) {
        setIsBanned(true)
        const banMsg =
          'حساب کاربری شما به علت بیش از ۳ بار تلاش ناموفق غیرفعال و مسدود شد. علت: ورود غیرمجاز'
        setError(banMsg)
      } else {
        // Display error in the card's Alert ONLY without duplicate toast
        setError(localizedMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-200 overflow-x-hidden selection:bg-brand/20 selection:text-foreground"
    >
      {/* Background Ambience: Graphite Grid and Ambient Light Glows */}
      <GridPattern className="opacity-60 dark:opacity-40" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      {/* Top action bar: Only ThemeToggle */}
      <header className="w-full max-w-md mx-auto flex items-center justify-end z-10 mb-4 sm:mb-6">
        <ThemeToggle />
      </header>

      {/* Main Login Card - Graphite Minimal Technical Surface */}
      <main className="w-full max-w-md z-10">
        <div className="relative w-full rounded-surface border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-overlay text-card-foreground overflow-hidden">
          {/* Subtle animated border beam for high-tech aesthetic */}
          <BorderBeam
            size={220}
            duration={14}
            delay={0}
            colorFrom="#3b82f6"
            colorTo="#f59e0b"
            borderWidth={1.5}
          />

          {/* Ambient card glows */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />

          {/* Header Branding */}
          <div className="text-center mb-6 relative">
            {themeSettings?.site_logo_url ? (
              <div className="mb-3.5 flex justify-center">
                <div className="p-2 rounded-2xl bg-secondary/80 border border-border/70 shadow-control inline-flex items-center justify-center">
                  <img
                    src={cleanMediaUrl(themeSettings.site_logo_url)}
                    alt={siteName}
                    className="h-10 w-auto max-w-[150px] object-contain rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-secondary text-brand border border-border/70 shadow-control mb-3 relative group">
                <ShieldCheck className="w-6 h-6 text-brand transition-transform group-hover:scale-110" />
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-card" />
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/60 text-[10px] font-bold text-muted-foreground mb-2">
              <Sparkles className="w-3 h-3 text-brand" />
              <span>میز کار اختصاصی اپراتور و مدیریت</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              ورود به پنل مدیریت {siteName}
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              احراز هویت متمرکز مدیران کل، کارشناسان پشتیبانی و اپراتورها
            </p>
          </div>

          {/* Active Session Notification & Direct Access */}
          {hasActiveSession && !success && (
            <div className="mb-5 p-3.5 rounded-xl border border-brand/40 bg-brand/10 text-foreground space-y-2.5 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  نشست فعال مدیریت یافت شد
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                حساب مدیریت شما در این مرورگر فعال است. می‌توانید مستقیم وارد میز
                کار شوید یا با حساب دیگری لاگین کنید.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex-1 h-9.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود مستقیم به داشبورد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    apiService.clearAdminToken()
                    setHasActiveSession(false)
                    notifySuccess('خروج انجام شد', 'نشست قبلی لغو گردید.')
                  }}
                  className="h-9.5 px-3 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold duration-motion ease-motion active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج</span>
                </button>
              </div>
            </div>
          )}

          {/* Banned Alert */}
          {isBanned && (
            <div className="mb-5">
              <Alert variant="danger" title="حساب کاربری مسدود شد">
                {error ||
                  'به علت بیش از ۳ بار تلاش ناموفق، دسترسی شما از سمت پنل مدیریت غیرفعال و مسدود گردید. (علت: ورود غیرمجاز)'}
              </Alert>
            </div>
          )}

          {/* Error Alert */}
          {error && !isBanned && (
            <div className="mb-5">
              <Alert
                variant="danger"
                title="خطا در احراز هویت"
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-5">
              <Alert variant="success" title="احراز هویت تایید شد">
                در حال انتقال ایمن به داشبورد و میز کار مدیریت...
              </Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-foreground">
                نام کاربری یا شناسه مدیریت
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="admin"
                  className="w-full h-11 pl-10 pr-3.5 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all font-sans disabled:opacity-50"
                  disabled={loading || success || isBanned}
                  required
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-foreground">
                کلمه عبور امن
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="کلمه عبور مدیر سیستم"
                required
                disabled={loading || success || isBanned}
                autoComplete="current-password"
              />
            </div>

            {/* Quick helper for default credentials */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin')
                  setPassword('admin123456')
                  if (error) setError(null)
                }}
                disabled={loading || success || isBanned}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/30 hover:bg-muted border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-brand transition-colors cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand" />
                <span>تنظیم اطلاعات پیش‌فرض (admin)</span>
              </button>
              <div className="flex items-center gap-1 text-[10px] font-latin text-muted-foreground/70">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Bcrypt Hash</span>
              </div>
            </div>

            {/* Submit Button or Banned Status Button */}
            {isBanned ? (
              <button
                type="button"
                disabled
                className="w-full h-11 rounded-control bg-destructive/15 border border-destructive/40 text-destructive font-black text-xs sm:text-sm shadow-control flex items-center justify-center gap-2 cursor-not-allowed transition-all mt-2"
              >
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>حساب کاربری مسدود است (علت: ورود غیرمجاز)</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال اعتبارسنجی و صدور توکن...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ورود تایید شد</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به میز کار مدیریت</span>
                  </>
                )}
              </button>
            )}

            {/* Return to Storefront button: Placed directly below the Login button */}
            <Link
              to="/"
              className="w-full h-10 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs sm:text-sm shadow-control flex items-center justify-center gap-2 duration-motion active:scale-[0.98] transition-all cursor-pointer mt-2"
            >
              <Store className="w-4 h-4 text-brand" />
              <span>بازگشت به فروشگاه</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-60" />
            </Link>
          </form>
        </div>
      </main>
    </div>
  )
}
