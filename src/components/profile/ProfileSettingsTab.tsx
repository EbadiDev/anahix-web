import {
  AlertTriangle,
  Check,
  Layers,
  Mail,
  Send,
  ShieldAlert,
  Smartphone,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SMS Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Smartphone className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                پیامک خدماتی (SMS)
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">تکمیل سفارش‌ها</span>
                <input
                  type="checkbox"
                  checked={prefs.smsOrders}
                  onChange={() => togglePref('smsOrders')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  دریافت پیامک شماره مجازی
                </span>
                <input
                  type="checkbox"
                  checked={prefs.smsVirtualNumbers}
                  onChange={() => togglePref('smsVirtualNumbers')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  هشدارهای امنیتی ورود
                </span>
                <input
                  type="checkbox"
                  checked={prefs.smsSecurity}
                  onChange={() => togglePref('smsSecurity')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
            </div>
          </div>

          {/* Telegram Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Send className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                ربات تلگرام آناهیکس
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">تحویل لایسنس‌ها</span>
                <input
                  type="checkbox"
                  checked={prefs.tgOrders}
                  onChange={() => togglePref('tgOrders')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  کدهای OTP شماره موقت
                </span>
                <input
                  type="checkbox"
                  checked={prefs.tgVirtualNumbers}
                  onChange={() => togglePref('tgVirtualNumbers')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  یادآوری تمدید اشتراک
                </span>
                <input
                  type="checkbox"
                  checked={prefs.tgExpiration}
                  onChange={() => togglePref('tgExpiration')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
            </div>
          </div>

          {/* Email Channel */}
          <div className="p-4 rounded-control border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Mail className="w-4 h-4 text-brand" />
              <h5 className="text-xs font-bold text-foreground">
                پست الکترونیک (Email)
              </h5>
            </div>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">ارسال فاکتور رسمی</span>
                <input
                  type="checkbox"
                  checked={prefs.emailInvoices}
                  onChange={() => togglePref('emailInvoices')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  اطلاعات اکانت شخصی
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailCredentials}
                  onChange={() => togglePref('emailCredentials')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-foreground">
                  هشدارهای تغییر رمز
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailSecurity}
                  onChange={() => togglePref('emailSecurity')}
                  className="rounded-control cursor-pointer accent-brand"
                />
              </label>
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
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-card text-card-foreground rounded-surface border border-destructive/60 shadow-overlay p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black">
                آیا از حذف حساب مطمئن هستید؟
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              این عملیات برگشت‌ناپذیر است. موجودی کیف پول و لایسنس‌های فعال شما
              غیرقابل استرداد خواهند بود.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold duration-motion active:scale-[0.98] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  onLogout()
                }}
                className="h-9 px-4 rounded-control bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-black shadow-control duration-motion active:scale-[0.98] cursor-pointer"
              >
                بله، حساب حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
