import {
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  Shield,
  ShieldAlert,
  Smartphone,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { CustomerProfile } from '../../types'
import { formatDisplayPhone } from '../../utils/formatters'
import { Alert } from '../vibefarsi/Alert'
import { useNotification } from '../vibefarsi/NotificationContext'
import { OtpField } from '../vibefarsi/OtpField'

interface ProfilePersonalTabProps {
  customer: CustomerProfile
  onProfileUpdated: (updated: CustomerProfile) => void
}

export const ProfilePersonalTab: React.FC<ProfilePersonalTabProps> = ({
  customer,
  onProfileUpdated,
}) => {
  const { success, error, info } = useNotification()

  const [firstName, setFirstName] = useState(() => {
    if (customer.first_name) return customer.first_name
    if (customer.full_name) {
      const parts = customer.full_name.trim().split(/\s+/)
      return parts[0] || ''
    }
    return ''
  })
  const [lastName, setLastName] = useState(() => {
    if (customer.last_name) return customer.last_name
    if (customer.full_name) {
      const parts = customer.full_name.trim().split(/\s+/)
      return parts.slice(1).join(' ')
    }
    return ''
  })
  const [email, setEmail] = useState(customer.email || '')

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Email Verification & Change Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input')
  const [emailOtpCode, setEmailOtpCode] = useState(['', '', '', '', ''])
  const [emailVerifying, setEmailVerifying] = useState(false)
  const isEmailPreVerified = Boolean(
    customer.email_verified ||
      customer.auth_provider === 'google' ||
      customer.auth_provider === 'github',
  )
  const [isEmailVerified, setIsEmailVerified] = useState(
    () => isEmailPreVerified,
  )

  // 2. Change Mobile Phone Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input')
  const [phoneOtpCode, setPhoneOtpCode] = useState(['', '', '', '', ''])
  const [phoneLoading, setPhoneLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const combined = `${firstName.trim()} ${lastName.trim()}`.trim()
      const updated = await apiService.updateCustomerProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: combined,
        email: email.trim(),
      })
      onProfileUpdated(updated)
      setSuccessMsg('اطلاعات حساب کاربری با موفقیت به‌روزرسانی شد.')
      success('ویرایش موفق', 'مشخصات حساب شما با موفقیت در دیتابیس ثبت گردید.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      const msg = err.message || 'خطا در ذخیره تغییرات'
      setErrorMsg(msg)
      error('خطا در ذخیره', msg)
    } finally {
      setSaving(false)
    }
  }

  // --- Email Verification Handlers ---
  const handleSendEmailVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const target = newEmail.trim().toLowerCase()
    if (!target.includes('@') || !target.includes('.')) {
      error('ایمیل نامعتبر', 'لطفاً یک آدرس ایمیل معتبر وارد کنید.')
      return
    }
    setEmailVerifying(true)
    setTimeout(() => {
      setEmailVerifying(false)
      setEmailStep('verify')
      info(
        'کد تایید ارسال شد',
        `کد تایید ۵ رقمی به آدرس ${target} ارسال شد (کد آزمایشی: 12345).`,
      )
    }, 800)
  }

  const handleConfirmEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = emailOtpCode.join('')
    if (code.length !== 5) {
      error('کد ناقص', 'لطفاً کد تایید ۵ رقمی را کامل وارد کنید.')
      return
    }

    setEmailVerifying(true)
    try {
      const target = newEmail.trim().toLowerCase()
      setEmail(target)
      setIsEmailVerified(true)
      const updated = await apiService.updateCustomerProfile({
        email: target,
        email_verified: true,
      } as any)
      onProfileUpdated(updated)
      setIsEmailModalOpen(false)
      setEmailStep('input')
      setEmailOtpCode(['', '', '', '', ''])
      success(
        'ایمیل تایید شد',
        'آدرس ایمیل شما با موفقیت تایید و جایگزین گردید.',
      )
    } catch (err: any) {
      error('خطا در تایید ایمیل', err.message || 'کد تایید نامعتبر است.')
    } finally {
      setEmailVerifying(false)
    }
  }

  // --- Change Phone Handlers ---
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newPhone.trim()
    if (!clean.startsWith('09') || clean.length !== 11) {
      error(
        'شماره نامعتبر',
        'شماره موبایل جدید باید ۱۱ رقم بوده و با ۰۹ آغاز شود.',
      )
      return
    }

    setPhoneLoading(true)
    try {
      await apiService.sendOTP(clean)
      setPhoneStep('verify')
      success(
        'کد تایید ارسال شد',
        `کد تایید پیامکی به شماره جدید ${clean} ارسال گردید.`,
      )
    } catch (err: any) {
      error(
        'خطا در ارسال پیامک',
        err.message || 'ارسال کد به شماره جدید با خطا مواجه شد.',
      )
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleVerifyNewPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = phoneOtpCode.join('')
    if (code.length !== 5) {
      error('کد ناقص', 'لطفاً کد تایید ۵ رقمی را کامل وارد کنید.')
      return
    }

    setPhoneLoading(true)
    try {
      const clean = newPhone.trim()
      const updated = await apiService.updateCustomerProfile({
        phone: clean,
      })
      onProfileUpdated(updated)
      setIsPhoneModalOpen(false)
      setPhoneStep('input')
      setNewPhone('')
      setPhoneOtpCode(['', '', '', '', ''])
      success(
        'شماره موبایل تغییر یافت',
        `شماره تماس حساب شما به ${clean} تغییر یافت.`,
      )
    } catch (err: any) {
      error(
        'خطا در تایید شماره',
        err.message || 'تایید کد پیامکی با خطا مواجه شد.',
      )
    } finally {
      setPhoneLoading(false)
    }
  }

  const isRealPhone = Boolean(
    customer.phone && !/^098[0-9a-f]{8}$/i.test(customer.phone),
  )
  const fullDisplayPhone = isRealPhone
    ? formatDisplayPhone(customer.phone)
    : 'شماره همراه ثبت‌نشده است'

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      <div className="rounded-surface border border-border/40 bg-card p-5 sm:p-6 shadow-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              <span>اطلاعات هویتی و پروفایل فردی</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              مشخصات عمومی حساب، تایید ایمیل و تغییر شماره تماس با پیامک امنیتی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center font-bold text-base shadow-control overflow-hidden">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.full_name || 'کاربر'}
                  className="w-full h-full object-cover rounded-control"
                />
              ) : firstName ? (
                firstName.slice(0, 1)
              ) : customer.full_name ? (
                customer.full_name.slice(0, 1)
              ) : (
                customer.phone.slice(-2)
              )}
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4">
            <Alert variant="success" onClose={() => setSuccessMsg('')}>
              {successMsg}
            </Alert>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4">
            <Alert variant="danger" onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="personal-firstname"
                className="block text-xs font-bold text-foreground"
              >
                نام
              </label>
              <input
                id="personal-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="مثال: علی"
                className="w-full h-10 px-3.5 rounded-field bg-muted/40 border border-border/40 text-foreground text-xs outline-none focus:border-foreground/40 transition-colors"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="personal-lastname"
                className="block text-xs font-bold text-foreground"
              >
                نام خانوادگی
              </label>
              <input
                id="personal-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="مثال: محمدی"
                className="w-full h-10 px-3.5 rounded-field bg-muted/40 border border-border/40 text-foreground text-xs outline-none focus:border-foreground/40 transition-colors"
                required
              />
            </div>

            {/* Email Address with Verification Gate - Locked & Symmetrical with Phone */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="personal-email"
                    className="block text-xs font-bold text-foreground"
                  >
                    آدرس ایمیل حساب کاربری
                  </label>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-control">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>تایید شده</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-control animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-rose-500" />
                      <span>تایید نشده</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(true)
                    setEmailStep('input')
                    setNewEmail(email || '')
                    setEmailOtpCode(['', '', '', '', ''])
                  }}
                  className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-brand" />
                  <span>
                    {email ? 'تغییر آدرس ایمیل' : 'ثبت و تایید ایمیل'}
                  </span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="personal-email"
                  type="text"
                  dir="ltr"
                  value={email || 'ایمیلی ثبت نشده است'}
                  disabled
                  className="w-full h-10 px-3.5 pl-9 rounded-field bg-muted/20 border border-border/30 text-foreground font-latin text-left text-xs cursor-not-allowed font-bold"
                />
                <Mail
                  className={`w-3.5 h-3.5 absolute left-3 top-3.5 ${
                    isEmailVerified ? 'text-emerald-500' : 'text-amber-500'
                  } pointer-events-none`}
                />
              </div>

              {isEmailVerified ? (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>
                    هویت آدرس ایمیل با پروتکل امنیتی تایید شده و آماده دریافت
                    فاکتورهاست
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  <span>
                    ایمیل دستی ثبت شده و تایید نشده است. جهت تایید بر روی دکمه
                    بالا کلیک کنید.
                  </span>
                </p>
              )}
            </div>

            {/* Phone Number with Change Action - Symmetrical with Email */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="personal-phone"
                    className="block text-xs font-bold text-foreground"
                  >
                    شماره موبایل حساب کاربری
                  </label>
                  {isRealPhone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-control">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>تایید شده</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-control animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-rose-500" />
                      <span>تایید نشده</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneModalOpen(true)
                    setPhoneStep('input')
                    setNewPhone('')
                  }}
                  className="text-[10px] font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Smartphone className="w-3 h-3 text-brand" />
                  <span>
                    {isRealPhone
                      ? 'تغییر شماره همراه'
                      : 'ثبت و تایید شماره همراه'}
                  </span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="personal-phone"
                  type="text"
                  dir="ltr"
                  value={fullDisplayPhone}
                  disabled
                  className="w-full h-10 px-3.5 pl-9 rounded-field bg-muted/20 border border-border/30 text-foreground font-latin text-left text-xs cursor-not-allowed font-bold"
                />
                <Smartphone
                  className={`w-3.5 h-3.5 absolute left-3 top-3.5 ${
                    isRealPhone ? 'text-emerald-500' : 'text-amber-500'
                  } pointer-events-none`}
                />
              </div>

              {isRealPhone ? (
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>
                    هویت شماره موبایل با پیامک امن مخابراتی OTP تایید شده است
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  <span>
                    هنوز شماره موبایلی ثبت نکرده‌اید. با کلیک بر روی دکمه بالا،
                    شماره همراه خود را ثبت نمایید.
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Submit button: Graphite style - White with black text */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات پروفایل</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 1. EMAIL VERIFICATION & CHANGE MODAL */}
      {isEmailModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-md my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-control bg-secondary text-brand">
                      <Mail className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-foreground">
                      {email
                        ? 'تغییر آدرس ایمیل حساب کاربری'
                        : 'ثبت و تایید آدرس ایمیل'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {emailStep === 'input' ? (
                  <form
                    onSubmit={handleSendEmailVerification}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-foreground">
                        آدرس ایمیل جدید:
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-10 px-3.5 rounded-field bg-muted/30 border border-border/60 text-foreground font-latin text-xs outline-none focus:border-brand"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        یک کد تایید ۵ رقمی جهت اطمینان از صحت دسترسی به این
                        ایمیل ارسال خواهد شد.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={emailVerifying || !newEmail.trim()}
                      className="w-full h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {emailVerifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>ارسال کد تایید به این ایمیل</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmEmailOtp} className="space-y-4">
                    <div className="p-3 rounded-control bg-muted/30 border border-border/40 font-mono text-center text-xs text-foreground font-latin">
                      {newEmail}
                    </div>

                    <div className="space-y-1.5 text-center">
                      <label className="text-xs font-bold text-foreground block">
                        کد تایید ۵ رقمی ارسال شده به ایمیل:
                      </label>
                      <div className="py-2">
                        <OtpField
                          length={5}
                          value={emailOtpCode.join('')}
                          onChange={(val) => {
                            const arr = ['', '', '', '', '']
                            for (let i = 0; i < 5; i++) {
                              arr[i] = val[i] || ''
                            }
                            setEmailOtpCode(arr)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailStep('input')}
                        className="h-10 px-4 rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-xs font-bold text-foreground cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        ویرایش ایمیل
                      </button>

                      <button
                        type="submit"
                        disabled={emailVerifying}
                        className="flex-1 h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {emailVerifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>تایید نهایی و ثبت ایمیل</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 2. CHANGE MOBILE PHONE MODAL */}
      {isPhoneModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-md my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-control bg-secondary text-brand">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-foreground">
                      تغییر شماره تلفن همراه با تایید پیامکی
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {phoneStep === 'input' ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-foreground">
                        شماره موبایل جدید (۱۱ رقم با ۰۹):
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        placeholder="09123456789"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full h-10 px-3 font-mono text-center text-sm rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        یک پیامک حاوی کد تایید یکبارمصرف به این شماره ارسال
                        خواهد شد.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneLoading}
                      className="w-full h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {phoneLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>ارسال کد تایید به شماره جدید</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyNewPhone} className="space-y-4">
                    <div className="space-y-1.5 text-center">
                      <p className="text-xs text-muted-foreground">
                        کد تایید ۵ رقمی پیامک شده به {newPhone} را وارد کنید:
                      </p>
                      <div className="py-2">
                        <OtpField
                          length={5}
                          value={phoneOtpCode.join('')}
                          onChange={(val) => {
                            const arr = ['', '', '', '', '']
                            for (let i = 0; i < 5; i++) {
                              arr[i] = val[i] || ''
                            }
                            setPhoneOtpCode(arr)
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneLoading}
                      className="w-full h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {phoneLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>تایید نهایی و تغییر شماره</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
