import { AlertTriangle, Check, Layers, Smartphone, Trash2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

interface ProfileSettingsTabProps {
  onLogout: () => void
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  onLogout,
}) => {
  const [saved, setSaved] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Channels state (SMS, Telegram, Email)
  const [prefs, setPrefs] = useState({
    // SMS
    smsOrders: true,
    smsVirtualNumbers: true,
    smsSecurity: true,

    // Telegram
    tgOrders: true,
    tgVirtualNumbers: true,
    tgExpiration: true,

    // Email
    emailInvoices: true,
    emailCredentials: true,
    emailSecurity: true,
  })

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 max-w-4xl text-right"
      dir="rtl"
    >
      {/* 1. Channel Notification Settings (SMS, Telegram, Email) */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4 duration-motion ease-motion">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div>
            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>تنظیمات کانال‌های پیامکی و ایمیل</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              انتخاب کانال‌های مورد نظر برای دریافت پیامک، هشدارهای امنیتی و
              فاکتورها
            </p>
          </div>

          {saved && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-control border border-emerald-500/20 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              ذخیره شد
            </span>
          )}
        </div>

        <div className="max-w-2xl">
          {/* SMS Channel */}
          <div className="p-5 rounded-surface border border-border/80 bg-muted/20 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Smartphone className="w-5 h-5 text-brand" />
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-foreground">
                  پیامک خدماتی و اعلانات (SMS.ir)
                </h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ارسال پیامک‌های سریع و موثق به شماره همراه تاییدشده شما
                </p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-control bg-card border border-border/40">
                <div>
                  <span className="font-bold text-foreground block">
                    تکمیل و تحویل سفارش‌ها
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ارسال لایسنس و مشخصات پس از پرداخت
                  </span>
                </div>
                <ToggleSwitch
                  size="sm"
                  checked={prefs.smsOrders}
                  onChange={() => togglePref('smsOrders')}
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-control bg-card border border-border/40">
                <div>
                  <span className="font-bold text-foreground block">
                    دریافت پیامک و کدهای شماره مجازی
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ارسال کد OTP دریافتی از ۵SIM
                  </span>
                </div>
                <ToggleSwitch
                  size="sm"
                  checked={prefs.smsVirtualNumbers}
                  onChange={() => togglePref('smsVirtualNumbers')}
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-control bg-card border border-border/40">
                <div>
                  <span className="font-bold text-foreground block">
                    هشدارهای امنیتی و کدهای ورود
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ورود با دستگاه جدید یا بازیابی رمز
                  </span>
                </div>
                <ToggleSwitch
                  size="sm"
                  checked={prefs.smsSecurity}
                  onChange={() => togglePref('smsSecurity')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Danger Zone (Delete Account) */}
      <div className="rounded-surface border border-destructive/40 bg-destructive/5 p-5 sm:p-6 shadow-surface space-y-4">
        <h4 className="text-xs font-black text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>منطقه حساس (Danger Zone)</span>
        </h4>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-destructive/20">
          <div>
            <h5 className="text-xs font-bold text-foreground">
              حذف کامل حساب کاربری و اطلاعات
            </h5>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              با حذف حساب، تمامی نشست‌ها، کیف پول و لایسنس‌های فعال برای همیشه
              مسدود خواهند شد.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="h-9 px-4 rounded-control text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 shrink-0 flex items-center gap-1.5 duration-motion ease-motion active:scale-[0.98] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف حساب کاربری</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false)
          onLogout()
        }}
        title="آیا از حذف حساب مطمئن هستید؟"
        description="این عملیات برگشت‌ناپذیر است. موجودی کیف پول و لایسنس‌های فعال شما غیرقابل استرداد خواهند بود."
        confirmText="بله، حساب حذف شود"
      />
    </div>
  )
}
