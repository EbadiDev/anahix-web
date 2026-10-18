import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  ShieldAlert,
  Smartphone,
  User,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile } from '../../types'
import { formatDisplayPhone } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'
import { TypewriterText } from '../vibefarsi/TypewriterText'

interface SidebarProfileAvatarProps {
  customer: CustomerProfile
  onProfileUpdated: (updated: CustomerProfile) => void
  onNavigateToPersonal: () => void
}

export const SidebarProfileAvatar: React.FC<SidebarProfileAvatarProps> = ({
  customer,
  onProfileUpdated,
  onNavigateToPersonal,
}) => {
  const { success, error } = useNotification()
  const [uploading, setUploading] = useState(false)

  // Verification status logic: considers phone, email & auth provider
  const isSyntheticPhone = Boolean(
    customer.phone && /^098[0-9a-f]{8}$/i.test(customer.phone),
  )
  const hasRealPhone = Boolean(customer.phone && !isSyntheticPhone)
  const hasEmail = Boolean(customer.email?.includes('@'))

  const isEmailVerified = Boolean(
    customer.email_verified ||
      customer.auth_provider === 'google' ||
      customer.auth_provider === 'github',
  )
  const isPhoneVerified = Boolean(
    hasRealPhone &&
      (customer.phone_verified ||
        customer.auth_provider === 'phone' ||
        customer.is_active),
  )

  const isFullyVerified = isPhoneVerified && (hasEmail ? isEmailVerified : true)
  const isUnverified = !isPhoneVerified && (!hasEmail || !isEmailVerified)

  const isAdmin = Boolean(customer.is_admin || apiService.getAdminUser())

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const mediaResp = await apiService.uploadMedia(file)
      const updated = await apiService.updateCustomerProfile({
        avatar_url: mediaResp.file_url,
      })
      onProfileUpdated(updated)
      success(
        'تصویر پروفایل به‌روزرسانی شد',
        'آواتار حساب کاربری شما با موفقیت تغییر یافت.',
      )
    } catch (err: any) {
      error(
        'خطا در آپلود آواتار',
        err.message || 'بارگذاری تصویر با خطا مواجه شد.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-surface border border-border/60 bg-card p-4 sm:p-5 shadow-surface duration-motion ease-motion relative overflow-hidden space-y-4">
      {/* Role Badge on Top */}
      <div className="w-full flex items-center justify-between border-b border-border/40 pb-3">
        {isAdmin ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded-control shadow-control">
            <Crown className="w-3 h-3 text-rose-500" />
            <span>مدیر سیستم</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/40 px-2 py-0.5 rounded-control">
            <User className="w-3 h-3" />
            <span>حساب کاربری</span>
          </span>
        )}

        {/* Verification Status Pill */}
        {isFullyVerified ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-control shadow-xs"
            title="حساب کاربری کاملاً احراز هویت شده است"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>احراز هویت شده</span>
          </span>
        ) : isUnverified ? (
          <button
            type="button"
            onClick={onNavigateToPersonal}
            className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded-control hover:bg-rose-500/20 transition-colors cursor-pointer animate-pulse"
            title="هیچ اطلاعاتی تایید نشده است. جهت احراز هویت کلیک کنید"
          >
            <AlertCircle className="w-3 h-3 text-rose-500" />
            <span>نیاز به تایید فوری</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onNavigateToPersonal}
            className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-control hover:bg-amber-500/20 transition-colors cursor-pointer"
            title="جهت تایید هویت مکمل به بخش اطلاعات کاربری مراجعه کنید"
          >
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>نیازمند تایید مکمل</span>
          </button>
        )}
      </div>

      {/* Main Profile Info Row (Always structured, zero distortion) */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-center lg:items-center gap-3.5 sm:gap-4 text-center sm:text-right lg:text-center">
        {/* Creative Interactive Avatar */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 shrink-0 group">
          {customer.avatar_url ? (
            <img
              src={customer.avatar_url}
              alt={customer.full_name || 'کاربر'}
              className="w-full h-full rounded-control object-cover border border-border shadow-control group-hover:scale-105 transition-transform duration-motion"
            />
          ) : (
            <div className="w-full h-full rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center font-black text-2xl shadow-control group-hover:scale-105 transition-transform duration-motion">
              {customer.full_name
                ? customer.full_name.charAt(0).toUpperCase()
                : customer.phone.slice(-2)}
            </div>
          )}

          {/* Status Tick Badge (Green for verified, Rose for unverified, Orange for pending) */}
          <span
            className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center shadow-control ${
              isFullyVerified
                ? 'bg-emerald-500 text-white'
                : isUnverified
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-zinc-950'
            }`}
            title={
              isFullyVerified
                ? 'حساب کاربری کاملاً تایید شده'
                : isUnverified
                  ? 'نیازمند احراز هویت فوری'
                  : 'نیازمند تایید مکمل در پنل کاربری'
            }
          >
            {isFullyVerified ? (
              <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
            ) : isUnverified ? (
              <AlertCircle className="h-3 w-3 stroke-[2.5]" />
            ) : (
              <ShieldAlert className="h-3 w-3 stroke-[2.5]" />
            )}
          </span>

          {/* Hover Upload Trigger Overlay */}
          <label
            htmlFor="sidebar-avatar-upload"
            className="absolute inset-0 bg-black/60 rounded-control opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer duration-motion backdrop-blur-xs"
            title="تغییر تصویر پروفایل"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 mb-0.5" />
                <span>تغییر عکس</span>
              </>
            )}
            <input
              id="sidebar-avatar-upload"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {/* User Info & Identity with Creative Dual Channel Display */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-sm font-black text-foreground truncate min-h-[22px]">
            <TypewriterText
              words={[
                customer.full_name || 'کاربر گرامی',
                ...(hasRealPhone ? [customer.phone] : []),
                ...(hasEmail ? [customer.email || ''] : []),
                'خوش آمدید',
              ]}
              className="text-foreground font-black"
            />
          </h4>

          {/* Creative Display of Both Mobile & Email when both present */}
          {hasRealPhone && hasEmail ? (
            <div className="pt-1 space-y-1 select-all" dir="ltr">
              <div className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-control bg-muted/40 border border-border/40 text-[10px] sm:text-[11px] font-mono font-latin text-foreground">
                <Smartphone className="w-3 h-3 text-brand shrink-0" />
                <span>{customer.phone}</span>
                {isPhoneVerified ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                )}
              </div>
              <div className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-control bg-muted/40 border border-border/40 text-[10px] sm:text-[11px] font-mono font-latin text-foreground max-w-full">
                <Mail className="w-3 h-3 text-brand shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[180px]">
                  {customer.email}
                </span>
                {isEmailVerified ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                )}
              </div>
            </div>
          ) : (
            <p
              className="text-[11px] font-mono text-muted-foreground font-latin"
              dir="ltr"
            >
              {formatDisplayPhone(customer.phone, customer.email)}
            </p>
          )}
        </div>
      </div>

      {/* Quick Personal Info Link if pending */}
      {!isFullyVerified && (
        <button
          type="button"
          onClick={onNavigateToPersonal}
          className={`w-full py-2 px-3 text-xs font-bold rounded-control transition-colors duration-motion cursor-pointer block text-center border ${
            isUnverified
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30'
          }`}
        >
          {isUnverified
            ? 'احراز هویت فوری حساب کاربری ←'
            : 'تکمیل و تایید اطلاعات کاربری ←'}
        </button>
      )}
    </div>
  )
}
