import {
  AlertCircle,
  Check,
  Loader2,
  Lock,
  Mail,
  Save,
  Shield,
  User,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

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
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              اطلاعات هویتی و پروفایل فردی
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مشخصات عمومی حساب جهت ارسال پیامک‌ها، فاکتور و پیگیری پشتیبانی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              {firstName
                ? firstName.slice(0, 1)
                : customer.full_name
                  ? customer.full_name.slice(0, 1)
                  : customer.phone.slice(-2)}
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label
                htmlFor="personal-firstname"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                نام
              </label>
              <Input
                id="personal-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="مثال: علی"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="personal-lastname"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                نام خانوادگی
              </label>
              <Input
                id="personal-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="مثال: عبادی"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="personal-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                آدرس ایمیل
              </label>
              <div className="relative">
                <Input
                  id="personal-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali@example.com"
                  className="h-10 rounded-xl font-mono text-left pr-9 text-xs"
                />
                <Mail className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                اطلاع‌رسانی فاکتور و لایسنس‌ها به این آدرس ارسال می‌شود
              </p>
            </div>

            {/* Phone Number (Read-only verified) */}
            <div>
              <label
                htmlFor="personal-phone"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                شماره موبایل تایید‌شده
              </label>
              <div className="relative">
                <Input
                  id="personal-phone"
                  type="text"
                  dir="ltr"
                  value={maskedPhone}
                  disabled
                  className="h-10 rounded-xl font-mono text-left bg-slate-50 dark:bg-slate-950 text-slate-500 pr-9 border-dashed text-xs"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-3 text-emerald-500" />
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                <Shield className="w-3 h-3 shrink-0" />
                هویت شماره موبایل با پیامک امن مخابراتی OTP اعتبارسنجی شده است
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ذخیره تغییرات پروفایل
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
