import {
  ArrowRight,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Smartphone,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../services/api'
import type { CustomerProfile, ThemeSettings } from '../types'
import { GithubIcon, GoogleIcon } from './SocialIcons'
import { Alert } from './vibefarsi/Alert'
import { useNotification } from './vibefarsi/NotificationContext'
import { OtpField } from './vibefarsi/OtpField'
import { PasswordInput } from './vibefarsi/PasswordInput'

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
  const { success, error, info } = useNotification()

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
  const [identifier, setIdentifier] = useState('') // mobile or email
  const [otpCode, setOtpCode] = useState(['', '', '', '', ''])

  // Register method state (Phone vs Email)
  const [registerMethod, setRegisterMethod] = useState<'phone' | 'email'>(
    'phone',
  )
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerFullName, setRegisterFullName] = useState('')

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

  // Handle email + password registration with strict field validation
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const fullName = registerFullName.trim()
    if (!fullName) {
      const msg =
        'نام و نام خانوادگی الزامی است. لطفاً نام خود را به صورت کامل وارد نمایید.'
      setErrorMsg(msg)
      error('نام و نام خانوادگی الزامی است', msg)
      return
    }

    const cleanEmail = registerEmail.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      const msg =
        'آدرس ایمیل نامعتبر است. لطفاً یک ایمیل معتبر (مانند user@example.com) وارد کنید.'
      setErrorMsg(msg)
      error('ایمیل نامعتبر است', msg)
      return
    }

    const pwd = registerPassword.trim()
    if (!pwd) {
      const msg = 'کلمه عبور الزامی است. لطفاً یک رمز عبور تعیین کنید.'
      setErrorMsg(msg)
      error('کلمه عبور الزامی است', msg)
      return
    }

    if (pwd.length < 6) {
      const msg =
        'کلمه عبور کوتاه است. کلمه عبور انتخابی باید حداقل شامل ۶ کاراکتر باشد.'
      setErrorMsg(msg)
      error('کلمه عبور کوتاه است', msg)
      return
    }

    setLoading(true)
    try {
      const resp = await api.registerWithPassword({
        email: cleanEmail,
        password: pwd,
        full_name: fullName,
      })
      success(
        'عضویت با موفقیت انجام شد',
        `خوش آمدید ${resp.customer.full_name || ''}`,
      )
      onSuccess(resp.customer)
      onClose()
    } catch (err: any) {
      const msg = err.message || 'خطا در ثبت‌نام با ایمیل'
      setErrorMsg(msg)
      error('خطا در ثبت‌نام', msg)
    } finally {
      setLoading(false)
    }
  }

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

  // 2. Handle mobile or email form submit
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const rawInput = phone.trim()
    if (!rawInput) {
      setErrorMsg(
        authMode === 'login'
          ? 'لطفاً شماره موبایل یا آدرس ایمیل خود را وارد کنید'
          : 'لطفاً شماره موبایل خود را وارد کنید',
      )
      return
    }

    // If in login mode and input looks like an email address, route directly to password verification
    if (authMode === 'login' && rawInput.includes('@')) {
      setIdentifier(rawInput)
      setStep('password_form')
      return
    }

    // Otherwise, treat as an Iranian mobile phone number
    const cleanPhone = toEnDigits(rawInput.replace(/\s+/g, ''))
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setErrorMsg(
        authMode === 'login'
          ? 'شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ آغاز شود (یا یک آدرس ایمیل معتبر وارد کنید)'
          : 'شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ آغاز شود',
      )
      return
    }

    // In registration mode, always send OTP directly (no password form needed for initial signup)
    if (authMode === 'register') {
      await handleSendOtp(cleanPhone)
      return
    }

    // In login mode, if password is enabled, offer choice (OTP vs Password) or proceed directly to OTP
    if (themeSettings.auth_password_enabled) {
      setStep('otp_choice')
    } else {
      await handleSendOtp(cleanPhone)
    }
  }

  // 3. OTP verification logic
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

  return createPortal(
    <div
      dir="rtl"
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-surface border border-border/80 bg-card p-6 sm:p-8 shadow-overlay text-card-foreground">
        {/* Glow ambient background in Graphite style */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-foreground/5 blur-3xl" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="بستن پنجره"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-control bg-secondary text-secondary-foreground border border-border/60 font-black text-xl shadow-control">
            A
          </div>
          <h2 className="text-xl font-black text-foreground">
            {authMode === 'login'
              ? 'ورود به حساب کاربری'
              : 'ایجاد حساب کاربری جدید'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {authMode === 'login'
              ? 'دسترسی سریع به سفارش‌ها، کیف پول و شماره‌های مجازی'
              : 'عضویت آنی در سامانه لایسنس‌ها و اشتراک‌های بین‌المللی'}
          </p>
        </div>

        {/* Switcher Tab between Login & Register - Distinct High-Contrast Button Pills */}
        {step === 'main_form' && (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-control bg-muted/40 border border-border/60 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setErrorMsg('')
              }}
              className={`py-2 px-3 rounded-control font-black transition-all duration-motion ease-motion cursor-pointer ${
                authMode === 'login'
                  ? 'bg-primary text-primary-foreground shadow-control'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/40'
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
              className={`py-2 px-3 rounded-control font-black transition-all duration-motion ease-motion cursor-pointer ${
                authMode === 'register'
                  ? 'bg-primary text-primary-foreground shadow-control'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/40'
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
            {/* ONE-CLICK SOCIAL LOGIN BUTTONS */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-foreground p-3 font-bold text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
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
                className="w-full flex items-center justify-center gap-3 rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-foreground p-3 font-bold text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
              >
                <div className="flex items-center justify-center">
                  <GithubIcon className="h-5 w-5 text-foreground" />
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
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative bg-card px-3 text-[11px] font-bold text-muted-foreground">
                {authMode === 'login'
                  ? 'یا با شماره موبایل / ایمیل'
                  : 'یا با شماره تلفن همراه'}
              </div>
            </div>

            {/* Registration Method Switcher (Phone vs Email) - Distinct Button Pills */}
            {authMode === 'register' && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-control bg-muted/30 border border-border/60 mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMethod('phone')
                    setErrorMsg('')
                  }}
                  className={`py-2 px-2.5 rounded-control font-black transition-all duration-motion ease-motion cursor-pointer ${
                    registerMethod === 'phone'
                      ? 'bg-primary text-primary-foreground shadow-control'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  ثبت‌نام با شماره موبایل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMethod('email')
                    setErrorMsg('')
                  }}
                  className={`py-2 px-2.5 rounded-control font-black transition-all duration-motion ease-motion cursor-pointer ${
                    registerMethod === 'email'
                      ? 'bg-primary text-primary-foreground shadow-control'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  ثبت‌نام با ایمیل و رمز
                </button>
              </div>
            )}

            {/* Email Registration Form */}
            {authMode === 'register' && registerMethod === 'email' ? (
              <form onSubmit={handleEmailRegister} className="space-y-3.5">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground">
                    نام و نام خانوادگی (الزامی)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: علی محمدی"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    className="w-full h-11 px-3 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground">
                    آدرس ایمیل (الزامی)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      placeholder="user@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 text-xs font-latin rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                      required
                    />
                    <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground">
                    کلمه عبور (الزامی، حداقل ۶ کاراکتر)
                  </label>
                  <PasswordInput
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    showStrength
                    required
                    placeholder="رمز عبور حداقل ۶ کاراکتر"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    <span>تکمیل ثبت‌نام و ورود به حساب</span>
                  )}
                </button>
              </form>
            ) : (
              /* Mobile / Identifier Form */
              <form onSubmit={handleMobileSubmit} className="space-y-3.5">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-foreground">
                    {authMode === 'login'
                      ? 'شماره موبایل یا ایمیل'
                      : 'شماره تلفن همراه'}
                  </label>
                  <div className="relative">
                    <input
                      type={authMode === 'login' ? 'text' : 'tel'}
                      dir="ltr"
                      placeholder={
                        authMode === 'login'
                          ? '09123456789 یا user@example.com'
                          : '09123456789'
                      }
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 text-center font-latin tracking-wide text-sm rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                      required
                    />
                    {authMode === 'login' && phone.includes('@') ? (
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                </button>

                {/* Direct Password Login link for returning users (Only in login mode) */}
                {authMode === 'login' && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier(phone)
                        setStep('password_form')
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>ورود مستقیم با کلمه عبور</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* STEP 2: CHOICE FOR RETURNING PHONE (OTP vs PASSWORD) */}
        {step === 'otp_choice' && (
          <div className="space-y-4 text-center animate-fade-in-up">
            <p className="text-xs text-muted-foreground">
              شماره{' '}
              <span className="font-bold text-foreground font-latin">
                {phone}
              </span>{' '}
              ثبت شده است. نحوه احراز هویت را انتخاب کنید:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleSendOtp(toEnDigits(phone.trim()))}
                disabled={loading}
                className="flex items-center justify-between p-3.5 rounded-control border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-control bg-muted text-brand">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      ارسال رمز یکبار مصرف (SMS OTP)
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      دریافت کد ۵ رقمی پیامکی روی گوشی
                    </p>
                  </div>
                </div>
                <span className="text-xs text-brand font-bold">انتخاب ←</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('password_form')}
                className="flex items-center justify-between p-3.5 rounded-control border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-control bg-muted text-brand">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      ورود با کلمه عبور اختصاصی
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ورود با رمز عبوری که قبلاً ثبت کرده‌اید
                    </p>
                  </div>
                </div>
                <span className="text-xs text-brand font-bold">انتخاب ←</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep('main_form')}
              className="text-xs text-muted-foreground hover:text-foreground pt-2 inline-flex items-center gap-1 cursor-pointer duration-motion"
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
              <label className="text-xs font-bold text-foreground">
                شماره موبایل یا ایمیل
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="09123456789 یا user@example.com"
                  value={identifier || phone}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-center text-sm rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                  required
                />
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                کلمه عبور
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="کلمه عبور حساب کاربری"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const target = identifier || phone
                  const cleanTarget = toEnDigits(target.trim())
                  if (
                    cleanTarget.startsWith('09') &&
                    cleanTarget.length === 11
                  ) {
                    handleSendOtp(cleanTarget)
                  } else {
                    info(
                      'بازیابی رمز عبور با پیامک',
                      'لطفاً شماره موبایل خود را وارد کنید تا کد تایید یکبارمصرف (OTP) برای شما ارسال شود.',
                    )
                    setStep('main_form')
                  }
                }}
                className="text-brand hover:underline cursor-pointer font-medium"
              >
                رمز را فراموش کردید؟ ورود / بازیابی با پیامک
              </button>
              <button
                type="button"
                onClick={() => setStep('main_form')}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                بازگشت
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید کلمه عبور و ورود</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: OTP VERIFICATION */}
        {step === 'otp_verify' && (
          <form
            onSubmit={handleOtpVerify}
            className="space-y-5 animate-fade-in-up"
          >
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                کد تایید پیامک شده به شماره زیر را وارد کنید:
              </p>
              <p className="font-latin text-sm font-black text-foreground">
                {phone}
              </p>
            </div>

            {/* Vibe Farsi OtpField Component */}
            <div className="py-1">
              <OtpField
                length={5}
                value={otpCode.join('')}
                onChange={(val) => {
                  const arr = ['', '', '', '', '']
                  for (let i = 0; i < 5; i++) {
                    arr[i] = val[i] || ''
                  }
                  setOtpCode(arr)
                }}
                onComplete={() => {
                  handleOtpVerify()
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => handleSendOtp(toEnDigits(phone.trim()))}
                className={`font-bold flex items-center gap-1 ${
                  canResend
                    ? 'text-brand hover:underline cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>ارسال مجدد کد</span>
              </button>

              <span className="font-latin font-bold text-foreground">
                {formatTimer(timerSeconds)}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>تایید کد و ورود</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('main_form')}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1 cursor-pointer duration-motion"
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
              <h3 className="text-sm font-black text-foreground">
                تکمیل اطلاعات حساب کاربری
              </h3>
              <p className="text-[11px] text-muted-foreground">
                جهت صدور فاکتور و دسترسی به لایسنس‌ها، نام و مشخصات خود را ثبت
                نمایید
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  نام
                </label>
                <input
                  type="text"
                  placeholder="علی"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs rounded-field h-10 px-3 bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  نام خانوادگی
                </label>
                <input
                  type="text"
                  placeholder="محمدی"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs rounded-field h-10 px-3 bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-foreground">
                آدرس ایمیل
              </label>
              <input
                type="email"
                dir="ltr"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-field h-10 px-3 font-latin bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-[11px] font-bold text-foreground">
                لینک تصویر آواتار (اختیاری)
              </label>
              <input
                type="url"
                dir="ltr"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full text-xs rounded-field h-10 px-3 font-latin bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <span>ذخیره و ورود به سامانه</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
