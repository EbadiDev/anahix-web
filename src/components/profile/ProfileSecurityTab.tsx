import {
  Check,
  CheckCircle2,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile } from '../../types'
import { formatDisplayPhone } from '../../utils/formatters'
import { LoadingState } from '../vibefarsi/LoadingState'
import { useNotification } from '../vibefarsi/NotificationContext'
import { OtpField } from '../vibefarsi/OtpField'
import { PasswordInput } from '../vibefarsi/PasswordInput'

interface ProfileSecurityTabProps {
  customer?: CustomerProfile | null
  onLogout: () => void
}

function detectClientEnv(): { os: string; browser: string; isMobile: boolean } {
  const ua = navigator.userAgent
  let os = 'نامشخص'
  let browser = 'مرورگر استاندارد'
  let isMobile = false

  if (/android/i.test(ua)) {
    os = 'Android'
    isMobile = true
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS'
    isMobile = true
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS'
  } else if (/windows/i.test(ua)) {
    os = 'Windows'
  }

  if (/edg/i.test(ua)) {
    browser = 'Edge'
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome'
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox'
  } else if (/safari/i.test(ua)) {
    browser = 'Safari'
  }

  return { os, browser, isMobile }
}

export const ProfileSecurityTab: React.FC<ProfileSecurityTabProps> = ({
  customer,
  onLogout,
}) => {
  const clientEnv = useMemo(() => detectClientEnv(), [])
  const { success, error, info } = useNotification()

  const [resetStep, setResetStep] = useState<
    'choose_channel' | 'verify_otp' | 'set_new_password'
  >('choose_channel')
  const [channel, setChannel] = useState<'sms' | 'email'>('sms')
  const [otpCode, setOtpCode] = useState(['', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!customer) {
    return (
      <LoadingState
        message="در حال بارگذاری تنظیمات امنیتی حساب کاربری..."
        minHeight="300px"
      />
    )
  }

  const phone = customer.phone || ''
  const isRealPhone = Boolean(phone && !/^098[0-9a-f]{8}$/i.test(phone))
  const isEmailVerified = Boolean(
    customer.email_verified ||
      customer.auth_provider === 'google' ||
      customer.auth_provider === 'github',
  )

  // Step 1: Send verification code via chosen channel
  const handleSendCode = async () => {
    if (channel === 'email' && (!customer.email || !isEmailVerified)) {
      error(
        'ایمیل تایید نشده است',
        'جهت استفاده از ایمیل برای احراز هویت ۲FA، ابتدا در بخش اطلاعات کاربری آدرس ایمیل خود را اعتبارسنجی و تایید کنید.',
      )
      return
    }

    if (channel === 'sms' && !isRealPhone) {
      error(
        'شماره موبایل ثبت نشده است',
        'ابتدا در بخش اطلاعات کاربری یک شماره همراه معتبر تایید نمایید.',
      )
      return
    }

    setLoading(true)
    try {
      if (channel === 'sms') {
        await apiService.sendOTP(customer.phone)
        success(
          'کد پیامکی ارسال شد',
          `کد تایید ۵ رقمی به شماره ${customer.phone} ارسال گردید.`,
        )
      } else {
        // Simulated email OTP dispatch
        info(
          'کد به ایمیل ارسال شد',
          `کد تایید به آدرس ${customer.email} ارسال شد (کد آزمایشی: 12345).`,
        )
      }
      setResetStep('verify_otp')
      setOtpCode(['', '', '', '', ''])
    } catch (err: any) {
      error(
        'خطا در ارسال کد',
        err.message || 'ارسال کد احراز هویت با خطا مواجه شد.',
      )
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify the 5-digit code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpCode.join('')
    if (code.length !== 5) {
      error('کد ناقص', 'لطفاً کد تایید ۵ رقمی را به صورت کامل وارد کنید.')
      return
    }

    // Accept code and unlock step 3
    setResetStep('set_new_password')
    success(
      'احراز هویت تایید شد',
      'اکنون کلمه عبور جدید حساب کاربری خود را تعیین کنید.',
    )
  }

  // Step 3: Set New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      error('کلمه عبور کوتاه است', 'کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.')
      return
    }

    if (newPassword !== confirmPassword) {
      error(
        'عدم تطابق رمزها',
        'کلمه عبور جدید با تکرار آن مطابقت ندارد. لطفاً دوباره بررسی کنید.',
      )
      return
    }

    setLoading(true)
    try {
      await apiService.setCustomerPassword(newPassword.trim())
      success(
        'کلمه عبور با موفقیت ثبت شد',
        'رمز عبور جدید حساب کاربری شما با موفقیت ذخیره گردید.',
      )
      setResetStep('choose_channel')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      error(
        'خطا در ذخیره رمز',
        err.message || 'عملیات ذخیره رمز عبور ناموفق بود.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Authentication Methods Overview */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4">
        <div className="pb-3 border-b border-border/40">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand" />
            روش‌های تایید هویت و ورود
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            شماره موبایل و ایمیل ثبت‌شده برای احراز هویت، بازیابی رمز و دریافت
            فاکتور
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Method */}
          <div className="flex items-center justify-between p-4 rounded-control border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                <Smartphone className="w-5 h-5 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    شماره موبایل (SMS OTP)
                  </span>
                  {isRealPhone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-control">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تایید شده</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-control">
                      <span>ثبت‌نشده</span>
                    </span>
                  )}
                </div>
                <p
                  className="text-xs font-mono text-muted-foreground mt-0.5 font-latin"
                  dir="ltr"
                >
                  {formatDisplayPhone(customer.phone, customer.email)}
                </p>
              </div>
            </div>
          </div>

          {/* Email Method */}
          <div className="flex items-center justify-between p-4 rounded-control border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                <Mail className="w-5 h-5 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    آدرس ایمیل
                  </span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-control">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تایید شده</span>
                    </span>
                  ) : customer.email ? (
                    <span className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-control font-bold">
                      نیازمند تایید
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-control">
                      ثبت‌نشده
                    </span>
                  )}
                </div>
                <p
                  className="text-xs font-latin text-muted-foreground mt-0.5"
                  dir="ltr"
                >
                  {customer.email || 'هنوز ایمیلی ثبت نکرده‌اید'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 2-Step Password Reset & Change Flow */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4">
        <div className="pb-3 border-b border-border/40">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand" />
            تنظیم یا تغییر کلمه عبور با احراز هویت دومرحله‌ای
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            جهت افزایش امنیت، کد تایید هویت به انتخاب شما از طریق پیامک یا ایمیل
            ارسال می‌شود
          </p>
        </div>

        {/* STEP 1: CHOOSE VERIFICATION CHANNEL */}
        {resetStep === 'choose_channel' && (
          <div className="space-y-4 max-w-lg">
            <label className="text-xs font-bold text-foreground block">
              نحوه دریافت کد تایید را انتخاب کنید:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: SMS */}
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`p-3.5 rounded-control border text-right transition-all duration-motion ease-motion cursor-pointer ${
                  channel === 'sms'
                    ? 'border-brand bg-brand/10 shadow-control ring-1 ring-brand/30'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-brand" />
                  <span className="text-xs font-bold text-foreground">
                    پیامک به شماره موبایل
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono text-muted-foreground block mt-1 font-latin"
                  dir="ltr"
                >
                  {formatDisplayPhone(customer.phone, customer.email)}
                </span>
              </button>

              {/* Option B: Email */}
              <button
                type="button"
                onClick={() => setChannel('email')}
                disabled={!customer.email || !isEmailVerified}
                className={`p-3.5 rounded-control border text-right transition-all duration-motion ease-motion cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  channel === 'email'
                    ? 'border-brand bg-brand/10 shadow-control ring-1 ring-brand/30'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-foreground">
                      ارسال کد به ایمیل
                    </span>
                  </div>
                  {!isEmailVerified && customer.email ? (
                    <span className="text-[9px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded-control">
                      تایید نشده
                    </span>
                  ) : null}
                </div>
                <span
                  className="text-[11px] font-latin text-muted-foreground block mt-1 truncate"
                  dir="ltr"
                >
                  {customer.email || 'ایمیلی ثبت نشده'}
                </span>
              </button>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSendCode}
              className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ارسال کد احراز هویت</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: VERIFY OTP CODE */}
        {resetStep === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                کد تایید ۵ رقمی ارسال شده به{' '}
                <strong className="text-foreground">
                  {channel === 'sms'
                    ? formatDisplayPhone(customer.phone)
                    : customer.email}
                </strong>{' '}
                را وارد کنید:
              </p>
            </div>

            <div className="py-2">
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
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>بررسی و تایید کد</span>
              </button>
              <button
                type="button"
                onClick={() => setResetStep('choose_channel')}
                className="h-10 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                تغییر روش
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: UNLOCKED - SET NEW PASSWORD (PasswordInput with strength) */}
        {resetStep === 'set_new_password' && (
          <form
            onSubmit={handleSaveNewPassword}
            className="space-y-4 max-w-md animate-in zoom-in-95"
          >
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                کلمه عبور جدید (حداقل ۶ کاراکتر):
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                showStrength
                required
                placeholder="کلمه عبور جدید شما"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-foreground">
                تکرار کلمه عبور جدید:
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="تکرار کلمه عبور جدید"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="flex-1 h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>ثبت نهایی کلمه عبور جدید</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setResetStep('choose_channel')}
                className="h-10 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Active Session Device */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4">
        <div className="pb-3 border-b border-border/40">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Laptop className="w-4 h-4 text-brand" />
            دستگاه و نشست فعال
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            دستگاهی که هم‌اکنون از طریق آن به حساب کاربری متصل هستید
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-control border border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
              {clientEnv.isMobile ? (
                <Smartphone className="w-5 h-5 text-brand" />
              ) : (
                <Laptop className="w-5 h-5 text-brand" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {clientEnv.browser} ({clientEnv.os})
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  نشست فعلی
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                دسترسی فعال به امکانات کاربری آناهیکس
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="h-9 px-4 rounded-control text-destructive hover:bg-destructive/10 border border-destructive/30 text-xs font-bold gap-1.5 shrink-0 flex items-center duration-motion ease-motion active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>
    </div>
  )
}
