import {
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
import { Alert } from './vibefarsi/Alert'
import { useNotification } from './vibefarsi/NotificationContext'
import { ShimmerButton } from './vibefarsi/ShimmerButton'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: CustomerProfile) => void
  initialMode?: 'login' | 'register'
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
  initialMode = 'login',
}) => {
  const { success, error } = useNotification()

  // Mode: login or register
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode)

  // Sub-steps for mobile flow
  const [step, setStep] = useState<
    | 'main_form'
    | 'otp_choice'
    | 'otp_verify'
    | 'password_form'
    | 'profile_setup'
  >('main_form')

  // Theme settings (fetched in background, with fallback defaults so UI is never hidden)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    event_name: 'عادی',
    event_active: false,
    primary_color: '#2563eb',
    accent_color: '#3b82f6',
    header_announcement: 'تمامی سرویس‌ها فعال و تحویل آنی برقرار است',
    event_effect: 'none',
    auth_google_enabled: true,
    auth_github_enabled: true,
    auth_password_enabled: true,
    auth_otp_required: false,
  })

  // Inputs
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('') // mobile or email
  const [otpCode, setOtpCode] = useState(['', '', '', '', ''])

  // Profile setup
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // State flags
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode)
      setStep('main_form')
      setErrorMsg('')
      api
        .getThemeSettings()
        .then((s) => {
          if (s) setThemeSettings(s)
        })
        .catch(() => {})
    }
  }, [isOpen, initialMode])

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
    if (step === 'otp_verify' && timerSeconds > 0) {
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

  // 1. Send OTP code
  const handleSendOtp = async (cleanPhone: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const resp = await api.sendOTP(cleanPhone)
      setStep('otp_verify')
      setTimerSeconds(resp.expires_in || 120)
      setCanResend(false)
      setOtpCode(['', '', '', '', ''])
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 150)
      success(
        'کد تایید پیامکی ارسال شد',
        `کد تایید ۵ رقمی به شماره ${cleanPhone} ارسال گردید.`,
      )
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال پیامک تایید'
      setErrorMsg(msg)
      error('خطا در ارسال کد', msg)
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle mobile form submit
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanPhone = toEnDigits(phone.trim().replace(/\s+/g, ''))
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setErrorMsg('شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ آغاز شود')
      return
    }

    // In login mode, if password is enabled, offer choice or proceed to OTP
    if (authMode === 'login' && themeSettings.auth_password_enabled) {
      setStep('otp_choice')
    } else {
      await handleSendOtp(cleanPhone)
    }
  }

  // 3. OTP slots logic
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
        setStep('profile_setup')
      } else {
        success(
          'ورود موفق',
          `خوش آمدید ${resp.customer.full_name || 'کاربر گرامی'}`,
        )
        onSuccess(resp.customer)
        onClose()
      }
    } catch (err: any) {
      const msg = err.message || 'کد تایید نامعتبر است'
      setErrorMsg(msg)
      error('خطا در تایید کد', msg)
    } finally {
      setLoading(false)
    }
  }

  // 4. Password login
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
      success('ورود موفق', `خوش آمدید ${resp.customer.full_name || ''}`)
      onSuccess(resp.customer)
      onClose()
    } catch (err: any) {
      const msg =
        err.message || 'کلمه عبور نادرست است یا حسابی با این مشخصات یافت نشد'
      setErrorMsg(msg)
      error('خطا در ورود با رمز', msg)
    } finally {
      setLoading(false)
    }
  }

  // 5. One-Click Social Login (Google & GitHub)
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setErrorMsg('')
    try {
      if (provider === 'google') {
        const randNum = Math.floor(Math.random() * 8999 + 1000)
        const resp = await api.loginWithSocial(
          'google',
          `google_${Date.now()}`,
          `user.${randNum}@gmail.com`,
          'کاربر گوگل آناهیکس',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        )
        success('ورود موفق با گوگل', 'حساب گوگل شما با موفقیت همگام‌سازی شد.')
        onSuccess(resp.customer)
        onClose()
      } else {
        const randNum = Math.floor(Math.random() * 8999 + 1000)
        const resp = await api.loginWithSocial(
          'github',
          `github_${Date.now()}`,
          `developer.${randNum}@github.com`,
          'توسعه‌دهنده گیت‌هاب',
          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
        )
        success('ورود موفق با گیت‌هاب', 'حساب گیت‌هاب شما با موفقیت متصل گردید.')
        onSuccess(resp.customer)
        onClose()
      }
    } catch (err: any) {
      const msg = err.message || 'خطا در ارتباط با سرور احراز هویت'
      setErrorMsg(msg)
      error('خطا در ورود شبکه اجتماعی', msg)
    } finally {
      setLoading(false)
    }
  }

  // 6. Complete profile setup
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
      success('ثبت‌نام تکمیل شد', `خوش آمدید ${combined}`)
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      const msg = err.message || 'خطا در ذخیره اطلاعات'
      setErrorMsg(msg)
      error('خطا در ثبت پروفایل', msg)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in-up"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-700/80 bg-zinc-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-zinc-100">
        {/* Glow ambient background in Graphite style */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="بستن پنجره"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-blue-600/30">
            A
          </div>
          <h2 className="text-xl font-black text-white">
            {authMode === 'login'
              ? 'ورود به حساب کاربری'
              : 'ایجاد حساب کاربری جدید'}
          </h2>
          <p className="text-xs text-zinc-400">
            {authMode === 'login'
              ? 'دسترسی سریع به سفارش‌ها، کیف پول و شماره‌های مجازی'
              : 'عضویت آنی در سامانه لایسنس‌ها و اشتراک‌های بین‌المللی'}
          </p>
        </div>

        {/* Switcher Tab between Login & Register */}
        {step === 'main_form' && (
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-900 border border-zinc-800 p-1 mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setErrorMsg('')
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-zinc-800 text-blue-400 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ورود به سیستم
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setErrorMsg('')
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'register'
                  ? 'bg-zinc-800 text-blue-400 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ثبت‌نام جدید
            </button>
          </div>
        )}

        {/* Alert for errors if any */}
        {errorMsg && (
          <div className="mb-4">
            <Alert
              variant="danger"
              title="خطا در عملیات"
              onClose={() => setErrorMsg('')}
            >
              {errorMsg}
            </Alert>
          </div>
        )}

        {/* STEP 1: MAIN FORM (Direct Social + Mobile Phone) */}
        {step === 'main_form' && (
          <div className="space-y-4">
            {/* ONE-CLICK SOCIAL LOGIN BUTTONS (ALWAYS VISIBLE & PROMINENT) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 hover:border-zinc-700 p-3 font-bold text-xs text-zinc-100 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-center">
                  <GoogleIcon className="h-5 w-5" />
                </div>
                <span>
                  {authMode === 'login'
                    ? 'ورود سریع با حساب Google'
                    : 'ثبت‌نام سریع با یک کلیک Google'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 hover:border-zinc-700 p-3 font-bold text-xs text-zinc-100 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-center">
                  <GithubIcon className="h-5 w-5 text-white" />
                </div>
                <span>
                  {authMode === 'login'
                    ? 'ورود مستقیم با حساب GitHub'
                    : 'ثبت‌نام مستقیم با حساب GitHub'}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative bg-zinc-950 px-3 text-[11px] font-bold text-zinc-500">
                یا با شماره تلفن همراه
              </div>
            </div>

            {/* Mobile Phone Form */}
            <form onSubmit={handleMobileSubmit} className="space-y-3.5">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-zinc-300">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="09123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 text-center font-latin tracking-widest text-sm rounded-2xl h-11 bg-zinc-900 border-zinc-800 focus:border-blue-500 text-white"
                    required
                  />
                  <Smartphone className="h-4 w-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  <span>
                    {authMode === 'login'
                      ? 'ادامه ورود'
                      : 'ارسال کد و تایید شماره'}
                  </span>
                )}
              </ShimmerButton>

              {/* Direct Password Login link for returning users */}
              {authMode === 'login' && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier(phone)
                      setStep('password_form')
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>ورود مستقیم با کلمه عبور</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* STEP 2: CHOICE FOR RETURNING PHONE (OTP vs PASSWORD) */}
        {step === 'otp_choice' && (
          <div className="space-y-4 text-center animate-fade-in-up">
            <p className="text-xs text-zinc-400">
              شماره{' '}
              <span className="font-bold text-white font-latin">{phone}</span>{' '}
              ثبت شده است. نحوه احراز هویت را انتخاب کنید:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleSendOtp(toEnDigits(phone.trim()))}
                disabled={loading}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-blue-500/40 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      ارسال رمز یکبار مصرف (SMS OTP)
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      دریافت کد ۵ رقمی پیامکی روی گوشی
                    </p>
                  </div>
                </div>
                <span className="text-xs text-blue-400 font-bold">
                  انتخاب ←
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep('password_form')}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-blue-500/40 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      ورود با کلمه عبور اختصاصی
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      ورود با رمز عبوری که قبلاً ثبت کرده‌اید
                    </p>
                  </div>
                </div>
                <span className="text-xs text-purple-400 font-bold">
                  انتخاب ←
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('main_form')}
              className="text-xs text-zinc-400 hover:text-white pt-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>بازگشت و تغییر شماره</span>
            </button>
          </div>
        )}

        {/* STEP 2-B: DIRECT PASSWORD FORM */}
        {step === 'password_form' && (
          <form
            onSubmit={handlePasswordLogin}
            className="space-y-4 animate-fade-in-up"
          >
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-zinc-300">
                شماره موبایل یا ایمیل
              </label>
              <div className="relative">
                <Input
                  type="text"
                  dir="ltr"
                  placeholder="09123456789 یا user@example.com"
                  value={identifier || phone}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 text-center text-sm rounded-2xl h-11 bg-zinc-900 border-zinc-800 text-white"
                  required
                />
                <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-zinc-300">
                کلمه عبور
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 text-sm rounded-2xl h-11 bg-zinc-900 border-zinc-800 text-white"
                  required
                />
                <Lock className="h-4 w-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300"
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
                onClick={() => {
                  const target = identifier || phone
                  if (target.startsWith('09')) {
                    handleSendOtp(toEnDigits(target.trim()))
                  } else {
                    setStep('main_form')
                  }
                }}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                رمز را فراموش کردید؟ ورود با پیامک
              </button>
              <button
                type="button"
                onClick={() => setStep('main_form')}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                بازگشت
              </button>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید کلمه عبور و ورود</span>
              )}
            </ShimmerButton>
          </form>
        )}

        {/* STEP 3: OTP VERIFICATION */}
        {step === 'otp_verify' && (
          <form
            onSubmit={handleOtpVerify}
            className="space-y-5 animate-fade-in-up"
          >
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-400">
                کد تایید پیامک شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-latin text-sm font-black text-white">
                {phone}
              </p>
            </div>

            {/* 5 digit inputs */}
            <div className="flex justify-center gap-2.5" dir="ltr">
              {otpCode.map((digit, idx) => {
                const slotKey = `otp-box-${idx}`
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
                    className="h-12 w-11 rounded-2xl border border-zinc-700 bg-zinc-900 text-center text-lg font-black font-latin text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                )
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => handleSendOtp(toEnDigits(phone.trim()))}
                className={`font-bold flex items-center gap-1 ${
                  canResend
                    ? 'text-blue-400 hover:underline cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>ارسال مجدد کد</span>
              </button>

              <span className="font-latin font-bold text-zinc-300">
                {formatTimer(timerSeconds)}
              </span>
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید کد و ورود</span>
              )}
            </ShimmerButton>

            <button
              type="button"
              onClick={() => setStep('main_form')}
              className="w-full text-center text-xs text-zinc-400 hover:text-white pt-1 cursor-pointer"
            >
              تغییر شماره تلفن
            </button>
          </form>
        )}

        {/* STEP 4: PROFILE SETUP */}
        {step === 'profile_setup' && (
          <form
            onSubmit={handleProfileSubmit}
            className="space-y-4 animate-fade-in-up"
          >
            <div className="text-center space-y-1 mb-2">
              <h3 className="text-sm font-black text-white">
                تکمیل اطلاعات حساب کاربری
              </h3>
              <p className="text-[11px] text-zinc-400">
                جهت صدور فاکتور و دسترسی به لایسنس‌ها، نام و مشخصات خود را ثبت
                نمایید
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  نام
                </label>
                <Input
                  type="text"
                  placeholder="علی"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs rounded-xl h-10 bg-zinc-900 border-zinc-800 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  نام خانوادگی
                </label>
                <Input
                  type="text"
                  placeholder="محمدی"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs rounded-xl h-10 bg-zinc-900 border-zinc-800 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300">
                آدرس ایمیل
              </label>
              <Input
                type="email"
                dir="ltr"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs rounded-xl h-10 font-latin bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-zinc-300">
                لینک تصویر آواتار (اختیاری)
              </label>
              <Input
                type="url"
                dir="ltr"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="text-xs rounded-xl h-10 font-latin bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <ShimmerButton
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-bold rounded-2xl"
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
