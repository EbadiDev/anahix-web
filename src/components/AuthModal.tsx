import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import type { CustomerProfile, ThemeSettings } from '../types'
import { GithubIcon, GoogleIcon } from './SocialIcons'
import { Input } from './ui/input'
import { ShimmerButton } from './vibefarsi/ShimmerButton'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: CustomerProfile) => void
}

function toEnDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Navigation & Methods Tabs
  const [activeTab, setActiveTab] = useState<'mobile' | 'password' | 'social'>(
    'mobile',
  )
  const [step, setStep] = useState<
    | 'phone_input'
    | 'otp_choice'
    | 'otp_code'
    | 'password_input'
    | 'profile_setup'
  >('phone_input')

  // Theme & Auth config from admin
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)

  // Form states
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('') // for direct password login
  const [otpCode, setOtpCode] = useState(['', '', '', '', ''])

  // Profile setup
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [_verifiedCustomer, setVerifiedCustomer] =
    useState<CustomerProfile | null>(null)

  // Loading & Diagnostics
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [_successMsg, _setSuccessMsg] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Load theme and auth controls on mount
  useEffect(() => {
    if (isOpen) {
      api
        .getThemeSettings()
        .then(setThemeSettings)
        .catch(() => {})
      setErrorMsg('')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Countdown timer for OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (step === 'otp_code' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          if (prev <= 61) {
            setCanResend(true)
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timerSeconds])

  if (!isOpen) return null

  // 1. Submit phone and offer login choices (OTP vs Password)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanPhone = toEnDigits(phone.trim().replace(/\s+/g, ''))
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setErrorMsg('شماره موبایل باید ۱۱ رقم بوده و با ۰۹ آغاز شود')
      return
    }

    // If password login is allowed from admin, give user choice between OTP and password
    if (themeSettings?.auth_password_enabled !== false) {
      setStep('otp_choice')
    } else {
      await handleSendOtpDirect(cleanPhone)
    }
  }

  const handleSendOtpDirect = async (cleanPhone: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const resp = await api.sendOTP(cleanPhone)
      setStep('otp_code')
      setTimerSeconds(resp.expires_in || 120)
      setCanResend(false)
      setOtpCode(['', '', '', '', ''])
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 150)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال کد تایید پیامکی')
    } finally {
      setLoading(false)
    }
  }

  // 2. OTP handling
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = toEnDigits(val).replace(/\D/g, '')
    if (!cleaned) {
      const updated = [...otpCode]
      updated[index] = ''
      setOtpCode(updated)
      return
    }

    const char = cleaned.slice(-1)
    const updated = [...otpCode]
    updated[index] = char
    setOtpCode(updated)

    if (index < 4) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = toEnDigits(e.clipboardData.getData('text')).replace(
      /\D/g,
      '',
    )
    if (pasted.length >= 5) {
      const chars = pasted.split('').slice(0, 5)
      setOtpCode(chars)
      otpInputsRef.current[4]?.focus()
    }
  }

  const handleOtpVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    const code = otpCode.join('')
    if (code.length !== 5) {
      setErrorMsg('لطفاً کد تایید ۵ رقمی را کامل وارد کنید')
      return
    }

    const cleanPhone = toEnDigits(phone.trim().replace(/\s+/g, ''))
    setLoading(true)
    try {
      const resp = await api.verifyOTP(cleanPhone, code)
      const isNewUser =
        resp.is_new ||
        !resp.customer.full_name ||
        resp.customer.full_name === 'کاربر آناهیکس'

      if (isNewUser) {
        setVerifiedCustomer(resp.customer)
        setStep('profile_setup')
      } else {
        onSuccess(resp.customer)
        onClose()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'کد تایید نامعتبر است')
    } finally {
      setLoading(false)
    }
  }

  // 3. Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const targetIdent = identifier || phone
    if (!targetIdent.trim() || !password.trim()) {
      setErrorMsg('لطفاً شماره موبایل یا ایمیل و کلمه عبور را وارد کنید')
      return
    }

    setLoading(true)
    try {
      const resp = await api.loginWithPassword(
        targetIdent.trim(),
        password.trim(),
      )
      onSuccess(resp.customer)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'کلمه عبور نادرست است یا کاربری یافت نشد')
    } finally {
      setLoading(false)
    }
  }

  // 4. Social Login (Google & GitHub)
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setErrorMsg('')
    try {
      if (provider === 'google') {
        const sampleEmail = `user.${Math.floor(Math.random() * 8999 + 1000)}@gmail.com`
        const resp = await api.loginWithSocial(
          'google',
          `google_${Date.now()}`,
          sampleEmail,
          'کاربر گوگل',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        )
        onSuccess(resp.customer)
        onClose()
      } else {
        const sampleEmail = `developer.${Math.floor(Math.random() * 8999 + 1000)}@github.com`
        const resp = await api.loginWithSocial(
          'github',
          `github_${Date.now()}`,
          sampleEmail,
          'توسعه‌دهنده گیت‌هاب',
          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
        )
        onSuccess(resp.customer)
        onClose()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ورود از طریق حساب شبکه اجتماعی')
    } finally {
      setLoading(false)
    }
  }

  // 5. Complete Profile Setup
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را کامل وارد کنید')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const combined = `${firstName.trim()} ${lastName.trim()}`
      const updated = await api.updateCustomerProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: combined,
        email: email.trim(),
        avatar_url: avatarUrl.trim(),
      })
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in-up"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-foreground">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-purple-500/15 blur-3xl" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-600/30">
            A
          </div>
          <h2 className="text-lg sm:text-xl font-black text-foreground">
            ورود به حساب کاربری آناهیکس
          </h2>
          <p className="text-xs text-muted-foreground">
            دسترسی به سفارش‌ها، کیف پول و شماره‌های مجازی اختصاصی
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method Switcher Tabs (Only if at entry step) */}
        {step === 'phone_input' && (
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('mobile')}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'mobile'
                  ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              شماره موبایل
            </button>
            {themeSettings?.auth_password_enabled !== false && (
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`py-2 rounded-xl transition-all ${
                  activeTab === 'password'
                    ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                کلمه عبور
              </button>
            )}
            {(themeSettings?.auth_google_enabled ||
              themeSettings?.auth_github_enabled) && (
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`py-2 rounded-xl transition-all ${
                  activeTab === 'social'
                    ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ورود سریع
              </button>
            )}
          </div>
        )}

        {/* STEP 1: Phone input */}
        {step === 'phone_input' && activeTab === 'mobile' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                شماره موبایل
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 text-center font-latin tracking-widest text-sm rounded-xl h-11"
                  required
                  autoFocus
                />
                <Smartphone className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>ادامه فرآیند ورود</span>
              )}
            </ShimmerButton>
          </form>
        )}

        {/* STEP 1-B: Direct Password Login Tab */}
        {step === 'phone_input' && activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                شماره موبایل یا ایمیل
              </label>
              <div className="relative">
                <Input
                  type="text"
                  dir="ltr"
                  placeholder="09123456789 یا user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 text-center text-sm rounded-xl h-11"
                  required
                />
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                کلمه عبور
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 text-sm rounded-xl h-11"
                  required
                />
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>ورود با کلمه عبور</span>
              )}
            </ShimmerButton>
          </form>
        )}

        {/* STEP 1-C: One-Click Social Logins */}
        {step === 'phone_input' && activeTab === 'social' && (
          <div className="space-y-3">
            {themeSettings?.auth_google_enabled && (
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-3 font-bold text-xs hover:bg-muted/60 transition-colors shadow-sm"
              >
                <div className="h-5 w-5 rounded-full flex items-center justify-center">
                  <GoogleIcon className="h-4 w-4" />
                </div>
                <span>ورود سریع با حساب Google</span>
              </button>
            )}

            {themeSettings?.auth_github_enabled && (
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-3 font-bold text-xs hover:bg-muted/60 transition-colors shadow-sm"
              >
                <div className="h-5 w-5 rounded-full flex items-center justify-center">
                  <GithubIcon className="h-4 w-4" />
                </div>
                <span>ورود مستقیم با GitHub</span>
              </button>
            )}

            <div className="pt-2 text-center text-[11px] text-muted-foreground">
              اطلاعات پروفایل و آواتار شما به صورت خودکار همگام‌سازی می‌شود.
            </div>
          </div>
        )}

        {/* STEP 2: Choose OTP or Password for verified phone */}
        {step === 'otp_choice' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-muted-foreground">
              شماره{' '}
              <span className="font-bold text-foreground font-latin">
                {phone}
              </span>{' '}
              تایید شد. نحوه احراز هویت را انتخاب کنید:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleSendOtpDirect(toEnDigits(phone.trim()))}
                disabled={loading}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/30 hover:bg-muted/70 hover:border-blue-500/40 transition-colors text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      ارسال رمز یکبار مصرف (SMS OTP)
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      دریافت کد ۵ رقمی پیامکی روی شماره همراه
                    </p>
                  </div>
                </div>
                <span className="text-xs text-blue-600">انتخاب ←</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('password_input')}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/30 hover:bg-muted/70 hover:border-blue-500/40 transition-colors text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      ورود با کلمه عبور اختصاصی
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ورود مستقیم با رمزی که قبلاً برای حسابتان تعیین کرده‌اید
                    </p>
                  </div>
                </div>
                <span className="text-xs text-purple-600">انتخاب ←</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('phone_input')}
              className="text-xs text-muted-foreground hover:text-foreground pt-2 inline-flex items-center gap-1"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>تغییر شماره موبایل</span>
            </button>
          </div>
        )}

        {/* STEP 2-B: Password input for chosen phone */}
        {step === 'password_input' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                کلمه عبور برای {phone}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 text-sm rounded-xl h-11"
                  required
                  autoFocus
                />
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleSendOtpDirect(toEnDigits(phone.trim()))}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                رمز را فراموش کرده‌اید؟ ورود با پیامک
              </button>
              <button
                type="button"
                onClick={() => setStep('otp_choice')}
                className="text-muted-foreground hover:text-foreground"
              >
                بازگشت
              </button>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید و ورود</span>
              )}
            </ShimmerButton>
          </form>
        )}

        {/* STEP 3: OTP 5-Digit Verification */}
        {step === 'otp_code' && (
          <form onSubmit={handleOtpVerify} className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                کد تایید پیامکی ارسال شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-latin text-sm font-black text-foreground">
                {phone}
              </p>
            </div>

            {/* 5 digit inputs */}
            <div className="flex justify-center gap-2.5" dir="ltr">
              {otpCode.map((digit, idx) => {
                const slotKey = `otp-slot-${idx}`
                return (
                  <input
                    key={slotKey}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-11 rounded-2xl border border-border bg-card text-center text-lg font-black font-latin focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                )
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => handleSendOtpDirect(toEnDigits(phone.trim()))}
                className={`font-bold flex items-center gap-1 ${
                  canResend
                    ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                <span>ارسال مجدد کد</span>
              </button>

              <span className="font-latin font-bold">
                {formatTimer(timerSeconds)}
              </span>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید کد و ورود</span>
              )}
            </ShimmerButton>

            <button
              type="button"
              onClick={() => setStep('phone_input')}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              تغییر شماره موبایل
            </button>
          </form>
        )}

        {/* STEP 4: Profile setup for new user or missing profile */}
        {step === 'profile_setup' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-2">
              <h3 className="text-sm font-black text-foreground">
                تکمیل اطلاعات حساب کاربری
              </h3>
              <p className="text-[11px] text-muted-foreground">
                جهت صدور فاکتور و پیگیری اشتراک‌ها، مشخصات خود را ثبت نمایید
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  نام
                </label>
                <Input
                  type="text"
                  placeholder="علی"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  نام خانوادگی
                </label>
                <Input
                  type="text"
                  placeholder="محمدی"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs rounded-xl h-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-foreground">
                آدرس ایمیل (جهت دریافت اطلاعات لایسنس)
              </label>
              <Input
                type="email"
                dir="ltr"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs rounded-xl h-10 font-latin"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-foreground">
                لینک آواتار / تصویر پروفایل (اختیاری)
              </label>
              <Input
                type="url"
                dir="ltr"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="text-xs rounded-xl h-10 font-latin"
              />
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>ذخیره و ورود به سامانه</span>
              )}
            </ShimmerButton>
          </form>
        )}
      </div>
    </div>
  )
}
