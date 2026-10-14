import {
  AlertCircle,
  ArrowRight,
  Clock,
  Loader2,
  RefreshCw,
  Smartphone,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import type { CustomerProfile } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'

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

const OTP_SLOT_KEYS = [
  'otp_slot_0',
  'otp_slot_1',
  'otp_slot_2',
  'otp_slot_3',
  'otp_slot_4',
] as const

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile_setup'>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', ''])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [verifiedCustomer, setVerifiedCustomer] =
    useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [timerSeconds, setTimerSeconds] = useState(120)
  const [canResend, setCanResend] = useState(false)

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

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
    if (step === 'otp' && timerSeconds > 0) {
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanPhone = toEnDigits(phone.trim().replace(/\s+/g, ''))
    if (!cleanPhone.startsWith('09') || cleanPhone.length !== 11) {
      setErrorMsg('شماره موبایل وارد شده باید ۱۱ رقم بوده و با ۰۹ آغاز شود')
      return
    }

    setLoading(true)
    try {
      const resp = await api.sendOTP(cleanPhone)
      setStep('otp')
      setTimerSeconds(resp.expires_in || 120)
      setCanResend(false)
      setOtpCode(['', '', '', '', ''])
      setTimeout(() => {
        otpInputsRef.current[0]?.focus()
      }, 150)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال کد تایید')
    } finally {
      setLoading(false)
    }
  }

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

    // Focus next input box if available
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
    if (pasted.length === 5) {
      const chars = pasted.split('').slice(0, 5)
      setOtpCode(chars)
      otpInputsRef.current[4]?.focus()
    }
  }

  const handleOtpSubmit = async (e?: React.FormEvent) => {
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
      })
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipProfile = () => {
    if (verifiedCustomer) {
      onSuccess(verifiedCustomer)
    }
    onClose()
  }

  const handleResend = async () => {
    if (!canResend || loading) return
    setErrorMsg('')
    setLoading(true)
    const cleanPhone = toEnDigits(phone.trim().replace(/\s+/g, ''))
    try {
      const resp = await api.sendOTP(cleanPhone)
      setTimerSeconds(resp.expires_in || 120)
      setCanResend(false)
      setOtpCode(['', '', '', '', ''])
      otpInputsRef.current[0]?.focus()
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال مجدد کد')
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {step === 'profile_setup' ? (
                <User className="w-5 h-5" />
              ) : (
                <Smartphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {step === 'phone'
                  ? 'ورود یا ثبت‌نام'
                  : step === 'otp'
                    ? 'تایید شماره موبایل'
                    : 'تکمیل حساب کاربری'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'phone'
                  ? 'جهت ادامه، شماره موبایل خود را وارد کنید'
                  : step === 'otp'
                    ? `کد تایید به ${phone} ارسال شد`
                    : 'لطفاً نام و مشخصات خود را جهت ساخت پروفایل وارد کنید'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="customer-phone-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  شماره موبایل
                </label>
                <div className="relative">
                  <Input
                    id="customer-phone-input"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="h-11 text-center text-base tracking-wider font-mono font-medium rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  کد تایید ۵ رقمی برای این شماره ارسال خواهد شد.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !phone}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    در حال ارسال...
                  </>
                ) : (
                  'ادامه'
                )}
              </Button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="otp-digit-0"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    کد تایید ۵ رقمی
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setErrorMsg('')
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    ویرایش شماره
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>

                <div
                  className="flex justify-center items-center gap-2.5 my-3"
                  dir="ltr"
                >
                  {otpCode.map((digit, idx) => (
                    <input
                      key={OTP_SLOT_KEYS[idx]}
                      id={`otp-digit-${idx}`}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-12 text-center text-xl font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-medium">
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>

                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      ارسال مجدد کد
                    </button>
                  ) : (
                    <span className="text-slate-400">
                      ارسال مجدد تا {timerSeconds} ثانیه دیگر
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || otpCode.join('').length !== 5}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    در حال بررسی...
                  </>
                ) : (
                  'تایید و ادامه'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="customer-firstname-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    نام <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-firstname-input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="مثال: علی"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="customer-lastname-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    نام خانوادگی <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="customer-lastname-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="مثال: عبادی"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-email-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  آدرس ایمیل{' '}
                  <span className="text-slate-400 text-[11px] font-normal">
                    (اختیاری - جهت دریافت فاکتور و لایسنس)
                  </span>
                </label>
                <Input
                  id="customer-email-input"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs font-mono"
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={loading || !firstName.trim() || !lastName.trim()}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      در حال ذخیره...
                    </>
                  ) : (
                    'تکمیل و ورود به حساب'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition text-center"
                >
                  بعداً تکمیل می‌کنم
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
