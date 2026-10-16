import { Loader2, Lock, Mail, Save, Shield, User } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile } from '../../types'
import { Alert } from '../vibefarsi/Alert'

interface ProfilePersonalTabProps {
  customer: CustomerProfile
  onProfileUpdated: (updated: CustomerProfile) => void
}

export const ProfilePersonalTab: React.FC<ProfilePersonalTabProps> = ({
  customer,
  onProfileUpdated,
}) => {
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
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره تغییرات')
    } finally {
      setSaving(false)
    }
  }

  // Masked phone number for display (e.g. 0992****377 or +98 992****377)
  const maskedPhone = customer.phone
    ? customer.phone.startsWith('+98')
      ? customer.phone.replace(/^\+98\s*0?(\d{3})\d{4}(\d{3})$/, '+98 $1****$2')
      : customer.phone.replace(/^(\d{4})\d{4}(\d{3})$/, '$1****$2')
    : '0992****377'

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
              مشخصات عمومی حساب جهت ارسال پیامک‌ها، فاکتور و پیگیری پشتیبانی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center font-bold text-base shadow-control">
              {firstName
                ? firstName.slice(0, 1)
                : customer.full_name
                  ? customer.full_name.slice(0, 1)
                  : customer.phone.slice(-2)}
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

            {/* Email Address */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="personal-email"
                className="block text-xs font-bold text-foreground"
              >
                آدرس ایمیل
              </label>
              <div className="relative">
                <input
                  id="personal-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full h-10 px-3.5 pl-9 rounded-field bg-muted/40 border border-border/40 text-foreground font-latin text-left text-xs outline-none focus:border-foreground/40 transition-colors"
                />
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                اطلاع‌رسانی فاکتور و لایسنس‌ها به این آدرس ارسال می‌شود
              </p>
            </div>

            {/* Phone Number (Read-only verified) */}
            <div className="space-y-1.5 text-right">
              <label
                htmlFor="personal-phone"
                className="block text-xs font-bold text-foreground"
              >
                شماره موبایل تایید‌شده
              </label>
              <div className="relative">
                <input
                  id="personal-phone"
                  type="text"
                  dir="ltr"
                  value={maskedPhone}
                  disabled
                  className="w-full h-10 px-3.5 pl-9 rounded-field bg-muted/20 border border-border/30 text-muted-foreground font-latin text-left text-xs cursor-not-allowed"
                />
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3.5 text-emerald-500 pointer-events-none" />
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <Shield className="w-3 h-3 shrink-0" />
                <span>
                  هویت شماره موبایل با پیامک امن مخابراتی OTP تایید شده است
                </span>
              </p>
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
    </div>
  )
}
